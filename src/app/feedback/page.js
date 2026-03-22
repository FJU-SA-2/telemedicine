"use client";
import { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu, AlertCircle, Send } from 'lucide-react';
import LockedPageOverlay from "../components/LockedPageOverlay";
import FloatingChat from "../components/FloatingChat";

function FeedbackFormContent() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { id: '登入註冊', label: '登入註冊' },
    { id: '預約功能', label: '預約功能' },
    { id: '收藏功能', label: '收藏功能' },
    { id: '視訊品質', label: '視訊品質' },
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
    const user_type = localStorage.getItem('user_type');

    if (!user_id) {
      setError('請先登入後再提交回報');
      setLoading(false);
      return;
    }

    if (!user_type) {
      setError('無法確認用戶類型，請重新登入');
      setLoading(false);
      return;
    }

    const userIdNumber = parseInt(user_id, 10);
    
    console.log('user_id from localStorage:', user_id);
    console.log('user_type from localStorage:', user_type);
    console.log('user_id as number:', userIdNumber);
    console.log('發送請求到:', '/api/feedback');
    console.log('提交數據:', {
      user_id: userIdNumber,
      user_type: user_type,
      categories: selectedCategories,
      feedback_text: feedback,
    });

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userIdNumber,
        user_type: user_type,
        categories: selectedCategories,
        feedback_text: feedback,
      }),
    });

    const data = await response.json();
    console.log('API 回應:', data);
    
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
    setError('提交失敗,請稍後重試');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-3 sm:p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl mx-auto p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">問題回報</h1>
        </div>
        
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          請告訴我們您遇到的問題，我們會盡快處理並改善服務品質。
        </p>

        <div>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
              請選擇問題類別
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded flex-shrink-0"
                  />
                  <span className="ml-3 text-gray-700 font-medium text-sm sm:text-base">
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <label htmlFor="feedback" className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
              問題描述
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="請詳細描述您遇到的問題..."
              rows="6"
              className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none resize-none transition-colors text-sm sm:text-base"
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
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold text-sm sm:text-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            {loading ? '提交中...' : '送出回報'}
          </button>
        </div>

        {submitted && (
          <div className="mt-5 sm:mt-6 p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <p className="text-green-800 font-medium text-center text-sm sm:text-base">
              ✓ 感謝您的回報！我們已收到您的意見。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("feedback");
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('檢查登入狀態失敗:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"}`}>
        <Navbar />
        
        <div className="relative min-h-screen">
          <FeedbackFormContent />
          {!user && <LockedPageOverlay pageName="問題回報" icon={AlertCircle} />}
        </div>
      </div>

      {/* Footer */}
      <div className={`transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"} bg-gray-800 text-white py-8`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 MedOnGo. 讓醫療服務更便捷、更貼心。
          </p>
        </div>
      </div>
      <FloatingChat />
    </div>
  );
}