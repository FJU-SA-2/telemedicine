"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Lock } from "lucide-react";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  
  const [messages, setMessages] = useState([
    { 
      sender: "bot", 
      text: "您好！我是 MOG AI 健康助理 🏥\n\n我可以協助您解答關於健康、身體保養、營養等相關問題。\n\n請問有什麼我可以幫您的嗎？" 
    },
  ]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [summary, setSummary] = useState("");

  // 檢查登入狀態
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 方法1: 檢查 localStorage 中的使用者資訊（根據你的登入代碼）
      const userId = localStorage.getItem('user_id');
      const userType = localStorage.getItem('user_type');
      const email = localStorage.getItem('email');
      
      console.log('📝 localStorage 檢查:', { userId, userType, email });
      
      if (userId && userType) {
        // 如果有基本資訊，先設為已登入
        setIsLoggedIn(true);
        setUserInfo({
          user_id: userId,
          role: userType,
          email: email
        });
        console.log('✅ 從 localStorage 確認已登入');
      }
      
      // 方法2: 呼叫 /api/me 來驗證登入狀態（使用你的 API）
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });

        console.log('🔍 /api/me 狀態:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ /api/me 回應:', data);
          
          if (data.authenticated || data.user) {
            setIsLoggedIn(true);
            setUserInfo(data.user || data);
          } else {
            // API 回應未登入，清除 localStorage
            console.log('❌ API 顯示未登入，清除本地資料');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_type');
            localStorage.removeItem('email');
            setIsLoggedIn(false);
          }
        } else {
          // API 呼叫失敗，但如果有 localStorage 就信任它
          if (!userId) {
            setIsLoggedIn(false);
          }
        }
      } catch (apiError) {
        console.log('⚠️ API 呼叫失敗:', apiError);
        // API 失敗時，如果有 localStorage 就信任它
        if (!userId) {
          setIsLoggedIn(false);
        }
      }
      
    } catch (error) {
      console.error("❌ 檢查登入狀態失敗:", error);
      setIsLoggedIn(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 12 && isLoggedIn) {
      generateSummary(messages);
    }
  }, [messages, isLoggedIn]);

  const generateSummary = async (allMessages) => {
    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });

      const data = await response.json();

      if (data?.summary) {
        setSummary(data.summary);
        const recent = allMessages.slice(-10);
        setMessages(recent);
      }
    } catch (error) {
      console.error("產生摘要失敗", error);
    }
  };

  const sendMessage = async () => {
    // 檢查是否登入
    if (!isLoggedIn) {
      alert('請先登入後才能使用聊天功能');
      return;
    }
    
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setIsLoading(true);

    let botMessage = { sender: "bot", text: "" };
    setMessages((prev) => [...prev, botMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          messages: [...messages, userMessage]
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

  // 載入中狀態
  if (isCheckingAuth) {
    return null;
  }

  return (
    <div className="relative z-[9999]">
      {/* 開啟按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-full shadow-2xl hover:shadow-cyan-500/50 hover:scale-110 transition-all duration-300 animate-pulse"
          aria-label="開啟 MOG AI 聊天"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* 聊天視窗 */}
      {isOpen && (
        <div className="fixed bottom-6 right-3 sm:right-6 z-[9999] w-[calc(100%-24px)] max-w-sm sm:w-96 h-[70vh] sm:h-[600px] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* 標題列 */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl">
                🏥
              </div>
              <div>
                <div className="font-bold text-lg">MOG AI</div>
                <div className="text-xs text-blue-100">
                  {isLoggedIn 
                    ? `健康諮詢助理 ${userInfo?.name ? `• ${userInfo.name}` : ''}`
                    : '健康諮詢助理'
                  }
                </div>
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
            {/* 未登入時顯示提示訊息 */}
            {!isLoggedIn && (
              <div className="flex justify-center items-center h-full">
                <div className="text-center max-w-xs">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={40} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    需要註冊登入
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    請先註冊或登入帳號<br/>才能使用 MOG AI 健康助理服務
                  </p>
                  <button
                    onClick={() => window.location.href = "/login"}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium"
                  >
                    前往登入 / 註冊
                  </button>
                </div>
              </div>
            )}

            {/* 已登入時顯示對話訊息 */}
            {isLoggedIn && (
              <>
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
              </>
            )}
          </div>

          {/* 輸入框 */}
          <div className="p-4 border-t bg-white">
            {/* 已登入時顯示警語 */}
            {isLoggedIn && (
              <div className="mb-3 p-3 border border-red-300 bg-red-50 rounded-lg text-xs text-red-700 leading-relaxed">
                <p className="font-bold">🚨 重要警語：</p>
                <p className="mt-1">
                  【此為 <b>OPEN AI</b> 生成之答案，<b>僅供參考</b>】
                </p>
                <ul className="list-disc list-inside mt-1 ml-1 space-y-0.5">
                  <li>本內容無法取代專業醫療判斷。</li>
                  <li>詳細症狀仍需透過<b>醫師診斷</b>。</li>
                  <li>若症狀相當嚴重，請<b>立即就醫</b>，切勿延誤。</li>
                </ul>
              </div>
            )}

            {/* 未登入時顯示鎖定提示 */}
            {!isLoggedIn && (
              <div className="mb-3 p-3 border border-gray-300 bg-gray-50 rounded-lg text-sm text-gray-600 text-center flex items-center justify-center gap-2">
                <Lock size={16} />
                <span>請先登入後才能使用聊天功能</span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && isLoggedIn && sendMessage()}
                className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none transition
                  ${isLoggedIn 
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                  }`}
                placeholder={isLoggedIn ? "輸入您遇到的健康問題..." : "請先登入..."}
                disabled={!isLoggedIn || isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!isLoggedIn || isLoading || !input.trim()}
                className={`px-5 rounded-xl transition-all font-medium
                  ${isLoggedIn 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:scale-105' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                  disabled:opacity-50 disabled:hover:scale-100`}
                aria-label="發送訊息"
              >
                {isLoggedIn ? <Send size={20} /> : <Lock size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}