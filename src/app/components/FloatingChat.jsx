"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: "bot", 
      text: "您好！我是 MOG AI 健康助理 🏥\n\n我可以協助您解答關於健康、身體保養、營養等相關問題。請問有什麼我可以幫您的嗎？" 
    },
  ]);
  const formattedMessages = messages.map(msg => ({
    role: msg.sender === "user" ? "user" : "assistant",
    content: msg.text
  }));

  const openAIMessages = [
    {
      role: "system",
      content: "你是 MOG AI 健康助理..."
    },
    ...formattedMessages
  ];


  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [summary, setSummary] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 當訊息太多時，自動產生摘要並只保留最近 10 則
  useEffect(() => {
    if (messages.length > 12) {
      generateSummary(messages);
    }
  }, [messages]);

  const generateSummary = async (allMessages) => {
    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });

      const data = await response.json();

      if (data?.summary) {
        // 更新前端紀錄的摘要
        setSummary(data.summary);

        // 把畫面上的 messages 縮短成最近 10 則
        const recent = allMessages.slice(-10);
        setMessages(recent);
      }
    } catch (error) {
      console.error("產生摘要失敗", error);
    }
  };


  const sendMessage = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage = { sender: "user", text: input.trim() };
  setMessages((prev) => [...prev, userMessage]);
  setInput("");

  setIsLoading(true);

  // 建立一個新的 bot 訊息（會被逐字更新）
  let botMessage = { sender: "bot", text: "" };
  setMessages((prev) => [...prev, botMessage]);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary,
        messages: [...messages, userMessage]  // 傳送整段上下文
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "").trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              botMessage.text += content;

              // 更新 UI
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...botMessage };
                return updated;
              });
            }
          } catch (e) {
            // 不可解析就跳過
          }
        }
      }
    }

  } catch (e) {
    console.error("Streaming error:", e);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div>
      {/* 開啟按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-full shadow-2xl hover:shadow-cyan-500/50 hover:scale-110 transition-all duration-300 animate-pulse"
          aria-label="開啟 MOG AI 聊天"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* 聊天視窗 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* 標題列 */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl">
                🏥
              </div>
              <div>
                <div className="font-bold text-lg">MOG AI</div>
                <div className="text-xs text-blue-100">健康諮詢助理</div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-white/20 rounded-full p-1 transition"
              aria-label="關閉聊天"
            >
              <X size={24} />
            </button>
          </div>

          {/* 訊息區域 */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-md whitespace-pre-wrap leading-relaxed
                    ${msg.sender === "user" 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-sm" 
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 輸入框 */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="輸入您的健康問題..."
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="發送訊息"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              💡 提醒：嚴重症狀請立即就醫
            </div>
          </div>
        </div>
      )}
    </div>
  );
}