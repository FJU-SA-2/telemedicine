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

export async function GET(request) {
  let connection;
  
  try {
    console.log('開始獲取評論資料...');
    
    // 建立資料庫連線
    connection = await getDbConnection();
    console.log('資料庫連線成功');

    // 查詢評論資料
    const [ratings] = await connection.query(`
      SELECT 
        r.rating_id,
        r.appointment_id,
        r.patient_id,
        r.doctor_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty as doctor_specialty
      FROM ratings r
      LEFT JOIN patient p ON r.patient_id = p.patient_id
      LEFT JOIN doctor d ON r.doctor_id = d.doctor_id
      ORDER BY r.created_at DESC
    `);

    console.log(`成功獲取 ${ratings.length} 則評論`);

    return NextResponse.json(ratings);
    
  } catch (error) {
    console.error('獲取評論錯誤:', error);
    
    // 詳細的錯誤訊息
    let errorMessage = '伺服器錯誤';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '無法連接到資料庫';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = '資料表不存在: ' + error.message;
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = '資料表欄位錯誤: ' + error.message;
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = '資料庫不存在';
    } else {
      errorMessage = error.message || '未知錯誤';
    }
    
    return NextResponse.json(
      { 
        message: errorMessage,
        error: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage
      },
      { status: 500 }
    );
  } finally {
    // 關閉連線
    if (connection) {
      await connection.end();
      console.log('資料庫連線已關閉');
    }
  }
}