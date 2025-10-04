// components/Sidebar.jsx
"use client";
import { X } from "lucide-react";
import Link from "next/link";


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
  <li>
    <Link href="/" className="hover:text-gray-400">
      🏠首頁
    </Link>
  </li>
  <li>
    <Link href="/reserve" className="hover:text-gray-400">
      ✏️我要預約
    </Link>
  </li>
  <li>
    <Link href="/doctorlist" className="hover:text-gray-400">
      👨🏻‍⚕️醫生介紹
    </Link>
  </li>
  <li>
    <Link href="/settings" className="hover:text-gray-400">
      以後再想
    </Link>
  </li>
</ul>

    </div>
  );
}
