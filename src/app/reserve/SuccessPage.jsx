"use client";
import { CheckCircle, Calendar, Clock, CreditCard, FileText } from "lucide-react";

// 預約成功頁面
export default function SuccessPage({ bookingInfo, onClose }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    const dayNames = ["週日","週一","週二","週三","週四","週五","週六"];
    return dayNames[date.getDay()];
  };

  return (
    <div className="p-5 fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm">
  <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* 成功動畫區 */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 p-10 text-center">
          <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce shadow-lg">
            <CheckCircle size={60} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">預約成功！</h2>
        </div>

        {/* 預約資訊 */}
        <div className="p-8">
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              預約詳情
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {bookingInfo.doctor.last_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">
                    {bookingInfo.doctor.last_name}{bookingInfo.doctor.first_name} 醫師
                  </p>
                  <p className="text-blue-600 font-semibold">{bookingInfo.doctor.specialty}</p>
                  <p className="text-sm text-gray-500">{bookingInfo.doctor.practice_hospital}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={16} className="text-gray-500" />
                    <p className="text-sm text-gray-600">就診日期</p>
                  </div>
                  <p className="font-bold text-gray-800">
                    {formatDate(bookingInfo.date)}
                  </p>
                  <p className="text-sm text-gray-600">{getDayName(bookingInfo.date)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-gray-500" />
                    <p className="text-sm text-gray-600">就診時間</p>
                  </div>
                  <p className="font-bold text-gray-800 text-xl">{bookingInfo.time}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={16} className="text-green-600" />
                  <p className="text-sm text-green-700 font-semibold">支付狀態</p>
                </div>
                <p className="font-bold text-green-600">已支付 NT$ 500</p>
              </div>
            </div>
          </div>

          {/* 提醒事項 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle size={18} />
              重要提醒
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>請在預約時間前 <strong>10 分鐘</strong>登入系統準備視訊就診</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>請確保網路連線穩定，並準備好相關病歷資料</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>如需取消預約，請至少提前 <strong>2 小時</strong>通知</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>預約確認信已發送至您的電子信箱</span>
              </li>
            </ul>
          </div>

          {/* 按鈕區 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            >
              返回首頁
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all"
            >
              查看我的預約
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}