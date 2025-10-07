import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',              // 改成你的使用者名稱
  password: '',       // 改成你的密碼
  database: 'telemedicine'
};

export async function GET(request) {
  try {
    console.log('嘗試連接資料庫...', dbConfig);
    const connection = await mysql.createConnection(dbConfig);
    console.log('資料庫連接成功！');
    
    const [rows] = await connection.execute(`
      SELECT 
        d.doctor_id,
        d.first_name,
        d.last_name,
        d.gender,
        d.specialty,
        d.practice_hospital,
        d.phone_number,
        u.email
      FROM doctor d
      JOIN users u ON d.user_id = u.user_id
      WHERE u.role = 'doctor'
    `);
    
    console.log('查詢結果:', rows);
    await connection.end();
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('詳細錯誤:', error);
    return NextResponse.json({ 
      error: '無法取得醫生資料', 
      details: error.message 
    }, { status: 500 });
  }
}