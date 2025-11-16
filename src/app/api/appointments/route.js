import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// 直接寫死資料庫連線設定
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

// POST - 新增預約 (狀態直接設為已確認)
export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const { patient_id, doctor_id, appointment_date, appointment_time, symptoms, payment_method, amount } = body;

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [schedules] = await connection.execute(
      `SELECT is_available FROM schedules 
       WHERE doctor_id = ? AND schedule_date = ? AND time_slot = ? FOR UPDATE`,
      [doctor_id, appointment_date, appointment_time]
    );

    if (schedules.length === 0 || Number(schedules[0].is_available) !== 1) {
      await connection.rollback();
      return NextResponse.json({ error: "該時段已被預約或不存在" }, { status: 409 });
    }

    // ✅ 修改:狀態直接設為「已確認」
    const [result] = await connection.execute(
      `INSERT INTO appointments 
       (patient_id, doctor_id, appointment_date, appointment_time, status, symptoms, payment_method, amount) 
       VALUES (?, ?, ?, ?, '已確認', ?, ?, ?)`,
      [patient_id, doctor_id, appointment_date, appointment_time, symptoms || null, payment_method || null, amount || 500]
    );

    await connection.execute(
      `UPDATE schedules 
       SET is_available = '0' 
       WHERE doctor_id = ? AND schedule_date = ? AND time_slot = ?`,
      [doctor_id, appointment_date, appointment_time]
    );

    await connection.commit();

    return NextResponse.json({ success: true, appointment_id: result.insertId, message: "預約成功" }, { status: 201 });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("預約創建錯誤:", error);
    return NextResponse.json({ error: "預約失敗", details: error.message }, { status: 500 });
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

    connection = await mysql.createConnection(dbConfig);

    // ✅ 新增:刪除過期的排程(保留今天但時間已過的排程也刪除)
    await connection.execute(`
      DELETE FROM schedules 
      WHERE CONCAT(schedule_date, ' ', time_slot) < NOW()
    `);

    let query = `
      SELECT 
        a.*,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.specialty,
        d.practice_hospital,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name
      FROM appointments a
      LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
      LEFT JOIN patient p ON a.patient_id = p.patient_id
      WHERE 1=1
    `;
    const params = [];

    if (appointment_id) {
      query += " AND a.appointment_id = ?";
      params.push(appointment_id);
    }
    if (patient_id) {
      query += " AND a.patient_id = ?";
      params.push(patient_id);
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
// ✅ 新增: PATCH - 取消預約
export async function PATCH(request) {
  let connection;
  try {
    const body = await request.json();
    const { appointment_id, cancellation_reason } = body;

    if (!appointment_id) {
      return NextResponse.json({ error: "缺少預約 ID" }, { status: 400 });
    }

    if (!cancellation_reason || cancellation_reason.trim() === "") {
      return NextResponse.json({ error: "請填寫取消理由" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 查詢預約資料
    const [appointments] = await connection.execute(
      `SELECT doctor_id, appointment_date, appointment_time, status 
       FROM appointments 
       WHERE appointment_id = ?`,
      [appointment_id]
    );

    if (appointments.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "預約不存在" }, { status: 404 });
    }

    const appointment = appointments[0];

    if (appointment.status === '已取消') {
      await connection.rollback();
      return NextResponse.json({ error: "預約已取消" }, { status: 400 });
    }

    if (appointment.status === '已完成') {
      await connection.rollback();
      return NextResponse.json({ error: "已完成的預約無法取消" }, { status: 400 });
    }

    // 更新預約狀態為已取消,並記錄取消理由
    await connection.execute(
      `UPDATE appointments 
       SET status = '已取消', 
           cancellation_reason = ?,
           updated_at = NOW()
       WHERE appointment_id = ?`,
      [cancellation_reason, appointment_id]
    );

    // 釋放時段,將排程設回可預約
    await connection.execute(
      `UPDATE schedules 
       SET is_available = '1' 
       WHERE doctor_id = ? AND schedule_date = ? AND time_slot = ?`,
      [appointment.doctor_id, appointment.appointment_date, appointment.appointment_time]
    );

    await connection.commit();

    return NextResponse.json({ 
      success: true, 
      message: "預約已取消,時段已釋放" 
    }, { status: 200 });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("取消預約錯誤:", error);
    return NextResponse.json({ error: "取消失敗", details: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}