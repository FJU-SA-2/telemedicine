// src/app/api/ratings/check/[appointment_id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mysql from 'mysql2/promise';

// 創建資料庫連接
async function getDbConnection() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "telemedicine",
  });
}

// GET /api/ratings/check/[appointment_id] - 檢查是否已評分
export async function GET(request, { params }) {
  let connection;
  try {
    const { appointment_id } = params;

    // 從 session 取得病患 ID
    const session = await getServerSession();
    const patient_id = session?.user?.id || request.headers.get('user-id');

    if (!patient_id) {
      return NextResponse.json(
        { success: false, message: '請先登入' },
        { status: 401 }
      );
    }

    connection = await getDbConnection();

    const [ratings] = await connection.query(
      `SELECT rating_id, rating, comment, created_at 
       FROM ratings 
       WHERE appointment_id = ? AND patient_id = ?`,
      [appointment_id, patient_id]
    );

    if (ratings.length > 0) {
      return NextResponse.json({
        success: true,
        hasRated: true,
        rating: ratings[0]
      });
    } else {
      return NextResponse.json({
        success: true,
        hasRated: false
      });
    }

  } catch (error) {
    console.error('檢查評分失敗:', error);
    return NextResponse.json(
      { success: false, message: '檢查評分失敗' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}