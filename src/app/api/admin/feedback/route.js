import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

async function getDbConnection() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "telemedicine",
  });
}

export async function GET() {
  let connection;
  try {
    connection = await getDbConnection();

    const [rows] = await connection.execute(`
      SELECT 
        f.feedback_id,
        f.patient_id,
        f.doctor_id,
        COALESCE(p.first_name, d.first_name) AS first_name,
        COALESCE(p.last_name, d.last_name) AS last_name,
        CASE 
          WHEN f.patient_id IS NOT NULL THEN 'patient'
          WHEN f.doctor_id IS NOT NULL THEN 'doctor'
          ELSE 'unknown'
        END AS user_role,
        f.categories,
        f.feedback_text,
        f.status,
        f.created_at
      FROM feedback f
      LEFT JOIN patient p ON f.patient_id = p.patient_id
      LEFT JOIN doctor d ON f.doctor_id = d.doctor_id
      ORDER BY f.created_at DESC
    `);

    const feedbacks = rows.map(f => ({
      ...f,
      categories: JSON.parse(f.categories || "[]"),
    }));

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("取得回報失敗:", error);
    return NextResponse.json({ message: "無法載入回報資料" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
