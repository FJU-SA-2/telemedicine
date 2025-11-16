"use client";
import { useState, useEffect } from "react";
import { Menu, Filter, CheckCircle, ArrowLeft, Calendar, Clock, X, ArrowRight, CreditCard, FileText, CircleAlert } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

// ✅ 預約模態窗口
function BookingModal({ doctor, schedules, onClose, onConfirm }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [processing, setProcessing] = useState(false);

  const isTimeSlotExpired = (dateStr, timeStr) => {
    const now = new Date();
    const slotDateTime = new Date(`${dateStr}T${timeStr}`);
    return slotDateTime < now;
  };

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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>

          <div className="flex items-center gap-4 mb-6">
            {doctor.photo_url ? (
              <img
                src={doctor.photo_url}
                alt={`${doctorFullName} 頭像`}
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
                  placeholder="請詳細描述您的症狀"
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm resize-none"
                />
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

          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={40} className="text-blue-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-800 mb-2">確認預約資訊</h4>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">就診日期</p>
                      <p className="font-bold text-gray-800">{formatDate(selectedDate)} {getDayName(selectedDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">預約時間</p>
                      <p className="font-bold text-gray-800">{selectedTime}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText size={20} className="text-blue-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">症狀描述</p>
                      <div className="bg-white rounded-lg p-3 text-sm text-gray-700">
                        {symptoms}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <ArrowLeft size={20} className="inline mr-2" />
                  修改資料
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg"
                >
                  前往支付
                  <ArrowRight size={20} className="inline ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard size={22} className="text-blue-600" />
                選擇支付方式
              </h4>

              <div className="space-y-3 mb-6">
                {[
                  { id: "credit", name: "信用卡", desc: "Visa / Mastercard / JCB" },
                  { id: "line", name: "LINE Pay", desc: "使用 LINE 支付" },
                  { id: "apple", name: "Apple Pay", desc: "快速安全支付" }
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
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">總計</span>
                  <span className="text-2xl font-bold text-blue-600">NT$ 500</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <ArrowLeft size={20} className="inline mr-2" />
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

// ✅ 醫師詳細資料頁面
function DoctorDetailsPage({ doctor, onBack, onBookNow }) {
  const doctorFullName = `${doctor.first_name}${doctor.last_name}`;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
        <div className="flex gap-6 mb-8">
          <div className="relative">
            <button
              onClick={onBack}
              className="absolute -top-6 -left-7 p-1 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center z-10"
            >
              <ArrowLeft size={24} />
            </button>
            {doctor.photo_url ? ( 
              <img
                src={doctor.photo_url}
                alt={`${doctor.first_name}${doctor.last_name} 頭像`}
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {doctor.last_name?.charAt(0) || "醫師"}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-black font-bold mb-2 text-2xl">{doctorFullName}</h1>
            <p className="text-blue-600 text-lg mb-1">{doctor.specialty}</p>
            <p className="text-gray-600">{doctor.practice_hospital}</p>
          </div>
        </div>

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
          </div>
        </div>

        <button
          onClick={onBookNow}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mt-8"
        >
          立即預約
        </button>
      </div>
    </div>
  );
}

// ✅ 醫師列表頁面（新增收藏功能）
function DoctorListPage({ onSelectDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
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

    fetchDoctors();
    fetchFavorites();
  }, []);

  const specialties = doctors.length > 0
    ? ["所有科別", ...new Set(doctors.map((d) => d.specialty))]
    : ["所有科別"];

  const filteredDoctors = doctors.filter((doctor) => {
    const specialtyMatch =
      !selectedSpecialty ||
      selectedSpecialty === "所有科別" ||
      doctor.specialty === selectedSpecialty;
    return specialtyMatch;
  });

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

      // 顯示收藏提示
      setFavoriteMessage(data.isFavorite ? "已加入收藏" : "已取消收藏");
      setShowFavoriteToast(true);
      setTimeout(() => setShowFavoriteToast(false), 3000);
    } catch (err) {
      console.error("收藏操作失敗", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showFavoriteToast && (
        <div className="fixed top-20 right-6 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>{favoriteMessage}</span>
        </div>
      )}

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

      <div className="mb-4">
        <h2 className="text-xl font-bold">
          搜尋結果 ({filteredDoctors.length} 位醫師)
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => {
          const fullName = `${doctor.first_name}${doctor.last_name}`;
          return (
            <div
              key={doctor.doctor_id}
              className="bg-white rounded-lg shadow p-6 relative hover:shadow-lg transition"
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
                    src={doctor.photo_url}
                    alt={`${doctor.first_name}${doctor.last_name} 頭像`}
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

              <button
                onClick={() => onSelectDoctor(doctor)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                查看更多
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ✅ 線上預約頁面（完整預約流程）
function BookingPage({ schedules, setSchedules }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const response = await fetch("/api/doctors");
        const data = await response.json();
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("無法取得醫生資料:", error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  const isTimeSlotExpired = (dateStr, timeStr) => {
    const now = new Date();
    const slotDateTime = new Date(`${dateStr}T${timeStr}`);
    return slotDateTime < now;
  };

  const validSchedules = schedules.filter(
    s => s.is_available === 1 && !isTimeSlotExpired(s.schedule_date, s.time_slot)
  );

  const doctorsWithSchedules = new Set(validSchedules.map(s => s.doctor_id));

  const availableSpecialties = [...new Set(
    doctors
      .filter(d => doctorsWithSchedules.has(d.doctor_id))
      .map(d => d.specialty)
  )].sort();

  const filteredDoctors = doctors.filter(doctor => {
    if (!doctorsWithSchedules.has(doctor.doctor_id)) return false;
    if (selectedSpecialty !== "all" && doctor.specialty !== selectedSpecialty) return false;

    if (selectedDate) {
      const hasAvailableSlot = validSchedules.some(
        s => s.doctor_id === doctor.doctor_id && s.schedule_date === selectedDate
      );
      if (!hasAvailableSlot) return false;
    }

    if (searchName) {
      const fullName = doctor.first_name + doctor.last_name;
      if (!fullName.includes(searchName)) return false;
    }

    return true;
  });

  const getDoctorAvailableDates = (doctorId) => {
    const dates = validSchedules
      .filter(s => s.doctor_id === doctorId)
      .map(s => s.schedule_date);
    return [...new Set(dates)].sort();
  };

  const getDoctorAvailableSlots = (doctorId) => {
    return validSchedules.filter(s => s.doctor_id === doctorId).length;
  };

  const handleBooking = (bookingData) => {
    console.log("預約資料:", bookingData);
    
    setSchedules(prevSchedules =>
      prevSchedules.map(s =>
        s.doctor_id === bookingData.doctor.doctor_id &&
          s.schedule_date === bookingData.date &&
          s.time_slot === bookingData.time
          ? { ...s, is_available: 0 }
          : s
      )
    );
    
    setShowModal(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedDoctor(null);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>預約成功!</span>
        </div>
      )}

      {/* 篩選區 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">篩選條件</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">選擇科別</label>
            <select
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-800 font-medium"
            >
              <option value="all">所有科別 ({availableSpecialties.length})</option>
              {availableSpecialties.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">選擇日期(選填)</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">搜尋醫師姓名</label>
            <input
              type="text"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="輸入醫師姓名"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-800"
            />
          </div>
        </div>
      </div>
      
      {/* 重要提醒區塊 */}
      {showAlert && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 relative">
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-3">
            <CircleAlert className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-red-700">【重要提醒】</p>
              <p className="text-sm text-gray-700 leading-relaxed mt-1">
                本平台提供之「心理諮商」與「精神科線上諮詢」服務屬於非醫療性質,
                僅提供心理支持、情緒陪伴、生活適應建議與健康相關資訊。
                諮詢內容不包含醫療診斷、開立藥物處方、醫療證明或任何醫療行為。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 醫生列表 */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            可預約醫師
            <span className="ml-2 text-blue-600">({filteredDoctors.length})</span>
          </h2>
          {(selectedSpecialty !== "all" || selectedDate || searchName) && (
            <button
              onClick={() => {
                setSelectedSpecialty("all");
                setSelectedDate("");
                setSearchName("");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              清除篩選
            </button>
          )}
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">目前沒有符合條件的醫師</p>
            <p className="text-sm">請嘗試調整篩選條件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map(doctor => {
              const availableDates = getDoctorAvailableDates(doctor.doctor_id);
              const availableSlots = getDoctorAvailableSlots(doctor.doctor_id);

              return (
                <div
                  key={doctor.doctor_id}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50"
                  onClick={() => { setSelectedDoctor(doctor); setShowModal(true); }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    {doctor.photo_url ? (
                      <img
                        src={doctor.photo_url}
                        alt={`${doctor.first_name}${doctor.last_name} 頭像`}
                        className="w-16 h-16 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                        {doctor.last_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-800 truncate">
                        {doctor.first_name + doctor.last_name} 醫師
                      </h3>
                      <p className="text-sm text-blue-600 font-semibold">{doctor.specialty}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{doctor.practice_hospital}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} className="text-green-600" />
                      <span className="font-medium">{availableDates.length} 天可預約</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-orange-600" />
                      <span className="font-medium">{availableSlots} 個時段可選</span>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-md hover:shadow-lg">
                    立即預約
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          schedules={schedules}
          onClose={() => { setShowModal(false); setSelectedDoctor(null); }}
          onConfirm={handleBooking}
        />
      )}
    </div>
  );
}

// 其他分頁
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

// ✅ 主應用入口
export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("doctors");
  const [currentView, setCurrentView] = useState("list"); // list, detail
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);

  // 載入排程資料
  useEffect(() => {
    async function fetchSchedules() {
      try {
        const response = await fetch("/api/schedules");
        const schedulesData = await response.json();
        
        const formattedSchedules = (Array.isArray(schedulesData) ? schedulesData : []).map(s => ({
          ...s,
          doctor_id: Number(s.doctor_id),
          schedule_date: s.schedule_date.split("T")[0],
          time_slot: s.time_slot.substring(0, 5),
          is_available: Number(s.is_available),
          schedule_id: s.schedule_id
        }));
        
        setSchedules(formattedSchedules);
      } catch (error) {
        console.error("載入排程錯誤:", error);
        setSchedules([]);
      }
    }

    fetchSchedules();
  }, []);

  // 處理醫師選擇 - 顯示詳細資料
  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentView("detail");
  };

  // 處理返回列表
  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedDoctor(null);
  };

  // 處理點擊立即預約 - 使用 Next.js 路由跳轉
  const handleBookNow = () => {
    // 使用 window.location 或 Next.js router 跳轉到預約頁面
    window.location.href = '/reserve';
  };

  return (
    <div className="relative">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-50 bg-white rounded-lg shadow hover:shadow-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // 當切換分頁時重置視圖
          if (tab === "doctors") {
            setCurrentView("list");
            setSelectedDoctor(null);
          }
        }}
      />

      <div
        className={`transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar />
        
        {activeTab === "home" && <HomePage />}
        
        {/* 醫生列表分頁 */}
        {activeTab === "doctors" && (
          <>
            {currentView === "list" && (
              <DoctorListPage onSelectDoctor={handleSelectDoctor} />
            )}
            
            {currentView === "detail" && selectedDoctor && (
              <DoctorDetailsPage
                doctor={selectedDoctor}
                onBack={handleBackToList}
                onBookNow={handleBookNow}
              />
            )}
          </>
        )}
        
        {/* 線上預約分頁 */}
        {activeTab === "reserve" && (
          <BookingPage 
            schedules={schedules}
            setSchedules={setSchedules}
          />
        )}
        
        {activeTab === "settings" && <SettingsPage />}
      </div>
    </div>
  );
}