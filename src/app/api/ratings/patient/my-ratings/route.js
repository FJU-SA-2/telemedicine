import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'telemedicine'
};
export async function GET(request) {
  try {
    // 從 session 或 cookies 獲取病患 ID
    const patient_id = request.cookies.get('patient_id')?.value;

    if (!patient_id) {
      return NextResponse.json(
        { message: '請先登入' },
        { status: 401 }
      );
    }

    const [ratings] = await db.query(
      `SELECT 
        r.*,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty as doctor_specialty,
        a.appointment_date,
        a.appointment_time
      FROM ratings r
      JOIN doctors d ON r.doctor_id = d.doctor_id
      JOIN appointments a ON r.appointment_id = a.appointment_id
      WHERE r.patient_id = ?
      ORDER BY r.created_at DESC`,
      [patient_id]
    );

    return NextResponse.json(ratings);

  } catch (error) {
    console.error('獲取評分記錄錯誤:', error);
    return NextResponse.json(
      { message: '伺服器錯誤' },
      { status: 500 }
    );
  }
}