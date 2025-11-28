// components/DoctorSidebar.jsx
"use client";
import { House, Calendar, ContactRound, X, Settings, Video, MessageCircleMore, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DoctorSidebar({ isOpen, setIsOpen, approvalStatus }) {
  const pathname = usePathname();

  const menuItems = [
    { id: "/doctorpage", label: "首頁", icon: House, href: "/doctorpage" },
    { id: "/dintroduction", label: "使用流程介紹", icon: ContactRound, href: "/dintroduction", requiresAuth: false },,
    { id: "/schedules", label: "排班管理", icon: ContactRound, href: "/schedules", needsApproval: true },
    { id: "/management", label: "預約管理", icon: ContactRound, href: "/management", needsApproval: true },
    { id: "/record", label: "預約紀錄", icon: Calendar, href: "/recordoc", needsApproval: true },
    { id: "/patientmanage", label: "患者病歷", icon: Calendar, href: "/patientmanage", needsApproval: true },
    { id: "/facetime", label: "視訊看診", icon: Video, href: "/facetime", needsApproval: true },
    { id: "/docfeedback", label: "問題回報", icon: MessageCircleMore, href: "/docfeedback" },
    { id: "/settings", label: "設定", icon: Settings, href: "/settings" },
  ];

  // 如果 approvalStatus 是 undefined，表示還在載入中，不顯示鎖定
  const isApproved = approvalStatus === "approved" || approvalStatus === "已核准";
  const isLoading = approvalStatus === undefined;

  const handleClick = (e, item) => {
    if (item.needsApproval && !isApproved && !isLoading) {
      e.preventDefault();
      alert("此功能需要等待管理員核准後才能使用");
    }
  };

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

      {/* 核准狀態提示 */}
      {!isApproved && !isLoading && (
        <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <Lock size={16} />
            {approvalStatus === "pending" && "帳號審核中，部分功能暫時無法使用"}
            {approvalStatus === "rejected" && "帳號未通過審核，請聯繫管理員"}
            {!approvalStatus && "帳號尚未審核"}
          </p>
        </div>
      )}

      {/* 選單 */}
      <nav className="p-4 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isLocked = item.needsApproval && !isApproved && !isLoading;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleClick(e, item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all relative
                ${isLocked 
                  ? "text-gray-400 bg-gray-50 cursor-not-allowed opacity-60" 
                  : isActive
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
              {isLocked && <Lock size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}