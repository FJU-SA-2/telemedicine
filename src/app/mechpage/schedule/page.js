"use client";
import { useState, useEffect, useCallback } from "react";
import Mech_Sidebar from "../../components/Mech_Sidebar";
import Navbar from "../../components/Navbar";
import {
    Save, ChevronLeft, ChevronRight,
    Sunrise, Sun, Moon,
    CheckCircle, Copy, RefreshCw, Eye, Building2
} from "lucide-react";

// ─── 工具函式 ──────────────────────────────────────────────────────────
const getWeekDates = (startDate) => {
    const weekDays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return { day: weekDays[date.getDay()], date: dd, fullDate: `${yyyy}-${mm}-${dd}` };
    });
};

const toSunday = (d) => {
    const s = new Date(d);
    s.setDate(d.getDate() - d.getDay());
    s.setHours(0, 0, 0, 0);
    return s;
};

const SESSION_GROUPS = {
    morning:   { label: "早診", icon: Sunrise, slots: ["09:00","09:30","10:00","10:30","11:00","11:30"] },
    afternoon: { label: "午診", icon: Sun,     slots: ["14:00","14:30","15:00","15:30","16:00","16:30","17:00"] },
    evening:   { label: "晚診", icon: Moon,    slots: ["18:00","18:30","19:00","19:30","20:00","20:30","21:00"] },
};
const SESSION_KEYS = ["morning", "afternoon", "evening"];

const sessionColorMap = {
    morning:   { bg: "bg-amber-500",  light: "bg-amber-100",  text: "text-amber-700",  hover: "hover:bg-amber-200"  },
    afternoon: { bg: "bg-orange-500", light: "bg-orange-100", text: "text-orange-700", hover: "hover:bg-orange-200" },
    evening:   { bg: "bg-indigo-500", light: "bg-indigo-100", text: "text-indigo-700", hover: "hover:bg-indigo-200" },
};

