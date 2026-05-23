"use client";
import { useState } from "react";
import { Calendar, CheckCircle, Clock, X, ArrowRight, ArrowLeft, FileText, Monitor, MapPin } from "lucide-react";

// 預約彈窗 - 多步驟流程
// isUnverified: 初診患者，強制鎖定實體看診
export default function BookingModal({ doctor, schedules, onClose, onConfirm, defaultScheduleType, isUnverified }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType] = useState("一般看診");
  const [symptoms, setSymptoms] = useState("");
  const [processing, setProcessing] = useState(false);

  // 初診患者強制 physical，否則帶入外層選擇或空
  const [selectedScheduleType, setSelectedScheduleType] = useState(
    isUnverified ? "physical" : (defaultScheduleType || "")
  );

  const isTimeSlotExpired = (dateStr, timeStr) => {
    const now = new Date();
    return new Date(`${dateStr}T${timeStr}`) < now;
  };

  // schedules 表沒有 schedule_type 欄位
  // 改用 doctor.consultation_type 判斷此醫師支援哪些方式：
  //   "現場看診" → physical only
  //   其他（線上）→ online only
  //   若日後有兩種，可再擴充
  const consultationType = doctor.consultation_type || "";
  const hasOnline   = !isUnverified && consultationType !== "現場看診";
  const hasPhysical = consultationType === "現場看診" || isUnverified;

  // 此醫師所有可用排班（不依 schedule_type 過濾，因為資料表沒有這欄）
  const availableSchedules = schedules.filter(
    s =>
      s.doctor_id === doctor.doctor_id &&
      s.is_available === 1 &&
      !isTimeSlotExpired(s.schedule_date, s.time_slot)
  );

  const uniqueDates = [...new Set(availableSchedules.map(s => s.schedule_date))].sort();

  const weekDates = uniqueDates.map(dateStr => {
    const date = new Date(dateStr + "T00:00:00");
    const dayNames = ["週日","週一","週二","週三","週四","週五","週六"];
    return {
      dayName: dayNames[date.getDay()],
      month: date.getMonth() + 1,
      day: date.getDate(),
      fullDate: dateStr,
    };
  });

  const timeSlots = selectedDate
    ? availableSchedules
        .filter(s => s.schedule_date === selectedDate)
        .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    : [];

  const doctorFullName = `${doctor.first_name}${doctor.last_name}`;

  const handleScheduleTypeChange = (type) => {
    if (isUnverified && type !== "physical") return; // 初診鎖定
    setSelectedScheduleType(type);
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedScheduleType) { alert("請先選擇看診方式（線上或實體）"); return; }
      if (!selectedDate || !selectedTime) return;
      if (isTimeSlotExpired(selectedDate, selectedTime)) {
        alert("此時段已過期，請重新選擇");
        setSelectedTime("");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!symptoms.trim()) return;
      setStep(3);
    } else if (step === 3) {
      setProcessing(true);
      setTimeout(() => { setProcessing(false); handleConfirm(); }, 1000);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const getDayName = (dateStr) => {
    const dayNames = ["週日","週一","週二","週三","週四","週五","週六"];
    return dayNames[new Date(dateStr + "T00:00:00").getDay()];
  };

  const handleConfirm = () => {
    onConfirm({
      doctor,
      date: selectedDate,
      time: selectedTime,
      symptoms,
      scheduleType: selectedScheduleType,
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl sm:max-w-3xl md:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* 頂部進度條 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-2xl z-10">
          <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition">
            <X size={22} />
          </button>

          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pr-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg flex-shrink-0">
              {doctor.last_name?.charAt(0) || "醫"}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-xl text-gray-800 truncate">{doctorFullName} 醫師</h3>
              <p className="text-xs sm:text-sm text-blue-600 font-medium">{doctor.specialty}</p>
              {selectedScheduleType && (
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  selectedScheduleType === "online" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                }`}>
                  {selectedScheduleType === "online" ? <Monitor size={11} /> : <MapPin size={11} />}
                  {selectedScheduleType === "online" ? "線上看診" : "實體看診"}
                </span>
              )}
            </div>
          </div>

          {/* 步驟指示器 */}
          <div className="flex items-center justify-between">
            {[
              { num: 1, name: "選擇時間", icon: Calendar },
              { num: 2, name: "症狀描述", icon: FileText },
              { num: 3, name: "確認預約", icon: CheckCircle },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s.num ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {step > s.num ? <CheckCircle size={16} /> : <s.icon size={16} />}
                  </div>
                  <span className={`text-xs mt-1 font-medium hidden sm:block ${step >= s.num ? "text-blue-600" : "text-gray-400"}`}>
                    {s.name}
                  </span>
                  <span className={`text-xs mt-1 font-medium sm:hidden ${step >= s.num ? "text-blue-600" : "text-gray-400"}`}>
                    {s.num}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded ${step > s.num ? "bg-blue-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">

          {/* 步驟 1: 選擇時間 */}
          {step === 1 && (
            <div>
              {/* 看診方式 */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Monitor size={22} className="text-blue-600" />
                  選擇看診方式
                </h4>

                {/* 初診提示 */}
                {isUnverified && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                    <MapPin size={13} className="shrink-0" />
                    初診患者僅可預約實體看診，完成首次看診後即可解鎖線上看診。
                  </div>
                )}

                <div className="flex gap-3">
                  {/* 線上看診 */}
                  <button
                    onClick={() => handleScheduleTypeChange("online")}
                    disabled={isUnverified || !hasOnline}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                      ${isUnverified || !hasOnline
                        ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                        : selectedScheduleType === "online"
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                  >
                    <Monitor size={28} className={selectedScheduleType === "online" && !isUnverified ? "text-blue-600" : "text-gray-400"} />
                    <span className={`font-semibold text-sm ${selectedScheduleType === "online" && !isUnverified ? "text-blue-700" : "text-gray-500"}`}>
                      線上看診
                    </span>
                    <span className="text-xs text-gray-400">
                      {isUnverified ? "初診不開放" : "視訊遠端諮詢"}
                    </span>
                    {selectedScheduleType === "online" && !isUnverified && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">已選擇</span>
                    )}
                  </button>

                  {/* 實體看診 */}
                  <button
                    onClick={() => handleScheduleTypeChange("physical")}
                    disabled={!hasPhysical}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                      ${!hasPhysical
                        ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                        : selectedScheduleType === "physical"
                          ? "border-green-500 bg-green-50 shadow-md"
                          : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50"
                      }`}
                  >
                    <MapPin size={28} className={selectedScheduleType === "physical" ? "text-green-600" : "text-gray-400"} />
                    <span className={`font-semibold text-sm ${selectedScheduleType === "physical" ? "text-green-700" : "text-gray-500"}`}>
                      實體看診
                    </span>
                    <span className="text-xs text-gray-400">至診所現場就診</span>
                    {selectedScheduleType === "physical" && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">已選擇</span>
                    )}
                  </button>
                </div>
              </div>

              {/* 選擇日期 */}
              {selectedScheduleType && (
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
              )}

              {/* 選擇時段 */}
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
                disabled={!selectedScheduleType || !selectedDate || !selectedTime}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                  selectedScheduleType && selectedDate && selectedTime
                    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                下一步：填寫症狀
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
                    <span className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      selectedScheduleType === "online" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {selectedScheduleType === "online" ? <Monitor size={11} /> : <MapPin size={11} />}
                      {selectedScheduleType === "online" ? "線上看診" : "實體看診"}
                    </span>
                  </div>
                  <button onClick={() => setStep(1)} className="text-blue-600 text-sm hover:underline">修改</button>
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
                  placeholder={"請詳細描述您的症狀，例如：\n• 發燒 38.5°C，已持續 2 天\n• 喉嚨痛、咳嗽有痰\n• 頭痛、全身無力"}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm resize-none text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 提示：請包含症狀開始時間、嚴重程度、已採取的處理方式等
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
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all flex flex-col items-center justify-center ${
                    symptoms.trim()
                      ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span className="text-base font-bold">下一步</span>
                  <span className="text-xs opacity-80">確認預約</span>
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
                    {doctor.first_name?.charAt(0) || "醫"}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-xl text-gray-800 mb-1">{doctorFullName} 醫師</h5>
                    <p className="text-blue-600 font-semibold mb-1">{doctor.specialty}</p>
                    <p className="text-sm text-gray-600">{doctor.practice_hospital}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    {selectedScheduleType === "online"
                      ? <Monitor size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                      : <MapPin size={20} className="text-green-600 mt-1 flex-shrink-0" />
                    }
                    <div>
                      <p className="text-sm text-gray-600">看診方式</p>
                      <p className={`font-bold ${selectedScheduleType === "online" ? "text-blue-700" : "text-green-700"}`}>
                        {selectedScheduleType === "online" ? "線上看診（視訊）" : "實體看診（現場）"}
                      </p>
                    </div>
                  </div>
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
                  disabled={processing}
                  className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                    !processing
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl"
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
                      確認預約
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