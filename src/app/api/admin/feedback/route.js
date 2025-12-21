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

export async function GET(request) {
  let connection;

  try {
    connection = await getConnection();

    const [feedbacks] = await connection.execute(`
      SELECT 
        f.feedback_id,
        f.user_role,
        f.categories,
        f.feedback_text,
        f.status,
        f.created_at,
        CASE 
          WHEN f.user_role = 'doctor' THEN d.first_name
          WHEN f.user_role = 'patient' THEN p.first_name
          ELSE '未知'
        END as first_name,
        CASE 
          WHEN f.user_role = 'doctor' THEN d.last_name
          WHEN f.user_role = 'patient' THEN p.last_name
          ELSE ''
        END as last_name
      FROM feedback f
      LEFT JOIN doctor d ON f.doctor_id = d.doctor_id AND f.user_role = 'doctor'
      LEFT JOIN patient p ON f.patient_id = p.patient_id AND f.user_role = 'patient'
      ORDER BY 
        CASE WHEN f.status = 'unread' THEN 0 ELSE 1 END,
        f.created_at DESC
    `);

    // 處理 categories JSON 字串
    const processedFeedbacks = feedbacks.map((f) => {
      let categories = [];
      if (f.categories) {
        try {
          categories = JSON.parse(f.categories);
        } catch (e) {
          categories = [];
        }
      }

      return {
        ...f,
        categories,
        created_at: f.created_at ? new Date(f.created_at).toISOString() : null,
      };
    });

    console.log(`✅ 獲取到 ${processedFeedbacks.length} 筆回報`);

    return NextResponse.json(processedFeedbacks);
  } catch (error) {
    console.error('❌ 獲取回報失敗:', error);
    return NextResponse.json(
      { message: `獲取失敗: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}