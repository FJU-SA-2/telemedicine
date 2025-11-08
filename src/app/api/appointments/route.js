// app/api/appointments/route.js
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

// POST - 新增預約 (狀態改為「待確認」)
export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const { patient_id, doctor_id, appointment_date, appointment_time, symptoms, payment_method, amount } = body;

    console.log("收到預約請求:", body);

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    // 統一時間格式,確保有秒數
    const formattedTime = appointment_time.length === 5 
      ? `${appointment_time}:00` 
      : appointment_time;

    console.log("格式化後的時間:", formattedTime);

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 檢查時段是否可用
    const [schedules] = await connection.execute(
      `SELECT schedule_id, is_available, time_slot 
       FROM schedules 
       WHERE doctor_id = ? 
       AND schedule_date = ? 
       AND (time_slot = ? OR time_slot LIKE ?)
       FOR UPDATE`,
      [doctor_id, appointment_date, formattedTime, `${appointment_time}%`]
    );

    console.log("查詢到的排程:", schedules);

    if (schedules.length === 0) {
      await connection.rollback();
      return NextResponse.json({ 
        error: "該時段不存在",
        debug: {
          doctor_id,
          appointment_date,
          appointment_time,
          formattedTime
        }
      }, { status: 404 });
    }

    if (schedules[0].is_available !== '1') {
      await connection.rollback();
      return NextResponse.json({ 
        error: "該時段已被預約" 
      }, { status: 409 });
    }

    // 新增預約,狀態設為「待確認」
    const actualTimeSlot = schedules[0].time_slot;
    
    const [result] = await connection.execute(
      `INSERT INTO appointments 
       (patient_id, doctor_id, appointment_date, appointment_time, status, symptoms, payment_method, amount) 
       VALUES (?, ?, ?, ?, '待確認', ?, ?, ?)`,
      [patient_id, doctor_id, appointment_date, actualTimeSlot, symptoms || null, payment_method || null, amount || 500]
    );

    // 更新排程為不可用
    await connection.execute(
      `UPDATE schedules 
       SET is_available = 0 
       WHERE schedule_id = ?`,
      [schedules[0].schedule_id]
    );

    await connection.commit();

    console.log("預約成功,ID:", result.insertId);

    return NextResponse.json({ 
      success: true, 
      appointment_id: result.insertId, 
      message: "預約已提交,等待醫師確認" 
    }, { status: 201 });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("預約創建錯誤:", error);
    return NextResponse.json({ 
      error: "預約失敗", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// GET - 查詢預約
export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get("patient_id");
    const doctor_id = searchParams.get("doctor_id");
    const appointment_id = searchParams.get("appointment_id");

    // ✅ 如果沒有提供任何參數,嘗試從 session/header 獲取 patient_id
    let actualPatientId = patient_id;
    if (!patient_id && !doctor_id && !appointment_id) {
      // 從 header 或 cookie 中獲取當前登入用戶的 patient_id
      // 這裡根據你的認證方式調整
      actualPatientId = request.headers.get('user-id') || request.cookies.get('patient_id')?.value;
    }

    connection = await mysql.createConnection(dbConfig);

    let query = `
      SELECT 
        a.*,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.specialty AS doctor_specialty,
        d.practice_hospital,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        r.rating,
        r.comment as rating_comment
      FROM appointments a
      LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
      LEFT JOIN patient p ON a.patient_id = p.patient_id
      LEFT JOIN ratings r ON a.appointment_id = r.appointment_id
      WHERE 1=1
    `;
    const params = [];

    if (appointment_id) {
      query += " AND a.appointment_id = ?";
      params.push(appointment_id);
    }
    if (actualPatientId) {
      query += " AND a.patient_id = ?";
      params.push(actualPatientId);
    }
    if (doctor_id) {
      query += " AND a.doctor_id = ?";
      params.push(doctor_id);
    }

    query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC";

    const [appointments] = await connection.execute(query, params);

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("查詢預約錯誤:", error);
    return NextResponse.json({ error: "查詢失敗", details: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// PATCH - 更新預約狀態 (確認/拒絕)
export async function PATCH(request) {
  let connection;
  try {
    const body = await request.json();
    const { appointment_id, status, release_schedule, doctor_id, appointment_date, appointment_time } = body;

    if (!appointment_id || !status) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 更新預約狀態
    const [result] = await connection.execute(
      `UPDATE appointments 
       SET status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE appointment_id = ?`,
      [status, appointment_id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "預約不存在" }, { status: 404 });
    }

    // 如果是拒絕預約,釋放時段
    if (release_schedule && status === "已取消" && doctor_id && appointment_date && appointment_time) {
      const formattedTime = appointment_time.length === 5 
        ? `${appointment_time}:00` 
        : appointment_time;
        
      await connection.execute(
        `UPDATE schedules 
         SET is_available = '1' 
         WHERE doctor_id = ? 
         AND schedule_date = ? 
         AND (time_slot = ? OR time_slot LIKE ?)`,
        [doctor_id, appointment_date, formattedTime, `${appointment_time}%`]
      );
    }

    await connection.commit();

    return NextResponse.json({ 
      success: true, 
      message: status === "已確認" ? "預約已確認" : "預約已取消,時段已釋放" 
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("更新預約錯誤:", error);
    return NextResponse.json({ error: "更新失敗", details: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE - 刪除預約
export async function DELETE(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const appointment_id = searchParams.get("appointment_id");

    if (!appointment_id) {
      return NextResponse.json({ error: "缺少預約ID" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 獲取預約資訊
    const [appointments] = await connection.execute(
      `SELECT doctor_id, appointment_date, appointment_time FROM appointments WHERE appointment_id = ?`,
      [appointment_id]
    );

    if (appointments.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "預約不存在" }, { status: 404 });
    }

    const { doctor_id, appointment_date, appointment_time } = appointments[0];

    // 刪除預約
    await connection.execute(
      `DELETE FROM appointments WHERE appointment_id = ?`,
      [appointment_id]
    );

    // 釋放時段
    await connection.execute(
      `UPDATE schedules 
       SET is_available = 1 
       WHERE doctor_id = ? 
       AND schedule_date = ? 
       AND time_slot LIKE ?`,
      [doctor_id, appointment_date, `${appointment_time}%`]
    );

    await connection.commit();

    return NextResponse.json({ success: true, message: "預約已刪除,時段已釋放" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("刪除預約錯誤:", error);
    return NextResponse.json({ error: "刪除失敗", details: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}