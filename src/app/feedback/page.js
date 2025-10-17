"use client";
import { useState} from 'react';
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu, AlertCircle, Send } from 'lucide-react';

function FeedbackFormContent() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const categories = [
    { id: '登入註冊', label: '登入註冊' },
    { id: '預約', label: '預約' },
    { id: '收藏', label: '收藏' },
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
    const user_id = localStorage.getItem('user_id'); // 👈 取得登入使用者ID

    console.log('發送請求到:', '/api/feedback');
    console.log('提交數據:', {
        user_id,
        categories: selectedCategories,
        feedback_text: feedback,
    });

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user_id,
        categories: selectedCategories,
        feedback_text: feedback,
      }),
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
    setError('提交失敗,請稍後重試');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl mx-auto p-8">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">問題回報</h1>
        </div>
        
        <p className="text-gray-600 mb-8">
          請告訴我們您遇到的問題，我們會盡快處理並改善服務品質。
        </p>

        <div>
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              請選擇問題類別
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
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
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                />
                  <span className="ml-3 text-gray-700 font-medium">
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="feedback" className="block text-lg font-semibold text-gray-700 mb-3">
              問題描述
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="請詳細描述您遇到的問題..."
              rows="6"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none resize-none transition-colors"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-2">
              {feedback.length} 字
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? '提交中...' : '送出回報'}
          </button>
        </div>

        {submitted && (
          <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <p className="text-green-800 font-medium text-center">
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

  return (
    <div className="relative">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray z-50"
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

      <div
        className={`transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar />
        <FeedbackFormContent />
      </div>
    </div>
  );
}