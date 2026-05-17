import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cookies } from "next/headers";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "telemedicine",
};

export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const { appointment_id, patient_id, suggested_weeks, note } = body;

    if (!appointment_id || !patient_id) {
      return NextResponse.json({ success: false, message: "缺少必要參數" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);

    // 取得醫師與患者資訊
    const [rows] = await connection.execute(
      `SELECT
         CONCAT(d.first_name, d.last_name) AS doctor_name,
         d.specialty,
         d.doctor_id,
         CONCAT(p.first_name, p.last_name) AS patient_name
       FROM appointments a
       JOIN doctor  d ON a.doctor_id  = d.doctor_id
       JOIN patient p ON a.patient_id = p.patient_id
       WHERE a.appointment_id = ?`,
      [appointment_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "找不到該預約" }, { status: 404 });
    }

    const { doctor_name, specialty, doctor_id, patient_name } = rows[0];

    // 寫入 followup_requests
    const [result] = await connection.execute(
      `INSERT INTO followup_requests
         (appointment_id, patient_id, doctor_id, suggested_weeks, note, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [appointment_id, patient_id, doctor_id, suggested_weeks ?? 2, note ?? ""]
    );
    const followup_request_id = result.insertId;

    // 呼叫 Flask 推播 LINE
    fetch("http://localhost:5000/api/internal/line/followup-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id,
        patient_name,
        doctor_name,
        specialty,
        suggested_weeks: suggested_weeks ?? 2,
        note: note ?? "",
        followup_request_id,
      }),
    }).catch(err => console.warn("LINE 回診推播失敗:", err));

    return NextResponse.json({ success: true, followup_request_id }, { status: 200 });

  } catch (error) {
    console.error("followup-request 錯誤:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}