// app/api/doctors/patients/route.js
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cookies } from "next/headers";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

// GET - 獲取該醫師的所有患者（曾經預約過的）
export async function GET(request) {
  let connection;
  try {
    // 方法1: 直接從內部呼叫 /api/me 的邏輯
    // 先取得 cookies 傳遞給內部驗證
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // 建立 cookie 字串
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
    
    // 從 /api/me 回傳的資料取得 doctor_id
    const doctorId = meData.user.doctor_id;
    
    if (!doctorId) {
      return NextResponse.json({ error: "找不到醫師資料" }, { status: 404 });
    }

    connection = await mysql.createConnection(dbConfig);

    // 查詢曾經預約過該醫師的所有患者（去重）
    const [patients] = await connection.execute(`
      SELECT DISTINCT
        p.patient_id,
        p.first_name,
        p.last_name,
        p.gender,
        p.date_of_birth,
        p.phone_number,
        p.address,
        p.id_number,
        p.smoking_status,
        p.drug_allergies,
        p.medical_history,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        (SELECT COUNT(*) FROM appointments WHERE patient_id = p.patient_id AND doctor_id = ?) as total_appointments,
        (SELECT MAX(appointment_date) FROM appointments WHERE patient_id = p.patient_id AND doctor_id = ?) as last_appointment_date
      FROM patient p
      INNER JOIN appointments a ON p.patient_id = a.patient_id
      WHERE a.doctor_id = ?
      ORDER BY last_appointment_date DESC
    `, [doctorId, doctorId, doctorId]);

    return NextResponse.json(patients);
  } catch (error) {
    console.error("獲取患者列表錯誤:", error);
    return NextResponse.json({ error: "獲取失敗", details: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}