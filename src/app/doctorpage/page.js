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
  const [dashboardStats, setDashboardStats] = useState({
    todayTotal: 0,
    pending: 0,
    completed: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // 模擬預約資料
  const appointments = [
    { id: 1, patient: "王小明", time: "09:00", type: "視訊諮詢", status: "confirmed" },
    { id: 2, patient: "李雅婷", time: "10:30", type: "追蹤回診", status: "pending" },
    { id: 3, patient: "陳大衛", time: "14:00", type: "初診", status: "confirmed" },
    { id: 4, patient: "林美玲", time: "15:30", type: "檢查報告", status: "completed" },
  ];

  // 儀表板統計數據（使用真實數據）
  const healthMetrics = [
    { 
      label: "今日預約", 
      value: dashboardStats.todayTotal.toString(), 
      icon: Calendar, 
      color: "bg-blue-500" 
    },
    { 
      label: "待完成", 
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

  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", {
          credentials: 'include'
        });
        const data = await res.json();
        
        if (data.authenticated && data.user && data.user.role === 'doctor') {
          setApprovalStatus(data.user.approval_status);
        }
      } catch (error) {
        console.error("Failed to fetch approval status:", error);
      }
    }
    fetchApprovalStatus();
  }, []);

  // 獲取統計數據
  useEffect(() => {
    async function fetchDashboardStats() {
      if (approvalStatus !== 'approved') {
        setIsLoadingStats(false);
        return;
      }

      try {
        setIsLoadingStats(true);
        const res = await fetch("/api/doctor/dashboard-stats", {
          credentials: 'include'
        });
        
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

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
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
      default:
        return status;
    }
  };

  // 判斷是否為未核准狀態
  const isNotApproved = approvalStatus !== 'approved';

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Sidebar 開關按鈕（只在 Sidebar 關閉時顯示） */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 bg-white rounded-lg transition"
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

        <div className="flex-1 overflow-auto p-8">
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

          {/* 統計卡片 - 改為置中並使用真實數據 */}
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
              {healthMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
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
            {/* 今日預約 */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">今日預約</h3>
                <button className="text-blue-600 text-sm font-medium hover:underline">
                  查看全部
                </button>
              </div>
              <div className="space-y-4">
                {isNotApproved ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={48} className="mx-auto mb-3 opacity-50" />
                    <p>待核准後即可查看預約資訊</p>
                  </div>
                ) : (
                  appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {apt.patient.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{apt.patient}</p>
                        <p className="text-sm text-gray-500">{apt.type}</p>
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
                )}
              </div>
            </div>

            {/* 本週日曆 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">本週日曆</h3>
              <div className="space-y-3">
                {isNotApproved ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                    <p>待核准後即可查看日曆</p>
                  </div>
                ) : (
                  ["一", "二", "三", "四", "五"].map((day, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        idx === 0 ? "bg-blue-500 text-white" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">星期{day}</span>
                        <span className="text-sm">{25 + idx}日</span>
                      </div>
                      <p className="text-xs mt-1 opacity-80">
                        {idx === 0 ? "8 個預約" : `${[4, 6, 5, 3][idx] || 4} 個預約`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">快速操作</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all ${
                  isNotApproved ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isNotApproved}
              >
                <Video size={24} className="mb-2" />
                <p className="text-sm font-medium">開始視訊</p>
              </button>
              <button 
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all ${
                  isNotApproved ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isNotApproved}
              >
                <Calendar size={24} className="mb-2" />
                <p className="text-sm font-medium">新增預約</p>
              </button>
              <button 
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all ${
                  isNotApproved ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isNotApproved}
              >
                <FileText size={24} className="mb-2" />
                <p className="text-sm font-medium">寫病歷</p>
              </button>
              <button 
                className={`bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all ${
                  isNotApproved ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isNotApproved}
              >
                <Users size={24} className="mb-2" />
                <p className="text-sm font-medium">查看患者</p>
              </button>
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