import { NextResponse } from "next/server";
import { medicalKnowledge } from "./medicalKnowledge";

export async function POST(request) {
  try {
    const { messages, summary } = await request.json();

    // 取得使用者最新問題
    const latestMessage =
      messages[messages.length - 1]?.text || "";
      // =========================
    // 建立知識庫內容
    // =========================
    let knowledgeContext = "";

    medicalKnowledge.forEach((item) => {
    const matched = item.keywords.some((keyword) =>
    latestMessage.includes(keyword)
    );

    if (matched) {
    knowledgeContext += `
    資料來源：${item.source}
    參考網址：${item.url}

    內容：
    ${item.content}

    `;
    }
    });


    // =========================
    // 緊急症狀偵測
    // =========================
    const emergencyKeywords = [
      "胸痛",
      "呼吸困難",
      "無法呼吸",
      "昏倒",
      "意識不清",
      "中風",
      "自殺",
      "快死了",
      "喘不過氣",
      "心臟痛"
    ];

    const isEmergency = emergencyKeywords.some((keyword) =>
      latestMessage.includes(keyword)
    );

    if (isEmergency) {
    return new Response(
      `data: ${JSON.stringify({
        choices: [
          {
            delta: {
              content:
                "⚠️ 偵測到可能緊急症狀，請立即撥打119或盡速前往急診就醫。"
            }
          }
        ]
      })}\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
        },
      }
    );
  }

    // =========================
    // 醫療問題限制
    // =========================
    const allowedKeywords = [
      "健康",
      "症狀",
      "感冒",
      "頭痛",
      "發燒",
      "咳嗽",
      "流鼻水",
      "喉嚨",
      "血壓",
      "糖尿病",
      "胃痛",
      "皮膚",
      "醫師",
      "醫生",
      "掛號",
      "預約",
      "營養",
      "減肥",
      "藥",
      "失眠",
      "焦慮",
      "月經",
      "MOG",
      "MedOnGo"
    ];

    const isMedicalQuestion = allowedKeywords.some((keyword) =>
      latestMessage.includes(keyword)
    );

    if (!isMedicalQuestion) {
    return new Response(
      `data: ${JSON.stringify({
        choices: [
          {
            delta: {
              content:
                "此問題超出 MOG AI 的服務範圍，目前僅提供健康與 MedOnGo 平台相關資訊。"
            }
          }
        ]
      })}\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
        },
      }
    );
  }

    // =========================
    // 格式化對話紀錄
    // =========================
    const formattedMessages = messages
      .slice(-10)
      .map((msg) => ({
        role:
          msg.sender === "user"
            ? "user"
            : "assistant",
        content: msg.text
      }));

    // =========================
    // OpenAI API 呼叫
    // =========================
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          stream: true,
          temperature: 0.5,
          messages: [
            {
              role: "system",
              content: `
              你是 MedOnGo（MOG）平台專屬 AI 健康助理。

              你的工作：
              1. 提供一般健康資訊
              2. 提供衛教知識
              3. 協助使用者理解常見症狀
              4. 協助使用者操作 MedOnGo 平台
              5. 提供生活保健與營養建議

              限制：
              1. 不回答與健康或平台無關問題
              2. 不回答數學、投資、程式、感情等問題
              3. 不進行正式醫療診斷
              4. 不開立藥物或處方
              5. 不取代專業醫師
              6. 不提供危險醫療建議

              回答規則：
              1. 使用繁體中文
              2. 保持友善、專業、有耐心
              3. 避免使用絕對化語氣
              4. 若資訊不確定，請建議就醫
              5. 優先提供安全建議
              6. 避免過度推測病情

              若問題超出範圍：
              請回覆：
              「此問題超出 MOG AI 的服務範圍。」

              若症狀可能嚴重：
              請提醒使用者立即就醫。
              
              以下為可信醫療資料：
              ${knowledgeContext || "目前無相關醫療資料"}

              若有引用資料，
              請在回答最後列出：
              資料來源與參考網址。

              使用者過往資訊摘要如下：
              ${summary || "(無過往資訊)"}

              `
            },

            ...formattedMessages
          ]
        })
      }
    );

    // =========================
    // Streaming 回傳
    // =========================
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });

  } catch (e) {
    console.error("MOG AI Error:", e);

    return NextResponse.json(
      {
        error: "Server Error",
        detail: e.message,
      },
      {
        status: 500,
      }
    );
  }
}