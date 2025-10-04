"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("取得使用者資料失敗:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        alert("登出成功");
        router.push("/login");
      } else {
        alert("登出失敗，請再試一次");
      }
    } catch (error) {
      console.error("登出錯誤:", error);
      alert("登出失敗，請再試一次");
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center text-gray-500">載入中...</div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">個人檔案</h1>

      <div className="bg-white shadow rounded-xl p-6 space-y-4 border border-gray-100">
        <div>
          <p className="text-sm text-gray-500">姓名</p>
          <p className="text-lg font-medium text-gray-800">
            {user.lastName} {user.firstName}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">電子郵件</p>
          <p className="text-lg font-medium text-gray-800">{user.email}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">角色</p>
          <p className="text-lg font-medium text-gray-800">
            {user.role === "patient" ? "病患" : user.role === "doctor" ? "醫生" : user.role}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">使用者名稱</p>
          <p className="text-lg font-medium text-gray-800">{user.username}</p>
        </div>
      </div>

      <div className="mt-8">
        <Link 
          href="/" 
          className="inline-block px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors mr-4"
        >
          返回首頁
        </Link>
        
        <button 
          onClick={handleLogout} 
          className="inline-block px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
        >
          登出
        </button>
      </div>
    </main>
  );
}