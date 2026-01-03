"use client";
import { useState } from "react";
import DoctorSidebar from "../components/DoctorSidebar";
import Navbar from "../components/Navbar";
import FloatingChat from "../components/FloatingChat";
import {
  Menu,
  Check,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  Mail,
  Zap,
  Crown
} from "lucide-react";

export default function PricingPage() {
  const [isOpen, setIsOpen] = useState(false);

  const plans = [
    {
      name: "醫師體驗版(試用中)",
      tag: "試營運",
      price: "NT$0",
      period: "帳號啟用後6個月",
      description: "新入駐平台即啟用會員版完整功能",
      audience: ["首次加入平台的醫師", "想熟悉看診流程與後台操作"],
      features: [
        "無限制接收病患預約",
        "線上視訊看診功能",
        "病患就診紀錄與備註管理",
        "看診時段自由設定",
        "平台金流與預約整合",
      ],
      icon: Stethoscope,
      badge: "試用中",
      buttonText: "試用中",
      buttonColor: "bg-gray-300 cursor-default",
      textColor: "text-gray-700",
      disabled: true
    },
    {
      name: "醫師月付方案",
      tag: "熱門選擇",
      price: "NT$2,500 / 月",
      period: "按月付費",
      description: "完整線上看診與病患管理功能，每月固定收費",
      audience: ["希望穩定使用平台的醫師", "想彈性安排看診時間"],
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
      buttonColor: "bg-[var(--color-azure)] hover:bg-[var(--color-azure)]/90",
      textColor: "text-gray-700"
    },
    {
      name: "醫師抽成方案",
      tag: "彈性收費",
      price: "平台抽成制",
      subPrice: "僅於完成看診後收費",
      period: "無綁約",
      description: "適合高看診量或自由接診的醫師",
      audience: ["高頻率遠距看診醫師", "診所或醫療團隊"],
      features: [
        "無限制接收病患預約",
        "線上視訊看診功能",
        "病患就診紀錄與備註管理",
        "平台金流與預約整合",
      ],
      icon: Crown,
      buttonText: "開始接診",
      buttonColor: "bg-[var(--color-lime-cream)] hover:bg-[var(--color-lime-cream)]/90",
      textColor: "text-gray-700"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[var(--background)]/50 backdrop-blur-sm">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
        >
          <Menu />
        </button>
      )}

      <DoctorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`transition-all duration-300 ${isOpen ? "lg:ml-64" : "ml-0"}`}>
        <Navbar />

        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="text-center mb-20">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              選擇最適合你的
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
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
                  className={`relative rounded-3xl shadow-xl p-8 flex flex-col justify-between transition-transform duration-300 hover:scale-105 ${
                    plan.popular ? "bg-white ring-4 ring-[var(--color-azure)]" : "bg-white"
                  }`}
                  style={{ background: plan.color }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--color-azure)] text-white px-6 py-1 rounded-full text-sm font-semibold">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Icon + Name */}
                    <div className="flex items-center gap-3 mb-6">
                      <Icon className="text-[var(--color-azure)]" />
                      <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                    </div>

                    <p className="text-gray-600 mb-4">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-6">
                      <div className={`text-4xl font-extrabold ${plan.textColor}`}>{plan.price}</div>
                      <div className="text-gray-500">{plan.period}</div>
                      {plan.subPrice && (
                        <div className="text-sm text-gray-500 mt-1">{plan.subPrice}</div>
                      )}
                    </div>

                    {/* Audience */}
                    {plan.audience?.length > 0 && (
                      <div className="mb-6">
                        <p className="font-semibold mb-2 text-gray-700">適合對象</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {plan.audience.map((a, idx) => (
                            <li key={idx}>✔ {a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Features */}
                    <ul className="space-y-3 mb-8 text-gray-600">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex gap-3">
                          <Check className="text-green-500 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    disabled={plan.disabled}
                    className={`w-full py-4 rounded-xl font-semibold transition ${plan.buttonColor} ${plan.textColor}`}
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
                <div key={i} className="bg-white rounded-3xl p-8 shadow-lg text-center text-gray-800">
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
