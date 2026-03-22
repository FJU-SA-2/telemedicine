"use client";
import { useState, useEffect } from "react";
import { Heart, ArrowLeft, Trash2, Menu, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import BookingModal from "../reserve/BookingModal";
import SuccessPage from "../reserve/SuccessPage";
import LockedPageOverlay from "../components/LockedPageOverlay";

// 醫師詳細資料頁面
function DoctorDetailsPage({ doctor, schedules, onBack, onBooking }) {
  const [showModal, setShowModal] = useState(false);

  const handleBookingClick = () => {
    setShowModal(true);
  };

  const handleConfirm = (bookingData) => {
    setShowModal(false);
    onBooking(bookingData);
  };

  const doctorFullName = `${doctor.first_name}${doctor.last_name}`;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow p-5 sm:p-8 max-w-2xl mx-auto">
        <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="self-start mt-1 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl flex-shrink-0">
            {doctor.first_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 text-gray-800">{doctorFullName}</h1>
            <p className="text-blue-600 text-base sm:text-lg mb-1">{doctor.specialty}</p>
            <p className="text-gray-600 text-sm sm:text-base">{doctor.practice_hospital}</p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 border-t border-gray-200 pt-4 sm:pt-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">簡介</h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              {doctor.description || "暫無介紹"}
            </p>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">專業經歷</h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              {doctor.experience || "暫無相關資訊"}
            </p>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">學位與認證</h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              {doctor.qualifications || "暫無相關資訊"}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 w-fit">
            <p className="text-gray-600 text-sm">掛號費</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              ${doctor.consultation_fee || "暫無"}
            </p>
          </div>
        </div>

        <button
          onClick={handleBookingClick}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mt-6 sm:mt-8"
        >
          立即預約
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

export default function FavoritesPage() {
  const router = useRouter();
  const [favoriteDoctors, setFavoriteDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  
  // 新增：登入狀態管理
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // 新增：檢查登入狀態
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

  useEffect(() => {
    // 修改：只有登入時才載入資料
    if (user) {
      fetchFavorites(user);
      fetchSchedules();
    } else if (!authLoading) {
      // 如果未登入且認證檢查完成，停止載入
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchFavorites = async (currentUser) => {
    try {
      setLoading(true);

      const favRes = await fetch(`/api/favorites?user_id=${currentUser.user_id}`);
      const favoriteIds = await favRes.json();

      if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
        setFavoriteDoctors([]);
        setLoading(false);
        return;
      }

      const doctorsRes = await fetch("/api/doctors");
      const allDoctors = await doctorsRes.json();

      const favorites = allDoctors.filter((doctor) =>
        favoriteIds.includes(doctor.doctor_id)
      );

      setFavoriteDoctors(favorites);
    } catch (error) {
      console.error("無法獲取收藏醫生:", error);
      setFavoriteDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const resSchedules = await fetch("/api/schedules");
      const schedulesData = await resSchedules.json();

      const formattedSchedules = schedulesData.map(s => ({
        ...s,
        doctor_id: Number(s.doctor_id),
        schedule_date: s.schedule_date.split("T")[0],
        time_slot: s.time_slot.substring(0, 5),
        is_available: Number(s.is_available)
      }));

      setSchedules(formattedSchedules);
    } catch (error) {
      console.error("無法獲取排程:", error);
    }
  };

  const removeFavorite = async (doctorId) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, doctor_id: doctorId }),
      });

      const data = await res.json();

      if (data.isFavorite === false) {
        setFavoriteDoctors((prev) =>
          prev.filter((doc) => doc.doctor_id !== doctorId)
        );
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error("取消收藏失敗:", error);
    }
  };

  const viewDoctorDetails = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleBooking = async (bookingData) => {
    try {
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

      setSchedules(prevSchedules =>
        prevSchedules.map(s =>
          s.doctor_id === bookingData.doctor.doctor_id &&
            s.schedule_date === bookingData.date &&
            s.time_slot === bookingData.time
            ? { ...s, is_available: 0 }
            : s
        )
      );

      setBookingInfo({
        ...bookingData,
        appointment_id: result.appointment_id
      });
      setShowSuccess(true);

    } catch (error) {
      console.error("預約錯誤:", error);
      alert("預約失敗,請檢查網路連線後再試");
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setBookingInfo(null);
    setSelectedDoctor(null);
  };

  // 新增：只在認證檢查時顯示載入
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  if (selectedDoctor) {
    return (
      <div className="relative flex flex-col min-h-screen bg-gray-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
            aria-label="開啟選單"
          >
            <Menu size={24} />
          </button>
        )}

        <Sidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          activeTab="favorites"
          setActiveTab={() => {}}
        />

        <div className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"}`}>
          <Navbar />
          {showSuccess && bookingInfo && (
            <SuccessPage bookingInfo={bookingInfo} onClose={handleCloseSuccess} />
          )}
          <DoctorDetailsPage
            doctor={selectedDoctor}
            schedules={schedules}
            onBack={() => setSelectedDoctor(null)}
            onBooking={handleBooking}
          />
        </div>

        {!user && <LockedPageOverlay pageName="收藏列表" icon={Heart} />}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
          aria-label="開啟選單"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeTab="favorites"
        setActiveTab={() => {}}
      />

      <div
        className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${
          isOpen ? "md:ml-64" : "ml-0"
        }`}
      >
        <Navbar />

        <div className="relative min-h-screen">
          {showSuccess && !bookingInfo && (
            <div className="fixed top-20 right-4 sm:right-6 bg-blue-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
              <CheckCircle size={20} />
              <span>已取消收藏</span>
            </div>
          )}

          <div className="p-4 sm:p-6">
            <div className="max-w-6xl mx-auto mb-4 sm:mb-6">
              <div className="flex items-center gap-3 mb-1">
                <Heart size={24} className="text-red-500 flex-shrink-0" fill="currentColor" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">我的收藏</h1>
              </div>
              <p className="text-gray-600 text-sm sm:text-base">
                共收藏了 {favoriteDoctors.length} 位醫師
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              {favoriteDoctors.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
                  <Heart size={56} className="mx-auto text-red-300 mb-4" fill="currentColor" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                    尚無收藏的醫師
                  </h3>
                  <p className="text-gray-500 mb-6 text-sm sm:text-base">
                    瀏覽醫師列表，點擊愛心圖標來收藏您喜歡的醫師
                  </p>
                  <button
                    onClick={() => router.push("/doctorlist")}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                  >
                    前往醫師列表
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {favoriteDoctors.map((doctor) => {
                    const fullName = `${doctor.first_name}${doctor.last_name}`;
                    return (
                      <div
                        key={doctor.doctor_id}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 sm:p-6 relative"
                      >
                        <button
                          onClick={() => removeFavorite(doctor.doctor_id)}
                          className="absolute top-3 right-3 p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                          title="取消收藏"
                        >
                          <Trash2 size={18} />
                        </button>

                        <div className="flex items-start gap-3 sm:gap-4 mb-4">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                            {doctor.last_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate pr-6">
                              {fullName}
                            </h3>
                            <p className="text-blue-600 text-sm font-medium">
                              {doctor.specialty}
                            </p>
                            <p className="text-gray-500 text-xs mt-1 truncate">
                              {doctor.practice_hospital}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {doctor.description || "暫無介紹"}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-xs text-gray-500">掛號費</p>
                          <p className="text-lg font-bold text-blue-600">
                            ${doctor.consultation_fee || "暫無"}
                          </p>
                        </div>

                        <button
                          onClick={() => viewDoctorDetails(doctor)}
                          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm sm:text-base"
                        >
                          查看醫師資訊
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {!user && <LockedPageOverlay pageName="收藏列表" icon={Heart} />}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              © 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
            </p>
          </div>
        </div>
    </div>
  );
}