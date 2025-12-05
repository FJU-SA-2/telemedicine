"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { User as UserIcon } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const displayName = user ? `${user.first_name}${user.last_name}` : "訪客";
  const href = user ? "/profile" : "/login";
  const COLOR_MAHOGANY = "var(--color-mahogany)";
  const COLOR_PERIWINKLE = "var(--color-periwinkle)";
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

  return (
    <header className="bg-[var(--background)]/50 backdrop-blur-sm border-b border-gray-100  ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <img 
                  src="/images/logo3.png"
                  alt="MedonGO Logo"
                  className="h-16 w-auto"
                />

          <div className="flex items-center gap-2">
            {/* 通知鈴鐺 - 只有患者才顯示 */}
            
            <NotificationBell user={user} />
            {/* 用戶資訊 */}
            <Link
              href={href}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--color-periwinkle)] transition-colors"
            >
              <UserIcon size={20} className="text-gray-500" />
              <span className="font-medium text-gray-800">{displayName}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}