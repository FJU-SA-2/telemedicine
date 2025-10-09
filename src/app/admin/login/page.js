'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert('請輸入帳號與密碼');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || '登入失敗');
        return;
      }

      alert('登入成功!');
      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      alert('登入失敗,請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4 shadow-lg">
            <Shield className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">管理者登入</h1>
          <p className="text-purple-200">醫隨行 MOG 後台管理系統</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                管理者帳號
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-purple-300" size={20} />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white placeholder-purple-200"
                  placeholder="請輸入管理者信箱"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                密碼
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-purple-300" size={20} />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white placeholder-purple-200"
                  placeholder="請輸入密碼"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all transform hover:scale-105 ${
                isLoading
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg'
              }`}
            >
              {isLoading ? '登入中...' : '登入管理系統'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-purple-200 hover:text-white text-sm transition-colors"
            >
              ← 返回首頁
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-purple-200">
          <p>© 醫隨行 MOG · 管理者專用系統</p>
        </div>
      </div>
    </div>
  );
}