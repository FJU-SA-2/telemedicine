// components/Sidebar.jsx
"use client";
import { House, Calendar, ContactRound, X, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Sidebar({ isOpen, setIsOpen }) {
  const [activeTab, setActiveTab] = useState("/");

  const menuItems = [
    { id: "/", label: "首頁", icon: House, href: "/" },
    { id: "/doctorlist", label: "醫生介紹", icon: ContactRound, href: "/doctorlist" },
    { id: "/reserve", label: "線上預約", icon: Calendar, href: "/reserve" },
    { id: "/favorite", label: "收藏列表", icon: ContactRound, href: "/favorite" },
    { id: "/my reserve", label: "預約紀錄", icon: Calendar, href: "/record" },
    { id: "/settings", label: "以後再想", icon: Settings, href: "/settings" },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-white text-gray-900 transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out z-40 shadow-lg`}
    >
      <div className="p-4 text-xl font-bold border-b border-gray-300 flex justify-between items-center">
        功能列表
        {/* 關閉按鈕 */}
        <button onClick={() => setIsOpen(false)} className="hover:text-red-500">
          <X size={24} />
        </button>
      </div>

      <nav className="p-4 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                activeTab === item.id
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
