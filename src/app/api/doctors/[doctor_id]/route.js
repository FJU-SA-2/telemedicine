import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'telemedicine'
};

export async function PATCH(request, { params }) {
  try {
    const { doctor_id } = params;
    const body = await request.json();

    const { first_name, last_name, specialty, phone_number, gender } = body;

    const connection = await mysql.createConnection(dbConfig);

    await connection.execute(
      `UPDATE doctor 
       SET first_name = ?, last_name = ?, specialty = ?, phone_number = ?, gender = ?, updated_at = NOW()
       WHERE doctor_id = ?`,
      [first_name, last_name, specialty, phone_number, gender, doctor_id]
    );

    await connection.end();

    return NextResponse.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新醫師資料失敗:', error);
    return NextResponse.json(
      { error: '更新失敗', details: error.message },
      { status: 500 }
    );
  }
}