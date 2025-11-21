"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCircle, Calendar, XCircle, MessageSquare } from "lucide-react";

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // 用變數代表是否為患者（Hooks 不可放在 if 裡）
  const isPatient = user && user.role === "patient";

  /* -------------------- Effect：載入通知 -------------------- */
  useEffect(() => {
    if (!isPatient) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [isPatient]);

  /* -------------------- Effect：點擊外部關閉下拉 -------------------- */
  useEffect(() => {
    if (!isPatient) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPatient]);

  /* -------------------- API：取得通知 -------------------- */
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error("載入通知失敗:", err);
    }
  };

  /* -------------------- API：單筆設為已讀 -------------------- */
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId
            ? { ...n, is_read: true }
            : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("標記已讀失敗:", err);
    }
  };

  /* -------------------- API：全部設為已讀 -------------------- */
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("全部標記已讀失敗:", err);
    }
  };

  /* -------------------- UI：點擊鈴鐺 -------------------- */
  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  /* -------------------- UI：通知圖示 -------------------- */
  const getIcon = (type) => {
    switch (type) {
      case "appointment_confirmed":
        return <CheckCircle size={18} className="text-green-500" />;
      case "appointment_cancelled":
        return <XCircle size={18} className="text-red-500" />;
      case "appointment_reminder":
        return <Calendar size={18} className="text-blue-500" />;
      case "feedback_resolved":
        return <MessageSquare size={18} className="text-purple-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "appointment_confirmed":
        return "預約成功";
      case "appointment_cancelled":
        return "預約取消";
      case "appointment_reminder":
        return "看診提醒";
      case "feedback_resolved":
        return "回報已處理";
      default:
        return "通知";
    }
  };

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

  /* -------------------- ⛔ 重要：在 return 層做條件，不提前 return -------------------- */
  if (!isPatient) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 鈴鐺按鈕 */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="通知"
      >
        <Bell size={22} className="text-gray-600" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 下拉通知面板 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* 標題列 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-bold text-gray-800">通知中心</h3>

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
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
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
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            notification.type === "appointment_confirmed"
                              ? "bg-green-100 text-green-700"
                              : notification.type === "appointment_cancelled"
                              ? "bg-red-100 text-red-700"
                              : notification.type === "appointment_reminder"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {getTypeLabel(notification.type)}
                        </span>

                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>

                      <p className="text-sm text-gray-800 font-medium truncate">
                        {notification.title}
                      </p>

                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
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
        </div>
      )}
    </div>
  );
}
