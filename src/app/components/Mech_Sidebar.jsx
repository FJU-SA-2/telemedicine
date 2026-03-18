// components/DoctorSidebar.jsx
"use client";
import { 
  House, 
  Calendar, 
  X, 
  Settings, 
  Video, 
  MessageCircleMore, 
  Lock, 
  FileText, 
  CalendarClock, 
  ClipboardList, 
  FolderOpen, 
  UserRoundCheck 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DoctorSidebar({ isOpen, setIsOpen, approvalStatus }) {
  const pathname = usePathname();

  const menuItems = [
    { id: "/mechpage", label: "首頁", icon: House, href: "/mechpage" },
    { id: "/schedules", label: "排班管理", icon: CalendarClock, href: "/mechpage/schedule", },
    { id: "/record", label: "預約紀錄", icon: ClipboardList, href: "/recordmech",},
    { id: "/mechfeedback", label: "問題回報", icon: MessageCircleMore, href: "/mechfeedback" },
      ];
  // 為了確保主色調能被正確引用 (這是從 globals.css 中取值)
  const COLOR_AZURE = "var(--color-azure)"; 
  const COLOR_PERIWINKLE = "var(--color-periwinkle)"; 
  const COLOR_LIGHT_CYAN = "var(--color-light-cyan)";

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
      className={`fixed top-0 left-0 h-full w-64 bg-[var(--background)]/90 text-gray-900 transform
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
          const isLocked = item.needsApproval && !isApproved && !isLoading;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleClick(e, item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all relative
                ${isLocked 
                  ? `bg-[var(--color-light-cyan)]/ text-gray-400 shadow-md` 
                  : isActive
                  ? `text-white bg-[var(--color-azure)]/80 cursor-pointer`
                  : `text-gray-700 hover:bg-[var(--color-periwinkle)]`
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