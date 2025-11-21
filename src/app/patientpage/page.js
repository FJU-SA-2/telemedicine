"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu } from "lucide-react";

export default function Page() {
  const [info, setInfo] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const colors = [
    "bg-red-200",
    "bg-yellow-200",
    "bg-green-200",
    "bg-blue-200",
    "bg-purple-200",
    "bg-pink-200",
  ];

  useEffect(() => {
    fetch("/health-info.json")
      .then((res) => res.json())
      .then((data) => setInfo(data));
  }, []);

  if (info.length === 0) return <p className="p-6">載入中...</p>;

  const item = info[current];
  const colorClass = colors[current % colors.length];

  const prev = () => {
    setCurrent((prev) => (prev - 1 + info.length) % info.length);
  };

  const next = () => {
    setCurrent((prev) => (prev + 1) % info.length);
  };

  return (
    <div className="relative">
      {/* 只在 Sidebar 關閉時顯示打開按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray z-50"
        >
          <Menu size={24} />
        </button>
      )}

      {/* 側邊欄 */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* 主內容區 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        <div className="flex flex-col items-center justify-center p-6">
          <h1 className="text-3xl font-bold mb-6 text-center">衛教資訊</h1>

          <div className={`w-full max-w-md p-6 rounded-xl shadow-lg border ${colorClass} transition-all duration-500 relative`}>            
            {/* 左右箭頭，放在卡片邊緣不擋字 */}
            <button
              onClick={prev}
              className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-700 hover:text-gray-900"
            >
              ◀
            </button>
            <button
              onClick={next}
              className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-700 hover:text-gray-900"
            >
              ▶
            </button>

            {/* 卡片內容直接展示完整資訊 */}
            <p className="text-sm text-gray-600 mb-2">{item.department_name}</p>
            <h2 className="text-2xl font-semibold mb-3">{item.title}</h2>
            <p className="text-gray-800 mb-4">{item.content}</p>
            <p className="text-xs text-gray-500">資料來源：{item.source}</p>
          </div>

          {/* 圓點指示器 */}
          <div className="flex mt-4 space-x-2">
            {info.map((_, idx) => (
              <span
                key={idx}
                className={`w-3 h-3 rounded-full ${idx === current ? "bg-gray-800" : "bg-gray-400"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}