import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

// POST - 新增預約 (狀態直接設為已確認 + 立即通知)
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

    const [doctorInfo] = await connection.execute(
      `SELECT first_name, last_name, specialty, practice_hospital 
       FROM doctor WHERE doctor_id = ?`,
      [doctor_id]
    );

    if (doctorInfo.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "醫師不存在" }, { status: 404 });
    }

    const doctor = doctorInfo[0];
    const doctorName = `${doctor.first_name}${doctor.last_name}`;

    const [patientInfo] = await connection.execute(
      `SELECT first_name, last_name 
       FROM patient WHERE patient_id = ?`,
      [patient_id]
    );

    const patientName = patientInfo.length > 0 
      ? `${patientInfo[0].last_name}${patientInfo[0].first_name}`
      : '患者';

    const [result] = await connection.execute(
      `INSERT INTO appointments 
       (patient_id, doctor_id, appointment_date, appointment_time, status, symptoms, payment_method, amount) 
       VALUES (?, ?, ?, ?, '已確認', ?, ?, ?)`,
      [patient_id, doctor_id, appointment_date, appointment_time, symptoms || null, payment_method || null, amount || 250]
    );

    const appointmentId = result.insertId;

    await connection.execute(
      `UPDATE schedules 
       SET is_available = '0' 
       WHERE doctor_id = ? AND schedule_date = ? AND time_slot = ?`,
      [doctor_id, appointment_date, appointment_time]
    );

    const notificationMessage = `預約成功! 您的線上看診已確認

📅 看診日期: ${appointment_date}
⏰ 看診時間: ${appointment_time}
👨‍⚕️ 主治醫師: ${doctorName}
🏥 專科: ${doctor.specialty}
🏢 執業醫院: ${doctor.practice_hospital}

💳 付款方式: ${payment_method || '未指定'}
💰 費用: NT$ ${amount || 250}

⚠️ 請在預約時間前 10 分鐘準備好進入視訊會議室
📱 系統將會提前提醒您`;

    await connection.execute(
      `INSERT INTO notifications (patient_id, type, title, message, related_id, is_read)
       VALUES (?, 'appointment_confirmed', '預約成功', ?, ?, FALSE)`,
      [patient_id, notificationMessage, appointmentId]
    );

    const doctorNotificationMessage = `您有新的預約!

📅 預約時間: ${appointment_date} ${appointment_time}
👤 患者: ${patientName}
📝 症狀描述: ${symptoms || '未填寫'}

請準時為患者提供看診服務。`;

    await connection.execute(
      `INSERT INTO doctor_notifications (doctor_id, type, title, message, related_id, is_read)
       VALUES (?, 'new_appointment', '新預約通知', ?, ?, FALSE)`,
      [doctor_id, doctorNotificationMessage, appointmentId]
    );

    await connection.commit();

    // ✅ 即時 LINE 推播（非同步，不影響回應速度）
    fetch("http://localhost:5000/api/internal/line/booking-success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id:   patient_id,
        patient_name: patientName,
        doctor_name:  doctorName,
        specialty:    doctor.specialty,
        date_str:     appointment_date,
        time_str:     String(appointment_time).slice(0, 5),
      }),
    }).catch(err => console.warn("LINE 推播呼叫失敗:", err));

    console.log(`✅ 預約成功 - ID: ${appointmentId}, 患者: ${patient_id}`);

    return NextResponse.json({ 
      success: true, 
      appointment_id: appointmentId, 
      message: "預約成功,通知已發送" 
    }, { status: 201 });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("預約創建錯誤:", error);
    return NextResponse.json({ 
      error: "預約失敗", 
      details: error.message 
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

    connection = await mysql.createConnection(dbConfig);

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

    if (appointment_id) { query += " AND a.appointment_id = ?"; params.push(appointment_id); }
    if (patient_id) { query += " AND a.patient_id = ?"; params.push(patient_id); }
    if (doctor_id) { query += " AND a.doctor_id = ?"; params.push(doctor_id); }

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

// PATCH - 取消預約
export async function PATCH(request) {
  let connection;
  try {
    const body = await request.json();
    const { appointment_id, cancellation_reason } = body;

    if (!appointment_id) return NextResponse.json({ error: "缺少預約 ID" }, { status: 400 });
    if (!cancellation_reason || cancellation_reason.trim() === "") {
      return NextResponse.json({ error: "請填寫取消理由" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [appointments] = await connection.execute(
      `SELECT a.doctor_id, a.patient_id, a.appointment_date, a.appointment_time, a.status,
              d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialty,
              p.first_name as patient_first_name, p.last_name as patient_last_name
       FROM appointments a
       LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
       LEFT JOIN patient p ON a.patient_id = p.patient_id
       WHERE a.appointment_id = ?`,
      [appointment_id]
    );

    if (appointments.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "預約不存在" }, { status: 404 });
    }

    const appointment = appointments[0];
    if (appointment.status === '已取消') { await connection.rollback(); return NextResponse.json({ error: "預約已取消" }, { status: 400 }); }
    if (appointment.status === '已完成') { await connection.rollback(); return NextResponse.json({ error: "已完成的預約無法取消" }, { status: 400 }); }

    const appointmentDateTime = new Date(`${appointment.appointment_date} ${appointment.appointment_time}`);
    const diffHours = (appointmentDateTime - new Date()) / (1000 * 60 * 60);
    let refundPercentage, refundMessage;
    if (diffHours < 24) { refundPercentage = 20; refundMessage = "24小時內取消,退款 20%"; }
    else if (diffHours < 48) { refundPercentage = 50; refundMessage = "48小時內取消,退款 50%"; }
    else { refundPercentage = 100; refundMessage = "提前取消,全額退款"; }

    await connection.execute(
      `UPDATE appointments SET status = '已取消', cancellation_reason = ?, updated_at = NOW() WHERE appointment_id = ?`,
      [cancellation_reason, appointment_id]
    );
    await connection.execute(
      `UPDATE schedules SET is_available = '1' WHERE doctor_id = ? AND schedule_date = ? AND time_slot = ?`,
      [appointment.doctor_id, appointment.appointment_date, appointment.appointment_time]
    );

    const doctorName = `${appointment.doctor_first_name}${appointment.doctor_last_name}`;
    const patientName = appointment.patient_last_name && appointment.patient_first_name
      ? `${appointment.patient_last_name}${appointment.patient_first_name}` : '患者';

    await connection.execute(
      `INSERT INTO notifications (patient_id, type, title, message, related_id, is_read) VALUES (?, 'appointment_cancelled', '預約已取消', ?, ?, FALSE)`,
      [appointment.patient_id, `預約已取消\n📅 原預約時間: ${appointment.appointment_date} ${appointment.appointment_time}\n👨‍⚕️ 醫師: ${doctorName}\n📝 取消理由: ${cancellation_reason}\n💰 退款說明: ${refundMessage}`, appointment_id]
    );
    await connection.execute(
      `INSERT INTO doctor_notifications (doctor_id, type, title, message, related_id, is_read) VALUES (?, 'appointment_cancelled', '預約已取消', ?, ?, FALSE)`,
      [appointment.doctor_id, `患者已取消預約\n📅 原預約時間: ${appointment.appointment_date} ${appointment.appointment_time}\n👤 患者: ${patientName}\n📝 取消原因: ${cancellation_reason}`, appointment_id]
    );

    await connection.commit();

    // ✅ 即時 LINE 推播（非同步）
    fetch("http://localhost:5000/api/internal/line/booking-cancelled", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id:     appointment.patient_id,
        patient_name:   patientName,
        doctor_name:    doctorName,
        specialty:      appointment.specialty,
        date_str:       String(appointment.appointment_date),
        time_str:       String(appointment.appointment_time).slice(0, 5),
        cancel_reason:  cancellation_reason,
        refund_message: refundMessage,
      }),
    }).catch(err => console.warn("LINE 取消推播呼叫失敗:", err));

    console.log(`✅ 預約已取消 - ID: ${appointment_id}`);
    return NextResponse.json({ success: true, message: `取消成功,${refundMessage}`, refund_percentage: refundPercentage }, { status: 200 });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("取消預約錯誤:", error);
    return NextResponse.json({ error: "取消失敗", details: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}