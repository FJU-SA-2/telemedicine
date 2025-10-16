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

export async function PATCH(req) {
  let connection;
  try {
    const body = await req.json();
    const { feedback_id } = body;

    if (!feedback_id) {
      return NextResponse.json({ message: "缺少 feedback_id" }, { status: 400 });
    }

    connection = await getDbConnection();
    await connection.execute(
      "UPDATE feedback SET status = 'read', updated_at = NOW() WHERE feedback_id = ?",
      [feedback_id]
    );

    return NextResponse.json({ message: "已標示為已處理" });
  } catch (error) {
    console.error("更新回報狀態失敗:", error);
    return NextResponse.json({ message: "更新失敗" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
