"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon, ChevronDown, LogOut, UserCircle } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const displayName = user ? `${user.first_name}${user.last_name}` : "訪客";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user) setUser(data.user);
      } catch {}
    })();
  }, []);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        // 清除 localStorage
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');
        localStorage.removeItem('email');
        
        alert("登出成功");
        router.push("/login");
      } else {
        alert("登出失敗,請再試一次");
      }
    } catch (error) {
      console.error("登出錯誤:", error);
      alert("登出失敗,請再試一次");
    }
  };

  // 未登入用戶點擊直接跳轉登入頁
  if (!user) {
    return (
      <header className="sticky top-0 z-10 bg-[var(--background)]/50 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-1">
              <img
                src="/images/logo.png"
                alt="MedonGO Logo"
                className="h-12"
              />
              <img
                src="/images/logo3.png"
                alt="MedonGO Logo"
                className="h-16 w-auto"
              />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--color-periwinkle)] transition-colors"
              >
                <UserIcon size={20} className="text-gray-500" />
                <span className="font-medium text-gray-800">訪客</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // 已登入用戶顯示下拉選單
  return (
    <header className="sticky top-0 z-10 bg-[var(--background)]/50 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* 左側:Logo */}
          <div className="flex items-center gap-1">
            <img
              src="/images/logo.png"
              alt="MedonGO Logo"
              className="h-12"
            />
            <img
              src="/images/logo3.png"
              alt="MedonGO Logo"
              className="h-16 w-auto"
            />
          </div>

          {/* 右側:通知 + 使用者下拉選單 */}
          <div className="flex items-center gap-2">
            <NotificationBell user={user} />
            
            {/* 下拉選單容器 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--color-periwinkle)] transition-colors"
              >
                <UserIcon size={20} className="text-gray-500" />
                <span className="font-medium text-gray-800">{displayName}</span>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-500 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 下拉選單 */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <UserCircle size={20} className="text-blue-600" />
                    <span className="font-medium">個人檔案</span>
                  </Link>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">登出</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}