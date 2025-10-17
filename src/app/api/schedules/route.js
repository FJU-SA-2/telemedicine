import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

export async function GET() {
  try {
    console.log("嘗試連接資料庫...", dbConfig);
    const connection = await mysql.createConnection(dbConfig);
    console.log("資料庫連接成功！");

    const [rows] = await connection.execute(`
      SELECT 
        s.schedule_id, 
        s.doctor_id, 
        DATE_FORMAT(s.schedule_date, '%Y-%m-%d') as schedule_date,
        s.time_slot, 
        s.is_available
      FROM schedules s
      ORDER BY s.schedule_date ASC, s.time_slot ASC
    `);

    await connection.end();

    const formatted = rows.map(r => ({
      schedule_id: r.schedule_id,
      doctor_id: r.doctor_id,
      schedule_date: r.schedule_date, // 現在已經是字串了
      time_slot: r.time_slot,
      is_available: r.is_available
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("取得班表錯誤:", error);
    return NextResponse.json(
      { error: "無法取得班表資料", details: error.message },
      { status: 500 }
    );
  }
}