"use client";
import { House, Calendar, ContactRound, X, Settings, Video, MessageCircleMore, Lock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DoctorSidebar({ isOpen, setIsOpen }) {
  const [activeTab, setActiveTab] = useState("/doctorpage");
  const [approvalStatus, setApprovalStatus] = useState(null);

  useEffect(() => {
    fetchApprovalStatus();
  }, []);

  const fetchApprovalStatus = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/me", {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user.doctorProfile) {
          setApprovalStatus(data.user.doctorProfile.approval_status);
        }
      }
    } catch (err) {
      console.error("取得審核狀態失敗:", err);
    }
  };

  const menuItems = [
    { id: "/doctorpage", label: "首頁", icon: House, href: "/doctorpage", requireApproval: false },
    { id: "/schedules", label: "排班管理", icon: ContactRound, href: "/schedules", requireApproval: true },
    { id: "/patientmanage", label: "患者列表", icon: Calendar, href: "/patientmanage", requireApproval: true },
    { id: "/management", label: "預約管理", icon: ContactRound, href: "/management", requireApproval: true },
    { id: "/record", label: "預約紀錄", icon: Calendar, href: "/recordoc", requireApproval: true },
    { id: "/facetime", label: "視訊看診", icon: Video, href: "/facetime", requireApproval: true },
    { id: "/docfeedback", label: "問題回報", icon: MessageCircleMore, href: "/docfeedback", requireApproval: false },
    { id: "/settings", label: "設定", icon: Settings, href: "/settings", requireApproval: false },
  ];

  const isLocked = (item) => item.requireApproval && approvalStatus !== 'approved';

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
      <nav className="p-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const locked = isLocked(item);
          
          return (
            <div key={item.id} className="relative">
              <Link
                href={locked ? "#" : item.href}
                onClick={(e) => {
                  if (locked) {
                    e.preventDefault();
                    alert('此功能需要管理員審核通過後才能使用');
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  locked
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                    : activeTab === item.id
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium flex-1">{item.label}</span>
                {locked && <Lock size={16} className="text-gray-400" />}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* 審核狀態提示 */}
      {approvalStatus === 'pending' && (
        <div className="p-4 border-t border-gray-200 bg-yellow-50">
          <div className="text-xs text-yellow-800">
            <p className="font-semibold mb-1">⏳ 審核進行中</p>
            <p>部分功能暫時鎖定</p>
          </div>
        </div>
      )}

      {approvalStatus === 'rejected' && (
        <div className="p-4 border-t border-gray-200 bg-red-50">
          <div className="text-xs text-red-800">
            <p className="font-semibold mb-1">❌ 審核未通過</p>
            <p>請聯繫管理員</p>
          </div>
        </div>
      )}
    </div>
  );
}