"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu, Check, Star, Zap, Crown, Mail } from "lucide-react";
import FloatingChat from "../components/FloatingChat";

export default function PricingPage() {
  const [isOpen, setIsOpen] = useState(false);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "永久免費",
      description: "適合個人用戶體驗基本功能",
      features: [
        "基本預約功能",
        "每月 3 次視訊看診",
        "查看就診紀錄",
        "基本健康衛教資訊",
        "標準客服支援"
      ],
      icon: Star,
      color: "from-gray-100 to-gray-200",
      // textColor: "text-[var(--color-mahogany)]",
      // buttonText: "開始使用",
      // buttonColor: "bg-[var(--color-mahogany)] hover:bg-[var(--color-mahogany)]/80"
    },
    {
      name: "會員版",
      price: "NT$260",
      period: "半年",
      description: "最受歡迎的選擇，適合頻繁就診用戶",
      features: [
        "無限制預約次數",
        "無限制視訊看診",
        "完整就診紀錄與報告",
        "個人化健康追蹤",
        "優先預約時段",
        "24/7 優先客服支援",
        "健康數據分析報告",
        "專屬健康顧問諮詢"
      ],
      icon: Zap,
      color: "from-[var(--color-azure)] to-[var(--color-periwinkle)]",
      textColor: "text-white",
      buttonText: "立即升級",
      buttonColor: "bg-[var(--color-azure)] hover:bg-[var(--color-azure)]/90",
      popular: true
    },
    {
      name: "企業版",
      price: "客製化",
      period: "依需求報價",
      description: "為企業和機構提供專業解決方案",
      features: [
        "所有升級版功能",
        "多人帳號管理",
        "企業健康管理儀表板",
        "客製化功能開發",
        "專屬帳戶經理",
        "專屬技術支援團隊",
        "API 整合服務",
        "數據安全保障",
        "員工健康管理方案"
      ],
      icon: Crown,
      color: "from-[var(--color-lime-cream)] to-[var(--color-lime-cream)]/70",
      textColor: "text-white",
      buttonText: "聯繫我們",
      buttonColor: "bg-[var(--color-lime-cream)] hover:bg-[var(--color-lime-cream)]/90"
    }
  ];

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

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`min-h-screen bg-gradient-to-br from-[var(--color-light-cyan)] via-white to-[var(--color-periwinkle)]/30 transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <Navbar />
        
        <div className="p-6 max-w-7xl mx-auto">
          {/* 頁面標題 */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
              選擇最適合您的
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> 方案</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              無論是個人用戶還是企業機構，我們都有最適合您的醫療服務方案
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">可以隨時取消訂閱嗎？</h3>
                <p className="text-gray-600">可以的！您可以隨時在帳戶設定中取消訂閱，不會收取任何額外費用。</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">升級後會立即生效嗎？</h3>
                <p className="text-gray-600">是的，升級後所有功能會立即解鎖，您可以馬上開始使用。</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">支援哪些付款方式？</h3>
                <p className="text-gray-600">我們支援信用卡、LINE Pay、Apple Pay 等多種付款方式。</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">企業版有最低人數限制嗎？</h3>
                <p className="text-gray-600">沒有限制！無論企業規模大小，我們都能提供客製化方案。</p>
              </div>
            </div>
          </div>

          {/* CTA 區塊 */}
          <div className="bg-gradient-to-r from-[var(--color-azure)] to-[var(--color-periwinkle)] rounded-3xl shadow-2xl p-12 text-center text-white">
            <Mail size={48} className="mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">還有其他問題？</h2>
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