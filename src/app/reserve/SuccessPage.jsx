"use client";
import { CheckCircle, Calendar, Clock, CreditCard, FileText, MessageSquare, X } from "lucide-react";
import Link from "next/link";

export default function SuccessPage({ bookingInfo, onClose }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
    return dayNames[date.getDay()];
  };

  const getAppointmentTypeName = (type) => {
    switch (type) {
      case 'consultation':
        return '健康諮詢';
      case 'treatment':
        return '醫療診療';
      default:
        return '醫療診療';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* 頂部關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-200 transition bg-black/20 rounded-full p-2"
        >
          <X size={24} />
        </button>

        {/* 成功動畫區 - 固定在頂部 */}
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-8 text-center flex-shrink-0">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce shadow-lg">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">預約成功!</h2>
          <p className="text-white text-sm">您的預約已確認</p>
        </div>

        {/* 可滾動的內容區域 */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-green-900 mb-1">預約狀態:已確認</h3>
                <p className="text-sm text-green-800">
                  您的預約已成功確認並完成支付!請在預約時間前 <strong>10 分鐘</strong>登入系統準備視訊就診。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              預約詳情
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
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
                    <p className="text-sm text-gray-600">預約時間</p>
                  </div>
                  <p className="font-bold text-gray-800 text-xl">{bookingInfo.time}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={16} className="text-blue-600" />
                  <p className="text-sm text-blue-700 font-semibold">預約類型</p>
                </div>
                <p className="font-bold text-blue-600">
                  {getAppointmentTypeName(bookingInfo.appointmentType)}
                  <span className="text-sm font-normal text-blue-500 ml-2">
                    ({bookingInfo.appointmentType === 'consultation' ? '健康諮詢服務' : '醫療診療服務'})
                  </span>
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={16} className="text-green-600" />
                  <p className="text-sm text-green-700 font-semibold">支付狀態</p>
                </div>
                <p className="font-bold text-green-600">已支付 NT$ 500</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-gray-500" />
                  <p className="text-sm text-gray-600 font-semibold">
                    {bookingInfo.appointmentType === 'consultation' ? '諮詢內容' : '症狀描述'}
                  </p>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{bookingInfo.symptoms}</p>
              </div>
            </div>
          </div>

          {/* 提醒事項 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle size={18} />
              重要提醒
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>您的預約已確認,無需等待醫師審核</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>請在預約時間前 <strong>10 分鐘</strong>登入系統準備視訊就診</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>您可以在「我的預約」頁面查看預約詳情</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>如需取消預約,請至少提前 <strong>2 小時</strong>通知</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>確保您的網路連線穩定,以獲得最佳視訊體驗</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部按鈕 - 固定在底部 */}
        <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            >
              返回首頁
            </button>
            <Link
              href="/record"
              className="flex-1 flex items-center justify-center py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all"
            >
              查看我的預約
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}