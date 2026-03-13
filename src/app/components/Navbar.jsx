"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon, ChevronDown, LogOut, UserCircle, Gift } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Navbar({ sidebarOpen = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = user ? `${user.first_name}${user.last_name}` : "訪客";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user) setUser(data.user);
      } catch {}
    })();
  }, []);

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
      const res = await fetch("/api/logout", { method: "POST", credentials: "include" });
      if (res.ok) {
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_type");
        localStorage.removeItem("email");
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

  // 未登入
  if (!user) {
    return (
      <header className="sticky top-0 z-10 bg-[var(--background)]/50 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-1 pl-10 sm:pl-0">
              <img src="/images/logo.png" alt="MedonGO Logo" className="h-9 sm:h-12 flex-shrink-0" />
              {/* 文字 logo：手機隱藏，sm 以上顯示 */}
              <img src="/images/logo3.png" alt="MedonGO" className="hidden sm:block h-16 w-auto flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-periwinkle)] transition-colors"
              >
                <UserIcon size={20} className="text-gray-500" />
                <span className="font-medium text-gray-800 hidden sm:inline">訪客</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // 已登入
  return (
    <header className="sticky top-0 z-10 bg-[var(--background)]/50 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* 左側 Logo */}
          <div className="flex items-center gap-1 flex-shrink-0 pl-10 sm:pl-0">
            <img src="/images/logo.png" alt="MedonGO Logo" className="h-9 sm:h-12 flex-shrink-0" />
            {/* 文字 logo：手機隱藏，sm 以上顯示 */}
            <img src="/images/logo3.png" alt="MedonGO" className="hidden sm:block h-16 w-auto flex-shrink-0" />
          </div>

          {/* 右側按鈕區 */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

            {/* 查看方案 */}
            <Link
              href={user?.role === "doctor" ? "/docplan" : "/plan"}
              className="inline-flex items-center gap-2 px-2 sm:px-3 py-2
                         text-[var(--color-azure)] bg-[var(--color-periwinkle)]
                         rounded-full hover:bg-[var(--color-azure)]/30 transition-all shadow-md hover:shadow-lg"
              title="查看方案"
            >
              <Gift size={18} className="flex-shrink-0" />
              <span className="hidden sm:inline text-sm whitespace-nowrap">查看方案</span>
            </Link>

            {/* 通知鈴鐺 */}
            <NotificationBell className="hover:bg-[var(--color-periwinkle)]" user={user} />

            {/* 使用者下拉 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg hover:bg-[var(--color-periwinkle)] transition-colors"
                aria-label="使用者選單"
              >
                <UserIcon size={20} className="text-gray-500 flex-shrink-0" />
                <span className="font-medium text-gray-800 whitespace-nowrap">
                  {displayName}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

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

                  <div className="border-t border-gray-100 my-1" />

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