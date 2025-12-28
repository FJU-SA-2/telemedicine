"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import DoctorSidebar from "../components/DoctorSidebar";
import { Clock, Save, ChevronLeft, ChevronRight, Menu } from "lucide-react";

export default function DoctorSchedulePage() {
    const [doctor_id, setDoctorId] = useState(null);
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - today.getDay());
        return sunday;
    });
    const [schedules, setSchedules] = useState({});
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("home");
    const [isOpen, setIsOpen] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState(null);

    const timeSlots = [
        "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00"
    ];

    useEffect(() => {
        async function fetchApprovalStatus() {
            try {
                const res = await fetch("/api/me", {
                    credentials: 'include'
                });
                const data = await res.json();
                
                if (data.authenticated && data.user && data.user.role === 'doctor') {
                    const status = data.user.approval_status;
                    setApprovalStatus(status);
                }
            } catch (error) {
                console.error("❌ fetchApprovalStatus 發生錯誤:", error);
            }
        }
        
        fetchApprovalStatus();
    }, []);
   
    useEffect(() => {
        const fetchDoctorId = async () => {
            try {
                const res = await fetch("/api/me", {
                    credentials: 'include'
                });

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

    // ⭐ 改進的過期判斷函數 - 精確到小時和分鐘
    const isTimeSlotPast = (dateString, timeString) => {
        const now = new Date();
        
        // 解析日期和時間
        const [year, month, day] = dateString.split('-').map(Number);
        const [hour, minute] = timeString.split(':').map(Number);
        
        // 創建時段的完整時間
        const slotDateTime = new Date(year, month - 1, day, hour, minute);
        
        // 比較:如果時段時間小於當前時間,則已過期
        return slotDateTime < now;
    };

    useEffect(() => {
        async function loadSchedules() {
            if (!doctor_id || !weekDates || weekDates.length === 0) {
                return;
            }

            const startDate = weekDates[0].fullDate;
            const endDate = weekDates[6].fullDate;

            try {
                const res = await fetch(
                    `http://127.0.0.1:5000/api/schedules/${doctor_id}?start_date=${startDate}&end_date=${endDate}`,
                    { credentials: 'include' }
                );

                if (!res.ok) throw new Error("抓取失敗");

                const data = await res.json();

                // 初始化所有時段為 false
                const newSchedules = {};
                weekDates.forEach(day => {
                    newSchedules[day.fullDate] = {};
                    timeSlots.forEach(time => {
                        newSchedules[day.fullDate][time] = false;
                    });
                });
                
                if (Array.isArray(data)) {
                    data.forEach(item => {
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

                setSchedules(newSchedules);

            } catch (err) {
                console.error('❌ 載入排班失敗:', err);
                alert("載入排班資料失敗");
            }
        }

        loadSchedules();
    }, [currentWeekStart, doctor_id]);

    const toggleSlot = (date, time) => {
        // ⭐ 使用新的判斷函數
        if (isTimeSlotPast(date, time)) {
            alert('無法設定已過期的排班時段');
            return;
        }

        setSchedules(prev => {
            const newSchedules = { ...prev };

            if (!newSchedules[date]) {
                newSchedules[date] = {};
            }

            newSchedules[date] = { ...newSchedules[date] };
            const currentValue = newSchedules[date][time] || false;
            newSchedules[date][time] = !currentValue;

            return newSchedules;
        });
    };

    const setWholeDay = (date, available) => {
        // ⭐ 檢查是否整天都已過期
        const now = new Date();
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        
        // 如果日期小於今天,則整天過期
        if (dateObj.setHours(0,0,0,0) < now.setHours(0,0,0,0)) {
            alert('無法設定過去的排班日期');
            return;
        }

        setSchedules(prev => {
            const newSchedules = { ...prev };

            if (!newSchedules[date]) {
                newSchedules[date] = {};
            }

            const updatedDate = { ...newSchedules[date] };

            timeSlots.forEach(time => {
                // ⭐ 只設定未過期的時段
                if (!isTimeSlotPast(date, time)) {
                    updatedDate[time] = available;
                }
            });

            newSchedules[date] = updatedDate;
            return newSchedules;
        });
    };

    const saveSchedules = async () => {
        if (!doctor_id) {
            alert('無法取得醫師 ID');
            return;
        }

        setLoading(true);
        try {
            const scheduleList = [];
            Object.keys(schedules).forEach(date => {
                Object.keys(schedules[date]).forEach(time => {
                    scheduleList.push({
                        date,
                        time_slot: time + ":00",
                        is_available: schedules[date][time]
                    });
                });
            });

            const res = await fetch('http://127.0.0.1:5000/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctor_id, schedules: scheduleList })
            });

            if (res.ok) {
                const result = await res.json();
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                const error = await res.json();
                alert(`儲存失敗: ${error.error || error.message}`);
            }

        } catch (error) {
            console.error("儲存排班失敗:", error);
            alert('儲存排班失敗,請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const isSlotAvailable = (date, time) => schedules[date]?.[time] ?? false;

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

                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">週排班表</h2>
                            <button onClick={saveSchedules} disabled={loading || !doctor_id}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                <Save size={18} /> {loading ? "儲存中..." : "儲存排班"}
                            </button>
                        </div>

                        <div className="grid grid-cols-8 gap-3 mb-4">
                            <div className="font-medium text-gray-700 flex items-center"><Clock size={18} className="mr-2" />時段</div>
                            {weekDates.map(item => {
                                return (
                                    <div key={item.fullDate} className="text-center">
                                        <div className="font-medium text-gray-700">{item.day}</div>
                                        <div className="text-sm text-gray-500">{item.date}日</div>
                                        <div className="mt-2 flex gap-1 justify-center">
                                            <button
                                                onClick={() => setWholeDay(item.fullDate, true)}
                                                className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                                            >
                                                全開
                                            </button>
                                            <button
                                                onClick={() => setWholeDay(item.fullDate, false)}
                                                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            >
                                                全關
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-2">
                            {timeSlots.map(time => (
                                <div key={time} className="grid grid-cols-8 gap-3 items-center">
                                    <div className="font-medium text-gray-600 text-sm">{time}</div>
                                    {weekDates.map(item => {
                                        // ⭐ 使用新的判斷函數
                                        const isPast = isTimeSlotPast(item.fullDate, time);
                                        const isAvailable = isSlotAvailable(item.fullDate, time);

                                        return (
                                            <button
                                                key={`${item.fullDate}-${time}`}
                                                onClick={() => toggleSlot(item.fullDate, time)}
                                                disabled={isPast}
                                                className={`py-3 rounded-lg text-sm font-medium transition-all ${
                                                    isPast
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                                        : isAvailable
                                                            ? "bg-green-500 text-white hover:bg-green-600"
                                                            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                                }`}
                                            >
                                                {isPast ? "已過期" : isAvailable ? "可預約" : "不可預約"}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
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