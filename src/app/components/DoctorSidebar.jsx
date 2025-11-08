// components/DoctorSidebar.jsx
"use client";
import { House, Calendar, ContactRound, X, Settings, Video, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DoctorSidebar({ isOpen, setIsOpen }) {
  const [activeTab, setActiveTab] = useState("/doctorpage");

  const menuItems = [
    { id: "/doctorpage", label: "首頁", icon: House, href: "/doctorpage" },
    { id: "/schedules", label: "排班管理", icon: ContactRound, href: "/schedules" },
    { id: "/patientmanage", label: "患者列表", icon: Calendar, href: "/patientmanage" },
    { id: "/management", label: "預約管理", icon: ContactRound, href: "/management" },
    { id: "/record", label: "預約紀錄", icon: Calendar, href: "/recordoc" },
    { id: "/facetime", label: "視訊看診", icon: Video, href: "/facetime" },
    { id: "/docfeedback", label: "問題回報", icon: MessageCircleMore, href: "/docfeedback" },
    { id: "/settings", label: "設定", icon: Settings, href: "/settings" },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-white text-gray-900 transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out z-40 shadow-lg`}
    >
      {/* 標題列 */}
      <div className="p-4 text-xl font-bold border-b border-gray-300 flex justify-between items-center">
        功能列表
        <button onClick={() => setIsOpen(false)} className="hover:text-red-500">
          <X size={24} />
        </button>
      </div>

      {/* 選單 */}
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