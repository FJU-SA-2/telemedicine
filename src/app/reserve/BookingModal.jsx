"use client";
import { useState } from "react";
import { Calendar, CheckCircle, Clock, X, ArrowRight, ArrowLeft, CreditCard, FileText, MessageSquare } from "lucide-react";

// 預約彈窗 - 多步驟流程 (調整順序: 時間 -> 症狀 -> 確認 -> 支付)
export default function BookingModal({ doctor, schedules, onClose, onConfirm }) {
  const [step, setStep] = useState(1); // 1=選時間, 2=症狀, 3=確認, 4=支付
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType] = useState("一般看診");
  const [symptoms, setSymptoms] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [processing, setProcessing] = useState(false);

   // ✅ 新增:過濾過期時段的函數
  const isTimeSlotExpired = (dateStr, timeStr) => {
    const now = new Date();
    const slotDateTime = new Date(`${dateStr}T${timeStr}`);
    return slotDateTime < now;
  };

  // ✅ 修改:過濾掉過期的排程
  const availableSchedules = schedules.filter(
    s => s.doctor_id === doctor.doctor_id && 
         s.is_available === 1 &&
         !isTimeSlotExpired(s.schedule_date, s.time_slot)
  );

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

  const timeSlots = selectedDate
    ? availableSchedules
        .filter(s => s.schedule_date === selectedDate)
        .sort((a,b)=>a.time_slot.localeCompare(b.time_slot))
    : [];

  const doctorFullName = `${doctor.first_name}${doctor.last_name}`;

  const handleNextStep = () => {
    // ✅ 新增:在進入下一步前再次檢查時段是否過期
    if (step === 1) {
      if (selectedDate && selectedTime) {
        if (isTimeSlotExpired(selectedDate, selectedTime)) {
          alert('此時段已過期,請重新選擇');
          setSelectedTime("");
          return;
        }
        setStep(2);
      }
    } else if (step === 2 && symptoms.trim()) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4 && paymentMethod) {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        handleConfirm();
      }, 2000);
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
      symptoms,
      paymentMethod 
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 頂部進度條 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {doctor.last_name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-800">{doctorFullName} 醫師</h3>
              <p className="text-sm text-blue-600 font-medium">{doctor.specialty}</p>
            </div>
          </div>

          {/* 步驟指示器 */}
          <div className="flex items-center justify-between">
            {[
              { num: 1, name: "選擇時間", icon: Calendar },
              { num: 2, name: "症狀描述", icon: FileText },
              { num: 3, name: "確認預約", icon: CheckCircle },
              { num: 4, name: "支付費用", icon: CreditCard }
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

              <button
                onClick={handleNextStep}
                disabled={!selectedDate || !selectedTime}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                  selectedDate && selectedTime 
                    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                下一步:填寫症狀
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* 步驟 2: 症狀描述 */}
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm resize-none text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 提示:請包含症狀開始時間、嚴重程度、已採取的處理方式等
                </p>
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

          {/* 步驟 3: 確認預約 */}
          {step === 3 && (
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
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {doctor.first_name.charAt(0)}
                  </div>
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
                  <strong>⚠️ 提醒:</strong>確認後將進入支付頁面,完成支付後預約即生效
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  修改資料
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  前往支付
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* 步驟 4: 支付 */}
          {step === 4 && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h5 className="font-semibold text-gray-800 mb-2">預約資訊</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• 醫師:{doctorFullName} ({doctor.specialty})</p>
                  <p>• 時間:{formatDate(selectedDate)} {getDayName(selectedDate)} {selectedTime}</p>
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

              {paymentMethod === "credit" && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">信用卡號碼</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">掛號費</span>
                  <span className="font-semibold text-gray-800">NT$ {doctor.consultation_fee}</span>
                </div>
                <div className="border-t border-gray-300 my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">總計</span>
                  <span className="text-2xl font-bold text-blue-600">NT$ {doctor.consultation_fee}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
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
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg" 
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
                      <CheckCircle size={20} />
                      確認支付並預約
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}