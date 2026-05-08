// 存放路徑: src/app/api/doctor/weekly-summary/route.js

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

// POST - 生成週摘要
export async function POST(request) {
  let connection;
  try {
    const doctor = await getDoctor(request);
    if (!doctor) return NextResponse.json({ message: "請先登入" }, { status: 401 });

    const doctorId = doctor.doctor_id;
    const body = await request.json();
    const { week_start, week_end } = body;

    if (!week_start || !week_end) {
      return NextResponse.json({ message: "請提供 week_start 與 week_end" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "伺服器未設定 OPENAI_API_KEY" }, { status: 500 });
    }

    // 查詢該週已完成的看診（含逐字稿）
    connection = await mysql.createConnection(dbConfig);
    const [appointments] = await connection.execute(
      `SELECT
         a.appointment_id,
         DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
         a.appointment_time,
         a.doctor_advice,
         a.transcript,
         p.first_name,
         p.last_name
       FROM appointments a
       INNER JOIN patient p ON a.patient_id = p.patient_id
       WHERE a.doctor_id = ?
         AND a.appointment_date BETWEEN ? AND ?
         AND a.status = '已完成'
       ORDER BY a.appointment_date, a.appointment_time`,
      [doctorId, week_start, week_end]
    );

    if (appointments.length === 0) {
      return NextResponse.json({ message: "該週無已完成的看診紀錄", summary: "" });
    }

    // 組合看診內容
    const contentLines = appointments.map((a, idx) => {
      const name = `${a.first_name}${a.last_name}`;
      const time = String(a.appointment_time).slice(0, 5);
      const advice = a.doctor_advice || "（無）";
      const transcript = a.transcript || "（無逐字稿）";
      return `【看診 ${idx + 1}】${a.appointment_date} ${time}　患者：${name}\n  醫師建議：${advice}\n  看診逐字稿：${transcript}`;
    });

    const prompt = `你是一位專業的醫療助理，請根據以下這一週（${week_start} 至 ${week_end}）的看診紀錄，為醫師生成一份結構清晰的中文週摘要報告，包含：
1. 本週看診總覽（患者數、常見主訴）
2. 各看診重點摘要
3. 整體觀察與建議

看診紀錄如下：
${contentLines.join("\n\n")}

請以正式、專業的醫療語氣撰寫，並使用繁體中文。`;

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.4,
    });

    const summary = response.choices[0].message.content.trim();

    console.log(`✅ 醫師 ${doctorId} 週摘要生成完成（${week_start} ~ ${week_end}，共 ${appointments.length} 筆）`);

    return NextResponse.json({
      summary,
      appointment_count: appointments.length,
      week_start,
      week_end,
    });
  } catch (error) {
    console.error("週摘要生成失敗:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}