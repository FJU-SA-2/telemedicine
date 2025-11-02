"use client";
import { useState } from 'react';
import { Star, X, Send } from 'lucide-react';

export default function RatingModal({ isOpen, onClose, appointment, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !appointment) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('請選擇評分星數');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('📝 準備送出評分:', {
        appointment_id: appointment.appointment_id,
        doctor_id: appointment.doctor_id,
        rating,
        comment
      });

      // 檢查 cookies
      console.log('🪪 當前 Cookies:', document.cookie);
      
      const response = await fetch('/api/ratings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointment_id: appointment.appointment_id,
          doctor_id: appointment.doctor_id,
          rating: rating,
          comment: comment.trim()
        })
      });
      
      const data = await response.json();
      console.log('伺服器回應:', data);

      if (response.ok) {
        console.log('✅ 評分提交成功');
        onSubmit?.({ rating, comment });
        onClose();
        // 重置表單
        setRating(0);
        setComment('');
      } else {
        console.error('❌ 提交失敗:', data.message);
        setError(data.message || '提交失敗,請稍後再試');
      }
    } catch (err) {
      console.error('❌ 評分提交錯誤:', err);
      setError('網路錯誤,請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 標題 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">評價看診體驗</h2>
        <p className="text-gray-600 text-sm mb-6">
          感謝您的回饋,這將幫助我們提供更好的服務
        </p>

        {/* 醫生資訊 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">看診醫生</p>
          <p className="font-semibold text-gray-900">
            {appointment.doctor_first_name} {appointment.doctor_last_name} 醫師
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {appointment.doctor_specialty} • {appointment.practice_hospital}
          </p>
        </div>

        {/* 評分星星 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            整體滿意度 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-all transform hover:scale-110"
              >
                <Star
                  className={`w-12 h-12 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <div className="text-center mt-2">
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && '😞 非常不滿意'}
                {rating === 2 && '😕 不滿意'}
                {rating === 3 && '😐 普通'}
                {rating === 4 && '😊 滿意'}
                {rating === 5 && '😄 非常滿意'}
              </p>
            )}
          </div>
        </div>

        {/* 評論 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            詳細評價 (選填)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="分享您的看診體驗,幫助醫生改進服務..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {comment.length}/500
          </p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* 按鈕 */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isSubmitting}
          >
            稍後再說
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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