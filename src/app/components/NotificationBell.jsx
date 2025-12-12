"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCircle, Calendar, XCircle, MessageSquare, Clock, FileText } from "lucide-react";

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const authWarned = useRef(false); // 避免未登入重複噴錯

  const isPatient = user && user.role === "patient";
  const isDoctor = user && user.role === "doctor";
  const shouldShowBell = isPatient || isDoctor;

  // ✅ 確保只在客戶端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ==================== 初始載入通知 + 輪詢 ==================== */
  useEffect(() => {
    if (!shouldShowBell) return;

    console.log("🔔 初始化通知系統", { isPatient, isDoctor });
    fetchNotifications();
    
    const pollInterval = setInterval(() => {
      checkForNewNotifications();
    }, 5000); // 每5秒檢查一次

    return () => {
      clearInterval(pollInterval);
    };
  }, [shouldShowBell, isPatient, isDoctor]);

  /* ==================== 檢查新通知 (輪詢) ==================== */
  const checkForNewNotifications = async () => {
    try {
      // ✅ 根據角色選擇正確的 API 端點
      const endpoint = isDoctor ? "/api/doctor/notifications" : "/api/notifications";
      
      console.log("🔍 檢查新通知", { endpoint, isDoctor, isPatient });
      
      const res = await fetch(endpoint, { 
        credentials: "include",
        cache: 'no-cache'
      });
      
      if (res.status === 401) {
        if (!authWarned.current) {
          console.warn("ℹ️ 尚未登入，跳過通知輪詢");
          authWarned.current = true;
        }
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (!res.ok) {
        console.error("❌ 通知 API 錯誤:", res.status);
        return;
      }
      
      const data = await res.json();
      const newNotificationsList = data.notifications || [];
      
      console.log("📬 收到通知數量:", newNotificationsList.length);
      
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.notification_id));
        const brandNewNotifications = newNotificationsList.filter(
          n => !existingIds.has(n.notification_id)
        );
        
        if (brandNewNotifications.length > 0) {
          console.log('📬 發現新通知:', brandNewNotifications.length);
          return [...brandNewNotifications, ...prev];
        }
        
        return prev;
      });
      
      setUnreadCount(data.unread_count || 0);
      
    } catch (err) {
      console.error("❌ 檢查新通知失敗:", err);
    }
  };

  /* ==================== 獲取通知列表 ==================== */
  const fetchNotifications = async () => {
    try {
      // ✅ 根據角色選擇正確的 API 端點
      const endpoint = isDoctor ? "/api/doctor/notifications" : "/api/notifications";
      
      console.log("📥 獲取通知列表", { endpoint });
      
      const res = await fetch(endpoint, { 
        credentials: "include",
        cache: 'no-cache'
      });
      
      if (res.status === 401) {
        if (!authWarned.current) {
          console.warn("ℹ️ 尚未登入，跳過通知載入");
          authWarned.current = true;
        }
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (!res.ok) {
        console.error("❌ 獲取通知失敗:", res.status);
        return;
      }
      
      const data = await res.json();
      console.log("✅ 通知列表:", data);
      
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      
    } catch (err) {
      console.error("❌ 載入通知失敗:", err);
    }
  };

  /* ==================== 點擊外部關閉 ==================== */
  useEffect(() => {
    if (!shouldShowBell) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [shouldShowBell]);

  /* ==================== 標記單筆已讀 ==================== */
  const markAsRead = async (notificationId) => {
    try {
      // ✅ 根據角色選擇正確的 API 端點
      const endpoint = isDoctor 
        ? `/api/doctor/notifications/${notificationId}/read`
        : `/api/notifications/${notificationId}/read`;
        
      const res = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) return;

      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId
            ? { ...n, is_read: true }
            : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error("❌ 標記已讀失敗:", err);
    }
  };

  /* ==================== 全部標記已讀 ==================== */
  const markAllAsRead = async () => {
    try {
      // ✅ 根據角色選擇正確的 API 端點
      const endpoint = isDoctor 
        ? "/api/doctor/notifications/read-all"
        : "/api/notifications/read-all";
        
      const res = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) return;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
    } catch (err) {
      console.error("❌ 全部標記已讀失敗:", err);
    }
  };

  /* ==================== 獲取通知圖示 ==================== */
  const getIcon = (type) => {
    switch (type) {
      case "appointment_confirmed":
      case "new_appointment":
        return <CheckCircle size={18} className="text-green-500" />;
      case "appointment_cancelled":
        return <XCircle size={18} className="text-red-500" />;
      case "appointment_reminder":
        return <Clock size={18} className="text-orange-500" />;
      case "feedback_resolved":
      case "feedback_received":
        return <MessageSquare size={18} className="text-purple-500" />;
      case "consultation_reminder":
        return <FileText size={18} className="text-blue-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "appointment_confirmed":
        return "預約成功";
      case "new_appointment":
        return "新預約";
      case "appointment_cancelled":
        return "預約取消";
      case "appointment_reminder":
        return isDoctor ? "看診提醒" : "看診提醒";
      case "feedback_resolved":
        return "回報已處理";
      case "feedback_received":
        return "問題回報";
      case "consultation_reminder":
        return "請填寫醫囑";
      default:
        return "通知";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "appointment_confirmed":
      case "new_appointment":
        return "bg-green-100 text-green-700";
      case "appointment_cancelled":
        return "bg-red-100 text-red-700";
      case "appointment_reminder":
        return "bg-orange-100 text-orange-700";
      case "feedback_resolved":
      case "feedback_received":
        return "bg-purple-100 text-purple-700";
      case "consultation_reminder":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /* ==================== 格式化時間 ==================== */
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "剛剛";
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString("zh-TW");
  };

  /* ==================== 計算面板位置 ==================== */
  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: '64px', right: '16px' };
    
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`
    };
  };

  /* ==================== 渲染 ==================== */
  if (!shouldShowBell) return null;

  // ✅ 通知面板組件
  const NotificationPanel = () => {
    if (!isOpen || !mounted) return null;

    const position = getDropdownPosition();

    return createPortal(
      <div 
        ref={dropdownRef}
        className="fixed w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden animate-slideDown"
        style={{
          top: position.top,
          right: position.right,
          maxHeight: 'calc(100vh - 80px)'
        }}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Bell size={18} />
            通知中心 {isDoctor && "(醫師)"}
          </h3>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              全部標為已讀
            </button>
          )}
        </div>

        {/* 通知列表 */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Bell size={40} className="mx-auto mb-3 text-gray-300" />
              <p>目前沒有通知</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.notification_id}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.notification_id);
                  }
                }}
                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all ${
                  !notification.is_read ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(notification.type)}`}
                      >
                        {getTypeLabel(notification.type)}
                      </span>

                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      )}
                    </div>

                    <p className="text-sm text-gray-800 font-medium">
                      {notification.title}
                    </p>

                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap line-clamp-3">
                      {notification.message}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部 */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              關閉
            </button>
          </div>
        )}

        {/* 動畫樣式 */}
        <style jsx>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slideDown {
            animation: slideDown 0.2s ease-out;
          }
        `}</style>
      </div>,
      document.body
    );
  };

  return (
    <>
      {/* 鈴鐺按鈕 */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="通知"
      >
        <Bell 
          size={22} 
          className="text-gray-600 transition-all" 
        />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ✅ 使用 Portal 渲染通知面板到 body */}
      <NotificationPanel />
    </>
  );
}