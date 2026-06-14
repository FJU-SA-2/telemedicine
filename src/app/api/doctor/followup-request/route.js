import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cookies } from "next/headers";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "telemedicine",
};

const FLASK_BASE = process.env.FLASK_API_URL || "http://localhost:5000";

export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const { appointment_id, patient_id, suggested_weeks, appointment_type, note } = body;

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
         (appointment_id, patient_id, doctor_id, suggested_weeks, appointment_type, note, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [appointment_id, patient_id, doctor_id, suggested_weeks ?? 2, appointment_type ?? "online", note ?? ""]
    );
    const followup_request_id = result.insertId;

    // 呼叫 Flask 推播 LINE（await 確保 serverless 不會提早結束）
    try {
      const lineRes = await fetch(`${FLASK_BASE}/api/internal/line/followup-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id,
          patient_name,
          doctor_name,
          specialty,
          suggested_weeks: suggested_weeks ?? 2,
          appointment_type: appointment_type ?? "online",
          note: note ?? "",
          followup_request_id,
        }),
      });
      if (!lineRes.ok) {
        const errText = await lineRes.text();
        console.warn(`[LINE 推播] Flask 回應異常 status=${lineRes.status}:`, errText);
      } else {
        console.log("[LINE 推播] 成功送出，followup_request_id=", followup_request_id);
      }
    } catch (lineErr) {
      console.warn("[LINE 推播] 呼叫 Flask 失敗:", lineErr.message);
    }

    return NextResponse.json({ success: true, followup_request_id }, { status: 200 });

  } catch (error) {
    console.error("followup-request 錯誤:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}