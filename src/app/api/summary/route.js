import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { messages } = await request.json();

    // 將前端訊息轉換成系統可以理解的格式
    const formatted = messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "請將以下完整對話濃縮成 1–3 句，摘要出使用者的健康資訊、偏好與主要問題，不要包含不必要的客套話。"
          },
          ...formatted
        ]
      })
    });

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ summary });

  } catch (err) {
    return NextResponse.json(
      { error: "摘要失敗", detail: err.message },
      { status: 500 }
    );
  }
}
