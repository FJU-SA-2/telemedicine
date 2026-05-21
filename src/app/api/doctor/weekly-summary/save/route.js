// 存放路徑: src/app/api/doctor/weekly-summary/save/route.js

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

export async function POST(request) {
  let connection;
  try {
    const doctor = await getDoctor(request);
    if (!doctor) return NextResponse.json({ message: "請先登入" }, { status: 401 });

    const body = await request.json();
    const { week_start, week_end, summary } = body;
    if (!week_start || !week_end || !summary?.trim()) {
      return NextResponse.json({ message: "缺少必要參數" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO weekly_summaries (doctor_id, week_start, week_end, summary, created_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE summary = VALUES(summary), created_at = NOW()`,
      [doctor.doctor_id, week_start, week_end, summary.trim()]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("儲存週摘要失敗:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}