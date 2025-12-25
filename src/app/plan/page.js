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
      name: "Free",
      price: "$0",
      period: "無限期",
      description: "僅能瀏覽經驗分享區及醫師介紹表",
      features: [
        "瀏覽經驗分享區",
        "查看醫師列表",
      ],
      icon: Star,
      color: "from-gray-100 to-gray-200"
    },
    {
      name: "會員版",
      price: "NT$260",
      period: "6個月",
      description: "提供所有功能給有訂閱的顧客",
      features: [
        "無限制預約次數",
        "無限制視訊看診",
        "完整就診紀錄與報告",
        "AI健康顧問諮詢",
        "經驗分享區互動",
        "收藏喜愛的醫師"
      ],
      icon: Zap,
      color: "from-[var(--color-azure)] to-[var(--color-periwinkle)]",
      textColor: "text-white",
      buttonText: "馬上訂閱",
      buttonColor: "bg-[var(--color-azure)] hover:bg-[var(--color-azure)]/90",
      popular: true
    },
    {
      name: "長期訂閱會員",
      price: "NT$1300",
      period: "3年",
      description: "等於免費送半年,超值優惠給長期使用者",
      features: [
        "無限制預約次數",
        "無限制視訊看診",
        "完整就診紀錄與報告",
        "AI健康顧問諮詢",
        "經驗分享區互動",
        "收藏喜愛的醫師"
      ],
      icon: Crown,
      color: "from-[var(--color-lime-cream)] to-[var(--color-lime-cream)]/70",
      textColor: "text-white",
      buttonText: "立即升級",
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
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
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

      <div className={`min-h-screen bg-gradient-to-br from-[var(--color-light-cyan)] via-white to-[var(--color-periwinkle)]/30 transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <Navbar />
        
        <div className="p-6 max-w-7xl mx-auto">
          {/* 頁面標題 */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
              訂閱我們的
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> 方案</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              訂閱後即能享受透過平台看診的所有便利功能,讓您的醫療體驗更順暢。
            </p>
          </div>

          {/* 方案卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <div 
                  key={index}
                  className={`relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                    plan.popular ? 'ring-4 ring-[var(--color-azure)] transform md:scale-105' : ''
                  }`}
                >
                  {/* 熱門標籤 */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-[var(--color-azure)] text-white px-6 py-2 rounded-bl-2xl font-semibold text-sm">
                      🔥 免費試用中
                    </div>
                  )}

                  {/* 方案圖示 */}
                  <div className={`h-32 bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <Icon size={64} className={plan.textColor} />
                  </div>

                  {/* 方案內容 */}
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                    <p className="text-gray-600 text-sm mb-4 min-h-[40px]">{plan.description}</p>
                    
                    {/* 價格 */}
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-2">/ {plan.period}</span>
                    </div>

                    {/* 功能列表 */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* 行動按鈕 */}
                    <button 
                      className={`w-full ${plan.buttonColor} text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl`}
                    >
                      {plan.buttonText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ 區塊 */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">常見問題</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">可以隨時取消訂閱嗎?</h3>
                <p className="text-gray-600">可以的!您可以隨時在帳戶設定中取消訂閱,不會收取任何額外費用。</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">升級後會立即生效嗎?</h3>
                <p className="text-gray-600">是的,升級後所有功能會立即解鎖,您可以馬上開始使用。</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">支援哪些付款方式?</h3>
                <p className="text-gray-600">我們支援信用卡、LINE Pay、Apple Pay 等多種付款方式。</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">企業版有最低人數限制嗎?</h3>
                <p className="text-gray-600">沒有限制!無論企業規模大小,我們都能提供客製化方案。</p>
              </div>
            </div>
          </div>

          {/* CTA 區塊 */}
          <div className="bg-gradient-to-r from-[var(--color-azure)] to-[var(--color-periwinkle)] rounded-3xl shadow-2xl p-12 text-center text-white">
            <Mail size={48} className="mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">還有其他問題?</h2>
            <p className="text-lg mb-8 text-white/90">我們的團隊隨時為您提供協助</p>
            <button className="bg-white text-[var(--color-azure)] font-semibold px-8 py-4 rounded-xl hover:bg-[var(--color-light-cyan)] transition-all shadow-lg">
              聯繫客服團隊
            </button>
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