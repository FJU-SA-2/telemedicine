"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import DoctorSidebar from "../components/DoctorSidebar";
import Navbar from "../components/Navbar";
import { Menu, Check, Star, Zap, Crown, Mail } from "lucide-react";
import FloatingChat from "../components/FloatingChat";

export default function PricingPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ 獲取用戶資料
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/auth");
          return;
        }

        const data = await res.json();
        
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          router.push("/auth");
        }
      } catch (error) {
        console.error("獲取使用者資料失敗:", error);
        router.push("/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const plans = [
  {
    name: "會員版（試用中）",
    price: "$0",
    period: "前 6 個月",
    description: "新會員註冊即啟用會員版完整功能試用",
    features: [
      "無限制預約次數",
      "無限制視訊看診",
      "完整就診紀錄與報告",
      "AI 健康顧問諮詢",
      "經驗分享區互動",
      "收藏喜愛的醫師"
    ],
    icon: Star,
    color: "from-gray-100 to-gray-200",
    textColor: "text-gray-700",
    buttonText: "試用中",
    buttonColor: "bg-gray-300 cursor-default",
    disabled: true,
    badge: "試用中"
  },
  {
    name: "會員版（月訂）",
    price: "NT$260",
    period: "每月",
    description: "適合彈性使用的會員方案",
    features: [
      "無限制預約次數",
      "無限制視訊看診",
      "完整就診紀錄與報告",
      "AI 健康顧問諮詢",
      "經驗分享區互動",
      "收藏喜愛的醫師"
    ],
    icon: Check,
    color: "from-[var(--color-azure)] to-[var(--color-periwinkle)]",
    textColor: "text-white",
    buttonText: "開始訂閱",
    buttonColor: "bg-[var(--color-azure)] hover:bg-[var(--color-azure)]/90",
    popular: true
  },
  {
    name: "年費會員",
    price: "NT$1600",
    period: "每年",
    description: "長期使用最划算，相當於贈送半年服務",
    features: [
      "無限制預約次數",
      "無限制視訊看診",
      "完整就診紀錄與報告",
      "AI 健康顧問諮詢",
      "經驗分享區互動",
      "收藏喜愛的醫師"
    ],
    icon: Crown,
    color: "from-[var(--color-lime-cream)] to-[var(--color-lime-cream)]/70",
    textColor: "text-white",
    buttonText: "升級年費",
    buttonColor: "bg-[var(--color-lime-cream)] hover:bg-[var(--color-lime-cream)]/90"
  }
];


  // ✅ 載入中顯示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
          aria-label="開啟選單"
        >
          <Menu size={24} />
        </button>
      )}

      {/* ✅ 根據用戶身份顯示對應的 Sidebar */}
      {user?.role === "patient" && (
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      )}

      {user?.role === "doctor" && (
        <DoctorSidebar  
          isOpen={isOpen} 
          setIsOpen={setIsOpen}
          approvalStatus={user.approval_status}
        />
      )}

      <div className={`min-h-screen bg-gradient-to-br from-[var(--color-light-cyan)] via-white to-[var(--color-periwinkle)]/30 transition-all duration-300 transition-all duration-300 md:ml-0
${isOpen ? 'md:ml-64' : ''}`}>
        <Navbar />
        
        <div className="p-6 max-w-7xl mx-auto">
          {/* 頁面標題 */}
          <div className="text-center mb-10 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              會員方案說明
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              本平台為付費制服務，新會員註冊即啟用會員版完整功能試用 6 個月。
            </p>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              訂閱後即能享受透過平台看診的所有便利功能,讓您的醫療體驗更順暢。
            </p>
          </div>

          {/* 方案卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (

                <div 
                  key={index}
                  className={`relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                    plan.popular ? 'ring-4 ring-[var(--color-azure)] transform md:scale-105' : ''
                  }`}
                >
                  {plan.badge && (
                  <div className="absolute top-0 right-0 bg-gray-500 text-white px-6 py-2 rounded-bl-2xl font-semibold text-sm">
                    {plan.badge}
                  </div>
                )}

                  {/* 方案圖示 */}
                  <div className={`h-32 bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <Icon className="w-12 h-12 md:w-16 md:h-16" />
                  </div>

                  {/* 方案內容 */}
                  <div className="p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                    <p className="text-gray-600 text-sm mb-4 min-h-[40px]">{plan.description}</p>
                    
                    {/* 價格 */}
                    <div className="mb-6">
                      <span className="text-3xl md:text-4xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-2">/ {plan.period}</span>
                    </div>

                    {/* 功能列表 */}
                    <ul className="space-y-2 md:space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={plan.disabled}
                      className={`w-full ${plan.buttonColor} text-white font-semibold py-3 md:py-4 rounded-xl transition-all shadow-lg ${
                        plan.disabled ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl"
                      }`}
                    >
                      {plan.buttonText}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>

         {/* FAQ 區塊 */}
<div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-16">
  <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
    常見問題
  </h2>

  <div className="max-w-3xl mx-auto divide-y divide-gray-200">
    {[
      {
        q: "平台是免費使用的嗎？",
        a: "本平台為付費制遠距醫療服務。新會員註冊後可啟用會員版完整功能試用 6 個月，試用期結束後需選擇訂閱方案方可繼續使用。"
      },
      {
        q: "試用期間可以使用所有功能嗎？",
        a: "可以。試用期間即為會員版完整功能體驗，包含預約看診、視訊看診、AI 健康顧問與就診紀錄等服務。"
      },
      {
        q: "試用結束後會自動扣款嗎？",
        a: "不會。試用期結束後，系統不會自動扣款，需由您自行選擇並啟用月訂或年費方案。"
      },
      {
        q: "可以隨時取消或更換訂閱方案嗎？",
        a: "可以。您可隨時於帳戶設定中取消或調整訂閱方案，已啟用的方案將持續至當期結束。"
      },
      {
        q: "支援哪些付款方式？",
        a: "目前支援信用卡、LINE Pay、Apple Pay 等多種付款方式，實際可用方式依結帳頁面顯示為準。"
      }
    ].map((item, index) => (
      <FaqItem key={index} question={item.q} answer={item.a} />
    ))}
  </div>
</div>

        </div>

        {/* Footer */}
        <div className="bg-[var(--color-azure)]/20 text-[var(--color-mahogany)] py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-[var(--color-mahogany)]/80">
              © 2025 MedOnGo. 讓醫療服務更便捷、更貼心。
            </p>
          </div>
        </div>

        <FloatingChat />
      </div>
    </div>
  );
}
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-base md:text-lg font-semibold text-gray-900">
          {question}
        </span>

        <span className="ml-4 text-2xl text-gray-400 font-light">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <p className="mt-4 text-gray-600 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}
