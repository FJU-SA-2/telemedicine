"use client";
import { useState, useEffect } from 'react';
import { Calendar, Video, FileText, Users, Clock, CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Menu, X, ZoomIn, ClipboardCheck, UserCheck, MessageSquare, Star, Shield } from 'lucide-react';
import DoctorSidebar from "../components/DoctorSidebar";
import Navbar from "../components/Navbar";

export default function DoctorIntroductionPage() {
  const [activeStep, setActiveStep] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 鍵盤控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        lightboxPrev();
      } else if (e.key === 'ArrowRight') {
        lightboxNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex, lightboxImages]);

  const steps = [
  {
    id: 1,
    icon: UserCheck,
    title: "醫師註冊與審核",
    color: "from-blue-500 to-blue-600",
    description: "快速完成專業醫師認證,開啟線上診療之旅",
    images: [
      "/images/1.png",
      "/images/23.png", 
      "/images/24.png",
      "/images/4.png"
    ],
    details: [
      "選擇「醫師」身份進行註冊,填寫基本聯絡資訊",
      "設定安全的帳號密碼,保護您的專業帳戶",
      "上傳醫師執照及相關證明文件(支持 PDF、JPG 格式)",
      "系統將在 1-3 個工作天內完成審核並通知結果",
      "審核通過後立即啟用帳號,開始使用完整平台功能"
    ]
  },
  {
    id: 2,
    icon: Calendar,
    title: "設定看診時間表",
    color: "from-purple-500 to-purple-600",
    description: "彈性安排門診時段,掌握工作節奏",
    images: ["/images/26.png"],
    details: [
      "進入「排班管理」功能,查看您的可用時段",
      "選擇想要開放看診的日期與時間區間",
      "可設定單次或重複性排班,靈活調整時間安排",
      "隨時暫停或關閉特定時段,應對突發狀況",
      "點擊儲存後,系統將自動開放預約給患者"
    ]
  },
  {
    id: 3,
    icon: Users,
    title: "查看預約清單",
    color: "from-green-500 to-green-600",
    description: "一目了然掌握所有預約資訊",
    images: [
      "/images/27.png",
      "/images/30.png"
    ],
    details: [
      "進入「預約管理」查看今日及未來的預約安排",
      "點擊任一預約可查看患者詳細資料與主訴症狀",
      "系統會顯示患者基本健康資訊,協助診前準備",
      "可按日期、狀態篩選預約,快速找到所需資訊"
    ]
  },
  {
    id: 4,
    icon: Calendar,
    title: "取消預約",
    color: "from-orange-500 to-orange-600",
    description: "妥善處理突發狀況,維護醫病關係",
    images: [
      "/images/27.png",
      "/images/28.png"
    ],
    details: [
      "在「預約管理」中找到需要取消的預約項目",
      "點擊「取消預約」按鈕,進入取消流程",
      "填寫取消原因(此資訊將通知患者)",
      "確認送出後,系統將自動通知患者並退還費用",
      "該時段將重新開放,供其他患者預約"
    ]
  },
  {
    id: 5,
    icon: Video,
    title: "查看預約紀錄",
    color: "from-red-500 to-red-600",
    description: "完整追蹤所有診療歷程",
    images: ["/images/31.png"],
    details: [
      "進入「預約紀錄」功能,查看歷史預約資料",
      "可檢視已完成的看診記錄與診療內容",
      "查看已取消的預約及取消原因,便於追蹤管理",
      "支持日期範圍篩選,快速找到特定時期的紀錄"
    ]
  },
  {
    id: 6,
    icon: FileText,
    title: "查看患者病歷",
    color: "from-indigo-500 to-indigo-600",
    description: "完整病歷系統,提供更精準的診療",
    images: [
      "/images/32.png",
      "/images/33.png"
    ],
    details: [
      "進入「患者病歷」功能,查看所有就診過的患者列表",
      "系統自動整理每位患者的完整就診歷程",
      "點擊「查看完整病歷」可查看詳細診療記錄",
      "包含過往主訴、診斷、處方等重要醫療資訊",
      "協助您更全面了解患者健康狀況,提供連貫性照護"
    ]
  },
  {
    id: 7,
    icon: Video,
    title: "視訊看診",
    color: "from-pink-500 to-pink-600",
    description: "高品質視訊系統,如同面對面問診",
    images: [
      "/images/35.png",
      "/images/34.png"
    ],
    details: [
      "在預約時間前 5 分鐘開啟會議室",
      "點擊「進入視訊看診室」,系統會進行設備檢測",
      "等待患者進入,開始進行線上診療",
      "使用清晰的視訊與音訊功能進行專業問診",
      "看診過程自動錄影並加密保存,保障醫病雙方權益"
    ]
  },
  {
    id: 8,
    icon: MessageSquare,
    title: "問題回報",
    color: "from-teal-500 to-teal-600",
    description: "您的回饋幫助我們做得更好",
    images: ["/images/36.png"],
    details: [
      "點擊頁面上的「問題回報」按鈕",
      "勾選您遇到的問題類型(可複選)",
      "詳細描述具體問題或建議事項",
      "我們的技術團隊將在 24 小時內回覆",
      "持續優化平台功能,提供更好的使用體驗"
    ]
  },
];

  // 處理圖片切換
  const handlePrevImage = (stepId) => {
    setCurrentImageIndex(prev => {
      const currentIndex = prev[stepId] || 0;
      const step = steps.find(s => s.id === stepId);
      const newIndex = currentIndex === 0 ? step.images.length - 1 : currentIndex - 1;
      return { ...prev, [stepId]: newIndex };
    });
  };

  const handleNextImage = (stepId) => {
    setCurrentImageIndex(prev => {
      const currentIndex = prev[stepId] || 0;
      const step = steps.find(s => s.id === stepId);
      const newIndex = currentIndex === step.images.length - 1 ? 0 : currentIndex + 1;
      return { ...prev, [stepId]: newIndex };
    });
  };

  // 開啟燈箱
  const openLightbox = (images, index) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxImage(images[index]);
    setLightboxOpen(true);
  };

  // 關閉燈箱
  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage(null);
  };

  // 燈箱上一張
  const lightboxPrev = () => {
    const newIndex = lightboxIndex === 0 ? lightboxImages.length - 1 : lightboxIndex - 1;
    setLightboxIndex(newIndex);
    setLightboxImage(lightboxImages[newIndex]);
  };

  // 燈箱下一張
  const lightboxNext = () => {
    const newIndex = lightboxIndex === lightboxImages.length - 1 ? 0 : lightboxIndex + 1;
    setLightboxIndex(newIndex);
    setLightboxImage(lightboxImages[newIndex]);
  };

  const features = [
    {
      icon: Clock,
      title: "彈性排班",
      description: "自由安排看診時間,工作生活平衡"
    },
    {
      icon: Shield,
      title: "資料安全",
      description: "醫療資訊加密保護,符合法規要求"
    },
    {
      icon: Video,
      title: "高品質視訊",
      description: "穩定流暢的視訊通話體驗"
    },
    {
      icon: Star,
      title: "專業形象",
      description: "建立個人品牌,獲得更多病患信任"
    }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 側邊欄開啟按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      {/* 使用醫師專用的 Sidebar 組件 */}
      <DoctorSidebar isOpen={isOpen} setIsOpen={setIsOpen} activeTab="introduction" />

      {/* 主要內容區域 */}
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-0'}`}>
        {/* 使用你自己的 Navbar 組件 */}
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              醫師專用平台使用指南
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              歡迎加入線上醫療平台,為更多病患提供專業醫療服務
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <span className="text-blue-600 font-semibold">✓ 彈性排班</span>
              </div>
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <span className="text-purple-600 font-semibold">✓ 線上看診</span>
              </div>
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <span className="text-green-600 font-semibold">✓ 收益透明</span>
              </div>
            </div>
          </div>

          {/* Main Steps */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
              使用流程
            </h3>
            
            <div className="space-y-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                
                return (
                  <div 
                    key={step.id}
                    className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
                    onMouseEnter={() => setActiveStep(step.id)}
                    onMouseLeave={() => setActiveStep(null)}
                  >
                    <div className="flex flex-col lg:flex-row gap-8 items-center">
                      {/* Left Side - Info */}
                      <div className="flex-1 space-y-6">
                        {/* Step Header */}
                        <div className="flex items-center gap-4">
                          <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center`}>
                            <Icon className="w-10 h-10 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-4 py-1 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full text-sm font-bold">
                                步驟 {step.id}
                              </span>
                            </div>
                            <h4 className="text-3xl font-bold text-gray-800">
                              {step.title}
                            </h4>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-lg text-gray-600">
                          {step.description}
                        </p>
                        
                        {/* Details */}
                        <div className="space-y-3">
                          {step.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-gray-700">
                              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-base">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Right Side - Screenshot with Carousel */}
                      <div className="flex-1 w-full">
                        <div className="relative group">
                          <div 
                            className="rounded-2xl overflow-hidden border-4 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-zoom-in relative"
                            onClick={() => openLightbox(step.images, currentImageIndex[step.id] || 0)}
                          >
                            <img 
                              src={step.images[currentImageIndex[step.id] || 0]} 
                              alt={`${step.title}示意圖 ${(currentImageIndex[step.id] || 0) + 1}`}
                              className="w-full h-auto object-cover"
                            />
                            {/* Zoom Indicator */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                                <ZoomIn className="w-8 h-8 text-gray-800" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Image Navigation - Only show if multiple images */}
                          {step.images.length > 1 && (
                            <>
                              {/* Previous Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrevImage(step.id);
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
                              >
                                <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
                              </button>
                              
                              {/* Next Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextImage(step.id);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
                              >
                                <ChevronRight className="w-6 h-6 text-gray-800" />
                              </button>
                              
                              {/* Image Indicators */}
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                {step.images.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentImageIndex(prev => ({ ...prev, [step.id]: idx }));
                                    }}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                      (currentImageIndex[step.id] || 0) === idx 
                                        ? 'bg-white w-8' 
                                        : 'bg-white/50 hover:bg-white/75'
                                    }`}
                                  />
                                ))}
                              </div>
                              
                              {/* Image Counter */}
                              <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                                {(currentImageIndex[step.id] || 0) + 1} / {step.images.length}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow for next step */}
                    {index < steps.length - 1 && (
                      <div className="flex justify-center mt-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center transform rotate-90">
                          <ChevronRight className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
              平台優勢
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

          {/* Important Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 mb-16">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">醫師注意事項</h4>
                <ul className="text-gray-700 leading-relaxed space-y-2">
                  <li>• 請確保您的醫師執照在有效期限內</li>
                  <li>• 線上看診需遵守醫療法規與倫理規範</li>
                  <li>• 建議在安靜、光線充足的環境進行視訊看診</li>
                  <li>• 請保護病患隱私,不得洩露病患資訊</li>
                  <li>• 如遇緊急狀況,請引導病患就近就醫</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
            <h3 className="text-4xl font-bold mb-4">準備好開始了嗎?</h3>
            <p className="text-xl mb-8 text-blue-100">
              立即註冊成為平台醫師,開啟線上醫療新篇章
            </p>
            <a 
              href="/login"
              className="inline-flex bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg items-center gap-3"
            >
              立即開始
              <ChevronRight className="w-6 h-6" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400">
              © 2024 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all z-10"
          >
            <X className="w-8 h-8 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full text-lg font-semibold">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>

          {/* Main Image */}
          <div 
            className="relative max-w-6xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImage}
              alt="放大檢視"
              className="w-full h-full object-contain rounded-lg"
            />

            {/* Navigation Buttons - Only show if multiple images */}
            {lightboxImages.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={lightboxPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 hover:bg-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
                >
                  <ChevronRight className="w-8 h-8 text-gray-800 rotate-180" />
                </button>

                {/* Next Button */}
                <button
                  onClick={lightboxNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 hover:bg-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
                >
                  <ChevronRight className="w-8 h-8 text-gray-800" />
                </button>

                {/* Image Indicators */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
                  {lightboxImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLightboxIndex(idx);
                        setLightboxImage(lightboxImages[idx]);
                      }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        lightboxIndex === idx 
                          ? 'bg-white w-10' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Footer */}
        <div className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400">
              © 2025 MedOnGo. 讓醫療服務更便捷、更貼心。
            </p>
          </div>
        </div>
          {/* Keyboard Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            按 ESC 關閉 {lightboxImages.length > 1 && '• 使用 ← → 切換圖片'}
          </div>
        </div>
      )}
    </div>
  );
}