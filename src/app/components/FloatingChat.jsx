"use client";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "您好！有什麼我可以幫忙的嗎？" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // 模擬 AI 回覆
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "收到您的訊息：" + newMessage.text },
      ]);
    }, 600);
  };

  return (
    <div>
      {/* 開啟按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* 聊天視窗 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white shadow-xl rounded-xl flex flex-col overflow-hidden border border-gray-200 animate-fade-in">
          {/* 標題列 */}
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-semibold">線上客服</span>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80">
              <X size={20} />
            </button>
          </div>

          {/* 訊息區域 */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[70%] px-3 py-2 rounded-lg text-sm shadow-sm whitespace-pre-wrap
                  ${msg.sender === "user" ? "ml-auto bg-blue-500 text-white" : "mr-auto bg-white text-gray-800"}`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* 輸入框 */}
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="輸入訊息..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 text-sm"
            >
              送出
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
