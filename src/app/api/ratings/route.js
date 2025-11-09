// src/app/api/ratings/route.js
import { NextResponse } from 'next/server';
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
  let connection;
  try {
    const { appointment_id, rating, comment, user_id } = await request.json();

    // ✅ 修正：從前端傳來的 user_id 取得病患 ID
    if (!user_id) {
      console.log('❌ 未提供 user_id');
      return NextResponse.json(
        { success: false, message: '請先登入' },
        { status: 401 }
      );
    }

    console.log('✅ User ID:', user_id);
    console.log('📋 預約 ID:', appointment_id);

    // 驗證評分範圍
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: '評分必須在 1-5 之間' },
        { status: 400 }
      );
    }

    connection = await getDbConnection();

    // 1. 從 user_id 查詢 patient_id
    const [patients] = await connection.query(
      'SELECT patient_id FROM patient WHERE user_id = ?',
      [user_id]
    );

    if (patients.length === 0) {
      console.log('❌ 找不到病患資料');
      return NextResponse.json(
        { success: false, message: '找不到病患資料' },
        { status: 404 }
      );
    }

    const patient_id = patients[0].patient_id;
    console.log('✅ 病患 ID:', patient_id);

    // 2. 檢查該預約是否存在並取得醫生 ID
    const [appointments] = await connection.query(
      `SELECT doctor_id, patient_id, status 
       FROM appointments 
       WHERE appointment_id = ? AND patient_id = ?`,
      [appointment_id, patient_id]
    );

    if (appointments.length === 0) {
      console.log('❌ 找不到預約或病患不匹配');
      return NextResponse.json(
        { success: false, message: '找不到此預約或您沒有權限評分' },
        { status: 404 }
      );
    }

    const doctor_id = appointments[0].doctor_id;
    console.log('✅ 找到預約，醫生 ID:', doctor_id);

    // 3. 檢查是否已評分過
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

      console.log('✅ 評分已更新');
      return NextResponse.json({
        success: true,
        message: '評分已更新',
        rating_id: existingRating[0].rating_id
      });
    }

    // 4. 插入新評分
    const [result] = await connection.query(
      `INSERT INTO ratings (appointment_id, patient_id, doctor_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [appointment_id, patient_id, doctor_id, rating, comment || null]
    );

    console.log('✅ 評分已新增，ID:', result.insertId);
    return NextResponse.json({
      success: true,
      message: '評分已提交',
      rating_id: result.insertId
    });

  } catch (error) {
    console.error('❌ 提交評分失敗:', error);
    return NextResponse.json(
      { success: false, message: '提交評分失敗，請稍後再試' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}