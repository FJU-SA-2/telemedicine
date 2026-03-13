"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import DoctorSidebar from "../components/DoctorSidebar";
import {
  Calendar,
  Users,
  Video,
  FileText,
  Settings,
  Bell,
  Search,
  Clock,
  Activity,
  Menu,
} from "lucide-react";

const TelemedicineDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [isOpen, setIsOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [dashboardStats, setDashboardStats] = useState({
    todayTotal: 0,
    pending: 0,
    completed: 0
  });

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [weeklyCalendar, setWeeklyCalendar] = useState([]);
  
  const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

  const getStatusColor = (status) => {
    switch (status) {
      case "已確認":
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "待確認":
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "已完成":
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed": return "已確認";
      case "pending": return "待確認";
      case "completed": return "已完成";
      case "已取消": return "已取消";
      default: return status;
    }
  };
  
  const getDayNameAndDate = (dateString) => {
    const date = new Date(dateString);
    const dayName = dayNames[date.getDay()];
    const dateOfMonth = date.getDate();
    const isToday = date.toDateString() === new Date().toDateString();
    return { dayName, dateOfMonth, isToday };
  };

  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", { credentials: 'include' });
        const data = await res.json();
        if (data.authenticated && data.user && data.user.role === 'doctor') {
          setApprovalStatus(data.user.approval_status);
        } else {
          setApprovalStatus('unauthorized');
        }
      } catch (error) {
        console.error("Failed to fetch approval status:", error);
        setApprovalStatus('error');
      }
    }
    fetchApprovalStatus();
  }, []);

  useEffect(() => {
    async function fetchDashboardStats() {
      if (approvalStatus !== 'approved') {
        setIsLoadingStats(false);
        return;
      }
      try {
        setIsLoadingStats(true);
        const res = await fetch("/api/doctor/dashboard-stats", { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setDashboardStats({
            todayTotal: data.todayTotal || 0,
            pending: data.pending || 0,
            completed: data.completed || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    }
    if (approvalStatus) fetchDashboardStats();
  }, [approvalStatus]);

  useEffect(() => {
    async function fetchAppointmentsAndCalendar() {
      if (approvalStatus !== 'approved') {
        setIsLoadingData(false);
        return;
      }
      try {
        setIsLoadingData(true);
        const res = await fetch("/api/doctor/appointments-data", { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setTodayAppointments(data.todayAppointments || []);
          setWeeklyCalendar(data.weeklyStats || []);
        } else if (res.status === 401) {
          setTodayAppointments([]);
          setWeeklyCalendar([]);
        } else {
          setTodayAppointments([]);
          setWeeklyCalendar([]);
        }
      } catch (error) {
        console.error("Network or parsing error fetching appointments data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }
    if (approvalStatus === 'approved') fetchAppointmentsAndCalendar();
  }, [approvalStatus]);

  const isNotApproved = approvalStatus !== 'approved';

  const healthMetrics = [
    { label: "今日預約", value: dashboardStats.todayTotal.toString(), icon: Calendar, color: "bg-blue-500" },
    { label: "已確認",   value: dashboardStats.pending.toString(),    icon: Clock,     color: "bg-yellow-500" },
    { label: "已完成",   value: dashboardStats.completed.toString(),  icon: Activity,  color: "bg-green-500" },
  ];

  return (
    <div className="relative min-h-screen bg-gray-50">

      {/* Sidebar 開關按鈕（sidebar 關閉時顯示） */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition "
          aria-label="開啟選單"
        >
          <Menu size={24} />
        </button>
      )}

      {/* 側邊欄 */}
      <DoctorSidebar 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        approvalStatus={approvalStatus}
      />

      {/* 主內容：sidebar 只在桌機版推移，手機版 overlay 不推移 */}
      <div className={`transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"}`}>

        {/* 頂部導覽列 */}
        <Navbar sidebarOpen={isOpen} />

        {/* 頁面主體 */}
        <div className="p-4 sm:p-6 lg:p-8">

          {/* 未核准提示框 */}
          {isNotApproved && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
              <div className="flex items-start sm:items-center gap-3">
                <Bell className="text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0" size={24} />
                <div>
                  <h4 className="text-yellow-800 font-semibold text-base sm:text-lg mb-1">
                    帳號審核中
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    您的醫師帳號正在審核中，待核准後即可開始使用此頁面的所有功能。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 統計卡片：手機 1 欄，平板以上 3 欄 */}
          <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {healthMetrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div
                  key={idx}
                  className="bg-[var(--color-lime-cream)]/20 rounded-xl shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${metric.color} p-3 rounded-lg`}>
                      <Icon size={24} className="text-white" />
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {isNotApproved || isLoadingStats ? "0" : metric.value}
                  </p>
                  {isLoadingStats && !isNotApproved && (
                    <p className="text-xs text-gray-400 mt-1">載入中...</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* 今日預約 + 本週日曆：手機 1 欄，桌機 3 欄 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* 今日預約 */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">今日預約</h3>
                <button className="text-[var(--color-azure)] text-sm font-medium hover:underline">
                  查看全部
                </button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {isNotApproved || isLoadingData ? (
                  <div className="text-center py-8 text-gray-500">
                    {isLoadingData && !isNotApproved ? (
                      <div className="flex justify-center items-center">
                        <Activity size={24} className="animate-spin mr-3 opacity-50" />
                        <p>預約資料載入中...</p>
                      </div>
                    ) : (
                      <>
                        <Users size={48} className="mx-auto mb-3 opacity-50" />
                        <p>{isNotApproved ? '待核准後即可查看預約資訊' : '目前沒有今日預約'}</p>
                      </>
                    )}
                  </div>
                ) : (
                  todayAppointments.length > 0 ? (
                    todayAppointments.map((apt) => (
                      <div
                        key={apt.appointment_id}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0 text-sm sm:text-base">
                          {apt.patient_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{apt.patient_name}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {apt.symptoms.substring(0, 15)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-gray-800 text-sm sm:text-base">{apt.time}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(apt.status)}`}>
                            {getStatusText(apt.status)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto mb-3 opacity-50" />
                      <p>今天沒有任何預約</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* 本週日曆 */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">本週日曆</h3>
              <div className="space-y-2 sm:space-y-3">
                {isNotApproved || isLoadingData ? (
                  <div className="text-center py-8 text-gray-500">
                    {isLoadingData && !isNotApproved ? (
                      <div className="flex justify-center items-center">
                        <Activity size={24} className="animate-spin mr-3 opacity-50" />
                        <p>日曆資料載入中...</p>
                      </div>
                    ) : (
                      <>
                        <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                        <p>{isNotApproved ? '待核准後即可查看日曆' : '無法載入日曆資料'}</p>
                      </>
                    )}
                  </div>
                ) : (
                  weeklyCalendar.length > 0 ? (
                    weeklyCalendar.map((item) => {
                      const { dayName, dateOfMonth, isToday } = getDayNameAndDate(item.date_day);
                      return (
                        <div
                          key={item.date_day}
                          className={`p-3 rounded-lg ${isToday ? "bg-blue-200 text-gray-800" : "bg-blue-100"}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${isToday ? 'text-[var(--color-mahogany)]' : 'text-gray-700'}`}>
                              星期{dayName}
                            </span>
                            <span className="text-sm">{dateOfMonth}日</span>
                          </div>
                          <p className={`text-xs mt-1 opacity-80 ${isToday ? 'text-[var(--color-mahogany)]' : 'text-gray-600'}`}>
                            {item.total_appointments} 個預約
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                      <p>本週沒有任何預約</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 快速操作：手機 2 欄，平板以上 4 欄 */}
          <div className="mt-6 sm:mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-100">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">快速操作</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { href: "/facetime",     icon: Video,     color: "text-blue-600",   label: "開始視訊" },
                { href: "/schedules",    icon: Calendar,  color: "text-green-600",  label: "新增排程" },
                { href: "/recordoc",     icon: FileText,  color: "text-orange-600", label: "查看預約紀錄" },
                { href: "/patientmanage",icon: Users,     color: "text-purple-600", label: "查看患者/寫病歷" },
              ].map(({ href, icon: Icon, color, label }) => (
                <a
                  key={href}
                  href={isNotApproved ? "#" : href}
                  className={`bg-white hover:bg-blue-50 rounded-lg p-4 sm:p-6 transition-all flex flex-col items-center justify-center shadow-sm border border-gray-200 ${
                    isNotApproved ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  }`}
                  onClick={(e) => isNotApproved && e.preventDefault()}
                >
                  <Icon size={28} className={`mb-2 sm:mb-3 ${color}`} />
                  <p className="text-xs sm:text-sm font-semibold text-center text-gray-800 leading-tight">{label}</p>
                </a>
              ))}
            </div>
          </div>
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
};

export default TelemedicineDashboard;