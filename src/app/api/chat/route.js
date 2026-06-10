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
    // AI 語意分類：緊急狀況 + 問題範圍
    // 傳入對話歷史，讓分類器有上下文可以理解語意
    // =========================
    const recentHistory = messages
      .slice(-7, -1)
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text
      }));

    const classifyRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0,
          messages: [
            {
              role: "system",
              content: `你是一個醫療健康問題分類器。
你會收到一段對話紀錄（含歷史訊息）與使用者最新訊息。
請結合上下文，判斷以下兩件事：

1. isEmergency（緊急狀況）：
   - 對話中出現任何可能危及生命或需要立即急救的狀況，
     例如：昏倒、失去意識、呼吸困難、胸痛、大量出血、
     中風跡象、無法回應、心跳異常、嚴重過敏反應、
     有自傷或自殺意圖等。
   - 即使沒有精確醫學詞彙，只要描述情境屬緊急，就設為 true。

2. isInScope（在服務範圍內）：
   - 與健康、身體症狀、疾病、醫療、藥物、營養、運動、
     心理健康，或 MedOnGo / MOG 平台操作相關，設為 true。
   - 若使用者是在追問 AI 剛才的回答（例如「這樣算診斷嗎」、
     「你確定嗎」、「那我應該怎麼辦」、「這是你的看法嗎」），
     且對話脈絡屬醫療健康，也設為 true。
   - 只有當問題明顯與健康及平台完全無關（如純數學、投資、程式、感情），
     才設為 false。

請只回傳 JSON，不要有任何說明文字：
{"isEmergency": true, "isInScope": true}`
            },
            ...recentHistory,
            {
              role: "user",
              content: latestMessage
            }
          ]
        })
      }
    );

    const classifyData = await classifyRes.json();
    const classifyText = classifyData.choices?.[0]?.message?.content || "{}";
    let classification = { isEmergency: false, isInScope: true };
    try {
      classification = JSON.parse(classifyText.replace(/```json|```/g, "").trim());
    } catch (_) {
      // 解析失敗時保守處理：放行讓主模型回答
    }

    if (classification.isEmergency) {
      return new Response(
        `data: ${JSON.stringify({
          choices: [
            {
              delta: {
                content:
                  "⚠️ 您描述的情況可能是緊急狀況，請立即撥打 119 或盡速前往急診就醫，不要等待。"
              }
            }
          ]
        })}\n\ndata: [DONE]\n\n`,
        {
          headers: { "Content-Type": "text/event-stream" }
        }
      );
    }

    if (!classification.isInScope) {
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
        })}\n\ndata: [DONE]\n\n`,
        {
          headers: { "Content-Type": "text/event-stream" }
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