import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

async function getDbConnection() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "telemedicine",
  });
}

export async function POST(req) {
  let connection;
  try {
    const body = await req.json();
    const { user_id, categories, feedback_text } = body;

    if (!user_id) {
      return NextResponse.json(
        { message: '請先登入' },
        { status: 401 }
      );
    }

    connection = await getDbConnection();
    const [patients] = await connection.execute(
      'SELECT patient_id FROM patient WHERE user_id = ?',
      [user_id]
    );

    if (patients.length === 0) {
      return NextResponse.json(
        { message: '無效的使用者 ID，請重新登入' },
        { status: 400 }
      );
    }
    const patient_id = patients[0].patient_id;

    if (!feedback_text || feedback_text.trim() === '') {
      return NextResponse.json(
        { message: '問題描述不能為空' },
        { status: 400 }
      );
    }

    const categoriesJson = JSON.stringify(categories);

    const [result] = await connection.execute(
      `INSERT INTO feedback (patient_id, categories, feedback_text, status, created_at, updated_at) 
       VALUES (?, ?, ?, 'unread', NOW(), NOW())`,
      [patient_id, categoriesJson, feedback_text]
    );

    return NextResponse.json(
      { 
        message: '回報已提交',
        feedback_id: result.insertId 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('提交回報失敗:', error);
    return NextResponse.json(
      { message: '提交失敗,請稍後重試', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}