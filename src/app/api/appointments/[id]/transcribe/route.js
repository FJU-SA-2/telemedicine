// 存放路徑: src/app/api/appointments/[id]/transcribe/route.js

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import OpenAI from "openai";

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

// POST - 接收音訊 → Whisper 轉文字 → 存入 DB
export async function POST(request, { params }) {
  let connection;
  try {
    const doctor = await getDoctor(request);
    if (!doctor) return NextResponse.json({ message: "請先登入" }, { status: 401 });

    // ⭐ Next.js 15 params 需要 await
    const { id } = await params;

    // 取得上傳的音訊檔案
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile) {
      return NextResponse.json({ message: "未收到音訊檔案" }, { status: 400 });
    }

    // 將 File 物件轉成 Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ message: "音訊資料為空，請重新錄製" }, { status: 400 });
    }

    console.log(`📤 準備送 Whisper，appointment_id=${id}，大小=${buffer.length} bytes`);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "伺服器未設定 OPENAI_API_KEY" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    // ⭐ 用 Blob 而非 File，相容性更好
    const filename = audioFile.name || `consultation_${id}.webm`;
    const mimeType = audioFile.type || "audio/webm";
    const blob = new Blob([buffer], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    const transcriptResponse = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "zh",
      response_format: "text",
    });

    const transcriptText =
      typeof transcriptResponse === "string"
        ? transcriptResponse.trim()
        : (transcriptResponse.text ?? "").trim();

    if (!transcriptText) {
      return NextResponse.json(
        { message: "語音辨識結果為空，請確認麥克風有錄到聲音" },
        { status: 400 }
      );
    }

    console.log(`✅ Whisper 轉文字成功（${transcriptText.length} 字）`);

    // 存入 DB
    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE appointments SET transcript = ? WHERE appointment_id = ?",
      [transcriptText, id]
    );

    if (result.affectedRows === 0) {
      console.warn(`⚠️ 找不到 appointment_id=${id}`);
    }

    console.log(`✅ 預約 ${id} 逐字稿已存入 DB`);
    return NextResponse.json({ transcript: transcriptText });
  } catch (error) {
    console.error("語音轉文字失敗:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// Next.js App Router 需關閉 body parser 才能接收 FormData
export const config = {
  api: { bodyParser: false },
};