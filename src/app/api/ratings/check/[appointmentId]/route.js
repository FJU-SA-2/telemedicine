// src/app/api/ratings/check/[appointmentId]/route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';

// 創建資料庫連接
async function getDbConnection() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "telemedicine",
  });
}

// ✅ 從 cookie 取得病患 ID
async function getPatientIdFromCookie() {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return null;
    }

    const userData = JSON.parse(userCookie.value);
    return userData.patient_id || userData.id;
  } catch (error) {
    console.error('解析 cookie 失敗:', error);
    return null;
  }
}

// GET /api/ratings/check/[appointmentId] - 檢查是否已評分
export async function GET(request, { params }) {
  let connection;
  try {
    const { appointmentId } = params;
    
    // ✅ 從 cookie 取得病患 ID
    const patient_id = await getPatientIdFromCookie();

    if (!patient_id) {
      return NextResponse.json(
        { success: false, message: '請先登入' },
        { status: 401 }
      );
    }

    connection = await getDbConnection();

    // 檢查是否已評分
    const [ratings] = await connection.query(
      `SELECT rating_id, rating, comment, created_at 
       FROM ratings 
       WHERE appointment_id = ? AND patient_id = ?`,
      [appointmentId, patient_id]
    );

    if (ratings.length > 0) {
      return NextResponse.json({
        success: true,
        hasRated: true,
        rating: ratings[0]
      });
    }

    return NextResponse.json({
      success: true,
      hasRated: false
    });

  } catch (error) {
    console.error('檢查評分狀態失敗:', error);
    return NextResponse.json(
      { success: false, message: '檢查失敗' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}