// pages/HomePage.jsx
"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Doctorbox from "../components/Doctorbox";
import { Menu } from "lucide-react";



export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);

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

      {/* 原本內容 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />
        <Doctorbox />
      </div>
    </div>
  );
}
