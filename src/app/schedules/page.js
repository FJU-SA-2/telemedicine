"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import DoctorSidebar from "../components/DoctorSidebar";
import { Clock, Save, ChevronLeft, ChevronRight, Menu, Sunrise, Sun, Moon, Eye, Building2, Lock } from "lucide-react";

export default function DoctorSchedulePage() {
    const [doctor_id, setDoctorId] = useState(null);
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - today.getDay());
        return sunday;
    });
    const [schedules, setSchedules] = useState({});
    const [appointments, setAppointments] = useState({});
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("home");
    const [isOpen, setIsOpen] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState(null);
    const [hoveredSlot, setHoveredSlot] = useState(null);

    // ── 新增：所屬院所狀態 ────────────────────────────────────────────
    const [hasMechanism, setHasMechanism] = useState(false);       // 是否有所屬機構
    const [mechanismName, setMechanismName] = useState(null);      // 機構名稱
    const [viewOnly, setViewOnly] = useState(false);               // 唯讀模式

    const timeSlots = [
        "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00",
        "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
    ];

    const timeSlotGroups = {
        morning: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
        afternoon: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"],
        evening: ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]
    };

    // ── 取得審核狀態 ─────────────────────────────────────────────────
    useEffect(() => {
        async function fetchApprovalStatus() {
            try {
                const res = await fetch("/api/me", { credentials: 'include' });
                const data = await res.json();
                if (data.authenticated && data.user && data.user.role === 'doctor') {
                    setApprovalStatus(data.user.approval_status);
                }
            } catch (error) {
                console.error("❌ fetchApprovalStatus 發生錯誤:", error);
            }
        }
        fetchApprovalStatus();
    }, []);

    // ── 取得醫師 ID & 所屬機構狀態 ──────────────────────────────────
    useEffect(() => {
        const fetchDoctorId = async () => {
            try {
                const res = await fetch("/api/me", { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.user.role === 'doctor') {
                        const doctorRes = await fetch(
                            `/api/doctor/profile?user_id=${data.user.user_id}`,
                            { credentials: 'include' }
                        );
                        if (doctorRes.ok) {
                            const doctorData = await doctorRes.json();
                            setDoctorId(doctorData.doctor_id);
                            // mechanism_id 有值 → 唯讀模式，不需要額外 API
                            if (doctorData.mechanism_id) {
                                setViewOnly(true);
                                setHasMechanism(true);
                                setMechanismName(doctorData.mechanism_name || "所屬機構");
                            }
                        } else {
                            const errorData = await doctorRes.json();
                            console.error('❌ 取得醫師資料失敗:', errorData);
                            alert(`無法取得醫師資料: ${errorData.message}`);
                        }

                    } else {
                        alert('請先以醫師身份登入');
                        window.location.href = '/auth';
                    }
                } else {
                    alert('請先登入');
                    window.location.href = '/auth';
                }
            } catch (err) {
                console.error("❌ 取得 doctor_id 失敗:", err);
                alert('無法連接到伺服器,請檢查網路連線');
            }
        };
        fetchDoctorId();
    }, []);

    const getWeekDates = (startDate) => {
        const dates = [];
        const weekDays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");
            dates.push({
                day: weekDays[date.getDay()],
                date: dd,
                fullDate: `${yyyy}-${mm}-${dd}`
            });
        }
        return dates;
    };

    const weekDates = getWeekDates(currentWeekStart);

    const getWeekRangeText = () => {
        const start = weekDates[0];
        const end = weekDates[6];
        return `${start.fullDate.substring(5).replace('-', '月')}日 - ${end.fullDate.substring(5).replace('-', '月')}日`;
    };

    const isTimeSlotPast = (dateString, timeString) => {
        const now = new Date();
        const [year, month, day] = dateString.split('-').map(Number);
        const [hour, minute] = timeString.split(':').map(Number);
        const slotDateTime = new Date(year, month - 1, day, hour, minute);
        return slotDateTime < now;
    };

    useEffect(() => {
        async function loadSchedulesAndAppointments() {
            if (!doctor_id || !weekDates || weekDates.length === 0) return;

            const startDate = weekDates[0].fullDate;
            const endDate = weekDates[6].fullDate;

            try {
                const scheduleRes = await fetch(
                    `/api/schedules/${doctor_id}?start_date=${startDate}&end_date=${endDate}`,
                    { credentials: 'include' }
                );

                if (!scheduleRes.ok) throw new Error("抓取排班失敗");
                const scheduleData = await scheduleRes.json();

                const appointmentRes = await fetch(
                    `/api/doctor/appointments/${doctor_id}?start_date=${startDate}&end_date=${endDate}`,
                    { credentials: 'include' }
                );
                const appointmentData = appointmentRes.ok ? await appointmentRes.json() : [];

                const newSchedules = {};
                const newAppointments = {};

                weekDates.forEach(day => {
                    newSchedules[day.fullDate] = {};
                    newAppointments[day.fullDate] = {};
                    timeSlots.forEach(time => {
                        newSchedules[day.fullDate][time] = false;
                        newAppointments[day.fullDate][time] = null;
                    });
                });

                if (Array.isArray(scheduleData)) {
                    scheduleData.forEach(item => {
                        if (!item.schedule_date || !item.time_slot) return;
                        const date = item.schedule_date.slice(0, 10);
                        let [h, m] = item.time_slot.split(':');
                        if (h.length === 1) h = '0' + h;
                        const timeSlot = `${h}:${m}`;
                        if (newSchedules[date] && timeSlots.includes(timeSlot)) {
                            newSchedules[date][timeSlot] = !!item.is_available && item.is_available !== 0 && item.is_available !== "0";
                        }
                    });
                }

                if (Array.isArray(appointmentData)) {
                    appointmentData.forEach(apt => {
                        const date = apt.appointment_date.slice(0, 10);
                        const time = apt.appointment_time.slice(0, 5);
                        if (newAppointments[date] && newAppointments[date].hasOwnProperty(time)) {
                            newAppointments[date][time] = {
                                patient_name: `${apt.patient_last_name}${apt.patient_first_name}`,
                                symptoms: apt.symptoms || '無',
                                status: apt.status,
                                appointment_id: apt.appointment_id
                            };
                        }
                    });
                }

                setSchedules(newSchedules);
                setAppointments(newAppointments);

            } catch (err) {
                console.error('❌ 載入資料失敗:', err);
                alert("載入資料失敗");
            }
        }
        loadSchedulesAndAppointments();
    }, [currentWeekStart, doctor_id]);

    // ── 操作函式（唯讀時阻擋） ────────────────────────────────────────
    const toggleSlot = (date, time) => {
        if (viewOnly) return; // ← 有機構 → 阻擋
        if (isTimeSlotPast(date, time)) {
            alert('無法設定已過期的排班時段');
            return;
        }
        const isBooked = !!appointments[date]?.[time];
        const currentStatus = schedules[date]?.[time] ?? false;
        if (isBooked && currentStatus === true) {
            alert('此時段已有預約，無法設為休診');
            return;
        }
        setSchedules(prev => {
            const newSchedules = { ...prev };
            if (!newSchedules[date]) newSchedules[date] = {};
            newSchedules[date][time] = !currentStatus;
            return newSchedules;
        });
    };

    const setQuickSchedule = (date, period, value) => {
        if (viewOnly) return;
        const slots = timeSlotGroups[period];
        if (!slots) return;
        setSchedules(prev => {
            const newSchedules = { ...prev };
            if (!newSchedules[date]) newSchedules[date] = {};
            slots.forEach(time => {
                if (timeSlots.includes(time) && !appointments[date]?.[time]) {
                    if (!isTimeSlotPast(date, time)) {
                        newSchedules[date][time] = value;
                    }
                }
            });
            return newSchedules;
        });
    };

    const setWholeDay = (date, value) => {
        if (viewOnly) return;
        setSchedules(prev => {
            const newSchedules = { ...prev };
            const updatedDate = { ...newSchedules[date] };
            timeSlots.forEach(time => {
                if (!appointments[date]?.[time] && !isTimeSlotPast(date, time)) {
                    updatedDate[time] = value;
                }
            });
            newSchedules[date] = updatedDate;
            return newSchedules;
        });
    };

    const saveSchedules = async () => {
        if (viewOnly) {
            alert('您已加入院所，排班由院所管理，無法自行修改');
            return;
        }
        if (!doctor_id) {
            alert('無法取得醫師 ID');
            return;
        }
        setLoading(true);
        try {
            const scheduleList = [];
            Object.keys(schedules).forEach(date => {
                Object.keys(schedules[date]).forEach(time => {
                    if (schedules[date][time] === true) {
                        scheduleList.push({ date, time_slot: time + ":00", is_available: 1 });
                    }
                });
            });

            const res = await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctor_id,
                    schedules: scheduleList,
                    week_start: weekDates[0].fullDate,
                    week_end: weekDates[6].fullDate
                })
            });

            if (res.ok) {
                const result = await res.json();
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                if (result.warning) alert(`${result.message}\n\n${result.warning}`);
            } else {
                const text = await res.text();
                let errMsg = `HTTP ${res.status}`;
                try { const error = JSON.parse(text); errMsg = error.error || error.message || errMsg; } catch (_) {}
                alert(`儲存失敗: ${errMsg}`);
            }
        } catch (error) {
            console.error("儲存排班失敗:", error);
            alert('儲存排班失敗,請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const isSlotAvailable = (date, time) => schedules[date]?.[time] ?? false;
    const isSlotBooked = (date, time) => !!appointments[date]?.[time];

    const previousWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const nextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const goToCurrentWeek = () => {
        const today = new Date();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - today.getDay());
        setCurrentWeekStart(sunday);
    };

    const getSlotStyle = (date, time) => {
        const isPast = isTimeSlotPast(date, time);
        const isBooked = isSlotBooked(date, time);
        const isAvailable = isSlotAvailable(date, time);

        if (isPast) return "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50";
        if (isBooked) return "bg-red-500 text-white cursor-pointer hover:bg-red-600";
        if (isAvailable) return `bg-green-500 text-white ${viewOnly ? 'cursor-default' : 'hover:bg-green-600 cursor-pointer'}`;
        return `bg-gray-200 text-gray-600 ${viewOnly ? 'cursor-default' : 'hover:bg-gray-300 cursor-pointer'}`;
    };

    const getSlotText = (date, time) => {
        const isPast = isTimeSlotPast(date, time);
        const isBooked = isSlotBooked(date, time);
        const isAvailable = isSlotAvailable(date, time);

        if (isPast) return "已過期";
        if (isBooked) return "已預約";
        if (isAvailable) return "開診";
        return "休診";
    };

    return (
        <div className="relative min-h-screen bg-gray-50">
            {!isOpen && (
                <button onClick={() => setIsOpen(true)}
                    className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition">
                    <Menu size={24} />
                </button>
            )}

            <DoctorSidebar
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                approvalStatus={approvalStatus}
            />

            <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
                <Navbar setIsSidebarOpen={setIsOpen} />
                <div className="p-6">

                    {saveSuccess && (
                        <div className="fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
                            <Save size={20} /> 排班儲存成功!
                        </div>
                    )}

                    {/* ── 唯讀提示橫幅 ────────────────────────────────── */}
                    {viewOnly && (
                        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-start gap-3">
                            <div className="mt-0.5">
                                <Building2 size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                    <Lock size={14} /> 排班由院所管理（僅供檢視）
                                </p>
                                <p className="text-sm text-blue-600 mt-0.5">
                                    您目前隸屬於 <strong>{mechanismName}</strong>，排班由院所負責安排，您只能查看不能修改。
                                    如有疑問請聯絡所屬院所。
                                </p>
                            </div>
                            <div className="ml-auto">
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Eye size={12} /> 檢視模式
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ── 週導覽 ────────────────────────────────────────── */}
                    <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex items-center justify-between">
                        <button onClick={previousWeek} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <ChevronLeft size={20} /> 上一週
                        </button>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-gray-800">{getWeekRangeText()}</div>
                            <button onClick={goToCurrentWeek} className="text-sm text-blue-600 hover:text-blue-700 mt-1">回到本週</button>
                        </div>
                        <button onClick={nextWeek} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            下一週 <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* ── 圖例 ────────────────────────────────────────── */}
                    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                        <div className="flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span className="text-gray-500">開診</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                <span className="text-gray-500">休診</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span className="text-gray-500">已預約</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                                <span className="text-gray-500">已過期</span>
                            </div>
                        </div>
                    </div>

                    {/* ── 排班表 ──────────────────────────────────────── */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                週排班表
                                {viewOnly && (
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Eye size={11} /> 僅供檢視
                                    </span>
                                )}
                            </h2>
                            {!viewOnly ? (
                                <button onClick={saveSchedules} disabled={loading || !doctor_id}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    <Save size={18} /> {loading ? "儲存中..." : "儲存排班"}
                                </button>
                            ) : (
                                <span className="text-sm text-gray-400 flex items-center gap-1.5 bg-gray-50 px-4 py-2 rounded-lg border">
                                    <Lock size={14} /> 院所管理中
                                </span>
                            )}
                        </div>

                        {/* 表頭 */}
                        <div className="grid grid-cols-8 gap-3 mb-4">
                            <div className="font-medium text-gray-700 flex items-center">
                                <Clock size={18} className="mr-2" />時段
                            </div>
                            {weekDates.map(item => (
                                <div key={item.fullDate} className="text-center">
                                    <div className="font-medium text-gray-700">{item.day}</div>
                                    <div className="text-sm text-gray-500">{item.date}日</div>

                                    {/* 快捷按鈕：唯讀時隱藏 */}
                                    {!viewOnly && (
                                        <>
                                            <div className="mt-2 flex gap-1 justify-center">
                                                <button onClick={() => setWholeDay(item.fullDate, true)}
                                                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                                                    title="全天開診">全開</button>
                                                <button onClick={() => setWholeDay(item.fullDate, false)}
                                                    className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    title="全天休診">全關</button>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                <button onClick={() => setQuickSchedule(item.fullDate, 'morning', true)}
                                                    className="w-full text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center justify-center gap-1">
                                                    <Sunrise size={12} /> 早
                                                </button>
                                                <button onClick={() => setQuickSchedule(item.fullDate, 'afternoon', true)}
                                                    className="w-full text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center justify-center gap-1">
                                                    <Sun size={12} /> 午
                                                </button>
                                                <button onClick={() => setQuickSchedule(item.fullDate, 'evening', true)}
                                                    className="w-full text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center justify-center gap-1">
                                                    <Moon size={12} /> 晚
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 時段格子 */}
                        <div className="space-y-2">
                            {timeSlots.map((time) => {
                                const isFirstMorning   = time === timeSlotGroups.morning[0];
                                const isFirstAfternoon = time === timeSlotGroups.afternoon[0];
                                const isFirstEvening   = time === timeSlotGroups.evening[0];
                                return (
                                    <div key={time}>
                                        {isFirstMorning && (
                                            <div className="flex items-center gap-2 border-t-2 border-amber-200 pt-1 pb-1 mb-1">
                                                <Sunrise size={14} className="text-amber-500" />
                                                <span className="text-xs font-medium text-amber-500">早上診</span>
                                            </div>
                                        )}
                                        {isFirstAfternoon && (
                                            <div className="flex items-center gap-2 border-t-2 border-orange-200 pt-1 pb-1 mb-1">
                                                <Sun size={14} className="text-orange-500" />
                                                <span className="text-xs font-medium text-orange-500">下午診</span>
                                            </div>
                                        )}
                                        {isFirstEvening && (
                                            <div className="flex items-center gap-2 border-t-2 border-indigo-200 pt-1 pb-1 mb-1">
                                                <Moon size={14} className="text-indigo-500" />
                                                <span className="text-xs font-medium text-indigo-500">晚間診</span>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-8 gap-3 items-center">
                                            <div className="font-medium text-gray-600 text-sm">{time}</div>
                                            {weekDates.map(item => {
                                                const isBooked = isSlotBooked(item.fullDate, time);
                                                const appointmentInfo = appointments[item.fullDate]?.[time];
                                                const slotKey = `${item.fullDate}-${time}`;
                                                const isPast = isTimeSlotPast(item.fullDate, time);

                                                return (
                                                    <div key={slotKey} className="relative"
                                                        onMouseEnter={() => isBooked && setHoveredSlot(slotKey)}
                                                        onMouseLeave={() => setHoveredSlot(null)}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (!isPast && !viewOnly) toggleSlot(item.fullDate, time);
                                                            }}
                                                            disabled={isPast || viewOnly && !isBooked}
                                                            className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${getSlotStyle(item.fullDate, time)}`}>
                                                            {getSlotText(item.fullDate, time)}
                                                        </button>

                                                        {isBooked && hoveredSlot === slotKey && appointmentInfo && (
                                                            <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none">
                                                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                                                    <div className="border-8 border-transparent border-t-gray-900"></div>
                                                                </div>
                                                                <div className="font-semibold mb-2 text-sm">預約資訊</div>
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-400">患者:</span>
                                                                        <span className="font-medium">{appointmentInfo.patient_name}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-400">狀態:</span>
                                                                        <span className={`font-medium ${
                                                                            appointmentInfo.status === '已確認' ? 'text-green-400' :
                                                                            appointmentInfo.status === '已完成' ? 'text-blue-400' :
                                                                            appointmentInfo.status === '已取消' ? 'text-red-400' :
                                                                            'text-yellow-400'
                                                                        }`}>{appointmentInfo.status}</span>
                                                                    </div>
                                                                    <div className="border-t border-gray-700 pt-1 mt-1">
                                                                        <span className="text-gray-400">症狀:</span>
                                                                        <div className="mt-1 text-gray-300">{appointmentInfo.symptoms}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400">
                        © 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
                    </p>
                </div>
            </div>
        </div>
    );
}