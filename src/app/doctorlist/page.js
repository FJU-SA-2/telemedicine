"use client";
import { useState, useEffect } from "react";
import { Menu, Filter, CheckCircle, ArrowLeft, Calendar, Clock, CreditCard, FileText, ArrowRight, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

// 🟢 BookingModal 組件 (多步驟流程)
function BookingModal({ doctor, schedules, onClose, onConfirm }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [processing, setProcessing] = useState(false);


  // 獲取可用日期
  const uniqueDates = [...new Set(availableSchedules.map(s => s.schedule_date))].sort();

  const weekDates = uniqueDates.map(dateStr => {
    const date = new Date(dateStr + "T00:00:00");
    const dayNames = ["週日","週一","週二","週三","週四","週五","週六"];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return {
      dayName: dayNames[date.getDay()],
      month: month,
      day: day,
      fullDate: dateStr,
      displayDate: `${month}/${day}`
    };
  });

  // 獲取選定日期的時間段
  const timeSlots = selectedDate
    ? availableSchedules
        .filter(s => s.schedule_date === selectedDate)
        .sort((a,b)=>a.time_slot.localeCompare(b.time_slot))
    : [];

  const doctorFullName = `${doctor.last_name}${doctor.first_name}`;

  const handleNextStep = () => {
    if (step === 1 && selectedDate && selectedTime && appointmentType) {
      setStep(2);
    } else if (step === 2 && paymentMethod) {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        setStep(3);
      }, 2000);
    } else if (step === 3 && symptoms.trim()) {
      setStep(4);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    const dayNames = ["週日","週一","週二","週三","週四","週五","週六"];
    return dayNames[date.getDay()];
  };

  const getAppointmentTypeName = (type) => {
    return type === "consultation" ? "諮詢" : "看診";
  };

  const handleConfirm = () => {
    onConfirm({ 
      doctor, 
      date: selectedDate, 
      time: selectedTime,
      appointmentType,
      symptoms,
      paymentMethod 
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 頂部進度條 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>

          <div className="flex items-center gap-4 mb-6">
            {doctor.photo_url ? (
              <img
                src={`http://localhost:5000${doctor.photo_url}`}
                alt={doctorFullName}
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {doctor.last_name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-bold text-xl text-gray-800">{doctorFullName} 醫師</h3>
              <p className="text-sm text-blue-600 font-medium">{doctor.specialty}</p>
            </div>
          </div>

          {/* 步驟指示器 */}
          <div className="flex items-center justify-between">
            {[
              { num: 1, name: "選擇時間、類型", icon: Calendar },
              { num: 2, name: "支付費用", icon: CreditCard },
              { num: 3, name: "症狀描述", icon: FileText },
              { num: 4, name: "確認預約", icon: CheckCircle }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s.num ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {step > s.num ? <CheckCircle size={20} /> : <s.icon size={20} />}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${step >= s.num ? "text-blue-600" : "text-gray-400"}`}>
                    {s.name}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${step > s.num ? "bg-blue-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* 步驟 1: 選擇時間 */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={22} className="text-blue-600" />
                  選擇預約日期
                </h4>
                {weekDates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>目前沒有可預約的日期</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
                    {weekDates.map(item => (
                      <button
                        key={item.fullDate}
                        onClick={() => { setSelectedDate(item.fullDate); setSelectedTime(""); }}
                        className={`py-3 px-2 rounded-xl text-center transition-all ${
                          selectedDate === item.fullDate 
                            ? "bg-blue-500 text-white shadow-lg scale-105" 
                            : "bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <div className="text-xs mb-1 font-medium">{item.dayName}</div>
                        <div className="text-lg font-bold">{item.day}</div>
                        <div className="text-xs mt-1 opacity-75">{item.month}月</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedDate && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock size={22} className="text-blue-600" />
                    選擇時段
                  </h4>
                  {timeSlots.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p>該日期沒有可預約時段</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {timeSlots.map(slot => (
                        <button
                          key={slot.schedule_id}
                          onClick={() => setSelectedTime(slot.time_slot)}
                          className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
                            selectedTime === slot.time_slot 
                              ? "bg-blue-500 text-white shadow-lg scale-105" 
                              : "bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          {slot.time_slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedTime && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="text-blue-600" width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    選擇預約類型
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setAppointmentType('consultation')}
                      className={`py-4 px-4 rounded-xl text-center transition-all ${
                        appointmentType === 'consultation'
                          ? "bg-blue-500 text-white shadow-lg scale-105"
                          : "bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <div className="text-lg font-bold mb-1">諮詢</div>
                      <div className="text-xs opacity-75">健康諮詢服務</div>
                    </button>
                    <button
                      onClick={() => setAppointmentType('treatment')}
                      className={`py-4 px-4 rounded-xl text-center transition-all ${
                        appointmentType === 'treatment'
                          ? "bg-blue-500 text-white shadow-lg scale-105"
                          : "bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <div className="text-lg font-bold mb-1">看診</div>
                      <div className="text-xs opacity-75">醫療診療服務</div>
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleNextStep}
                disabled={!selectedDate || !selectedTime || !appointmentType}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                  selectedDate && selectedTime && appointmentType
                    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                下一步:支付費用
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* 步驟 2: 支付 */}
          {step === 2 && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">已選擇</p>
                    <p className="font-bold text-gray-800">{formatDate(selectedDate)} {getDayName(selectedDate)} {selectedTime}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-blue-600 text-sm hover:underline">
                    修改
                  </button>
                </div>
              </div>

              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard size={22} className="text-blue-600" />
                選擇支付方式
              </h4>

              <div className="space-y-3 mb-6">
                {[
                  { id: "credit", name: "信用卡", desc: "Visa / Mastercard / JCB" },
                  { id: "line", name: "LINE Pay", desc: "使用 LINE 支付" },
                  { id: "apple", name: "Apple Pay", desc: "快速安全支付" },
                  { id: "google", name: "Google Pay", desc: "簡單便捷支付" }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === method.id ? "border-blue-500" : "border-gray-300"
                      }`}>
                        {paymentMethod === method.id && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">掛號費</span>
                  <span className="font-semibold text-gray-800">NT$ 150</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">診療費</span>
                  <span className="font-semibold text-gray-800">NT$ 350</span>
                </div>
                <div className="border-t border-gray-300 my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">總計</span>
                  <span className="text-2xl font-bold text-blue-600">NT$ 500</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  上一步
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!paymentMethod || processing}
                  className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                    paymentMethod && !processing
                      ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      處理中...
                    </>
                  ) : (
                    <>
                      確認支付
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 步驟 3: 症狀描述 */}
          {step === 3 && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">支付成功!</p>
                  <p className="text-sm text-green-600">已收到您的支付 NT$ 500</p>
                </div>
              </div>

              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={22} className="text-blue-600" />
                填寫症狀描述
              </h4>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  主要症狀 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="請詳細描述您的症狀,例如:&#10;• 發燒 38.5°C,已持續 2 天&#10;• 喉嚨痛、咳嗽有痰&#10;• 頭痛、全身無力"
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 提示:請包含症狀開始時間、嚴重程度、已採取的處理方式等
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h5 className="font-semibold text-gray-800 mb-2">就診資訊</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• 醫師:{doctorFullName} ({doctor.specialty})</p>
                  <p>• 時間:{formatDate(selectedDate)} {getDayName(selectedDate)} {selectedTime}</p>
                  <p>• 預約類型:{getAppointmentTypeName(appointmentType)}</p>
                  <p>• 費用:NT$ 500 (已支付)</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  上一步
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!symptoms.trim()}
                  className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                    symptoms.trim()
                      ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  下一步:確認預約
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* 步驟 4: 確認預約 */}
          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={40} className="text-blue-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-800 mb-2">確認預約資訊</h4>
                <p className="text-gray-600">請仔細核對以下資訊</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-blue-200">
                  {doctor.photo_url ? (
                    <img
                      src={`http://localhost:5000${doctor.photo_url}`}
                      alt={doctorFullName}
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {doctor.last_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h5 className="font-bold text-xl text-gray-800 mb-1">{doctorFullName} 醫師</h5>
                    <p className="text-blue-600 font-semibold mb-1">{doctor.specialty}</p>
                    <p className="text-sm text-gray-600">{doctor.practice_hospital}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">就診日期</p>
                      <p className="font-bold text-gray-800">{formatDate(selectedDate)} {getDayName(selectedDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">預約時間</p>
                      <p className="font-bold text-gray-800">{selectedTime}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCard size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">支付狀態</p>
                      <p className="font-bold text-green-600">已支付 NT$ 500</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">症狀描述</p>
                      <div className="bg-white rounded-lg p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                        {symptoms}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ 提醒:</strong>請在預約時間前 10 分鐘登入系統準備視訊就診
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  修改資料
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  確認預約
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🟢 醫師詳細資料頁面
function DoctorDetailsPage({ doctor, schedules, onBack, onBooking }) {
  const [showModal, setShowModal] = useState(false);

  const doctorFullName = `${doctor.first_name}${doctor.last_name}`;

  // 獲取該醫生的可用排班數量
  const availableSlots = schedules.filter(
    s => s.doctor_id === doctor.doctor_id && s.is_available === 1
  ).length;

  const handleConfirm = (bookingData) => {
    setShowModal(false);
    onBooking(bookingData);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
        {/* 醫師基本信息 */}
        <div className="flex gap-6 mb-8">
          <div className="relative">
            {/* 返回按鈕 */}
            <button
              onClick={onBack}
              className="absolute -top-6 -left-7 p-1 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center z-10"
            >
              <ArrowLeft size={24} />
            </button>
            {doctor.photo_url ? (
              <img
                src={`http://localhost:5000${doctor.photo_url}`}
                alt={doctorFullName}
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {doctor.last_name?.charAt(0) || "醫"}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-black font-bold mb-2">{doctorFullName}</h1>
            <p className="text-blue-600 text-lg mb-1">{doctor.specialty}</p>
            <p className="text-gray-600">{doctor.practice_hospital}</p>
          </div>
        </div>

        {/* 詳細資料 */}
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">簡介</h3>
            <p className="text-gray-600 leading-relaxed">
              {doctor.description || "暫無介紹"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">專業經歷</h3>
            <p className="text-gray-600 leading-relaxed">
              {doctor.experience || "暫無相關資訊"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">學位與認證</h3>
            <p className="text-gray-600 leading-relaxed">
              {doctor.qualifications || "暫無相關資訊"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">掛號費</p>
              <p className="text-2xl font-bold text-blue-600">
                ${doctor.consultation_fee || "暫無"}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">可預約時段</p>
              <p className="text-2xl font-bold text-green-600">
                {availableSlots} 個
              </p>
            </div>
          </div>
        </div>

        {/* 預約按鈕 */}
        <button
          onClick={() => setShowModal(true)}
          disabled={availableSlots === 0}
          className={`w-full py-3 rounded-lg font-medium transition mt-8 ${
            availableSlots > 0
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {availableSlots > 0 ? "立即預約" : "暫無可預約時段"}
        </button>
      </div>

      {showModal && (
        <BookingModal
          doctor={doctor}
          schedules={schedules}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

// 🟢 預約主頁面
function BookingPage({ onSelectDoctor, selectedDoctor, activeTab, schedules, setSchedules }) {
  const [doctors, setDoctors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");

  const userId = 1; // 模擬登入使用者 ID

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const response = await fetch("/api/doctors");
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("無法取得醫生資料:", error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }

    async function fetchFavorites() {
      try {
        const res = await fetch(`/api/favorites?user_id=${userId}`);

        if (!res.ok) {
          console.error(`取得最愛醫生失敗,狀態碼: ${res.status} ${res.statusText}`);
          setFavorites([]);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setFavorites(data.map((id) => Number(id)));
        } else if (typeof data === 'object' && data.favorites && Array.isArray(data.favorites)) {
          setFavorites(data.favorites.map((id) => Number(id)));
        } else {
          console.warn("最愛醫生資料格式不正確:", data);
          setFavorites([]);
        }
      } catch (err) {
        console.error("無法取得最愛醫生資料:", err.message);
        setFavorites([]);
      }
    }

    if (activeTab === "reserve" || activeTab === "doctorlist") {
      fetchDoctors();
      fetchFavorites();
    }
  }, [activeTab]);

  // 只顯示有可用排班的醫生
  const doctorsWithSchedules = new Set(
    schedules.filter(s => s.is_available === 1).map(s => s.doctor_id)
  );

  const availableDoctors = doctors.filter(d => doctorsWithSchedules.has(d.doctor_id));

  const specialties = availableDoctors.length > 0
    ? ["所有科別", ...new Set(availableDoctors.map((d) => d.specialty))]
    : ["所有科別"];

  const filteredDoctors = availableDoctors.filter((doctor) => {
    const specialtyMatch =
      !selectedSpecialty ||
      selectedSpecialty === "所有科別" ||
      doctor.specialty === selectedSpecialty;
    return specialtyMatch;
  });

  const handleViewMore = (doctor) => {
    onSelectDoctor(doctor);
  };

  const handleBooking = async (bookingData) => {
    try {
      // 先取得登入使用者資訊
      const meRes = await fetch("/api/me");
      if (!meRes.ok) {
        alert("請先登入!");
        return;
      }
      const meData = await meRes.json();
      const patientId = meData.user?.patient_id;

      if (!patientId) {
        alert("您不是病患,無法預約!");
        return;
      }

      // 發送預約請求到後端 API
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: bookingData.doctor.doctor_id,
          appointment_date: bookingData.date,
          appointment_time: bookingData.time,
          symptoms: bookingData.symptoms,
          payment_method: bookingData.paymentMethod,
          appointment_type: bookingData.appointmentType,
          amount: 500
        }),
        credentials: "include", 
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "預約失敗,請稍後再試");
        return;
      }

      // 預約成功,更新本地排程狀態
      setSchedules(prevSchedules => 
        prevSchedules.map(s => 
          s.doctor_id === bookingData.doctor.doctor_id && 
          s.schedule_date === bookingData.date && 
          s.time_slot === bookingData.time
            ? { ...s, is_available: 0 }
            : s
        )
      );

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      onSelectDoctor(null); // 返回列表

    } catch (error) {
      console.error("預約錯誤:", error);
      alert("預約失敗,請檢查網路連線後再試");
    }
  };

  const toggleFavorite = async (doctorId) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, doctor_id: doctorId }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        console.error("⚠️ API 沒有回傳JSON,操作中止。");
        return;
      }

      if (!data || typeof data.isFavorite === "undefined") {
        console.error("⚠️ API 回傳格式不正確:", data);
        return;
      }

      setFavorites((prev) =>
        data.isFavorite
          ? [...prev, doctorId]
          : prev.filter((id) => id !== doctorId)
      );

      setFavoriteMessage(data.isFavorite ? "已加入收藏" : "已取消收藏");
      setShowFavoriteToast(true);
      setTimeout(() => setShowFavoriteToast(false), 3000);
    } catch (err) {
      console.error("收藏操作失敗", err);
    }
  };

  const getDoctorAvailableSlots = (doctorId) => {
    return schedules.filter(s => s.doctor_id === doctorId && s.is_available === 1).length;
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  if (selectedDoctor) {
    return (
      <DoctorDetailsPage
        doctor={selectedDoctor}
        schedules={schedules}
        onBack={() => onSelectDoctor(null)}
        onBooking={handleBooking}
      />
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showSuccess && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>預約成功!</span>
        </div>
      )}

      {showFavoriteToast && (
        <div className="fixed top-20 right-6 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>{favoriteMessage}</span>
        </div>
      )}

      {/* 篩選區塊 */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold">篩選條件</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇科別
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
            >
              <option value="">所有科別</option>
              {specialties
                .filter((s) => s !== "所有科別")
                .map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* 醫師列表 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          搜尋結果 ({filteredDoctors.length} 位醫師)
        </h2>
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-600 mb-2">目前沒有可預約的醫師</p>
          <p className="text-sm text-gray-500">請稍後再試或選擇其他科別</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => {
            const fullName = `${doctor.first_name}${doctor.last_name}`;
            const availableSlots = getDoctorAvailableSlots(doctor.doctor_id);
            
            return (
              <div
                key={doctor.doctor_id}
                className="bg-white rounded-lg shadow p-6 relative hover:shadow-xl transition-shadow"
              >
                {/* 收藏按鈕 */}
                <div
                  onClick={() => toggleFavorite(doctor.doctor_id)}
                  className="absolute top-3 right-3 text-yellow-400 text-xl cursor-pointer select-none"
                >
                  {favorites.includes(doctor.doctor_id) ? "★" : "☆"}
                </div>

                <div className="flex items-start gap-4 mb-4">
                  {doctor.photo_url ? (
                    <img
                      src={`http://localhost:5000${doctor.photo_url}`}
                      alt={fullName}
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {doctor.last_name?.charAt(0) || "醫"}
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{fullName}</h3>
                    <p className="text-blue-600 text-sm">{doctor.specialty}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {doctor.practice_hospital}
                    </p>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-blue-600" />
                    <span className="font-medium text-gray-700">
                      可預約時段: <span className="text-blue-600 font-bold">{availableSlots}</span> 個
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleViewMore(doctor)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  查看更多
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 🟢 其他分頁
function HomePage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">首頁</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">歡迎使用遠端醫療系統</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">設定</h2>
      <p className="text-gray-600">功能開發中...</p>
    </div>
  );
}

// 🟢 主應用入口
export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("reserve");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // 載入排班資料
  useEffect(() => {
    async function fetchSchedules() {
      try {
        const response = await fetch("/api/schedules");
        const data = await response.json();
        
        // 格式化排班資料
        const formattedSchedules = data.map(s => ({
          ...s,
          doctor_id: Number(s.doctor_id),
          schedule_date: s.schedule_date.split("T")[0], // 只保留日期部分
          time_slot: s.time_slot.substring(0, 5), // 只保留 HH:MM
          is_available: Number(s.is_available)
        }));
        
        setSchedules(formattedSchedules);
      } catch (error) {
        console.error("無法取得排班資料:", error);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedules();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 打開按鈕 */}
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
        className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}
      >
        <Navbar />
        {activeTab === "home" && <HomePage />}
        {activeTab === "reserve" && (
          <BookingPage
            onSelectDoctor={setSelectedDoctor}
            selectedDoctor={selectedDoctor}
            activeTab={activeTab}
            schedules={schedules}
            setSchedules={setSchedules}
          />
        )}
        {activeTab === "settings" && <SettingsPage />}
      </div>
    </div>
  );
}

