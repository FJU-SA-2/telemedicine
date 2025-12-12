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
  const [isLoadingData, setIsLoadingData] = useState(true); // 新增：用於預約和日曆
  
  // 儀表板統計數據
  const [dashboardStats, setDashboardStats] = useState({
    todayTotal: 0,
    pending: 0,
    completed: 0
  });

  // 真實預約資料 (替代原來的假資料 `appointments`)
  const [todayAppointments, setTodayAppointments] = useState([]);

  // 本週日曆資料
  const [weeklyCalendar, setWeeklyCalendar] = useState([]);
  
  // 臺灣星期對應
  const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

  // --- Utility Functions ---

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
      case "confirmed":
        return "已確認";
      case "pending":
        return "待確認";
      case "completed":
        return "已完成";
      case "已取消":
        return "已取消";
      default:
        return status;
    }
  };
  
  const getDayNameAndDate = (dateString) => {
    const date = new Date(dateString);
    const dayName = dayNames[date.getDay()];
    const dateOfMonth = date.getDate();
    const isToday = date.toDateString() === new Date().toDateString();

    return { dayName, dateOfMonth, isToday };
  };

  // --- Fetching Logic ---

  // 1. 獲取醫師審核狀態
  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", { credentials: 'include' });
        const data = await res.json();
        
        if (data.authenticated && data.user && data.user.role === 'doctor') {
          setApprovalStatus(data.user.approval_status);
        } else {
          // 處理未登入或非醫師的情況
          setApprovalStatus('unauthorized');
        }
      } catch (error) {
        console.error("Failed to fetch approval status:", error);
        setApprovalStatus('error');
      }
    }
    fetchApprovalStatus();
  }, []);

  // 2. 獲取儀表板統計數據 (未修改，保留原邏輯)
  useEffect(() => {
    async function fetchDashboardStats() {
      if (approvalStatus !== 'approved') {
        setIsLoadingStats(false);
        return;
      }

      try {
        setIsLoadingStats(true);
        // **注意: 這裡假設 /api/doctor/dashboard-stats 仍然存在並提供統計數據**
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

    if (approvalStatus) {
      fetchDashboardStats();
    }
  }, [approvalStatus]);

  // 3. 獲取今天的預約和本週日曆數據 (新增主要邏輯)
  useEffect(() => {
    async function fetchAppointmentsAndCalendar() {
      if (approvalStatus !== 'approved') {
        setIsLoadingData(false);
        return;
      }

      try {
        setIsLoadingData(true);
        // **注意: 這裡使用您新創建的 API 端點**
        const res = await fetch("/api/doctor/appointments-data", { credentials: 'include' });
        
        if (res.ok) {
          const data = await res.json();
          
          // 更新今日預約
          setTodayAppointments(data.todayAppointments || []);
          
          // 更新本週日曆統計
          setWeeklyCalendar(data.weeklyStats || []);

        } else if (res.status === 401) {
            // 處理未授權
            console.warn("Doctor data fetch unauthorized.");
            setTodayAppointments([]);
            setWeeklyCalendar([]);
        } else {
             // 處理其他錯誤
            console.error("Failed to fetch appointments and calendar data.");
            setTodayAppointments([]);
            setWeeklyCalendar([]);
        }

      } catch (error) {
        console.error("Network or parsing error fetching appointments data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }

    if (approvalStatus === 'approved') {
      fetchAppointmentsAndCalendar();
    }
  }, [approvalStatus]);

  // 判斷是否為未核准狀態
  const isNotApproved = approvalStatus !== 'approved';

  // 將 stats 數據放入 healthMetrics，用於卡片渲染
  const healthMetrics = [
    { 
      label: "今日預約", 
      value: dashboardStats.todayTotal.toString(), 
      icon: Calendar, 
      color: "bg-blue-500" 
    },
    { 
      label: "已確認", 
      value: dashboardStats.pending.toString(), 
      icon: Clock, 
      color: "bg-yellow-500" 
    },
    { 
      label: "已完成", 
      value: dashboardStats.completed.toString(), 
      icon: Activity, 
      color: "bg-green-500" 
    },
  ];


  return (
    
    <div className="relative min-h-screen bg-[var(--color-azure)]/5">
      {/* Sidebar 開關按鈕（只在 Sidebar 關閉時顯示） */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
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

      {/* 主內容 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        {/* 頂部導覽列 */}
        <Navbar />

        <div className="p-8">
          {/* 未核准提示框 */}
          {isNotApproved && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Bell className="text-yellow-600 mr-3" size={24} />
                <div>
                  <h4 className="text-yellow-800 font-semibold text-lg mb-1">
                    帳號審核中
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    您的醫師帳號正在審核中，待核准後即可開始使用此頁面的所有功能。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 統計卡片 */}
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
              {healthMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={idx}
                    className="bg-[var(--color-lime-cream)]/20 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 今日預約 - 使用真實數據 `todayAppointments` */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">今日預約</h3>
                <button className="text-[var(--color-azure)] text-sm font-medium hover:underline">
                  查看全部
                </button>
              </div>
              <div className="space-y-4">
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
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {apt.patient_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{apt.patient_name}</p>
                          <p className="text-sm text-gray-500">
                            {/* 假設 symptoms 欄位用於描述預約類型，否則這裡可能需要 patient 表中其他欄位 */}
                            {apt.symptoms.substring(0, 15)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">{apt.time}</p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(apt.status)}`}
                          >
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

            {/* 本週日曆 - 使用真實數據 `weeklyCalendar` */}
            <div className="bg-[var(--color-periwinkle)]/30 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">本週日曆</h3>
              <div className="space-y-3">
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
                    weeklyCalendar.map((item, idx) => {
                      const { dayName, dateOfMonth, isToday } = getDayNameAndDate(item.date_day);
                      return (
                        <div
                          key={item.date_day}
                          className={`p-3 rounded-lg ${
                            // 更改今日強調色為 COLOR_MAHOGANY，非今日背景色為 COLOR_LIGHT_CYAN
                            isToday ? "bg-[var(--color-mahogany)]/20 text-gray-800" : "bg-[var(--color-light-cyan)]/30"
                          }`}
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

         {/* 快速操作 */}
          <div className="mt-8 bg-[var(--color-mahogany)]/10 rounded-xl shadow-lg p-6 ">
            <h3 className="text-xl font-bold mb-4">快速操作</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a 
                href={isNotApproved ? "#" : "/facetime"}
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-6 transition-all flex flex-col items-center justify-center ${
                  isNotApproved ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
                onClick={(e) => isNotApproved && e.preventDefault()}
              >
                <Video size={32} className="mb-3" />
                <p className="text-base font-semibold text-center">開始視訊</p>
              </a>
              <a 
                href={isNotApproved ? "#" : "/schedules"}
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-6 transition-all flex flex-col items-center justify-center ${
                  isNotApproved ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
                onClick={(e) => isNotApproved && e.preventDefault()}
              >
                <Calendar size={32} className="mb-3" />
                <p className="text-base font-semibold text-center">新增排班</p>
              </a>
              <a 
                href={isNotApproved ? "#" : "/patientmanage"}
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-6 transition-all flex flex-col items-center justify-center ${
                  isNotApproved ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
                onClick={(e) => isNotApproved && e.preventDefault()}
              >
                <FileText size={32} className="mb-3" />
                <p className="text-base font-semibold text-center">寫病歷</p>
              </a>
              <a 
                href={isNotApproved ? "#" : "/patientmanage"}
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-6 transition-all flex flex-col items-center justify-center ${
                  isNotApproved ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
                onClick={(e) => isNotApproved && e.preventDefault()}
              >
                <Users size={32} className="mb-3" />
                <p className="text-base font-semibold text-center">查看患者</p>
              </a>
              
            </div>
          </div>
        </div>
      </div>
    {/* Footer */}
        <div className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400">
              © 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
            </p>
          </div>
        </div>
    </div>
  );
};

export default TelemedicineDashboard;