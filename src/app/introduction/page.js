"use client";
import { useState, useEffect } from 'react';
import { Calendar, Video, Star, FileText, CreditCard, User, Clock, CheckCircle, ArrowRight, Stethoscope, Heart, Monitor, ChevronRight, ChevronLeft, AlertCircle, Menu, X, ZoomIn } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import FloatingChat from "../components/FloatingChat";
import { MessageCircle } from "lucide-react";

export default function IntroductionPage() {
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

  // 患者端使用步驟
const steps = [
  {
    id: 1,
    icon: User,
    title: "註冊帳號",
    color: "from-blue-500 to-blue-600",
    description: "輕鬆建立您的個人健康帳戶",
    images: [
      "/images/1.png",
      "/images/2.png", 
      "/images/3.png",
      "/images/4.png"
    ],
    details: [
      "選擇「患者」身份開始註冊流程",
      "使用電子郵件建立帳號",
      "填寫基本個人資料與設定安全密碼",
      "輸入手機驗證碼完成身份驗證",
      "註冊完成，立即開始使用平台功能!"
    ]
  },
  {
    id: 2,
    icon: Calendar,
    title: "瀏覽與收藏醫師",
    color: "from-purple-500 to-purple-600",
    description: "找到最適合您的專業醫師",
    images: [
      "/images/5.png",
      "/images/6.png", 
      "/images/7.png"
    ],
    details: [
      "瀏覽各專科醫師列表,查看醫師背景與專長",
      "點擊「查看更多」了解醫師詳細資料",
      "點擊星星圖示將喜歡的醫師加入收藏清單",
      "在「我的收藏」中快速找到您收藏的醫師",
      "隨時管理收藏清單,方便日後預約!"
    ]
  },
  {
    id: 3,
    icon: CreditCard,
    title: "預約與線上付款",
    color: "from-green-500 to-green-600",
    description: "簡單三步驟完成看診預約",
    images: [
      "/images/11.png",
      "/images/12.png", 
      "/images/13.png",
      "/images/14.png",
      "/images/15.png",
      "/images/16.png"
    ],
    details: [
      "在線上預約頁面查看醫師的可預約時段",
      "選擇最適合您的看診日期與時間",
      "詳細描述您的症狀,如需修改可點擊編輯",
      "確認預約資訊無誤後進入付款頁面",
      "選擇付款方式完成交易,預約成功!系統將發送確認通知"
    ]
  },
  {
    id: 4,
    icon: Calendar,
    title: "取消預約",
    color: "from-orange-500 to-orange-600",
    description: "彈性調整您的看診安排",
    images: [
      "/images/17.png",
      "/images/18.png"
    ],
    details: [
      "在「我的預約」中找到想要取消的預約項目",
      "點擊「取消預約」按鈕進入取消流程",
      "填寫取消原因(可選填)並送出申請",
      "注意:預約時間 2 天內取消僅退還 50% 費用",
      "取消成功後將收到系統通知與退款確認"
    ]
  },
  {
    id: 5,
    icon: Video,
    title: "視訊看診與評分",
    color: "from-red-500 to-red-600",
    description: "享受便利的線上醫療服務",
    images: [
      "/images/8.png",
      "/images/19.png",
      "/images/20.png"
    ],
    details: [
      "預約時間到達前,等待醫師開啟視訊會議室",
      "收到通知後點擊「進入看診室」開始視訊",
      "與醫師進行即時視訊問診,清楚說明症狀",
      "看診過程將自動錄影保存,可隨時回顧",
      "看診結束後為醫師評分,幫助其他患者參考",
      "也可點擊看診紀錄為之前的看診進行評分"
    ]
  },
  {
    id: 6,
    icon: FileText,
    title: "經驗分享區",
    color: "from-indigo-500 to-indigo-600",
    description: "與社群分享您的就醫經驗",
    images: [
      "/images/9.png",
      "/images/21.png",
      "/images/22.png"
    ],
    details: [
      "點擊「發布」按鈕開始撰寫您的經驗分享",
      "輸入標題與內容,分享您的就醫心得",
      "可選擇「匿名發布」保護個人隱私",
      "在他人的文章下方發表留言互動交流",
      "留言時也可選擇匿名,自由表達想法"
    ]
  },
  {
    id: 7,
    icon: User,
    title: "問題回報",
    color: "from-blue-500 to-blue-600",
    description: "您的回饋幫助我們做得更好",
    images: ["/images/10.png"],
    details: [
      "點擊「問題回報」進入反饋表單",
      "勾選遇到的問題類型或功能建議",
      "詳細描述問題情況或您的改善建議",
      "我們會仔細審閱每一則回饋意見",
      "持續改進平台,提供更優質的服務體驗"
    ]
  },
  {
  id: 8,
  icon: MessageCircle,
  title: "AI聊天室",
  color: "from-indigo-500 to-indigo-600",
  description: "系統在每個頁面的右下角皆設有 AI 聊天室，方便使用者隨時進行線上視訊看診相關的諮詢與協助。",
  images: [
    "/images/37.png",
    "/images/38.png",
  ],
  details: [
    "每個頁面右下角皆可快速開啟 AI 聊天室",
    "看診前協助進行症狀初步詢問與整理",
    "輔助說明線上視訊看診流程",
    "提供基本健康與就醫相關資訊",
    "提升線上醫療服務的整體互動體驗"
  ]
}


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
      title: "線上服務",
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
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
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
              © 2025 MedOnGo. 讓醫療服務更便捷、更貼心。
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

          {/* Keyboard Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            按 ESC 關閉 {lightboxImages.length > 1 && '• 使用 ← → 切換圖片'}
          </div>
        </div>
      )}
      <FloatingChat />
    </div>
  );
}