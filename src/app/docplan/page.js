"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import FloatingChat from "../components/FloatingChat";
import {
  Menu,
  Check,
  Star,
  Zap,
  Crown,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  Mail,
} from "lucide-react";

export default function PricingPage() {
  const [isOpen, setIsOpen] = useState(false);

  const plans = [
  {
    name: "醫師體驗版",
    tag: "試營運",
    price: "NT$0",
    period: "無期限",
    description: "適合想先了解平台流程的醫師",
    audience: [
      "首次加入遠距醫療平台的醫師",
      "想了解看診流程與後台操作",
    ],
    features: [
      "建立基本醫師個人資料",
      "查看病患預約需求（僅瀏覽）",
      "熟悉視訊看診介面",
      "查看平台功能介紹",
    ],
    icon: Stethoscope,
    buttonText: "免費試用",
    buttonStyle:
      "border border-gray-300 text-gray-600 hover:bg-gray-50",
  },
  {
    name: "醫師專業版",
    tag: "最受醫師選擇",
    price: "平台抽成制",
    subPrice: "僅於實際完成看診後收費",
    period: "無綁約",
    description: "提供完整線上看診與病患管理功能",
    audience: [
      "提供遠距門診服務的醫師",
      "希望彈性安排看診時間",
    ],
    features: [
      "無限制接收病患預約",
      "線上視訊看診功能",
      "病患就診紀錄與備註管理",
      "看診時段自由設定",
      "平台金流與預約整合",
    ],
    icon: Zap,
    popular: true,
    buttonText: "開始接診",
    buttonStyle:
      "bg-[var(--color-azure)] text-white hover:bg-[var(--color-azure)]/90",
  },
  {
    name: "醫師尊榮方案",
    tag: "進階支援",
    price: "客製化方案",
    subPrice: "依合作模式調整",
    period: "長期合作",
    description: "適合高看診量或團隊型醫師使用",
    audience: [
      "高頻率遠距看診醫師",
      "診所或醫療團隊",
    ],
    features: [
      "專屬客服與技術支援",
      "醫師個人品牌曝光",
      "病患數據與看診分析報告",
      "優先功能測試與平台合作",
    ],
    icon: Crown,
    buttonText: "聯絡我們",
    buttonStyle:
      "bg-[var(--color-lime-cream)] text-white hover:bg-[var(--color-lime-cream)]/90",
  },

  ];

  return (
    <div className="relative min-h-screen bg-[var(--background)]/50 backdrop-blur-sm">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-3 left-4 z-30 p-3 rounded-xl hover:bg-white transition"
        >
          <Menu />
        </button>
      )}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div
        className={`transition-all duration-300 ${
          isOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        <Navbar />

        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="text-center mb-20">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              選擇最適合你的
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                醫療方案
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              透過清楚的訂閱方案，讓你安心享受線上醫療的每一步。
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-24">
            {plans.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <div
                  key={i}
                  className={`relative bg-white rounded-3xl shadow-xl p-8 ${
                    plan.popular
                      ? "ring-4 ring-[var(--color-azure)] scale-[1.03]"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--color-azure)] text-white px-6 py-1 rounded-full text-sm font-semibold">
                      ⭐ 最多人選擇
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6">
                    <Icon className="text-[var(--color-azure)]" />
                    <h2 className="text-2xl font-bold">{plan.name}</h2>
                  </div>

                  <p className="text-gray-600 mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-4xl font-extrabold">
                      {plan.price}
                    </div>
                    <div className="text-gray-500">
                      {plan.period}
                    </div>
                    {plan.subPrice && (
                      <div className="text-sm text-gray-500 mt-1">
                        {plan.subPrice}
                      </div>
                    )}
                  </div>

                  {/* Audience */}
                  <div className="mb-6">
                    <p className="font-semibold mb-2">適合對象</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {plan.audience.map((a, idx) => (
                        <li key={idx}>✔ {a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex gap-3">
                        <Check className="text-green-500 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-4 rounded-xl font-semibold transition ${plan.buttonStyle}`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Trust Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {[
              {
                icon: ShieldCheck,
                title: "資料安全",
                desc: "符合醫療隱私與資料保護規範",
              },
              {
                icon: HeartPulse,
                title: "專業醫療",
                desc: "合作醫師來自各大醫院與診所",
              },
              {
                icon: Stethoscope,
                title: "持續追蹤",
                desc: "完整保存每一次就診紀錄",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-8 shadow-lg text-center"
                >
                  <Icon className="mx-auto mb-4 text-[var(--color-azure)]" />
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[var(--color-azure)] to-[var(--color-periwinkle)] text-white rounded-3xl p-14 text-center shadow-2xl">
            <Mail size={48} className="mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">還有其他問題嗎？</h2>
            <p className="mb-8 text-white/90">
              我們的客服團隊隨時為你提供協助
            </p>
            <button className="bg-white text-[var(--color-azure)] px-8 py-4 rounded-xl font-semibold hover:bg-[var(--color-light-cyan)] transition">
              聯絡客服
            </button>
          </div>
        </div>

        <FloatingChat />
      </div>
    </div>
  );
}
