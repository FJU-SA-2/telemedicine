"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import DoctorSidebar from "../components/DoctorSidebar";
import {
  Calendar,
  Users,
  Video,
  FileText,
  Menu,
  Clock,
  XCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const TelemedicineDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [isOpen, setIsOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/me", {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user.doctorProfile) {
          setApprovalStatus(data.user.doctorProfile.approval_status);
        }
      } else {
        window.location.href = '/auth';
      }
    } catch (err) {
      console.error("取得用戶資料失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  // 模擬預約資料(僅審核通過才顯示)
  const appointments = approvalStatus === 'approved' ? [
    { id: 1, patient: "王小明", time: "09:00", type: "視訊諮詢", status: "confirmed" },
    { id: 2, patient: "李雅婷", time: "10:30", type: "追蹤回診", status: "pending" },
    { id: 3, patient: "陳大衛", time: "14:00", type: "初診", status: "confirmed" },
    { id: 4, patient: "林美玲", time: "15:30", type: "檢查報告", status: "completed" },
  ] : [];

  const healthMetrics = approvalStatus === 'approved' ? [
    { label: "今日預約", value: "8", change: "+2", icon: Calendar, color: "bg-blue-500" },
    { label: "待處理", value: "3", change: "-1", icon: Clock, color: "bg-yellow-500" },
    { label: "已完成", value: "5", change: "+3", icon: CheckCircle, color: "bg-green-500" },
    { label: "總患者數", value: "142", change: "+8", icon: Users, color: "bg-purple-500" },
  ] : [
    { label: "今日預約", value: "—", change: "", icon: Calendar, color: "bg-gray-400" },
    { label: "待處理", value: "—", change: "", icon: Clock, color: "bg-gray-400" },
    { label: "已完成", value: "—", change: "", icon: CheckCircle, color: "bg-gray-400" },
    { label: "總患者數", value: "—", change: "", icon: Users, color: "bg-gray-400" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed": return "已確認";
      case "pending": return "待確認";
      case "completed": return "已完成";
      default: return status;
    }
  };

  // 審核狀態橫幅
  const renderApprovalBanner = () => {
    if (approvalStatus === 'approved') {
      return (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <CheckCircle className="text-green-600 mr-3" size={24} />
            <div>
              <p className="text-green-900 font-semibold">✅ 您的帳號已通過審核</p>
              <p className="text-green-700 text-sm">您現在可以使用所有醫生功能</p>
            </div>
          </div>
        </div>
      );
    }

    if (approvalStatus === 'pending') {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <Clock className="text-yellow-600 mr-4" size={32} />
            <div className="flex-1">
              <p className="text-yellow-900 font-bold text-lg mb-2">⏳ 您的帳號正在審核中</p>
              <p className="text-yellow-800 mb-2">
                管理員將在 <strong>1-3 個工作天</strong>內完成審核,審核通過後您將收到 Email 通知
              </p>
              <div className="bg-yellow-100 p-3 rounded-lg mt-3">
                <p className="text-yellow-900 font-medium text-sm">⚠️ 審核期間的功能限制:</p>
                <ul className="text-yellow-800 text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>無法設定排班時間</li>
                  <li>無法接受患者預約</li>
                  <li>無法進行視訊看診</li>
                  <li>無法查看患者資料</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (approvalStatus === 'rejected') {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <XCircle className="text-red-600 mr-4" size={32} />
            <div className="flex-1">
              <p className="text-red-900 font-bold text-lg mb-2">❌ 您的註冊申請已被拒絕</p>
              <p className="text-red-800 mb-2">
                請聯繫管理員了解詳情
              </p>
              <p className="text-red-700 text-sm">
                📧 Email: telemedicine.medongo@gmail.com
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-700 z-50 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white"
        >
          <Menu size={24} />
        </button>
      )}

      <DoctorSidebar isOpen={isOpen} setIsOpen={setIsOpen} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        <div className="flex-1 overflow-auto p-8">
          {/* 審核狀態橫幅 */}
          {renderApprovalBanner()}

          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {healthMetrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow ${
                    approvalStatus !== 'approved' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${metric.color} p-3 rounded-lg`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    {metric.change && (
                      <span className="text-sm font-medium text-green-600">{metric.change}</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{metric.value}</p>
                </div>
              );
            })}
          </div>

          {approvalStatus === 'approved' ? (
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
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">審核通過後即可查看預約資料</p>
            </div>
          )}

          {/* 快速操作 */}
          <div className={`mt-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white ${
            approvalStatus !== 'approved' ? 'opacity-60 cursor-not-allowed' : ''
          }`}>
            <h3 className="text-xl font-bold mb-4">快速操作</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                disabled={approvalStatus !== 'approved'}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Video size={24} className="mb-2" />
                <p className="text-sm font-medium">開始視訊</p>
              </button>
              <button 
                disabled={approvalStatus !== 'approved'}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar size={24} className="mb-2" />
                <p className="text-sm font-medium">新增預約</p>
              </button>
              <button 
                disabled={approvalStatus !== 'approved'}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={24} className="mb-2" />
                <p className="text-sm font-medium">寫病歷</p>
              </button>
              <button 
                disabled={approvalStatus !== 'approved'}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
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