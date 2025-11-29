import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { messages, summary } = await request.json();

    const formattedMessages = messages.slice(-10).map((msg) => ({
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
        stream: true,
        messages: [
          {
            role: "system",
            content: `
你是 MOG AI 健康助理，請使用繁體中文回答，語氣友善、有耐心，提供一般健康建議，不診斷疾病。
使用者過往資訊摘要如下：
${summary || "(無過往資訊)"}
`
          },
          ...formattedMessages
        ],
      })
    });

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server Error", detail: e.message },
      { status: 500 }
    );
  }
}
