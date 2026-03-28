"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon, ChevronDown, LogOut, UserCircle, Gift, X } from "lucide-react";
import NotificationBell from "./NotificationBell";

// LINE SVG Icon
function LineIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#06C755" />
      <path
        d="M20 10.61C20 7.02 16.42 4.1 12 4.1C7.58 4.1 4 7.02 4 10.61C4 13.82 6.74 16.5 10.5 17.07C10.74 17.12 11.07 17.23 11.15 17.44C11.22 17.63 11.19 17.93 11.17 18.12L11.06 18.83C11.03 19.02 10.9 19.57 12 19.1C13.1 18.63 17.97 15.52 20.13 12.99C21.56 11.42 20 10.61 20 10.61Z"
        fill="white"
      />
      <path d="M10.08 9.2H9.4C9.27 9.2 9.17 9.3 9.17 9.43V13.2C9.17 13.33 9.27 13.43 9.4 13.43H10.08C10.21 13.43 10.31 13.33 10.31 13.2V9.43C10.31 9.3 10.21 9.2 10.08 9.2Z" fill="#06C755" />
      <path d="M14.6 9.2H13.92C13.79 9.2 13.69 9.3 13.69 9.43V11.63L12.12 9.31C12.12 9.3 12.11 9.28 12.1 9.27C12.1 9.27 12.1 9.26 12.09 9.26C12.09 9.26 12.08 9.25 12.08 9.25C12.07 9.24 12.07 9.24 12.06 9.24C12.06 9.24 12.05 9.23 12.05 9.23C12.04 9.23 12.04 9.22 12.03 9.22C12.03 9.22 12.02 9.22 12.01 9.21C12.01 9.21 12 9.21 11.99 9.21H11.31C11.18 9.21 11.08 9.31 11.08 9.44V13.21C11.08 13.34 11.18 13.44 11.31 13.44H11.99C12.12 13.44 12.22 13.34 12.22 13.21V11.01L13.8 13.34C13.82 13.37 13.84 13.39 13.87 13.41C13.87 13.41 13.88 13.41 13.88 13.42C13.89 13.42 13.9 13.43 13.91 13.43C13.91 13.43 13.92 13.43 13.92 13.43C13.93 13.43 13.95 13.44 13.96 13.44H14.6C14.73 13.44 14.83 13.34 14.83 13.21V9.44C14.83 9.3 14.73 9.2 14.6 9.2Z" fill="#06C755" />
      <path d="M8.56 12.3H6.96V9.43C6.96 9.3 6.86 9.2 6.73 9.2H6.05C5.92 9.2 5.82 9.3 5.82 9.43V13.2C5.82 13.26 5.84 13.32 5.88 13.36C5.92 13.4 5.98 13.43 6.05 13.43H8.56C8.69 13.43 8.79 13.33 8.79 13.2V12.53C8.79 12.4 8.69 12.3 8.56 12.3Z" fill="#06C755" />
      <path d="M18.18 10.34C18.31 10.34 18.41 10.24 18.41 10.11V9.44C18.41 9.31 18.31 9.21 18.18 9.21H15.67C15.6 9.21 15.54 9.24 15.5 9.28C15.46 9.32 15.44 9.37 15.44 9.44V13.21C15.44 13.27 15.46 13.33 15.5 13.37C15.54 13.41 15.6 13.44 15.67 13.44H18.18C18.31 13.44 18.41 13.34 18.41 13.21V12.54C18.41 12.41 18.31 12.31 18.18 12.31H16.58V11.59H18.18C18.31 11.59 18.41 11.49 18.41 11.36V10.69C18.41 10.56 18.31 10.46 18.18 10.46H16.58V10.34H18.18Z" fill="#06C755" />
    </svg>
  );
}

// LINE Modal Component
function LineModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[320px] flex flex-col items-center gap-4 z-10 animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="關閉"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <LineIcon size={28} />
            <span className="text-lg font-bold text-gray-800">加入官方 LINE</span>
          </div>
          <p className="text-sm text-gray-500 text-center">掃描 QR Code 或點擊連結加入我們</p>
        </div>

        {/* QR Code */}
        <div className="border-2 border-[#06C755]/30 rounded-xl p-2 bg-[#06C755]/5">
          <img
            src="https://qr-official.line.me/gs/M_715cnjoi_GW.png?oat_content=qr"
            alt="LINE QR Code"
            className="w-44 h-44 object-contain rounded-lg"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">或</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* LINE Link Button */}
        <a
          href="https://lin.ee/zwseeq6"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 px-4
                     bg-[#06C755] hover:bg-[#05b34c] active:bg-[#049a42]
                     text-gray-700 font-semibold rounded-xl transition-colors shadow-md"
        >
          <LineIcon size={20} />
          點此連結加入 LINE
        </a>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.18s ease-out both; }
      `}</style>
    </div>
  );
}

export default function Navbar({ sidebarOpen = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = user
    ? (user.role === "mech" ? (user.mechanism_name || user.username) : `${user.first_name}${user.last_name}`)
    : "訪客";

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
    <>
      {/* LINE Modal */}
      {lineModalOpen && <LineModal onClose={() => setLineModalOpen(false)} />}

      <header className="sticky top-0 z-10 bg-[var(--background)]/50 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* 左側 Logo */}
            <div className="flex items-center gap-1 flex-shrink-0 pl-10 sm:pl-12">
              <img src="/images/logo.png" alt="MedonGO Logo" className="h-9 sm:h-12 flex-shrink-0" />
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

                    {/* 加入 LINE */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setLineModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#06C755]/10 transition-colors text-[#06C755]"
                    >
                      <LineIcon size={20} />
                      <span className="font-medium text-gray-700">加入官方 LINE</span>
                    </button>

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
    </>
  );
}