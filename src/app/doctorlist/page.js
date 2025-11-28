"use client";
import { useState, useEffect } from "react";
import { Menu, Filter, CheckCircle, ArrowLeft, Calendar, Clock, X, ArrowRight, CreditCard, FileText, CircleAlert, LogIn, UserPlus } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import LockedPageOverlay from "../components/LockedPageOverlay";

// ✅ 新增：登入提示弹窗组件
function LoginRequiredModal({ onClose, onLogin, onRegister }) {
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 relative">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <CircleAlert size={18} className="text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">需要登入才能使用</h2>
          <p className="text-gray-600 text-center text-sm leading-relaxed">
            「收藏列表」功能需要登入後才能使用。<br />
            請先登入或註冊您的帳號。
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={onLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            立即登入
          </button>
          
          <button
            onClick={onRegister}
            className="w-full bg-white text-gray-700 py-3 rounded-lg font-medium border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            註冊新帳號
          </button>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500 text-center mb-3">登入後您可以：</p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>預約線上視訊看診</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>查看預約記錄</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>收藏喜歡的醫師</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
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

// ✅ 医师列表页面（新增收藏功能）
function DoctorListPage({ onSelectDoctor, user }) {
  const [doctors, setDoctors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const userId = 1; // 模拟登入使用者 ID

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
  }, [user]);

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
    // ✅ 检查是否登入
    if (!user) {
      setShowLoginModal(true);
      return;
    }

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

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
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
          const isFavorited = favorites.includes(doctor.doctor_id);
          
          return (
            <div
              key={doctor.doctor_id}
              className="bg-white rounded-lg shadow p-6 relative hover:shadow-lg transition"
            >
              {/* 收藏按钮 */}
              <div
                onClick={() => toggleFavorite(doctor.doctor_id)}
                className={`absolute top-3 right-3 text-xl cursor-pointer select-none transition-all ${
                  user 
                    ? 'text-yellow-400 hover:scale-110' 
                    : 'text-gray-300 hover:text-gray-400'
                }`}
                title={user ? (isFavorited ? "取消收藏" : "加入收藏") : "需要登入才能收藏"}
              >
                {isFavorited ? "★" : "☆"}
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

// 其他分页
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

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
    </div>
  );
}