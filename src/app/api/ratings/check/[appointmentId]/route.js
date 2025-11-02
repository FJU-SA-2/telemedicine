import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'telemedicine'
};
export async function GET(request, { params }) {
  try {
    const { appointmentId } = params;
    
    // 從 session 或 cookies 獲取病患 ID
    const patient_id = request.cookies.get('patient_id')?.value;

    if (!patient_id) {
      return NextResponse.json(
        { message: '請先登入' },
        { status: 401 }
      );
    }

    // 檢查預約狀態
    const [appointments] = await db.query(
      'SELECT * FROM appointments WHERE appointment_id = ? AND patient_id = ?',
      [appointmentId, patient_id]
    );

    if (appointments.length === 0) {
      return NextResponse.json({
        canRate: false,
        reason: '找不到預約記錄'
      });
    }

    if (appointments[0].status !== 'completed') {
      return NextResponse.json({
        canRate: false,
        reason: '預約尚未完成'
      });
    }

    // 檢查是否已評分
    const [ratings] = await db.query(
      'SELECT * FROM ratings WHERE appointment_id = ?',
      [appointmentId]
    );

    if (ratings.length > 0) {
      return NextResponse.json({
        canRate: false,
        reason: '已經評分過了',
        existingRating: ratings[0]
      });
    }

    return NextResponse.json({ canRate: true });

  } catch (error) {
    console.error('檢查評分狀態錯誤:', error);
    return NextResponse.json(
      { message: '伺服器錯誤' },
      { status: 500 }
    );
  }
}