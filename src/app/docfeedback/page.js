"use client";
import { useState, useEffect } from 'react';
import DoctorSidebar from "../components/DoctorSidebar";
import Navbar from "../components/Navbar";
import { Menu, AlertCircle, Send } from 'lucide-react';

function DoctorFeedbackFormContent() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { id: '登入註冊', label: '登入註冊' },
    { id: '排班管理', label: '排班管理' },
    { id: '預約管理', label: '預約管理' },
    { id: '視訊品質', label: '視訊品質' },
    { id: '患者資料', label: '患者資料' },
    { id: '其他', label: '其他' }
  ];

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const user_id = localStorage.getItem('user_id');

      if (!user_id || user_id === 'null' || user_id === 'undefined') {
        setError('請先登入後再提交回報');
        setLoading(false);
        return;
      }

      const userIdNumber = parseInt(user_id, 10);

      if (isNaN(userIdNumber)) {
        setError(`user_id 格式錯誤: ${user_id}`);
        setLoading(false);
        return;
      }

      if (selectedCategories.length === 0) {
        setError('請至少選擇一個問題類別');
        setLoading(false);
        return;
      }

      if (!feedback || feedback.trim() === '') {
        setError('請填寫問題描述');
        setLoading(false);
        return;
      }

      const requestBody = {
        user_id: userIdNumber,
        user_type: 'doctor',
        categories: selectedCategories,
        feedback_text: feedback,
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || '提交失敗');
        return;
      }

      setSubmitted(true);
      setSelectedCategories([]);
      setFeedback('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('提交錯誤:', err);
      setError(`提交失敗: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl mx-auto p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">醫師問題回報</h1>
        </div>

        <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8">
          請告訴我們您在使用系統時遇到的問題，我們會盡快處理並改善服務品質。
        </p>

        <div>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
              請選擇問題類別 <span className="text-red-500">*</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCategories.includes(category.id)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="category"
                    value={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded shrink-0"
                  />
                  <span className="ml-2 sm:ml-3 text-sm sm:text-base text-gray-700 font-medium">
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <label htmlFor="feedback" className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
              問題描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="請詳細描述您遇到的問題，例如：在哪個功能、執行什麼操作時發生、錯誤訊息內容等..."
              rows="5"
              className="text-gray-700 w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none resize-none transition-colors text-sm sm:text-base"
              disabled={loading}
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
              {feedback.length} 字
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold text-base sm:text-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? '提交中...' : '送出回報'}
          </button>
        </div>

        {submitted && (
          <div className="mt-5 sm:mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <p className="text-green-800 font-medium text-center text-sm sm:text-base">
              ✓ 感謝您的回報！我們已收到您的意見，會盡快處理。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorFeedbackPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // 偵測螢幕寬度，桌機才用推擠式 sidebar
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // 手機/平板開啟 sidebar 時鎖定 body 捲動
  useEffect(() => {
    if (isOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isDesktop]);

  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", { credentials: 'include' });
        const data = await res.json();
        if (data.authenticated && data.user && data.user.role === 'doctor') {
          setApprovalStatus(data.user.approval_status);
        }
      } catch (error) {
        console.error("Failed to fetch approval status:", error);
      }
    }
    fetchApprovalStatus();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50">
      {/* 漢堡選單按鈕 */}
      {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition "
                    aria-label="開啟選單"
                >
                    <Menu size={24} />
                </button>
            )}

      {/* Sidebar 遮罩：手機/平板且 sidebar 開啟時顯示 */}
      {isOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-label="關閉選單"
        />
      )}

      <DoctorSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        approvalStatus={approvalStatus}
      />

      {/* 主內容區：桌機推擠，手機/平板 overlay 不推擠 */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isOpen && isDesktop ? "lg:ml-64" : "ml-0"
        }`}
      >
        <Navbar />
        <DoctorFeedbackFormContent />

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}