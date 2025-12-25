// src/app/components/RatingModal.jsx
"use client";
import { useState } from 'react';
import { Star, X, Send, CheckCircle } from 'lucide-react';

export default function RatingModal({ isOpen, onClose, appointment, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('請選擇評分');
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ 從 localStorage 取得 user_id（與問題回報相同方式）
      const user_id = localStorage.getItem('user_id');
      
      if (!user_id) {
        alert('請先登入後再提交評分');
        setIsSubmitting(false);
        return;
      }

      const userIdNumber = parseInt(user_id, 10);
      console.log('提交評分 - user_id:', userIdNumber);
      console.log('提交評分 - appointment_id:', appointment.appointment_id);

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userIdNumber,  // ✅ 加入 user_id
          appointment_id: appointment.appointment_id,
          rating,
          comment: comment.trim() || null
        })
      });

      const data = await response.json();
      console.log('API 回應:', data);

      if (data.success) {
        // ✅ 顯示成功提示
        setShowSuccess(true);
        
        // ✅ 2 秒後關閉彈窗
        setTimeout(() => {
          onSubmit && onSubmit({ rating, comment });
          onClose();
          // 重置表單
          setRating(0);
          setComment('');
          setShowSuccess(false);
        }, 2000);
      } else {
        alert(data.message || '提交失敗,請稍後再試');
      }
    } catch (error) {
      console.error('提交評分失敗:', error);
      alert('提交失敗,請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ 成功提示畫面 - 移除內部背景遮罩
  if (showSuccess) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">評分提交成功!</h3>
          <p className="text-gray-600">感謝您的寶貴意見</p>
          <div className="mt-4 flex items-center justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ✅ 主要評分畫面 - 移除內部背景遮罩,只保留卡片本身
  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <h3 className="text-xl font-bold">評價看診體驗</h3>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Doctor Info */}
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">您剛完成與以下醫師的看診</p>
          <p className="text-lg font-semibold text-gray-900">
            {appointment?.doctor_first_name} {appointment?.doctor_last_name} 醫師
          </p>
          <p className="text-sm text-gray-500">{appointment?.doctor_specialty}</p>
        </div>

        {/* Star Rating */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 text-center">
            請為本次看診評分 <span className="text-red-500">*</span>
          </label>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
                disabled={isSubmitting}
              >
                <Star
                  className={`w-12 h-12 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">
            {rating === 0 && '請選擇星級'}
            {rating === 1 && '非常不滿意'}
            {rating === 2 && '不滿意'}
            {rating === 3 && '普通'}
            {rating === 4 && '滿意'}
            {rating === 5 && '非常滿意'}
          </p>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            分享您的看診體驗 (選填)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="您可以在此分享看診感受、醫師專業度、溝通品質等..."
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
            className="text-gray-700 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          />
          <p className="text-xs text-gray-500 text-right">
            {comment.length}/500 字
          </p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            稍後再說
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>提交中...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>送出評價</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}