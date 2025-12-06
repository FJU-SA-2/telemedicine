"use client";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 幻燈片內容（可以替換成你的圖片和文字）
  const slides = [
    {
      title: "專業遠距醫療服務",
      description: "隨時隨地獲得專業醫療諮詢",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop",
      bgColor: "from-blue-500 to-indigo-600"
    },
    {
      title: "經驗豐富的醫療團隊",
      description: "匯聚各科專業醫師為您服務",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&h=600&fit=crop",
      bgColor: "from-green-500 to-teal-600"
    },
    {
      title: "便捷的線上預約",
      description: "一鍵預約，輕鬆管理您的健康",
      image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=600&fit=crop",
      bgColor: "from-purple-500 to-pink-600"
    },
    {
      title: "安全的隱私保護",
      description: "您的健康資訊受到完善保護",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&h=600&fit=crop",
      bgColor: "from-orange-500 to-red-600"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative">
      {/* 只在 Sidebar 關閉時顯示打開按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      {/* 側邊欄 */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* 原本內容 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        {/* 幻燈片輪播 */}
        <div className="relative w-full h-[600px] overflow-hidden bg-gray-900">
          {/* 幻燈片內容 */}
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={index} className="min-w-full h-full relative">
                {/* 背景圖片 */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                
                {/* 漸層遮罩 */}
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgColor} opacity-60`}></div>

                {/* 文字內容 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
                  <h2 className="text-5xl font-bold mb-4 text-center drop-shadow-lg">
                    {slide.title}
                  </h2>
                  <p className="text-2xl text-center drop-shadow-md">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 左箭頭按鈕 */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm p-3 rounded-full transition-all duration-300 group"
            aria-label="上一張"
          >
            <ChevronLeft size={32} className="text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* 右箭頭按鈕 */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm p-3 rounded-full transition-all duration-300 group"
            aria-label="下一張"
          >
            <ChevronRight size={32} className="text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* 底部指示點 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`前往第 ${index + 1} 張`}
              />
            ))}
          </div>
        </div>

        {/* 平台介紹區域（可選） */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            為什麼選擇我們？
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700">不限特定地點</h3>
              <p className="text-gray-600">隨地都能獲得醫療諮詢</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700">資料安全保障</h3>
              <p className="text-gray-600">符合醫療隱私保護標準</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700">專業醫療團隊</h3>
              <p className="text-gray-600">經驗豐富的認證醫師</p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
        <div className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400">
              © 2025 MedOnGo 讓醫療服務更便捷、更貼心。
            </p>
          </div>
        </div>
    </div>
  );
}