"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu, X, ChevronRight, ChevronLeft, Calendar, BookOpen, Clock, User, FileText, Activity } from "lucide-react";

// 顏色變數
const COLOR_MAHOGANY = "var(--color-mahogany)"; 
const COLOR_LIME_CREAM = "var(--color-lime-cream)"; 
const COLOR_AZURE = "var(--color-azure)"; 
const COLOR_PERIWINKLE = "var(--color-periwinkle)"; 
const COLOR_LIGHT_CYAN = "var(--color-light-cyan)"; 

// --- Dashboard Header ---
const DashboardHeader = ({ userName, onAddAppointment }) => (
  <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-100">
    <div>
      <h1 className="text-4xl font-extrabold text-[var(--color-azure)] mb-2">👋 Hello {userName}!</h1>
      <p className="text-xl text-gray-500">今天感覺怎麼樣?</p>
    </div>
    <div className="flex items-center space-x-4">
      <button 
        onClick={onAddAppointment}
        className="flex items-center bg-[var(--color-lime-cream)] hover:bg-[var(--color-mahogany)] text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg"
      >
        <Calendar size={20} className="mr-2" />
        新增預約
      </button>
    </div>
  </div>
);

// --- Appointment Card ---
const AppointmentCard = ({ appointment, onJoinMeeting }) => {
  if (!appointment) {
    return (
      <div className="bg-[var(--color-lime-cream)]/20 p-6 rounded-2xl shadow-xl border-l-4 border-gray-300 mb-10">
        <div className="text-center py-8">
          <Calendar size={48} className="mx-auto text-[var(--color-mahogany)] mb-4" />
          <h3 className="text-xl font-bold text-[var(--color-mahogany)] mb-2">目前沒有即將到來的預約</h3>
          <p className="text-[var(--color-mahogany)]">立即預約您的下一次看診</p>
        </div>
      </div>
    );
  }

  
  return (
    <div className="bg-[var(--color-lime-cream)]/30 p-6 rounded-2xl shadow-xl mb-10">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">最近預約</h3>
          <p className="text-sm text-gray-500 mb-4">{appointment.date}</p>
          
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center">
              <User size={20} className="text-[var(--color-mahogany)] mr-2" />
              <span className="text-lg font-medium">{appointment.doctor} 醫師</span>
            </div>
            <div className="flex items-center">
              <Clock size={20} className="text-[var(--color-mahogany)] mr-2" />
              <span className="text-lg font-medium">{appointment.time}</span>
            </div>
          </div>

          {/* 科別顯示 */}
          {appointment.specialty && (
            <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
              {appointment.specialty}
            </div>
          )}
        </div>

        <div className="text-right ml-4">
          <span className={`inline-block font-bold px-4 py-1 rounded-full text-sm mb-3 ${
            appointment.status === '已確認' ? 'bg-green-100 text-green-700' :
            appointment.status === '已完成' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {appointment.status}
          </span>
          
          {/* 倒數計時顯示 */}
          {appointment.countdown && (
            <div className="mb-3">
              <p className="text-sm text-gray-600 font-semibold bg-gray-100 px-3 py-2 rounded-lg">
                ⏰ {appointment.countdown}
              </p>
            </div>
          )}
          
          {/* 進入診間按鈕 */}
          {appointment.canJoin ? (
            <button 
              onClick={() => onJoinMeeting(appointment.appointment_id)}
              className="w-full bg-[var(--color-azure)] hover:bg-[var(--color-azure-dark)] text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              🎥 進入診間
            </button>
          ) : (
            <button className="w-full bg-gray-200 text-gray-500 font-semibold px-4 py-2 rounded-lg cursor-not-allowed">
              進入診間
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- History Sidebar ---
const HistorySidebar = ({ history, onViewAll }) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-[var(--color-periwinkle)]/80 p-6 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">我的紀錄</h3>
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400">目前沒有就診紀錄</p>
        </div>
      </div>
    );
  }

  const getIcon = (status) => {
    switch(status) {
      case '已完成': return <Activity size={18} className="text-green-500" />;
      case '已取消': return <X size={18} className="text-red-500" />;
      case '已確認': return <Calendar size={18} className="text-blue-500" />;
      default: return <FileText size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-[var(--color-azure)]/20 p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">我的紀錄</h3>
      <ul className="space-y-4">
        {history.slice(0,5).map(item => (
          <li key={item.appointment_id} className="flex items-center p-3  rounded-lg hover:bg-[var(--color-light-cyan)]/30 transition-colors cursor-pointer">
            <div className="mr-3 p-2 bg-white rounded-full shadow-sm border border-gray-100">
              {getIcon(item.status)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">
                與{item.doctor_name}醫師看診
              </p>
              <p className="text-xs text-gray-500">{item.appointment_date} {item.appointment_time}</p>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </li>
        ))}
      </ul>
      <button 
        onClick={onViewAll}
        className="mt-6 w-full text-center text-[var(--color-azure)] font-semibold hover:text-[var(--color-azure-dark)] transition-colors"
      >
        查看所有活動 &rarr;
      </button>
    </div>
  );
};

// --- Page Component ---
export default function Page() {
  const [info, setInfo] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const [user, setUser] = useState(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const colors = [
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-violet-500",
    "from-fuchsia-400 to-pink-500",
  ];

  // 載入衛教資料
  useEffect(() => {
    fetch("/health-info.json")
      .then(res => res.json())
      .then(data => setInfo(data))
      .catch(err => console.error("載入資料失敗:", err));
  }, []);

  // 載入用戶資料
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/me", { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) setUser(data.user);
        }
      } catch (err) {
        console.error("載入用戶資料失敗:", err);
      }
    };
    fetchUserData();
  }, []);

  // 載入即將預約
  useEffect(() => {
  const fetchUpcoming = async () => {
    try {
      const res = await fetch("/api/appointments/", { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response Status:', res.status); // 除錯用

      if (!res.ok) {
        console.error('API 回應錯誤:', res.status, res.statusText);
        return;
      }

      const appointments = await res.json();
      console.log('取得的預約資料:', appointments); // 除錯用

      if (!appointments || appointments.length === 0) {
        console.log('沒有預約資料');
        setUpcomingAppointment(null);
        return;
      }

      // 處理第一筆預約（最近的預約）
      const apt = appointments[0];
      
      // 檢查必要欄位是否存在
      if (!apt.appointment_id || !apt.appointment_date) {
        console.error('預約資料格式錯誤:', apt);
        return;
      }

      // 計算時間差
      const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
      const now = new Date();
      const diffMinutes = Math.floor((appointmentDateTime - now) / (1000 * 60));
      
      // 判斷是否可以進入診間（預約時間前15分鐘到預約時間後30分鐘）
      const canJoin = diffMinutes >= -30 && diffMinutes <= 15;

      setUpcomingAppointment({
        appointment_id: apt.appointment_id,
        doctor: `${apt.doctor_last_name || ''}${apt.doctor_first_name || ''} 醫師`,
        specialty: apt.doctor_specialty || '未指定科別',
        time: `${apt.appointment_date} ${apt.appointment_time}`,
        status: apt.status || '未確認',
        date: apt.appointment_date,
        countdown: diffMinutes >= 0 
          ? `尚餘 ${diffMinutes} 分鐘` 
          : `已過 ${Math.abs(diffMinutes)} 分鐘`,
        canJoin: canJoin
      });

    } catch (err) {
      console.error("載入預約失敗:", err);
      setUpcomingAppointment(null);
    }
  };

  fetchUpcoming();
  const interval = setInterval(fetchUpcoming, 60000); // 每分鐘更新
  return () => clearInterval(interval);
}, []);

useEffect(() => {
  const fetchUpcomingAlternative = async () => {
    try {
      const res = await fetch("/api/record", { 
        credentials: 'include' 
      });

      if (!res.ok) {
        console.error('API 回應錯誤:', res.status);
        return;
      }

      const allAppointments = await res.json();
      console.log('所有預約資料:', allAppointments);

      // 篩選「已確認」的預約
      const confirmedAppointments = allAppointments.filter(
        apt => apt.status === '已確認'
      );

      if (confirmedAppointments.length === 0) {
        setUpcomingAppointment(null);
        return;
      }

      // 按日期時間排序，取最近的一筆
      const sortedAppointments = confirmedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
        return dateA - dateB;
      });

      const apt = sortedAppointments[0];
      const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
      const now = new Date();
      const diffMinutes = Math.floor((appointmentDateTime - now) / (1000 * 60));
      const canJoin = diffMinutes >= -30 && diffMinutes <= 15;

      setUpcomingAppointment({
        appointment_id: apt.appointment_id,
        doctor: `${apt.last_name || ''}${apt.first_name || ''} 醫師`,
        specialty: apt.doctor_specialty || '未指定科別',
        time: `${apt.appointment_date} ${apt.appointment_time}`,
        status: apt.status,
        date: apt.appointment_date,
        countdown: diffMinutes >= 0 
          ? `尚餘 ${diffMinutes} 分鐘` 
          : `已過 ${Math.abs(diffMinutes)} 分鐘`,
        canJoin: canJoin
      });

    } catch (err) {
      console.error("載入預約失敗:", err);
      setUpcomingAppointment(null);
    }
  };

  fetchUpcomingAlternative();
  const interval = setInterval(fetchUpcomingAlternative, 60000);
  return () => clearInterval(interval);
}, []);

  // 載入歷史紀錄
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/record", { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAppointmentHistory(data.map(item => ({
            appointment_id: item.appointment_id,
            doctor_name: `${item.last_name}${item.first_name}`,
            specialty: item.doctor_specialty,
            appointment_date: item.appointment_date,
            appointment_time: item.appointment_time,
            status: item.status
          })));
        }
      } catch (err) {
        console.error("載入歷史紀錄失敗:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // 衛教輪播自動播放
  useEffect(() => {
    if (!autoPlay || info.length === 0) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % Math.min(info.length, 3)), 5000);
    return () => clearInterval(timer);
  }, [autoPlay, info.length]);

  const selectedItem = info.find(item => item.id === selectedId);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % Math.min(info.length, 3));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + Math.min(info.length, 3)) % Math.min(info.length, 3));
  const handleAddAppointment = () => window.location.href = '/reserve';
  const handleViewAllHistory = () => window.location.href = '/record';
  const handleJoinMeeting = (id) => window.location.href = `/videochat?appointment_id=${id}`;

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  const featuredItems = info.slice(0, 3);
  const userName = user.first_name && user.last_name ? `${user.last_name}${user.first_name}` : user.username;

  return (
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* 主內容區: 內縮效果 */}
      <div className={`min-h-screen bg-gradient-to-br from-[${COLOR_PERIWINKLE}]/30 via-white to-[${COLOR_LIGHT_CYAN}]/30 transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <Navbar />
        <div className="p-6 max-w-7xl mx-auto">
          <DashboardHeader userName={userName} onAddAppointment={handleAddAppointment} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左側 */}
            <div className="lg:col-span-2">
              <AppointmentCard appointment={upcomingAppointment} onJoinMeeting={handleJoinMeeting} />

              <h2 className="text-3xl font-bold text-gray-800 mb-6">健康衛教</h2>
              <div className="relative">
                {/* 輪播區 */}
                <div className="relative h-80 md:h-96 rounded-3xl overflow-hidden shadow-2xl">
                  {featuredItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`absolute inset-0 transition-all duration-700 ${
                        idx === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
                      }`}
                    >
                      <div className={`h-full bg-gradient-to-br ${colors[idx % colors.length]} p-8 md:p-12 flex flex-col justify-between`}>
                        <div>
                          {item.department_name && (
                            <span className="inline-block bg-white bg-opacity-30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-black mb-4">
                              {item.department_name}
                            </span>
                          )}
                          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                            {item.title}
                          </h3>
                          <p className="text-white text-lg mb-6 line-clamp-3 drop-shadow">
                            {item.summary}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-white text-sm">
                            {item.date && (
                              <span className="flex items-center">
                                <Calendar size={16} className="mr-2" />
                                {item.date}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedId(item.id)}
                            className="bg-white text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all flex items-center shadow-lg"
                            onMouseEnter={() => setAutoPlay(false)}
                            onMouseLeave={() => setAutoPlay(true)}
                          >
                            閱讀全文
                            <ChevronRight size={20} className="ml-2" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 左右箭頭 */}
                <button
                  onClick={prevSlide}
                  onMouseEnter={() => setAutoPlay(false)}
                  onMouseLeave={() => setAutoPlay(true)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-100 p-3 rounded-full transition-all shadow-lg z-20"
                >
                  <ChevronLeft size={22} className="text-gray-800" />
                </button>
                <button
                  onClick={nextSlide}
                  onMouseEnter={() => setAutoPlay(false)}
                  onMouseLeave={() => setAutoPlay(true)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-100 p-3 rounded-full transition-all shadow-lg z-20"
                >
                  <ChevronRight size={22} className="text-gray-800" />
                </button>

                {/* 指示點 */}
                <div className="flex justify-center mt-6 space-x-2">
                  {featuredItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentSlide(idx);
                        setAutoPlay(false);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentSlide ? "w-8 bg-blue-500" : "w-2 bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 右側 */}
            <div className="lg:col-span-1 mt-6 lg:mt-0">
              <HistorySidebar history={appointmentHistory} onViewAll={handleViewAllHistory} />
            </div>
          </div>
        </div>
      </div>

      {/* 文章詳細內容彈窗 */}
      {selectedItem && (
       <div 
         className="fixed inset-0 bg-black/30 bg-opacity-30 backdrop-blur-sm z-50 p-4 overflow-y-auto flex"
          onClick={() => setSelectedId(null)}
            >

          <div 
               className="bg-white/95 backdrop-blur-lg rounded-3xl max-w-4xl w-full mx-auto my-12 
             shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-white/40 
             max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
                >

            {/* 文章標題區 */}
            <div className={`bg-gradient-to-br ${colors[info.findIndex(i => i.id === selectedItem.id) % colors.length]} p-8 relative`}>
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-6 right-6 bg-white bg-opacity-30 hover:bg-opacity-100 backdrop-blur-sm rounded-full p-2 transition-all"
              >
                <X size={24} className="text-black hover:text-gray-700" />
              </button>
              
              {selectedItem.department_name && (
                <span className="inline-block bg-white bg-opacity-30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-black mb-4">
                  {selectedItem.department_name}
                </span>
              )}
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg pr-12">
                {selectedItem.title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-4 text-white text-sm">
                {selectedItem.author && (
                  <span className="flex items-center">
                    <User size={16} className="mr-2" />
                    {selectedItem.author}
                  </span>
                )}
                {selectedItem.date && (
                  <span className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    {selectedItem.date}
                  </span>
                )}
               
              </div>
            </div>

            {/* 文章內容 */}
            <div className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                {selectedItem.content.split('\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={idx} className="text-2xl font-bold text-gray-800 mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                  } else if (paragraph.startsWith('### ')) {
                    return <h3 key={idx} className="text-xl font-semibold text-gray-700 mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
                  } else if (paragraph.startsWith('- ')) {
                    return <li key={idx} className="text-gray-700 ml-6 mb-2">{paragraph.replace('- ', '')}</li>;
                  } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return <p key={idx} className="font-bold text-gray-800 mt-4 mb-2">{paragraph.replace(/\*\*/g, '')}</p>;
                  } else if (paragraph.trim()) {
                    return <p key={idx} className="text-gray-700 leading-relaxed mb-4">{paragraph}</p>;
                  }
                  return null;
                })}
              </div>
              
              {/* 資料來源 */}
              {selectedItem.source && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <BookOpen size={18} className="mr-2 text-blue-500" />
                    <span className="font-semibold mr-2">資料來源：</span>
                    {selectedItem.source}
                  </div>
                </div>
              )}
              
              {/* 關閉按鈕 */}
              <button
                onClick={() => setSelectedId(null)}
                className="mt-8 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg"
              >
                關閉文章
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Footer */}
        <div className="bg-[var(--color-azure)]/20 text-[var(--color-mahogany)] py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-[var(--color-mahogany)]/80">
              © 2025 MedOnGo. 讓醫療服務更便捷、更貼心。
            </p>
          </div>
        </div>
    </div>
  );
}
