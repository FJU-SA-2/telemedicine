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
    const { user_id, user_type, categories, feedback_text } = body;

    console.log('接收到的 user_id:', user_id, 'type:', typeof user_id);
    console.log('接收到的 user_type (前端傳入):', user_type);

    if (!user_id) {
      return NextResponse.json({ message: '請先登入' }, { status: 401 });
    }

    connection = await getDbConnection();

    // ✅ 優先使用前端傳來的 user_type
    let userRole = user_type;

    // 若前端沒傳，就去資料庫查
    if (!userRole) {
      console.log('前端未提供 user_type，改從 users 表查角色...');
      const [users] = await connection.execute(
        'SELECT user_id, role FROM users WHERE user_id = ?',
        [user_id]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { message: `使用者不存在 (user_id: ${user_id})` },
          { status: 404 }
        );
      }

      userRole = users[0].role;
    }

    console.log('最終使用的 userRole:', userRole);

    let relatedId = null;
    let relatedType = null;

    // ✅ 根據角色查詢對應 ID
    if (userRole === 'patient') {
      const [patients] = await connection.execute(
        'SELECT patient_id FROM patient WHERE user_id = ?',
        [user_id]
      );

      if (patients.length === 0) {
        return NextResponse.json(
          { message: `找不到病患資料 (user_id: ${user_id})` },
          { status: 400 }
        );
      }

      relatedId = patients[0].patient_id;
      relatedType = 'patient';
      console.log('找到的 patient_id:', relatedId);

    } else if (userRole === 'doctor') {
      const [doctors] = await connection.execute(
        'SELECT doctor_id FROM doctor WHERE user_id = ?',
        [user_id]
      );

      if (doctors.length === 0) {
        return NextResponse.json(
          { message: `找不到醫生資料 (user_id: ${user_id})` },
          { status: 400 }
        );
      }

      relatedId = doctors[0].doctor_id;
      relatedType = 'doctor';
      console.log('找到的 doctor_id:', relatedId);

    } else {
      return NextResponse.json(
        { message: `不支援的使用者角色: ${userRole}` },
        { status: 400 }
      );
    }

    // ✅ 驗證回饋內容
    if (!feedback_text || feedback_text.trim() === '') {
      return NextResponse.json(
        { message: '問題描述不能為空' },
        { status: 400 }
      );
    }

    const categoriesJson = JSON.stringify(categories);

    // ✅ 插入回饋記錄
    const [result] = await connection.execute(
      `INSERT INTO feedback (patient_id, doctor_id, user_role, categories, feedback_text, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'unread', NOW(), NOW())`,
      [
        relatedType === 'patient' ? relatedId : null,
        relatedType === 'doctor' ? relatedId : null,
        userRole,
        categoriesJson,
        feedback_text
      ]
    );

    console.log('回饋提交成功, feedback_id:', result.insertId);

    return NextResponse.json(
      { 
        message: '回報已提交',
        feedback_id: result.insertId,
        user_role: userRole
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
    if (connection) await connection.end();
  }
}
