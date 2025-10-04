// components/Sidebar.jsx
"use client";
import { X } from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out z-40`}
    >
      <div className="p-4 text-xl font-bold border-b border-gray-700 flex justify-between items-center">
        功能列表
        {/* 關閉按鈕 */}
        <button onClick={() => setIsOpen(false)}>
          <X size={24} />
        </button>
      </div>

      <ul className="p-4 space-y-4">
        <li className="hover:text-gray-400 cursor-pointer">🏠首頁</li>
        <li className="hover:text-gray-400 cursor-pointer">✏️我要預約</li>
        <li className="hover:text-gray-400 cursor-pointer">👨🏻‍⚕️醫生介紹</li>
        <li className="hover:text-gray-400 cursor-pointer">以後再想</li>
      </ul>
    </div>
  );
}
