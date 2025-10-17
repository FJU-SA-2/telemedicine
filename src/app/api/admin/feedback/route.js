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
        p.first_name,
        p.last_name,
        f.categories,
        f.feedback_text,
        f.status,
        f.created_at
      FROM feedback f
      LEFT JOIN patient p ON f.patient_id = p.patient_id
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
