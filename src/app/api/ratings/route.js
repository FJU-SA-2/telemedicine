// src/app/api/ratings/route.js
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

// POST /api/ratings - 提交評分
export async function POST(request) {
  try {
    const { appointment_id, rating, comment } = await request.json();

    // 從 session 取得病患 ID (根據你的認證方式調整)
    const session = await getServerSession();
    const patient_id = session?.user?.id || request.headers.get('user-id');

    if (!patient_id) {
      return NextResponse.json(
        { success: false, message: '請先登入' },
        { status: 401 }
      );
    }

    // 驗證評分範圍
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: '評分必須在 1-5 之間' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      // 1. 檢查該預約是否存在並取得醫生 ID
      const [appointments] = await connection.query(
        `SELECT doctor_id, patient_id 
         FROM appointments 
         WHERE appointment_id = ? AND patient_id = ? AND status = 'completed'`,
        [appointment_id, patient_id]
      );

      if (appointments.length === 0) {
        connection.release();
        return NextResponse.json(
          { success: false, message: '找不到此預約或預約尚未完成' },
          { status: 404 }
        );
      }

      const doctor_id = appointments[0].doctor_id;

      // 2. 檢查是否已評分過
      const [existingRating] = await connection.query(
        'SELECT rating_id FROM ratings WHERE appointment_id = ?',
        [appointment_id]
      );

      if (existingRating.length > 0) {
        // 更新現有評分
        await connection.query(
          `UPDATE ratings 
           SET rating = ?, comment = ?, updated_at = NOW()
           WHERE appointment_id = ?`,
          [rating, comment || null, appointment_id]
        );

        connection.release();
        return NextResponse.json({
          success: true,
          message: '評分已更新',
          rating_id: existingRating[0].rating_id
        });
      }

      // 3. 插入新評分
      const [result] = await connection.query(
        `INSERT INTO ratings (appointment_id, patient_id, doctor_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [appointment_id, patient_id, doctor_id, rating, comment || null]
      );

      connection.release();

      return NextResponse.json({
        success: true,
        message: '評分已提交',
        rating_id: result.insertId
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('提交評分失敗:', error);
    return NextResponse.json(
      { success: false, message: '提交評分失敗，請稍後再試' },
      { status: 500 }
    );
  }
}