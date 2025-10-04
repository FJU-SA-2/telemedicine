"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { User as UserIcon } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const displayName = user ? `${user.firstName}${user.lastName}` : "訪客";
  const href = user ? "/profile" : "/login";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", {  // 改成相對路徑
        credentials: "include",
      });;
        if (!res.ok) return; // 未登入
        const data = await res.json();
        if (data?.user) setUser(data.user);
      } catch {}
    })();
  }, []);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-800"><b>醫隨行 MedOnGo</b></h1>
          <Link
            href={href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <UserIcon size={20} className="text-gray-500" />
            <span className="font-medium text-gray-800">{displayName}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
