import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'telemedicine'
};

export async function POST(request) {
  let connection;
  
  try {
    // 建立資料庫連接
    connection = await mysql.createConnection(dbConfig);

    // 獲取請求資料
    const body = await request.json();
    const { appointment_id, doctor_id, rating, comment } = body;

    console.log('📝 收到評分請求:', { appointment_id, doctor_id, rating });

    // 從 cookies 獲取病患 ID
    const patientIdCookie = request.cookies.get('patient_id');
    const patient_id = patientIdCookie?.value;

    console.log('🔍 病患 ID:', patient_id);
    console.log('🍪 所有 Cookies:', request.cookies.getAll());

    if (!patient_id) {
      return NextResponse.json(
        { message: '請先登入' },
        { status: 401 }
      );
    }

    // 驗證輸入
    if (!appointment_id || !doctor_id || !rating) {
      return NextResponse.json(
        { message: '缺少必要欄位' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: '評分必須在1-5之間' },
        { status: 400 }
      );
    }

    // 檢查預約是否存在且屬於該病患
    const [appointments] = await connection.query(
      'SELECT * FROM appointments WHERE appointment_id = ? AND patient_id = ? AND status = "completed"',
      [appointment_id, patient_id]
    );

    console.log('📋 找到的預約:', appointments);

    if (appointments.length === 0) {
      return NextResponse.json(
        { message: '找不到已完成的預約記錄' },
        { status: 404 }
      );
    }

    // 檢查是否已經評分過
    const [existingRating] = await connection.query(
      'SELECT * FROM ratings WHERE appointment_id = ?',
      [appointment_id]
    );

    if (existingRating.length > 0) {
      return NextResponse.json(
        { message: '此預約已經評分過了' },
        { status: 400 }
      );
    }

    // 插入評分
    const [result] = await connection.query(
      'INSERT INTO ratings (appointment_id, patient_id, doctor_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [appointment_id, patient_id, doctor_id, rating, comment || null]
    );

    console.log('✅ 評分插入成功:', result.insertId);

    // 獲取新建立的評分
    const [newRating] = await connection.query(
      'SELECT * FROM ratings WHERE rating_id = ?',
      [result.insertId]
    );

    return NextResponse.json({
      message: '評分提交成功',
      rating: newRating[0]
    }, { status: 201 });

  } catch (error) {
    console.error('❌ 建立評分錯誤:', error);
    return NextResponse.json(
      { message: '伺服器錯誤: ' + error.message },
      { status: 500 }
    );
  } finally {
    // 關閉資料庫連接
    if (connection) {
      await connection.end();
    }
  }
}

// 獲取醫生的所有評分
export async function GET(request) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);

    const { searchParams } = new URL(request.url);
    const doctor_id = searchParams.get('doctor_id');

    if (!doctor_id) {
      return NextResponse.json(
        { message: '缺少醫生 ID' },
        { status: 400 }
      );
    }

    const [ratings] = await connection.query(
      `SELECT r.*, 
              p.first_name as patient_first_name, 
              p.last_name as patient_last_name,
              a.appointment_date
       FROM ratings r
       JOIN patients p ON r.patient_id = p.patient_id
       JOIN appointments a ON r.appointment_id = a.appointment_id
       WHERE r.doctor_id = ?
       ORDER BY r.created_at DESC`,
      [doctor_id]
    );

    // 計算平均評分
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    return NextResponse.json({
      ratings,
      average_rating: avgRating.toFixed(1),
      total_ratings: ratings.length
    });

  } catch (error) {
    console.error('獲取評分錯誤:', error);
    return NextResponse.json(
      { message: '伺服器錯誤' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}