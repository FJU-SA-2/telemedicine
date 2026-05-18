// 存放路徑: src/app/api/doctor/weekly-summary/history/route.js

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

async function getDoctor(request) {
  const cookie = request.headers.get("cookie");
  const meRes = await fetch("http://127.0.0.1:5000/api/me", {
    headers: { Cookie: cookie || "" },
  });
  if (!meRes.ok) return null;
  const meData = await meRes.json();
  if (!meData.authenticated || meData.user?.role !== "doctor") return null;
  return meData.user;
}

export async function GET(request) {
  let connection;
  try {
    const doctor = await getDoctor(request);
    if (!doctor) return NextResponse.json({ message: "請先登入" }, { status: 401 });

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT id,
              DATE_FORMAT(week_start, '%Y-%m-%d') AS week_start,
              DATE_FORMAT(week_end,   '%Y-%m-%d') AS week_end,
              summary,
              DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
       FROM weekly_summaries
       WHERE doctor_id = ?
       ORDER BY week_start DESC`,
      [doctor.doctor_id]
    );

    return NextResponse.json({ summaries: rows });
  } catch (error) {
    console.error("取得週摘要歷史失敗:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}