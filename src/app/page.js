"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import Sidebar from "./components/Sidebar"; // 請確保路徑正確
import { Menu, User, MessageSquare, Star, ChevronRight, ChevronLeft ,Zap, Crown} from "lucide-react";
import FloatingChat from "./components/FloatingChat";

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(0);

  const COLOR_MAHOGANY = "var(--color-mahogany)"; 
  const COLOR_LIME_CREAM = "var(--color-lime-cream)"; 
  const COLOR_AZURE = "var(--color-sazure)"; 
  const COLOR_PERIWINKLE = "var(--color-periwinkle)"; 
  const COLOR_LIGHT_CYAN = "var(--color-light-cyan)"; 
  // ============================================

  const feedbacks = [
    {
      rating: 5,
      comment: "非常方便的遠距醫療服務，醫生很專業，解決了我的問題。",
      name: "張小姐",
      date: "2025年11月",
      // 替換為引用 const 變數，const 變數現在引用的是 CSS 變數
      gradient: `from-[${COLOR_AZURE}] to-[${COLOR_PERIWINKLE}]` 
    },
    {
      rating: 4,
      comment: "預約系統很簡單，不用出門就能看病，節省很多時間。",
      name: "李先生",
      date: "2025年11月",
      gradient: `from-[${COLOR_LIME_CREAM}] to-[${COLOR_LIGHT_CYAN}]`
    },
    {
      rating: 5,
      comment: "醫療團隊很親切，線上諮詢體驗很好，會繼續使用。",
      name: "王太太",
      date: "2025年10月",
      gradient: `from-[${COLOR_PERIWINKLE}] to-[${COLOR_MAHOGANY}]/20`
    },
    {
      rating: 5,
      comment: "專業的醫療諮詢，讓我在家也能得到完善的照護。",
      name: "陳先生",
      date: "2025年10月",
      gradient: `from-[${COLOR_MAHOGANY}]/50 to-[${COLOR_LIME_CREAM}]`
    },
    {
      rating: 4,
      comment: "介面設計直覺，操作簡單，推薦給需要的朋友。",
      name: "林小姐",
      date: "2025年9月",
      gradient: `from-[${COLOR_LIGHT_CYAN}] to-[${COLOR_AZURE}]`
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeedback((prev) => (prev + 1) % feedbacks.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextFeedback = () => {
    setCurrentFeedback((prev) => (prev + 1) % feedbacks.length);
  };

  const prevFeedback = () => {
    setCurrentFeedback((prev) => (prev - 1 + feedbacks.length) % feedbacks.length);
  };

  return (
    // 使用淺色系的長春花和淺青色作為背景漸層
    <div className={`min-h-screen bg-gradient-to-br from-[${COLOR_PERIWINKLE}]/30 via-white to-[${COLOR_LIGHT_CYAN}]/30`}>
      
      {/* 引用共用的 Sidebar 元件 */}
    <div className="relative">
      {/* 只在 Sidebar 關閉時顯示打開按鈕 */}
      {!isOpen && (
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition "
                aria-label="開啟選單"
              >
                <Menu size={24} />
              </button>
            )}

      {/* 側邊欄 */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"}`}>
        
        {/* Minimal Navbar */}
        <nav className="bg-[var(--background)]/50 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
  <div className="mx-auto">

    <div className="flex items-center justify-between h-16">

      {/* 左側 */}
      <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-6 lg:pl-8">
        
        {/* menu */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-all"
        >
          <Menu size={22} className="text-gray-700" />
        </button>

        {/* logo icon */}
        <img
          src="/images/logo.png"
          alt="New Telehealth Logo"
          className="h-9 sm:h-12 w-auto"
        />

        {/* 文字 logo (手機隱藏) */}
        <img 
          src="/images/logo3.png"
          alt="MedonGO Logo"
          className="hidden sm:block h-16 w-auto"
        />

      </div>

      {/* 右側 */}
      <div className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-6 lg:pr-8">

        {/* 使用教學 */}
        <Link 
          href="/introduction"
          className="px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base
          bg-[var(--color-azure)] text-white rounded-lg
          hover:opacity-90 transition-all shadow-md hover:shadow-lg"
        >
          <span className="hidden sm:inline">使用教學</span>
          <span className="sm:hidden">教學</span>
        </Link>

        {/* 登入 */}
        <Link 
          href="/login"
          className="px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base
          bg-[var(--background)] text-[var(--color-azure)]
          border border-[var(--color-azure)] rounded-lg
          hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
        >
          登入
        </Link>

      </div>

    </div>
  </div>
</nav>

        
        <main>
          {/* Hero Section */}
          <section className="relative py-12 lg:py-18 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* 左側文字區 */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              醫隨行 <span className="text-[var(--color-azure)]">MedOnGo</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg lg:text-xl text-gray-500 max-w-md mx-auto md:mx-0">
              走到哪，醫師就在哪<br />
              隨時隨地，輕鬆看診
            </p>

            <div className="mt-8 flex justify-center md:justify-start">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2
                           px-6 sm:px-8 lg:px-10
                           py-3
                           text-sm sm:text-base
                           bg-[var(--color-lime-cream)]
                           text-white rounded-xl
                           hover:opacity-90 transition-all
                           shadow-md hover:shadow-lg"
              >
                立即體驗
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>

          {/* 右側圖片區 */}
          <div className="w-full">
            <div className="relative w-full aspect-[7/4] lg:aspect-[16/10]">
              <NextImage
                src="/images/hero1.png"
                alt="遠距醫療示意圖"
                fill
                className="object-cover rounded-3xl shadow-xl"
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </section>
          <section className="py-20">
  <div className="max-w-7xl mx-auto px-6 lg:px-8">
  {/* 標題 */}
  <div className="text-center mb-12">
    <h2 className="text-3xl font-extrabold text-gray-900">
      會員方案說明
    </h2>
    <p className="mt-4 text-lg text-gray-500">
      本平台為付費制服務，新會員註冊即啟用會員版完整功能試用 6 個月
    </p>
  </div>

  {/* 表格 */}
  <div className="overflow-x-auto">
    <table className="w-full border-collapse rounded-2xl overflow-hidden">
      {/* 表頭 */}
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left p-5 text-gray-600 font-medium">
            功能
          </th>

          <th className="py-4 px-4 text-sm text-gray-700 font-semibold">
            會員版（試用中）
            <div className="text-xs text-gray-400 mt-1">
              前 6 個月
            </div>
          </th>

          <th className="py-4 px-4 text-sm text-gray-900 font-semibold bg-gray-100">
            會員版（月訂）
            <div className="text-xs text-gray-500 mt-1">
              推薦
            </div>
          </th>

          <th className="py-4 px-4 text-sm text-gray-700 font-semibold">
            年費會員
          </th>
        </tr>
      </thead>

      {/* 表身 */}
      <tbody className="divide-y divide-gray-200 text-sm">
        {[
          ["費用", "$0（試用期間）", "NT$500 / 月", "NT$5000 / 年"],
          ["預約次數", "無限制", "無限制", "無限制"],
          ["視訊看診", "✔", "✔", "✔"],
          ["完整就診紀錄", "✔", "✔", "✔"],
          ["AI 健康顧問", "✔", "✔", "✔"],
          ["經驗分享互動", "✔", "✔", "✔"],
          ["收藏喜愛醫師", "✔", "✔", "✔"],
        ].map(([feature, trial, monthly, yearly]) => (
          <tr key={feature} className="hover:bg-gray-50">
            <td className="p-5 text-gray-600">
              {feature}
            </td>

            <td className="py-3 px-4 text-center text-gray-500 bg-gray-50">
              {trial}
            </td>

            <td className="py-3 px-4 text-center font-medium text-gray-900 bg-gray-100">
              {monthly}
            </td>

            <td className="py-3 px-4 text-center text-gray-700">
              {yearly}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* 補充說明 */}
  <p className="mt-6 text-sm text-gray-400 text-center">
    試用期結束後，需選擇月訂或年費方案以繼續使用會員服務。
  </p>
  <p className="mt-6 text-sm text-center">
    機構可直接合作聯繫。
  </p>
</div>
</section>


          
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-10">
                  <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
                      視訊看診，<span className={`text-[var(--color-lime-cream)]`}>清晰影像</span> {/* 替換主色 */}
                  </h2>
                  <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
                      採用最先進的技術，確保診斷過程的每個細節都清晰可見。
                  </p>
              </div>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"> 
                    <div className="flex flex-col md:flex-row">
                        
                        <div className="flex-1 p-6 md:p-12 relative">
                        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                        <div className="h-full w-full bg-cover bg-center" 
                             style={{ 
                                 backgroundImage: "url('/images/highq.jpg')", 
                                 backgroundRepeat: 'repeat',
                                 opacity: 0.3
                             }}>
                        </div>
                       </div>

                        
                        {/* 右側：內容展示區塊 */}
                        <div className="flex-1 p-6 md:p-12">
                            <h4 className="text-3xl font-bold text-gray-900 mb-6">即時互動，細節不遺漏</h4>
                            <p className="text-gray-600 mb-8 max-w-2xl">
                                收藏、預約、線上支付，一站完成。無需繁瑣手續，讓您專注於健康管理。
                            </p>
                            
                            {/* 視覺卡片：替換為引用 CSS 變數 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className={`p-4 bg-gradient-to-br from-[var(--color-periwinkle)]/10 to-[var(--color-light-cyan)]/15 rounded-xl border border-[var(--color-azure)]/30 shadow-lg flex flex-col items-start justify-center`}>
                                    <span className={`text-2xl font-bold drop-shadow text-[var(--color-mahogany)]`}>4K 畫質</span> {/* 替換主色 */}
                                    <p className={`text-sm text-[var(--color-mahogany)]/80`}>影像細節清晰</p>
                                </div>
                                <div className={`p-4 bg-gradient-to-br from-[var(--color-lime-cream)]/10 to-[var(--color-lime-cream)]/15 rounded-xl border border-[var(--color-lime-cream)]/50 shadow-lg flex flex-col items-start justify-center`}>
                                    <span className={`text-2xl font-bold text-[var(--color-mahogany)]`}>就醫紀錄儲存</span> {/* 紅木色作為深色點綴 */}
                                    <p className={`text-sm text-[var(--color-mahogany)]/80`}>不怕忘記看診細節</p>
                                </div>
                                <div className={`p-4 bg-gradient-to-br from-[var(--color-azure)]/10 to-[var(--color-azure)]/15 rounded-xl border border-[var(--color-azure)]/50 shadow-lg flex flex-col items-start justify-center`}>
                                    <span className={`text-2xl font-bold drop-shadow text-[var(--color-mahogany)]`}>經驗分享區</span> 
                                    <p className={`text-sm drop-shadow text-[var(--color-mahogany)]/80`}>交流看診心得</p>
                                </div>
                            </div></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

          
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-10">
                  <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
                      <span className={`text-[var(--color-lime-cream)]`}>專業醫師</span>進駐 {/* 替換主色 */}
                  </h2>
                  <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
                      嚴格篩選合作醫師，讓您隨時隨地獲得最可靠的醫療諮詢。
                  </p>
              </div>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6 md:p-12 relative">
                        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                        <div className="h-full w-full bg-cover bg-center" 
                             style={{ 
                                 backgroundImage: "url('/images/doc.jpg')", 
                                 backgroundRepeat: 'repeat',
                                 opacity: 0.3
                             }}>
                        </div>
                       </div>
                        
                        {/* 右側：內容展示區塊 */}
                        <div className="flex-1 p-6 md:p-12">
                            <h4 className="text-3xl font-bold text-gray-900 mb-6">不用出門，在家即可享有專業照護</h4>
                            <p className="text-gray-600 text-lg max-w-3xl mb-8">
                                我們嚴格篩選合作醫師，確保所有在平台上的執業醫師皆具備專業認證和豐富經驗。無論您需要皮膚科、家醫科或心理諮詢，都能隨時隨地，快速找到合適的專業人士。
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {/* 替換為引用 CSS 變數 */}
                                <div className={`p-4 bg-gradient-to-br from-[var(--color-azure)]/5 to-[var(--color-azure)]/10 rounded-xl border border-[var(--color-azure)]/30 shadow-lg flex flex-col items-start justify-center`}>
                                    <span className="text-2xl font-bold drop-shadow text-[var(--color-mahogany)]">多達 15+ 專科醫師</span>
                                    <p className={`text-sm text-[var(--color-mahogany)]/80`}>在家輕鬆診</p>
                                </div>
                                <div className={`p-4 bg-gradient-to-br from-[var(--color-lime-cream)]/5 to-[var(--color-lime-cream)]/10 rounded-xl border border-[var(--color-lime-cream)]/30 shadow-lg flex flex-col items-start justify-center`}>
                                    <span className={`text-2xl font-bold text-[var(--color-mahogany)]`}>全天候線上預約</span>
                                    <p className={`text-sm text-[var(--color-mahogany)]/80`}>不怕突發狀況</p>
                                </div>
                                <div className={`p-4 bg-gradient-to-br from-[var(--color-mahogany)]/5 to-[var(--color-mahogany)]/8 rounded-xl border border-[var(--color-mahogany)]/30 shadow-lg flex flex-col items-start justify-center`}>
                                    <span className={`text-2xl font-bold text-[var(--color-mahogany)]`}>達到真正的遠距醫療</span>
                                    <p className={`text-sm text-[var(--color-mahogany)]/80`}>達到真正的遠距醫療</p>
                                </div>
                            </div>
                        </div></div>
                    </div>
                </div>
            </div>
        </section>

          {/* User Feedback Section */}
          <section className="py-16 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">真實用戶回饋</h2>
              
              <div className="relative">
                {/* 輪播容器 */}
                <div className="flex items-center justify-center gap-6 px-4 md:px-16 h-80">
                  {[-1, 0, 1].map((offset) => {
                    const index = (currentFeedback + offset + feedbacks.length) % feedbacks.length;
                    const feedback = feedbacks[index];
                    const isCenter = offset === 0;
                    
                    return (
                      <div
                        key={offset}
                        className={`transition-all duration-500 absolute md:relative ${
                          isCenter 
                            ? "w-full max-w-2xl scale-100 opacity-100 z-10 left-0 md:left-auto" 
                            : "hidden md:block w-80 scale-90 opacity-60"
                        }`}
                      >
                        <div className={`bg-white rounded-2xl border border-gray-100 ${
                          isCenter ? "p-8 shadow-lg" : "p-6 shadow-sm"
                        }`}>
                          <div className={`flex items-center gap-1 mb-4 ${isCenter ? "justify-center" : "justify-start"}`}>
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={i < feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} 
                                size={isCenter ? 20 : 16} 
                              />
                            ))}
                          </div>
                          {/* 評價文字：置中調大為 text-xl，側邊調大為 text-base */}
                          <p className={`text-gray-600 mb-6 leading-relaxed ${
                            isCenter ? "text-xl text-center" : "text-base"
                          }`}>
                            "{feedback.comment}"
                          </p>
                          <div className={`flex items-center gap-4 ${isCenter ? "justify-center" : "justify-start"}`}>
                            {/* 使用 feedback 陣列中的新漸層 */}
                            <div className={`bg-gradient-to-br ${feedback.gradient} rounded-full ${
                              isCenter ? "w-14 h-14" : "w-10 h-10"
                            }`}></div>
                            <div>
                              {/* 姓名文字：置中調大為 text-lg */}
                              <p className={`font-semibold text-gray-900 ${isCenter ? "text-lg" : "text-base"}`}>
                                {feedback.name}
                              </p>
                              {/* 日期文字：置中調大為 text-base */}
                              <p className={`text-gray-400 ${isCenter ? "text-base" : "text-sm"}`}>
                                {feedback.date}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* 箭頭和指示點部分保持不變... */}
                <button
                  onClick={prevFeedback}
                  className="absolute left-0 md:left-10 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all z-20"
                  aria-label="上一則評價"
                >
                  <ChevronLeft size={24} className="text-gray-600" />
                </button>

                <button
                  onClick={nextFeedback}
                  className="absolute right-0 md:right-10 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all z-20"
                  aria-label="下一則評價"
                >
                  <ChevronRight size={24} className="text-gray-600" />
                </button>

                <div className="flex justify-center gap-2 mt-8">
                  {feedbacks.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeedback(index)}
                      className={`transition-all duration-300 rounded-full ${
                        currentFeedback === index
                          ? `bg-[var(--color-azure)] w-8 h-2` // 替換主色
                          : "bg-gray-300 w-2 h-2 hover:bg-gray-400"
                      }`}
                      aria-label={`前往第 ${index + 1} 則評價`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
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
    <FloatingChat />
    </div>
   );
}