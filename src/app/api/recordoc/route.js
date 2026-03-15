import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

// GET - 取得醫師的預約記錄
export async function GET(request) {
  let connection;
  try {
    // 從 Flask 後端獲取用戶信息
    const cookie = request.headers.get('cookie');
    const meRes = await fetch(`${process.env.BACKEND_URL || 'http://127.0.0.1:5000'}/api/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookie || '',
      },
    });

    if (!meRes.ok) {
      return NextResponse.json({ message: "請先登入" }, { status: 401 });
    }

    const meData = await meRes.json();
    
    if (!meData.authenticated || meData.user?.role !== 'doctor') {
      return NextResponse.json({ message: "此功能僅供醫師使用" }, { status: 403 });
    }

    const doctor_id = meData.user?.doctor_id;
    
    if (!doctor_id) {
      return NextResponse.json({ message: "找不到醫師資料" }, { status: 404 });
    }

    connection = await mysql.createConnection(dbConfig);

    const query = `
      SELECT 
        a.appointment_id,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date,
        a.appointment_time,
        a.cancellation_reason,
        a.status,
        a.doctor_advice,
        p.first_name,
        p.last_name
      FROM appointments a
      INNER JOIN patient p ON a.patient_id = p.patient_id
      WHERE a.doctor_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;

    const [appointments] = await connection.execute(query, [doctor_id]);

    // 格式化資料，確保所有欄位都有值
    const formattedAppointments = appointments.map((a) => ({
      appointment_id: a.appointment_id,
      appointment_date: a.appointment_date || "",
      appointment_time: a.appointment_time ? 
        (typeof a.appointment_time === 'string' ? a.appointment_time : 
         a.appointment_time.toString().match(/^\d{2}:\d{2}:\d{2}/)?.[0] || '') : "",
      status: a.status || "",
      cancellation_reason: a.cancellation_reason || "",
      doctor_advice: a.doctor_advice || "",
      first_name: a.first_name || "",
      last_name: a.last_name || ""
    }));

    return NextResponse.json(formattedAppointments, { status: 200 });
  } catch (error) {
    console.error("取得醫師預約記錄失敗:", error);
    return NextResponse.json({ 
      message: `取得歷史記錄失敗: ${error.message}` 
    }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}