// ─── 主元件 ───────────────────────────────────────────────────────────
export default function MechanismSchedulePage() {
    // Sidebar
    const [isOpen, setIsOpen] = useState(false);

    // 醫師列表 ── 改成跟管理頁面一樣的方式
    const [doctors, setDoctors] = useState([]);
    const [doctorsLoading, setDoctorsLoading] = useState(true);
    const [selectedDoctorId, setSelectedDoctorId] = useState(null);

    // 週
    const [currentWeekStart, setCurrentWeekStart] = useState(() => toSunday(new Date()));
    const weekDates = getWeekDates(currentWeekStart);

    // 排班狀態：{ [date]: { morning: bool, afternoon: bool, evening: bool } }
    const [schedules, setSchedules] = useState({});

    // 操作
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // ── Toast ─────────────────────────────────────────────────────────
    const showToast = (msg, type = "info") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── 抓醫師列表（跟管理頁面一樣，直接呼叫 API，由後端 require_mechanism 驗證）──
    const fetchDoctors = useCallback(async () => {
        setDoctorsLoading(true);
        try {
            const res = await fetch("/api/mechanism/doctors", { credentials: "include" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "無法取得醫師列表");
            }
            const data = await res.json();
            // 後端回傳 { doctors: [...], total: n }（跟管理頁面 fetchDoctors 一致）
            const list = Array.isArray(data) ? data : (data.doctors ?? []);
            setDoctors(list);
            // 預設選第一位
            if (list.length > 0 && !selectedDoctorId) {
                setSelectedDoctorId(list[0].doctor_id);
            }
        } catch (e) {
            showToast(e.message || "取得醫師列表失敗", "error");
        } finally {
            setDoctorsLoading(false);
        }
    }, []); // 只在 mount 時執行一次

    // ── 驗證登入並載入醫師 ────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                const data = await res.json();
                if (!data.authenticated) {
                    showToast("請先登入", "error");
                    window.location.href = "/auth";
                    return;
                }
                if (data.user?.role !== "mech") {
                    showToast("此頁面僅限機構帳號使用", "error");
                    return;
                }
            } catch (e) {
                showToast("連線失敗，請重新整理", "error");
                return;
            }
            // 驗證通過後才抓醫師
            fetchDoctors();
        })();
    }, [fetchDoctors]);

    // ── 載入排班 ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedDoctorId) return;
        loadSchedules();
    }, [selectedDoctorId, currentWeekStart]);

    const loadSchedules = async () => {
        const startDate = weekDates[0].fullDate;
        const endDate   = weekDates[6].fullDate;
        try {
            const res = await fetch(
                `/api/schedules/${selectedDoctorId}?start_date=${startDate}&end_date=${endDate}`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error();
            const data = await res.json();

            // 初始化全部關閉
            const init = {};
            weekDates.forEach(d => {
                init[d.fullDate] = { morning: false, afternoon: false, evening: false };
            });

            // 填入已有排班
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (!item.schedule_date || !item.time_slot) return;
                    const date = item.schedule_date.slice(0, 10);
                    let [h, m] = item.time_slot.split(":");
                    if (h.length === 1) h = "0" + h;
                    const slot = `${h}:${m}`;
                    const isAvailable = !!item.is_available && item.is_available !== 0 && item.is_available !== "0";
                    if (!isAvailable) return;

                    for (const [sess, info] of Object.entries(SESSION_GROUPS)) {
                        if (info.slots.includes(slot) && init[date]) {
                            init[date][sess] = true;
                        }
                    }
                });
            }
            setSchedules(init);
        } catch {
            showToast("載入排班失敗", "error");
        }
    };

    // ── Toggle ────────────────────────────────────────────────────────
    const toggleSession = (date, session) => {
        setSchedules(prev => ({
            ...prev,
            [date]: { ...prev[date], [session]: !prev[date]?.[session] }
        }));
    };

    const setDayAll = (date, value) => {
        setSchedules(prev => ({
            ...prev,
            [date]: { morning: value, afternoon: value, evening: value }
        }));
    };

    const setSessionAll = (session, value) => {
        setSchedules(prev => {
            const next = { ...prev };
            weekDates.forEach(d => {
                next[d.fullDate] = { ...next[d.fullDate], [session]: value };
            });
            return next;
        });
    };

    const setWholeWeek = (value) => {
        setSchedules(prev => {
            const next = { ...prev };
            weekDates.forEach(d => {
                next[d.fullDate] = { morning: value, afternoon: value, evening: value };
            });
            return next;
        });
    };

    const copyToNextWeek = () => {
        const nextStart = new Date(currentWeekStart);
        nextStart.setDate(nextStart.getDate() + 7);
        const nextDates = getWeekDates(nextStart);
        const copied = {};
        nextDates.forEach((nd, i) => {
            const src = weekDates[i]?.fullDate;
            copied[nd.fullDate] = schedules[src]
                ? { ...schedules[src] }
                : { morning: false, afternoon: false, evening: false };
        });
        setCurrentWeekStart(nextStart);
        setTimeout(() => setSchedules(prev => ({ ...prev, ...copied })), 50);
        showToast("已複製到下一週，請記得儲存", "info");
    };

    const applyBiweekly = () => {
        const template = {};
        weekDates.forEach((d, i) => {
            template[i] = schedules[d.fullDate] || { morning: false, afternoon: false, evening: false };
        });
        const bulk = {};
        for (let w = 2; w <= 8; w += 2) {
            const ws = new Date(currentWeekStart);
            ws.setDate(ws.getDate() + w * 7);
            getWeekDates(ws).forEach((d, i) => {
                bulk[d.fullDate] = { ...template[i] };
            });
        }
        setSchedules(prev => ({ ...prev, ...bulk }));
        showToast("已套用隔週排班（共 4 週），請逐週儲存", "success");
    };

    // ── 儲存 ──────────────────────────────────────────────────────────
    const saveSchedules = async () => {
        if (!selectedDoctorId) return showToast("請先選擇醫師", "error");
        setLoading(true);
        try {
            const scheduleList = [];
            Object.entries(schedules).forEach(([date, sessions]) => {
                Object.entries(sessions).forEach(([sess, isOn]) => {
                    if (isOn) {
                        SESSION_GROUPS[sess].slots.forEach(slot => {
                            scheduleList.push({ date, time_slot: slot + ":00", is_available: 1 });
                        });
                    }
                });
            });

            const res = await fetch("/api/mechanism/schedules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    doctor_id:  selectedDoctorId,
                    schedules:  scheduleList,
                    week_start: weekDates[0].fullDate,
                    week_end:   weekDates[6].fullDate,
                })
            });

            if (res.ok) {
                showToast("排班儲存成功！", "success");
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.error || "儲存失敗", "error");
            }
        } catch {
            showToast("儲存排班失敗，請稍後再試", "error");
        } finally {
            setLoading(false);
        }
    };

    const selectedDoctor = doctors.find(d => d.doctor_id === selectedDoctorId);

    const getWeekRangeText = () => {
        const s = weekDates[0];
        const e = weekDates[6];
        return `${s.fullDate.substring(5).replace('-', '月')}日 — ${e.fullDate.substring(5).replace('-', '月')}日`;
    };

    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="relative min-h-screen bg-gray-50">

            {/* ── Toast ─────────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-white flex items-center gap-2 transition-all
                    ${toast.type === "success" ? "bg-green-500" : toast.type === "error" ? "bg-red-500" : "bg-blue-500"}`}>
                    {toast.type === "success" ? <CheckCircle size={18} /> : <Building2 size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Sidebar toggle ────────────────────────────────────── */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
                >
                    <Building2 size={22} />
                </button>
            )}

            <Mech_Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>

                <Navbar sidebarOpen={isOpen} />

                <div className="p-6 max-w-7xl mx-auto">

                    {/* ── 醫師選擇（跟管理頁面一樣的顯示方式） ─────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                選擇醫師
                            </h2>
                            <button
                                onClick={fetchDoctors}
                                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                            >
                                <RefreshCw size={12} /> 重新整理
                            </button>
                        </div>

                        {/* 載入中 */}
                        {doctorsLoading && (
                            <div className="flex gap-2">
                                {[0,1,2].map(i => (
                                    <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        )}

                        {/* 無醫師 */}
                        {!doctorsLoading && doctors.length === 0 && (
                            <span className="text-sm text-gray-400">
                                尚無所屬醫師，請先至醫師管理頁面新增
                            </span>
                        )}

                        {/* 醫師按鈕列表 */}
                        {!doctorsLoading && doctors.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {doctors.map(d => (
                                    <button
                                        key={d.doctor_id}
                                        onClick={() => setSelectedDoctorId(d.doctor_id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition
                                            ${selectedDoctorId === d.doctor_id
                                                ? "bg-[var(--color-azure)] text-white border-transparent shadow-sm"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]"}`}
                                    >
                                        {d.last_name}{d.first_name}
                                        {d.specialty && (
                                            <span className="ml-1 text-xs opacity-70">· {d.specialty}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 未選醫師時 */}
                    {!selectedDoctorId && !doctorsLoading && doctors.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center text-blue-600">
                            <p className="font-medium">請先選擇要排班的醫師</p>
                        </div>
                    )}

                    {selectedDoctorId && (<>

                    {/* ── 週導覽 ────────────────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center justify-between">
                        <button
                            onClick={() => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-azure)] text-white rounded-lg hover:opacity-90 text-sm"
                        >
                            <ChevronLeft size={16} /> 上一週
                        </button>
                        <div className="text-center">
                            <div className="text-base font-semibold text-gray-800">{getWeekRangeText()}</div>
                            <button
                                onClick={() => setCurrentWeekStart(toSunday(new Date()))}
                                className="text-xs text-[var(--color-azure)] hover:opacity-80 mt-0.5"
                            >
                                回到本週
                            </button>
                        </div>
                        <button
                            onClick={() => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-azure)] text-white rounded-lg hover:opacity-90 text-sm"
                        >
                            下一週 <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* ── 快捷工具列 ────────────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">快捷操作</div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setWholeWeek(true)}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium">
                                <CheckCircle size={13} /> 本週全開
                            </button>
                            <button onClick={() => setWholeWeek(false)}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">
                                ✕ 本週全關
                            </button>
                            <div className="w-px bg-gray-200 mx-1" />
                            {SESSION_KEYS.map(sess => {
                                const { label, icon: Icon } = SESSION_GROUPS[sess];
                                const c = sessionColorMap[sess];
                                return (
                                    <button key={sess} onClick={() => setSessionAll(sess, true)}
                                        className={`flex items-center gap-1 text-xs px-3 py-2 rounded-lg ${c.light} ${c.text} ${c.hover} font-medium`}>
                                        <Icon size={12} /> 全週{label}開
                                    </button>
                                );
                            })}
                            <div className="w-px bg-gray-200 mx-1" />
                            <button onClick={copyToNextWeek}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium">
                                <Copy size={13} /> 複製到下週
                            </button>
                            <button onClick={applyBiweekly}
                                title="以本週為模板，往後每隔一週套用，共 4 週"
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 font-medium">
                                <RefreshCw size={13} /> 隔週排班 (×4)
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">圖例：</span>
                            {SESSION_KEYS.map(sess => {
                                const { label, icon: Icon } = SESSION_GROUPS[sess];
                                const c = sessionColorMap[sess];
                                return (
                                    <div key={sess} className="flex items-center gap-1 text-xs text-gray-500">
                                        <div className={`w-3 h-3 rounded ${c.bg}`} />
                                        <Icon size={11} className={c.text} /> {label}
                                    </div>
                                );
                            })}
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <div className="w-3 h-3 rounded bg-gray-200" /> 休診
                            </div>
                        </div>
                    </div>

                    {/* ── 排班表（早午晚 × 7天） ─────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h2 className="text-base font-semibold text-gray-800">
                                    {selectedDoctor?.last_name}{selectedDoctor?.first_name} 醫師 — 週排班
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">點擊格子切換開 / 關診</p>
                            </div>
                            <button
                                onClick={saveSchedules}
                                disabled={loading}
                                className="bg-[var(--color-azure)] text-white px-5 py-2 rounded-lg hover:opacity-90 flex items-center gap-2 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
                            >
                                <Save size={16} /> {loading ? "儲存中..." : "儲存排班"}
                            </button>
                        </div>

                        {/* 表頭 */}
                        <div className="grid grid-cols-8 gap-2 mb-3">
                            <div className="text-xs font-semibold text-gray-400 flex items-center">時段 ╲ 日期</div>
                            {weekDates.map(d => (
                                <div key={d.fullDate} className="text-center">
                                    <div className="text-sm font-semibold text-gray-700">{d.day}</div>
                                    <div className="text-xs text-gray-400">{d.date}日</div>
                                    <div className="mt-1.5 flex gap-1 justify-center">
                                        <button onClick={() => setDayAll(d.fullDate, true)}
                                            className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200">
                                            全開
                                        </button>
                                        <button onClick={() => setDayAll(d.fullDate, false)}
                                            className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200">
                                            全關
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 三節 × 七天 */}
                        <div className="space-y-2">
                            {SESSION_KEYS.map(sess => {
                                const { label, icon: Icon } = SESSION_GROUPS[sess];
                                const c = sessionColorMap[sess];
                                return (
                                    <div key={sess} className="grid grid-cols-8 gap-2 items-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`flex items-center gap-1 text-xs font-semibold ${c.text}`}>
                                                <Icon size={13} /> {label}
                                            </div>
                                            <button onClick={() => setSessionAll(sess, false)}
                                                className={`text-xs px-2 py-0.5 rounded ${c.light} ${c.text} ${c.hover}`}>
                                                全關
                                            </button>
                                        </div>
                                        {weekDates.map(d => {
                                            const isOn = schedules[d.fullDate]?.[sess] ?? false;
                                            return (
                                                <button
                                                    key={d.fullDate + sess}
                                                    onClick={() => toggleSession(d.fullDate, sess)}
                                                    className={`py-4 rounded-xl text-sm font-semibold border-2 transition-all select-none
                                                        ${isOn
                                                            ? `${c.bg} text-white border-transparent shadow-sm`
                                                            : `bg-gray-50 text-gray-300 border-gray-200 hover:border-gray-300 hover:text-gray-400`}`}
                                                >
                                                    {isOn ? label : "—"}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── 本週開診預覽 ──────────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-4">
                            <Eye size={15} /> 本週開診預覽
                        </h3>
                        <div className="grid grid-cols-7 gap-2">
                            {weekDates.map(d => {
                                const daySchedule = schedules[d.fullDate] || {};
                                const hasSessions = Object.values(daySchedule).some(Boolean);
                                return (
                                    <div key={d.fullDate}
                                        className={`rounded-lg p-3 border ${hasSessions ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
                                        <div className="text-xs font-semibold text-gray-600 text-center mb-2">
                                            {d.day}<br />
                                            <span className="font-normal text-gray-400">{d.date}日</span>
                                        </div>
                                        <div className="space-y-1">
                                            {SESSION_KEYS.map(sess => {
                                                if (!daySchedule[sess]) return null;
                                                const { label, icon: Icon } = SESSION_GROUPS[sess];
                                                const c = sessionColorMap[sess];
                                                return (
                                                    <div key={sess}
                                                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${c.light} ${c.text} font-medium`}>
                                                        <Icon size={10} /> {label}
                                                    </div>
                                                );
                                            })}
                                            {!hasSessions && (
                                                <div className="text-xs text-gray-300 text-center">休診</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    </>)}
                </div>

                <div className="bg-gray-800 text-white py-6 mt-8">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-gray-400 text-sm">© 2025 MedOnGo 機構平台．讓醫療管理更高效。</p>
                    </div>
                </div>
            </div>
        </div>
    );
}