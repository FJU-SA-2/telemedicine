// 存放路徑: src/app/api/appointments/[id]/transcript/route.js

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

// 驗證醫師身份（從 Flask session 取得）
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

// GET - 取得逐字稿
export async function GET(request, { params }) {
  let connection;
  try {
    const doctor = await getDoctor(request);
    if (!doctor) return NextResponse.json({ message: "請先登入" }, { status: 401 });

    const { id } = await params;
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      "SELECT transcript FROM appointments WHERE appointment_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "找不到預約" }, { status: 404 });
    }

    return NextResponse.json({ transcript: rows[0].transcript || "" });
  } catch (error) {
    console.error("取得逐字稿失敗:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// PUT - 更新逐字稿（手動編輯後儲存）
export async function PUT(request, { params }) {
  let connection;
  try {
    const doctor = await getDoctor(request);
    if (!doctor) return NextResponse.json({ message: "請先登入" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { transcript } = body;

    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "UPDATE appointments SET transcript = ? WHERE appointment_id = ?",
      [transcript ?? "", id]
    );

    return NextResponse.json({ message: "逐字稿已更新" });
  } catch (error) {
    console.error("更新逐字稿失敗:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}