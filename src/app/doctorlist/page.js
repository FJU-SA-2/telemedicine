"use client";
import { useState, useEffect } from "react";
import { Menu, Filter, CheckCircle, ArrowLeft, Calendar, Clock, X, ArrowRight, CreditCard, FileText, CircleAlert, LogIn, UserPlus, Heart } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import LockedPageOverlay from "../components/LockedPageOverlay";
import FloatingChat from "../components/FloatingChat";

const COLOR_MAHOGANY = "var(--color-mahogany)";
const COLOR_LIME_CREAM = "var(--color-lime-cream)";
const COLOR_AZURE = "var(--color-azure)";
const COLOR_PERIWINKLE = "var(--color-periwinkle)";
const COLOR_LIGHT_CYAN = "var(--color-light-cyan)";
// ✅ 新增：登入提示彈窗組件
function LoginRequiredModal({ onClose, onLogin, onRegister }) {
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-[var(--color-periwinkle)]/20 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full p-5 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={22} />
        </button>

        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-3 sm:mb-4 relative">
            <Heart size={36} className="text-gray-300 sm:w-12 sm:h-12" />
            <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center">
              <CircleAlert size={14} className="text-white sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            需要登入才能使用
          </h2>

          <p className="text-gray-600 text-center text-xs sm:text-sm leading-relaxed">
            「收藏列表」功能需要登入後才能使用。<br />
            請先登入或註冊您的帳號。
          </p>
        </div>

        <div className="space-y-3 mb-5 sm:mb-6">
          <button
            onClick={onLogin}
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            立即登入
          </button>

          <button
            onClick={onRegister}
            className="w-full bg-white text-gray-700 py-2.5 sm:py-3 rounded-lg font-medium border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            註冊新帳號
          </button>
        </div>

        <div className="border-t border-gray-200 pt-3 sm:pt-4">
          <p className="text-xs sm:text-sm text-gray-500 text-center mb-3">
            登入後您可以：
          </p>

          <div className="space-y-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              <span>預約線上視訊看診</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              <span>查看預約記錄</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              <span>收藏喜歡的醫師</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              <span>回報問題與建議</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ 医师详细资料页面
function DoctorDetailsPage({ doctor, onBack, onBookNow }) {
  const doctorFullName = `${doctor.first_name}${doctor.last_name}`;

  return (
    <div className="p-6 min-h-screen">
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
                {doctor.first_name?.charAt(0) || "醫師"}
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
            <div className="rounded-lg p-4">
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

// ✅ 医师列表页面（新增收藏功能）
function DoctorListPage({ onSelectDoctor, user }) {
  const [doctors, setDoctors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [keyword, setKeyword] = useState("");

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
      // ✅ 只有登入时才获取收藏列表
      if (!user) {
        setFavorites([]);
        return;
      }

      try {
        const res = await fetch(`/api/favorites?user_id=${user.user_id}`);

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
  }, [user]);

  const specialties = doctors.length > 0
    ? ["所有科別", ...new Set(doctors.map((d) => d.specialty))]
    : ["所有科別"];
  const hospitals = doctors.length > 0
    ? ["所有院所", ...new Set(doctors.map((d) => d.practice_hospital))]
    : ["所有院所"];

  const filteredDoctors = doctors.filter((doctor) => {
    const specialtyMatch =
      !selectedSpecialty ||
      selectedSpecialty === "所有科別" ||
      doctor.specialty === selectedSpecialty;

    const hospitalMatch =
      !selectedHospital ||
      selectedHospital === "所有院所" ||
      doctor.practice_hospital === selectedHospital;

    const keywordMatch = keyword
      ? `${doctor.first_name}${doctor.last_name} ${doctor.specialty} ${doctor.practice_hospital} ${doctor.education} ${doctor.experience}`
        .toLowerCase()
        .includes(keyword.toLowerCase())
      : true;

    return specialtyMatch && hospitalMatch && keywordMatch;
  });

  const toggleFavorite = async (doctorId) => {
    // ✅ 检查是否登入
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, doctor_id: doctorId }),
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

      // 显示收藏提示
      setFavoriteMessage(data.isFavorite ? "已加入收藏" : "已取消收藏");
      setShowFavoriteToast(true);
      setTimeout(() => setShowFavoriteToast(false), 3000);
    } catch (err) {
      console.error("收藏操作失敗", err);
    }
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleRegister = () => {
    window.location.href = '/register';
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-8 min-h-screen overflow-x-hidden">
      {showFavoriteToast && (
        <div className={`fixed top-20 right-6 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${favoriteMessage === "已加入收藏" ? "bg-blue-500" : "bg-red-500"
          }`}>
          <CheckCircle size={20} />
          <span>{favoriteMessage}</span>
        </div>
      )}

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}

      {/* 篩選區塊 */}
      <div className="mb-6 px-4 md:px-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">

          {/* 標題列 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Filter size={16} className="text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">篩選條件</h3>
            </div>
            {/* 有篩選時顯示清除按鈕 */}
            {(selectedSpecialty || selectedHospital || keyword) && (
              <button
                onClick={() => {
                  setSelectedSpecialty("");
                  setSelectedHospital("");
                  setKeyword("");
                }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={13} />
                清除篩選
              </button>
            )}
          </div>

          {/* 搜尋欄（全寬） */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋醫師姓名、科別、院所..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 科別 & 院所（並排） */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1 ml-1">科別</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition ${selectedSpecialty ? "border-blue-400 text-blue-700 bg-blue-50 font-medium" : "border-gray-200 text-gray-600"
                  }`}
              >
                <option value="">所有科別</option>
                {specialties
                  .filter((s) => s !== "所有科別")
                  .map((specialty) => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1 ml-1">院所</label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition ${selectedHospital ? "border-blue-400 text-blue-700 bg-blue-50 font-medium" : "border-gray-200 text-gray-600"
                  }`}
              >
                <option value="">所有院所</option>
                {hospitals
                  .filter((h) => h !== "所有院所")
                  .map((hospital) => (
                    <option key={hospital} value={hospital}>{hospital}</option>
                  ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 搜尋結果數 */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            {filteredDoctors.length}
          </span>
          <h2 className="text-sm font-medium text-gray-500">
            位醫師符合條件
          </h2>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredDoctors.map((doctor) => {
          const fullName = `${doctor.first_name}${doctor.last_name}`;
          const isFavorited = favorites.includes(doctor.doctor_id);

          return (
            <div
              key={doctor.doctor_id}
              className=""
            >
              {/* 收藏按鈕 - 改為愛心 */}
              <div
                key={doctor.doctor_id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-4 md:p-6 flex flex-col items-center text-center relative"
              >

                {/* 收藏愛心 */}
                <div
                  onClick={() => toggleFavorite(doctor.doctor_id)}
                  className="absolute top-3 right-3 cursor-pointer"
                >
                  <Heart
                    size={22}
                    className={
                      isFavorited
                        ? "text-red-500 fill-red-500"
                        : "text-gray-300 hover:text-red-400"
                    }
                    fill={isFavorited ? "currentColor" : "none"}
                  />
                </div>

                {/* 醫師頭像 */}
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-blue-100 shadow mb-3">
                  {doctor.photo ? (
                    <img
                      src={`http://localhost:5000/uploads/profile_pictures/${doctor.photo}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      className="w-full h-full object-cover"
                      alt={`${doctor.first_name}${doctor.last_name}`}
                    />
                  ) : null}
                  <div
                    style={{ display: doctor.photo ? 'none' : 'flex' }}
                    className="w-full h-full bg-blue-500 items-center justify-center text-white font-bold text-xl"
                  >
                    {doctor.first_name?.charAt(0) || "醫"}
                  </div>
                </div>

                {/* 醫師姓名 */}
                <h3 className="text-base md:text-lg font-bold text-gray-800">
                  {doctor.first_name}{doctor.last_name}
                </h3>

                {/* 科別 */}
                <span className="mt-1 px-2 py-0.5 md:px-3 md:py-1 bg-blue-100 text-blue-700 text-xs md:text-sm rounded-full">
                  {doctor.specialty}
                </span>

                {/* 院所 */}
                <p className="text-gray-500 text-xs md:text-sm mt-1">
                  {doctor.practice_hospital}
                </p>

                {/* 費用 */}
                <p className="mt-1 md:mt-2 text-sm md:text-lg font-semibold text-blue-600">
                  NT$ {doctor.consultation_fee || "—"}
                </p>

                {/* Divider */}
                <div className="hidden md:block w-full border-t my-4"></div>

                {/* 專業資訊（手機隱藏） */}
                <div className="hidden md:grid grid-cols-1 gap-3 w-full text-left text-sm">

                  <div className="flex gap-2 items-start">
                    <span className="text-blue-500 font-bold">🎓</span>
                    <p className="text-gray-700">
                      <span className="font-semibold">學歷：</span>
                      {doctor.education || "暫無資料"}
                    </p>
                  </div>

                  <div className="flex gap-2 items-start">
                    <span className="text-green-500 font-bold">💼</span>
                    <p className="text-gray-700">
                      <span className="font-semibold">經歷：</span>
                      {doctor.experience || "暫無資料"}
                    </p>
                  </div>

                  <div className="flex gap-2 items-start">
                    <span className="text-purple-500 font-bold">🧾</span>
                    <p className="text-gray-700">
                      <span className="font-semibold">認證：</span>
                      {doctor.qualifications || "暫無資料"}
                    </p>
                  </div>

                </div>

                {/* 預約按鈕 */}
                <button
                  onClick={() =>
                    (window.location.href = `/reserve?doctor=${doctor.doctor_id}`)
                  }
                  className="mt-3 md:mt-4 w-full bg-green-600 text-white py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-medium hover:bg-green-700 transition"
                >
                  立即預約
                </button>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 其他分頁
function HomePage() {
  return (
    <div className="p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">首頁</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">歡迎使用遠端醫療系統</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="p-6 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">設定</h2>
      <p className="text-gray-600">功能開發中...</p>
    </div>
  );
}

// ✅ 主应用入口
export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("doctors");
  const [currentView, setCurrentView] = useState("list");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ 检查登入状态
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

  // 载入排程资料
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

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedDoctor(null);
  };

  const handleBookNow = () => {
    window.location.href = '/reserve';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition "
          aria-label="開啟選單"
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
          if (tab === "doctors") {
            setCurrentView("list");
            setSelectedDoctor(null);
          }
        }}
      />

      <div
        className={`transition-all duration-300 overflow-x-hidden min-w-0 flex-1 ${isOpen ? "md:ml-64" : "ml-0"}`}
      >
        <Navbar />

        {activeTab === "home" && <HomePage />}

        {activeTab === "doctors" && (
          <>
            {currentView === "list" && (
              <DoctorListPage
                onSelectDoctor={handleSelectDoctor}
                user={user}
              />
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
        {activeTab === "settings" && <SettingsPage />}

      </div>
      <div className="bg-gray-800 text-white py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              © 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
            </p>
          </div>
        </div>
      <FloatingChat />
    </div>
  );
}