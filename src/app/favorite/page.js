"use client";
import { useState, useEffect } from "react";
import { Star, ArrowLeft, Trash2, Menu, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import BookingModal from "../reserve/BookingModal";
import SuccessPage from "../reserve/SuccessPage";

// 🟢 醫師詳細資料頁面
function DoctorDetailsPage({ doctor, schedules, onBack, onBooking }) {
  const [showModal, setShowModal] = useState(false);

  const handleBookingClick = () => {
    setShowModal(true);
  };

  const handleConfirm = (bookingData) => {
    setShowModal(false);
    onBooking(bookingData);
  };

  const doctorFullName = `${doctor.last_name}${doctor.first_name}`;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
        {/* 醫師基本信息 */}
        <div className="flex gap-6 mb-8 relative">
          {/* 返回按鈕 - 位於頭像左上角 */}
          <button
            onClick={onBack}
            className="absolute -left-6 -top-6 p-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center z-10"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
            {doctor.last_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{doctorFullName}</h1>
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
          </div>
        </div>

        {/* 預約按鈕 */}
        <button
          onClick={handleBookingClick}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mt-8"
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
  const userId = 1; // 模擬登入使用者 ID

  useEffect(() => {
    fetchFavorites();
    fetchSchedules();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);

      // 1. 獲取收藏的醫生 ID 列表
      const favRes = await fetch(`/api/favorites?user_id=${userId}`);
      const favoriteIds = await favRes.json();

      if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
        setFavoriteDoctors([]);
        setLoading(false);
        return;
      }

      // 2. 獲取所有醫生資料
      const doctorsRes = await fetch("/api/doctors");
      const allDoctors = await doctorsRes.json();

      // 3. 篩選出收藏的醫生
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

      // 確保日期格式正確
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
        body: JSON.stringify({ user_id: userId, doctor_id: doctorId }),
      });

      const data = await res.json();

      if (data.isFavorite === false) {
        // 移除成功，更新列表
        setFavoriteDoctors((prev) =>
          prev.filter((doc) => doc.doctor_id !== doctorId)
        );
        // 顯示成功提示
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
      // 先取得登入使用者資訊
      const meRes = await fetch("/api/me");
      if (!meRes.ok) {
        alert("請先登入！");
        return;
      }
      const meData = await meRes.json();
      const patientId = meData.user?.patient_id;

      if (!patientId) {
        alert("您不是病患，無法預約！");
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
        alert(result.error || "預約失敗，請稍後再試");
        return;
      }

      // 預約成功，更新本地排程狀態
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
      alert("預約失敗，請檢查網路連線後再試");
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setBookingInfo(null);
    setSelectedDoctor(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  // 如果選擇了醫師，顯示詳細資料頁面
  if (selectedDoctor) {
    return (
      <div className="relative min-h-screen bg-gray-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <Menu size={24} className="text-gray-600" />
          </button>
        )}

        <Sidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          activeTab="favorites"
          setActiveTab={() => {}}
        />

        <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
          <Navbar />
          
          {showSuccess && bookingInfo && (
            <SuccessPage
              bookingInfo={bookingInfo}
              onClose={handleCloseSuccess}
            />
          )}
          
          <DoctorDetailsPage
            doctor={selectedDoctor}
            schedules={schedules}
            onBack={() => setSelectedDoctor(null)}
            onBooking={handleBooking}
          />
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

      {/* 側邊欄 */}
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeTab="favorites"
        setActiveTab={() => {}}
      />

      {/* 主要內容區域 */}
      <div
        className={`transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* 導覽列 */}
        <Navbar />

        {/* 成功提示訊息 */}
        {showSuccess && !bookingInfo && (
          <div className="fixed top-20 right-6 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <CheckCircle size={20} />
            <span>已取消收藏</span>
          </div>
        )}

        {/* 收藏頁面內容 */}
        <div className="p-6">
          {/* 標題區 */}
          <div className="max-w-6xl mx-auto mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Star size={28} className="text-yellow-400" fill="currentColor" />
              <h1 className="text-3xl font-bold text-gray-800">我的收藏</h1>
            </div>
            <p className="text-gray-600">
              共收藏了 {favoriteDoctors.length} 位醫師
            </p>
          </div>

          {/* 收藏列表 */}
          <div className="max-w-6xl mx-auto">
            {favoriteDoctors.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Star
                  size={64}
                  className="mx-auto text-yellow-300 mb-4"
                  fill="currentColor"
                />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  尚無收藏的醫師
                </h3>
                <p className="text-gray-500 mb-6">
                  瀏覽醫師列表，點擊星星圖標來收藏您喜歡的醫師
                </p>
                <button
                  onClick={() => router.push("/doctorlist")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  前往醫師列表
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteDoctors.map((doctor) => {
                  const fullName = `${doctor.last_name}${doctor.first_name}`;
                  return (
                    <div
                      key={doctor.doctor_id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 relative"
                    >
                      {/* 移除收藏按鈕 */}
                      <button
                        onClick={() => removeFavorite(doctor.doctor_id)}
                        className="absolute top-3 right-3 p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                        title="取消收藏"
                      >
                        <Trash2 size={18} />
                      </button>

                      {/* 醫師頭像 */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                          {doctor.last_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">
                            {fullName}
                          </h3>
                          <p className="text-blue-600 text-sm font-medium">
                            {doctor.specialty}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {doctor.practice_hospital}
                          </p>
                        </div>
                      </div>

                      {/* 醫師簡介 */}
                      <div className="mb-4">
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {doctor.description || "暫無介紹"}
                        </p>
                      </div>

                      {/* 掛號費 */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-gray-500">掛號費</p>
                        <p className="text-lg font-bold text-blue-600">
                          ${doctor.consultation_fee || "暫無"}
                        </p>
                      </div>

                      {/* 查看詳情按鈕 */}
                      <button
                        onClick={() => viewDoctorDetails(doctor)}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
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
      </div>
    </div>
  );
}