// app/api/doctors/patients/[id]/route.js
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cookies } from "next/headers";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

// GET - 獲取單一患者詳細資料及就診紀錄
export async function GET(request, { params }) {
  let connection;
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieString = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // 呼叫 /api/me 來獲取當前使用者
    const baseUrl = request.nextUrl.origin;
    const meResponse = await fetch(`${baseUrl}/api/me`, {
      headers: {
        Cookie: cookieString
      }
    });
    
    if (!meResponse.ok) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }
    
    const meData = await meResponse.json();
    
    if (!meData.authenticated || !meData.user) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }
    
    if (meData.user.role !== 'doctor') {
      return NextResponse.json({ error: "您不是醫師" }, { status: 403 });
    }
    
    const doctorId = meData.user.doctor_id;
    
    if (!doctorId) {
      return NextResponse.json({ error: "找不到醫師資料" }, { status: 404 });
    }

    const { id: patientId } = await params;
    connection = await mysql.createConnection(dbConfig);

    // 檢查該患者是否曾預約過此醫師
    const [check] = await connection.execute(
      `SELECT 1 FROM appointments WHERE patient_id = ? AND doctor_id = ? LIMIT 1`,
      [patientId, doctorId]
    );

    if (check.length === 0) {
      return NextResponse.json({ error: "無權限查看此患者" }, { status: 403 });
    }

    // 獲取患者基本資料
    const [patients] = await connection.execute(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM appointments WHERE patient_id = p.patient_id AND doctor_id = ?) as total_appointments,
        (SELECT MAX(appointment_date) FROM appointments WHERE patient_id = p.patient_id AND doctor_id = ?) as last_appointment_date
      FROM patient p
      WHERE p.patient_id = ?
    `, [doctorId, doctorId, patientId]);

    if (patients.length === 0) {
      return NextResponse.json({ error: "患者不存在" }, { status: 404 });
    }

    // 獲取該患者的「所有」就診紀錄（不限於當前醫師）
    const [history] = await connection.execute(`
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.symptoms,
        a.consultation_notes as diagnoses,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty
      FROM appointments a
      JOIN doctor d ON a.doctor_id = d.doctor_id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [patientId]);

    // 格式化就診紀錄
    const formattedHistory = history.map(h => ({
      appointment_id: h.appointment_id,
      doctor_name: `${h.doctor_last_name}${h.doctor_first_name}`,
      specialty: h.specialty,
      appointment_date: h.appointment_date,
      appointment_time: h.appointment_time,
      status: h.status,
      symptoms: h.symptoms,
      diagnoses: h.diagnoses
    }));

    return NextResponse.json({
      patient: patients[0],
      history: formattedHistory
    });

  } catch (error) {
    console.error("獲取患者詳情錯誤:", error);
    return NextResponse.json({ error: "獲取失敗", details: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}