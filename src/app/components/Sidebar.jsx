"use client";
import { 
  Video, 
  House, 
  Calendar, 
  Users, 
  X, 
  Settings, 
  MessageCircleMore, 
  FileText, 
  Lock, 
  Heart,
  ClipboardList,
  Stethoscope
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 為了確保主色調能被正確引用 (這是從 globals.css 中取值)
  const COLOR_AZURE = "var(--color-azure)"; 
  const COLOR_PERIWINKLE = "var(--color-periwinkle)"; 
  const COLOR_LIGHT_CYAN = "var(--color-light-cyan)";

  // 檢查登入狀態
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/me');
        const data = await response.json();
        setIsLoggedIn(data.authenticated === true);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);


  const homeHref = isLoggedIn ? "/PatientPage" : "/";

  const menuItems = [
    { id: "home", label: "首頁", icon: House, href: homeHref, requiresAuth: false },
    { id: "/introduction", label: "使用流程介紹", icon: FileText, href: "/introduction", requiresAuth: false },
    { id: "/doctorlist", label: "醫生介紹", icon: Stethoscope, href: "/doctorlist", requiresAuth: false },
    { id: "/favorite", label: "收藏列表", icon: Heart, href: "/favorite", requiresAuth: true },
    { id: "/reserve", label: "線上預約", icon: Calendar, href: "/reserve", requiresAuth: true },
    { id: "/record", label: "預約紀錄", icon: ClipboardList, href: "/record", requiresAuth: true },
    { id: "/facetime", label: "視訊看診", icon: Video, href: "/pfacetime", requiresAuth: true },
    { id: "/experience", label: "經驗分享區", icon: MessageCircleMore, href: "/experience", requiresAuth: false },
    { id: "/feedback", label: "問題回報", icon: MessageCircleMore, href: "/feedback", requiresAuth: true },
  ];

  return (
    <div
      // 背景使用全域背景變數
      className={`fixed top-0 left-0 h-full
                  w-64
                  bg-[var(--background)]
                  sm:bg-[var(--background)]/50 sm:backdrop-blur-sm
                  text-gray-900 transform
                  ${isOpen ? "translate-x-0" : "-translate-x-full"}
                  transition-transform duration-300 ease-in-out
                  z-40 shadow-lg`}
    >
      <div className="p-4 text-xl font-bold border-b border-gray-300 flex justify-between items-center">
        功能列表
        <button onClick={() => setIsOpen(false)} className="hover:text-red-500">
          <X size={24} />
        </button>
      </div>

      <nav className="p-4 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isLocked = item.requiresAuth && !isLoggedIn;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all relative ${
                pathname === item.href
                  // 已點選的項目：使用 bg-[var(--color-azure)]
                  ? `bg-[var(--color-azure)]/80 text-white shadow-md`
                  : isLocked
                  ? `text-gray-400 hover:bg-[var(--color-light-cyan)] cursor-pointer`
                  : `text-gray-700 hover:bg-[var(--color-periwinkle)]`
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
              {isLocked && <Lock size={16} className="ml-auto text-gray-400" />}
            </Link>
          );
        })}

        {!isLoading && !isLoggedIn && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 flex items-center gap-2">
              <Lock size={14} />
              <span>部分功能需要登入後使用</span>
            </p>
          </div>
        )}
      </nav>
    </div>
  );
}