"use client";
import React, { useState } from "react";
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

  // 模擬預約資料
  const appointments = [
    { id: 1, patient: "王小明", time: "09:00", type: "視訊諮詢", status: "confirmed" },
    { id: 2, patient: "李雅婷", time: "10:30", type: "追蹤回診", status: "pending" },
    { id: 3, patient: "陳大衛", time: "14:00", type: "初診", status: "confirmed" },
    { id: 4, patient: "林美玲", time: "15:30", type: "檢查報告", status: "completed" },
  ];

  // 儀表板統計數據
  const healthMetrics = [
    { label: "今日預約", value: "8", change: "+2", icon: Calendar, color: "bg-blue-500" },
    { label: "待處理", value: "3", change: "-1", icon: Clock, color: "bg-yellow-500" },
    { label: "已完成", value: "5", change: "+3", icon: Activity, color: "bg-green-500" },
    { label: "總患者數", value: "142", change: "+8", icon: Users, color: "bg-purple-500" },
  ];

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

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Sidebar 開關按鈕（只在 Sidebar 關閉時顯示） */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-700 z-50 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white"
        >
          <Menu size={24} />
        </button>
      )}

      {/* 側邊欄 */}
      <DoctorSidebar isOpen={isOpen} setIsOpen={setIsOpen} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 主內容 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        {/* 頂部導覽列 */}
        <Navbar />

        <div className="flex-1 overflow-auto p-8">
          

          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    <span className="text-sm font-medium text-green-600">{metric.change}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{metric.value}</p>
                </div>
              );
            })}
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
                {appointments.map((apt) => (
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
                ))}
              </div>
            </div>

            {/* 本週日曆 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">本週日曆</h3>
              <div className="space-y-3">
                {["一", "二", "三", "四", "五"].map((day, idx) => (
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
                      {idx === 0
                        ? "8 個預約"
                        : `${Math.floor(Math.random() * 5) + 3} 個預約`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-black">
            <h3 className="text-xl font-bold mb-4">快速操作</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all">
                <Video size={24} className="mb-2" />
                <p className="text-sm font-medium">開始視訊</p>
              </button>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all">
                <Calendar size={24} className="mb-2" />
                <p className="text-sm font-medium">新增預約</p>
              </button>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all">
                <FileText size={24} className="mb-2" />
                <p className="text-sm font-medium">寫病歷</p>
              </button>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all">
                <Users size={24} className="mb-2" />
                <p className="text-sm font-medium">查看患者</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemedicineDashboard;
