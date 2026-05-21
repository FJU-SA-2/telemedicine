// 存放路徑: src/app/api/appointments/[id]/ai-summary/route.js

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import OpenAI from "openai";

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

// POST - 生成單筆 AI 摘要
export async function POST(request, { params }) {
  let connection;
  try {
    const doctor = await getDoctor(request);
    if (!doctor) return NextResponse.json({ message: "請先登入" }, { status: 401 });

    const appointmentId = params.id;
    const body = await request.json();
    const transcript = body.transcript?.trim();
    if (!transcript) {
      return NextResponse.json({ message: "逐字稿內容為空，無法生成摘要" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ message: "伺服器未設定 OPENAI_API_KEY" }, { status: 500 });

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT a.appointment_date, a.appointment_time, a.doctor_advice,
              CONCAT(p.first_name, p.last_name) AS patient_name
       FROM appointments a
       JOIN patient p ON a.patient_id = p.patient_id
       WHERE a.appointment_id = ? AND a.doctor_id = ?`,
      [appointmentId, doctor.doctor_id]
    );

    if (rows.length === 0) return NextResponse.json({ message: "找不到該看診紀錄" }, { status: 404 });
    const row = rows[0];
    const time = String(row.appointment_time).slice(0, 5);

    const prompt = `你是一位專業醫療助理，請根據以下看診逐字稿，為醫師生成一份簡潔的單筆看診摘要。

患者姓名：${row.patient_name}
看診日期：${row.appointment_date} ${time}
醫師建議：${row.doctor_advice || "（未填寫）"}

看診逐字稿：
${transcript}

請生成包含以下重點的繁體中文摘要（條列格式）：
1. 主訴與症狀
2. 重要病史或用藥資訊
3. 醫師評估與診斷方向
4. 處置與衛教重點
5. 追蹤事項（如有）

請保持簡潔專業，每點不超過兩句。`;

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    });

    const summary = response.choices[0].message.content.trim();
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("單筆摘要生成失敗:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// PUT - 儲存單筆 AI 摘要
export async function PUT(request, { params }) {
  let connection;
  try {
    const doctor = await getDoctor(request);
    if (!doctor) return NextResponse.json({ message: "請先登入" }, { status: 401 });

    const appointmentId = params.id;
    const body = await request.json();
    const ai_summary = body.ai_summary?.trim();
    if (!ai_summary) return NextResponse.json({ message: "摘要內容為空" }, { status: 400 });

    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `UPDATE appointments SET ai_summary = ? WHERE appointment_id = ? AND doctor_id = ?`,
      [ai_summary, appointmentId, doctor.doctor_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("儲存單筆摘要失敗:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}