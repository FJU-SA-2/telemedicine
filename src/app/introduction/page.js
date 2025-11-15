"use client";
import { useState } from 'react';
import { Calendar, Video, Star, FileText, CreditCard, User, Clock, CheckCircle, ArrowRight, Stethoscope, Heart, Monitor, ChevronRight, AlertCircle, Menu } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function IntroductionPage() {
  const [activeStep, setActiveStep] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      id: 1,
      icon: User,
      title: "註冊/登入",
      color: "from-blue-500 to-blue-600",
      description: "建立您的專屬帳號",
      details: [
        "填寫基本個人資料",
        "設定安全密碼",
        "驗證電子郵件",
        "完成會員註冊"
      ]
    },
    {
      id: 2,
      icon: Calendar,
      title: "預約掛號",
      color: "from-purple-500 to-purple-600",
      description: "選擇適合的醫師與時間",
      details: [
        "瀏覽醫師列表與專科",
        "查看醫師資歷與評價",
        "選擇方便的日期時段",
        "填寫主訴症狀",
        "選擇預約類型(諮詢/看診)"
      ]
    },
    {
      id: 3,
      icon: CreditCard,
      title: "線上付款",
      color: "from-green-500 to-green-600",
      description: "安全便捷的支付方式",
      details: [
        "查看費用明細",
        "選擇付款方式",
        "完成安全付款",
        "收到預約確認通知"
      ]
    },
    {
      id: 4,
      icon: Video,
      title: "視訊看診",
      color: "from-red-500 to-red-600",
      description: "與醫師進行線上諮詢",
      details: [
        "等待醫師開啟會議室",
        "進入視訊看診室",
        "與醫師進行即時溝通",
        "討論症狀與治療方案",
        "看診過程自動錄影保存"
      ]
    },
    {
      id: 5,
      icon: FileText,
      title: "查看紀錄",
      color: "from-indigo-500 to-indigo-600",
      description: "完整的醫療紀錄管理",
      details: [
        "查看看診歷史紀錄",
        "閱讀醫師診斷與建議",
        "觀看看診錄影回放",
        "追蹤治療進度",
        "評價看診體驗"
      ]
    }
  ];

  const features = [
    {
      icon: Clock,
      title: "24/7 線上服務",
      description: "隨時隨地都能預約看診"
    },
    {
      icon: Stethoscope,
      title: "專業醫師團隊",
      description: "各科專業醫師為您服務"
    },
    {
      icon: Monitor,
      title: "高品質視訊",
      description: "清晰流暢的視訊通話"
    },
    {
      icon: Heart,
      title: "隱私保護",
      description: "嚴格保護您的個人資料"
    }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 側邊欄開啟按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-50 bg-white rounded-lg shadow-lg hover:shadow-xl transition"
        >
          <Menu size={24} />
        </button>
      )}

      {/* 使用你自己的 Sidebar 組件 */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* 主要內容區域 */}
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-0'}`}>
        {/* 使用你自己的 Navbar 組件 */}
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              遠距線上醫療看診平台
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              打破時間與空間限制，讓優質醫療服務觸手可及
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <span className="text-blue-600 font-semibold">✓ 即時預約</span>
              </div>
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <span className="text-purple-600 font-semibold">✓ 視訊看診</span>
              </div>
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <span className="text-green-600 font-semibold">✓ 完整紀錄</span>
              </div>
            </div>
          </div>

          {/* Main Steps */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
              使用流程
            </h3>
            
            <div className="relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200" 
                   style={{ top: '80px', left: '10%', right: '10%' }} />
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = activeStep === step.id;
                  
                  return (
                    <div 
                      key={step.id}
                      className="relative"
                      onMouseEnter={() => setActiveStep(step.id)}
                      onMouseLeave={() => setActiveStep(null)}
                    >
                      <div className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 ${
                        isActive ? 'border-blue-500 scale-105' : 'border-transparent'
                      }`}>
                        {/* Step Number */}
                        <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {step.id}
                        </div>
                        
                        {/* Icon */}
                        <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center transform transition-transform ${
                          isActive ? 'scale-110 rotate-3' : ''
                        }`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        
                        {/* Title */}
                        <h4 className="text-xl font-bold text-gray-800 text-center mb-2">
                          {step.title}
                        </h4>
                        
                        {/* Description */}
                        <p className="text-sm text-gray-600 text-center mb-4">
                          {step.description}
                        </p>
                        
                        {/* Details - Show on hover */}
                        <div className={`transition-all duration-300 overflow-hidden ${
                          isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="border-t border-gray-200 pt-4 space-y-2">
                            {step.details.map((detail, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        {index < steps.length - 1 && (
                          <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                            <ChevronRight className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
              平台特色
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* 收藏功能 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">收藏功能</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>收藏喜歡的醫師</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>快速找到常看的醫師</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>建立個人醫療團隊</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 預約管理 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">預約管理</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>查看預約狀態</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>彈性取消或修改</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>即時通知提醒</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 mb-16">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">重要提醒</h4>
                <p className="text-gray-700 leading-relaxed mb-4">
                  本平台提供之「心理諮商」與「精神科線上諮詢」服務屬於非醫療性質，
                  僅提供心理支持、情緒陪伴、生活適應建議與健康相關資訊。
                </p>
                <p className="text-gray-700 leading-relaxed">
                  諮詢內容不包含醫療診斷、開立藥物處方、醫療證明或任何醫療行為。
                  如有緊急醫療需求，請立即撥打 119 或前往最近的醫療機構。
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
            <h3 className="text-4xl font-bold mb-4">準備好開始了嗎？</h3>
            <p className="text-xl mb-8 text-blue-100">
              立即註冊，體驗便捷的線上醫療服務
            </p>
            <a 
              href="/doctorlist"
              className="inline-flex bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg items-center gap-3"
            >
              立即開始
              <ArrowRight className="w-6 h-6" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400">
              © 2024 MedOnGo. 讓醫療服務更便捷、更貼心。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}