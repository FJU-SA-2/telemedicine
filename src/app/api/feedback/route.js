import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'telemedicine',
};

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

export async function POST(request) {
  let connection;
  
  try {
    const body = await request.json();
    const { user_id, user_type, categories, feedback_text } = body;

    console.log('📝 收到回報提交請求:', { user_id, user_type });

    if (!feedback_text || feedback_text.trim() === '') {
      return NextResponse.json(
        { success: false, message: '請填寫問題描述' },
        { status: 400 }
      );
    }

    connection = await getConnection();

    // 根據 user_type 獲取對應的 ID
    let patient_id = null;
    let doctor_id = null;
    let user_role = null;

    if (user_type === 'patient') {
      const [patientRows] = await connection.execute(
        'SELECT patient_id FROM patient WHERE user_id = ?',
        [user_id]
      );
      if (patientRows.length > 0) {
        patient_id = patientRows[0].patient_id;
      }
      user_role = 'patient';
    } else if (user_type === 'doctor') {
      const [doctorRows] = await connection.execute(
        'SELECT doctor_id FROM doctor WHERE user_id = ?',
        [user_id]
      );
      if (doctorRows.length > 0) {
        doctor_id = doctorRows[0].doctor_id;
      }
      user_role = 'doctor';
    }

    // 將 categories 轉為 JSON 字串
    const categoriesJson = JSON.stringify(categories);

    // 插入回報
    const [result] = await connection.execute(
      `INSERT INTO feedback (patient_id, doctor_id, user_role, categories, feedback_text, status)
       VALUES (?, ?, ?, ?, ?, 'unread')`,
      [patient_id, doctor_id, user_role, categoriesJson, feedback_text]
    );

    console.log(`✅ 回報已提交 - ID: ${result.insertId}`);

    return NextResponse.json({
      success: true,
      message: '回報提交成功',
      feedback_id: result.insertId,
    });
  } catch (error) {
    console.error('❌ 提交回報失敗:', error);
    return NextResponse.json(
      { success: false, message: `提交失敗: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}