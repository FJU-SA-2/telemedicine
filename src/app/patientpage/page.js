"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu, X, ChevronRight, ChevronLeft, Calendar, BookOpen, Clock, User } from "lucide-react";

export default function Page() {
  const [info, setInfo] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const colors = [
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-violet-500",
    "from-fuchsia-400 to-pink-500",
  ];

  // 從 JSON 檔案載入資料
  useEffect(() => {
    fetch("/health-info.json")
      .then((res) => res.json())
      .then((data) => setInfo(data))
      .catch((error) => {
        console.error("載入資料失敗:", error);
      });
  }, []);

  // 自動輪播
  useEffect(() => {
    if (!autoPlay || info.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(info.length, 3));
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay, info.length]);

  const selectedItem = info.find(item => item.id === selectedId);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.min(info.length, 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.min(info.length, 3)) % Math.min(info.length, 3));
  };

  if (info.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  const featuredItems = info.slice(0, 3);

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

      {/* 主內容區 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        <div className="p-6 max-w-7xl mx-auto">
          {/* 精選輪播區 */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">衛教資訊</h2>
            
            <div className="relative">
              {/* 輪播卡片 */}
              <div className="relative h-80 md:h-96 rounded-3xl overflow-hidden shadow-2xl">
                {featuredItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`absolute inset-0 transition-all duration-700 ${
                      idx === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
                    }`}
                  >
                    <div className={`h-full bg-gradient-to-br ${colors[idx % colors.length]} p-8 md:p-12 flex flex-col justify-between`}>
                      <div>
                        {item.department_name && (
                          <span className="inline-block bg-white bg-opacity-30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-black mb-4">
                            {item.department_name}
                          </span>
                        )}
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                          {item.title}
                        </h3>
                        <p className="text-white text-lg mb-6 line-clamp-3 drop-shadow">
                          {item.summary}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-white text-sm">
                          {item.date && (
                            <span className="flex items-center">
                              <Calendar size={16} className="mr-2" />
                              {item.date}
                            </span>
                          )}
                         
                        </div>
                        <button
                          onClick={() => setSelectedId(item.id)}
                          className="bg-white text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all flex items-center shadow-lg"
                          onMouseEnter={() => setAutoPlay(false)}
                          onMouseLeave={() => setAutoPlay(true)}
                        >
                          閱讀全文
                          <ChevronRight size={20} className="ml-2" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 左右箭頭 */}
              <button
                onClick={prevSlide}
                onMouseEnter={() => setAutoPlay(false)}
                onMouseLeave={() => setAutoPlay(true)}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-100 p-3 rounded-full transition-all shadow-lg"
              >
                <ChevronLeft size={22} className="text-gray-800" />
              </button>
              <button
                onClick={nextSlide}
                onMouseEnter={() => setAutoPlay(false)}
                onMouseLeave={() => setAutoPlay(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-100 p-3 rounded-full transition-all shadow-lg"
              >
                <ChevronRight size={22} className="text-gray-800" />
              </button>

              {/* 指示點 */}
              <div className="flex justify-center mt-6 space-x-2">
                {featuredItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentSlide(idx);
                      setAutoPlay(false);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentSlide ? "w-8 bg-blue-500" : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文章詳細內容彈窗 */}
      {selectedItem && (
       <div 
         className="fixed inset-0 bg-black/30 bg-opacity-30 backdrop-blur-sm z-50 p-4 overflow-y-auto flex"
          onClick={() => setSelectedId(null)}
            >

          <div 
               className="bg-white/95 backdrop-blur-lg rounded-3xl max-w-4xl w-full mx-auto my-12 
             shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-white/40 
             max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
                >

            {/* 文章標題區 */}
            <div className={`bg-gradient-to-br ${colors[info.findIndex(i => i.id === selectedItem.id) % colors.length]} p-8 relative`}>
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-6 right-6 bg-white bg-opacity-30 hover:bg-opacity-100 backdrop-blur-sm rounded-full p-2 transition-all"
              >
                <X size={24} className="text-black hover:text-gray-700" />
              </button>
              
              {selectedItem.department_name && (
                <span className="inline-block bg-white bg-opacity-30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-black mb-4">
                  {selectedItem.department_name}
                </span>
              )}
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg pr-12">
                {selectedItem.title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-4 text-white text-sm">
                {selectedItem.author && (
                  <span className="flex items-center">
                    <User size={16} className="mr-2" />
                    {selectedItem.author}
                  </span>
                )}
                {selectedItem.date && (
                  <span className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    {selectedItem.date}
                  </span>
                )}
               
              </div>
            </div>

            {/* 文章內容 */}
            <div className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                {selectedItem.content.split('\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={idx} className="text-2xl font-bold text-gray-800 mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                  } else if (paragraph.startsWith('### ')) {
                    return <h3 key={idx} className="text-xl font-semibold text-gray-700 mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
                  } else if (paragraph.startsWith('- ')) {
                    return <li key={idx} className="text-gray-700 ml-6 mb-2">{paragraph.replace('- ', '')}</li>;
                  } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return <p key={idx} className="font-bold text-gray-800 mt-4 mb-2">{paragraph.replace(/\*\*/g, '')}</p>;
                  } else if (paragraph.trim()) {
                    return <p key={idx} className="text-gray-700 leading-relaxed mb-4">{paragraph}</p>;
                  }
                  return null;
                })}
              </div>
              
              {/* 資料來源 */}
              {selectedItem.source && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <BookOpen size={18} className="mr-2 text-blue-500" />
                    <span className="font-semibold mr-2">資料來源：</span>
                    {selectedItem.source}
                  </div>
                </div>
              )}
              
              {/* 關閉按鈕 */}
              <button
                onClick={() => setSelectedId(null)}
                className="mt-8 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg"
              >
                關閉文章
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}