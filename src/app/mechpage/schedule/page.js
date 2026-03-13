"use client";
import { useState, useEffect, useCallback } from "react";
import Mech_Sidebar from "../../components/Mech_Sidebar";
import Navbar from "../../components/Navbar";
import {
    Save, ChevronLeft, ChevronRight,
    Sunrise, Sun, Moon,
    CheckCircle, Copy, RefreshCw, Eye, Building2,Menu
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
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        if (isOpen && !isDesktop) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen, isDesktop]);

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

    // 套用多週彈窗
    const [applyModal, setApplyModal] = useState(false);
    const [applyWeeks, setApplyWeeks] = useState(4);

    // ── Toast ─────────────────────────────────────────────────────────
    const showToast = (msg, type = "info") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── 抓醫師列表（只回傳登入機構所屬的醫師，由後端 require_mechanism 驗證）──
    const fetchDoctors = useCallback(async () => {
        setDoctorsLoading(true);
        try {
            // /api/mechanism/doctors 後端需根據 session 中的 mechanism_id 篩選，只回傳所屬醫師
            const res = await fetch("/api/mechanism/doctors", { credentials: "include" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "無法取得醫師列表");
            }
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.doctors ?? []);
            setDoctors(list);
            // 預設選第一位（只在尚未選擇時才自動選）
            if (list.length > 0) {
                setSelectedDoctorId(prev => prev ?? list[0].doctor_id);
            }
        } catch (e) {
            showToast(e.message || "取得醫師列表失敗", "error");
        } finally {
            setDoctorsLoading(false);
        }
    }, []);

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

    // ── 判斷時段是否已過期（以 session 最後一個 slot 為準）────────────
    const isSessionPast = (dateString, sessKey) => {
        const slots = SESSION_GROUPS[sessKey]?.slots;
        if (!slots || slots.length === 0) return false;
        const lastSlot = slots[slots.length - 1]; // 例如 "11:30"
        const [year, month, day] = dateString.split("-").map(Number);
        const [hour, minute] = lastSlot.split(":").map(Number);
        const slotEnd = new Date(year, month - 1, day, hour, minute + 30); // 加 30 分鐘緩衝
        return slotEnd < new Date();
    };

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

            // 填入已有排班：只要資料庫中存在該日期+時段且 is_available 為真，就開啟對應 session
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (!item.schedule_date || !item.time_slot) return;
                    const date = item.schedule_date.slice(0, 10);
                    if (!init[date]) return;

                    // 標準化時間格式，例如 "9:00:00" → "09:00"
                    const rawSlot = String(item.time_slot);
                    const parts = rawSlot.split(":");
                    const h = String(parts[0]).padStart(2, "0");
                    const m = String(parts[1] || "00").padStart(2, "0");
                    const slot = `${h}:${m}`;

                    // is_available 判斷：支援 1 / "1" / true
                    const isAvailable = item.is_available == 1 || item.is_available === true;
                    if (!isAvailable) return;

                    for (const [sess, info] of Object.entries(SESSION_GROUPS)) {
                        if (info.slots.includes(slot)) {
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
        if (isSessionPast(date, session)) return; // 過期不可點
        setSchedules(prev => ({
            ...prev,
            [date]: { ...prev[date], [session]: !prev[date]?.[session] }
        }));
    };

    const setDayAll = (date, value) => {
        setSchedules(prev => ({
            ...prev,
            [date]: {
                morning:   isSessionPast(date, "morning")   ? prev[date]?.morning   ?? false : value,
                afternoon: isSessionPast(date, "afternoon") ? prev[date]?.afternoon ?? false : value,
                evening:   isSessionPast(date, "evening")   ? prev[date]?.evening   ?? false : value,
            }
        }));
    };

    const setSessionAll = (session, value) => {
        setSchedules(prev => {
            const next = { ...prev };
            weekDates.forEach(d => {
                if (isSessionPast(d.fullDate, session)) return; // 過期跳過
                next[d.fullDate] = { ...next[d.fullDate], [session]: value };
            });
            return next;
        });
    };

    const setWholeWeek = (value) => {
        setSchedules(prev => {
            const next = { ...prev };
            weekDates.forEach(d => {
                next[d.fullDate] = {
                    morning:   isSessionPast(d.fullDate, "morning")   ? prev[d.fullDate]?.morning   ?? false : value,
                    afternoon: isSessionPast(d.fullDate, "afternoon") ? prev[d.fullDate]?.afternoon ?? false : value,
                    evening:   isSessionPast(d.fullDate, "evening")   ? prev[d.fullDate]?.evening   ?? false : value,
                };
            });
            return next;
        });
    };

    // ── 套用到之後 N 週（連續，每週都套用）────────────────────────────
    const applyToWeeks = async (numWeeks) => {
        if (!selectedDoctorId) return showToast("請先選擇醫師", "error");
        setApplyModal(false);
        setLoading(true);
        let successCount = 0;
        try {
            for (let w = 1; w <= numWeeks; w++) {
                const ws = new Date(currentWeekStart);
                ws.setDate(ws.getDate() + w * 7);
                const targetDates = getWeekDates(ws);

                const scheduleList = [];
                targetDates.forEach((d, i) => {
                    const src = weekDates[i]?.fullDate;
                    const srcSessions = schedules[src] || { morning: false, afternoon: false, evening: false };
                    Object.entries(srcSessions).forEach(([sess, isOn]) => {
                        if (isOn) {
                            SESSION_GROUPS[sess].slots.forEach(slot => {
                                scheduleList.push({ date: d.fullDate, time_slot: slot + ":00", is_available: 1 });
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
                        week_start: targetDates[0].fullDate,
                        week_end:   targetDates[6].fullDate,
                    })
                });
                if (res.ok) successCount++;
            }
            showToast(`已套用到之後 ${successCount} 週並儲存完成！`, "success");
        } catch {
            showToast("套用失敗，請稍後再試", "error");
        } finally {
            setLoading(false);
        }
    };

    // ── 儲存 ──────────────────────────────────────────────────────────
    const saveSchedules = async () => {
        if (!selectedDoctorId) return showToast("請先選擇醫師", "error");
        setLoading(true);
        try {
            const scheduleList = [];
            Object.entries(schedules).forEach(([date, sessions]) => {
                Object.entries(sessions).forEach(([sess, isOn]) => {
                    SESSION_GROUPS[sess].slots.forEach(slot => {
                        scheduleList.push({
                            date,
                            time_slot: slot + ":00",
                            is_available: isOn ? 1 : 0   // ← 開關都儲存，確保刷新後能正確讀回
                        });
                    });
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

            {/* ── 套用多週彈窗 ──────────────────────────────────────── */}
            {applyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onClick={() => setApplyModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-80"
                        onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-bold text-gray-800 mb-1">套用到之後幾週</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            以<span className="font-semibold text-gray-600"> {getWeekRangeText()} </span>
                            的排班為模板，連續套用到之後選定的週數。
                        </p>

                        {/* 快速選擇 */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {[1, 2, 3, 4].map(n => (
                                <button key={n}
                                    onClick={() => setApplyWeeks(n)}
                                    className={`py-2 rounded-lg text-sm font-semibold border-2 transition
                                        ${applyWeeks === n
                                            ? "border-purple-500 bg-purple-50 text-purple-700"
                                            : "border-gray-200 text-gray-500 hover:border-purple-300"}`}>
                                    {n} 週
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            {[6, 8, 12].map(n => (
                                <button key={n}
                                    onClick={() => setApplyWeeks(n)}
                                    className={`py-2 rounded-lg text-sm font-semibold border-2 transition
                                        ${applyWeeks === n
                                            ? "border-purple-500 bg-purple-50 text-purple-700"
                                            : "border-gray-200 text-gray-500 hover:border-purple-300"}`}>
                                    {n} 週{n === 4 ? "（1個月）" : n === 8 ? "（2個月）" : n === 12 ? "（3個月）" : ""}
                                </button>
                            ))}
                        </div>

                        {/* 自訂週數 */}
                        <div className="flex items-center gap-2 mb-5">
                            <span className="text-xs text-gray-500 shrink-0">自訂週數：</span>
                            <input
                                type="number" min={1} max={52} value={applyWeeks}
                                onChange={e => setApplyWeeks(Math.max(1, Math.min(52, Number(e.target.value))))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-300"
                            />
                            <span className="text-xs text-gray-500 shrink-0">週</span>
                        </div>

                        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mb-4">
                            將套用到 <span className="font-semibold text-gray-600">{applyWeeks}</span> 週，
                            共 <span className="font-semibold text-gray-600">{applyWeeks * 7}</span> 天
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setApplyModal(false)}
                                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                                取消
                            </button>
                            <button onClick={() => applyToWeeks(applyWeeks)}
                                className="flex-1 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600">
                                確認套用
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sidebar toggle ────────────────────────────────────── */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition "
                    aria-label="開啟選單"
                >
                    <Menu size={24} />
                </button>
            )}

            {isOpen && !isDesktop && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <Mech_Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <div className={`transition-all duration-300 ${isOpen && isDesktop ? "lg:ml-64" : "ml-0"}`}>

                <Navbar sidebarOpen={isOpen} />

                <div className="p-4 sm:p-6 max-w-7xl mx-auto">

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
                                        {d.first_name}{d.last_name}
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 flex items-center justify-between gap-2">
                        <button
                            onClick={() => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                            className="flex items-center gap-1 px-2 sm:px-4 py-2 bg-[var(--color-azure)] text-white rounded-lg hover:opacity-90 text-xs sm:text-sm"
                        >
                            <ChevronLeft size={16} /> 上一週
                        </button>
                        <div className="text-center">
                            <div className="text-xs sm:text-base font-semibold text-gray-800">{getWeekRangeText()}</div>
                            <button
                                onClick={() => setCurrentWeekStart(toSunday(new Date()))}
                                className="text-xs text-[var(--color-azure)] hover:opacity-80 mt-0.5"
                            >
                                回到本週
                            </button>
                        </div>
                        <button
                            onClick={() => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                            className="flex items-center gap-1 px-2 sm:px-4 py-2 bg-[var(--color-azure)] text-white rounded-lg hover:opacity-90 text-xs sm:text-sm"
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
                            <button onClick={() => setApplyModal(true)}
                                disabled={loading}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                <Copy size={13} /> 套用到之後幾週
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">圖例：</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <div className="w-3 h-3 rounded bg-green-500" /> 開診
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <div className="w-3 h-3 rounded bg-gray-200" /> 休診
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <div className="w-3 h-3 rounded bg-gray-100" /> 已過期
                            </div>
                        </div>
                    </div>

                    {/* ── 排班表（早午晚 × 7天） ─────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
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

                        {/* 表頭 - 手機橫向捲動 */}
                        <div className="overflow-x-auto -mx-5 px-5">
                        <div className="grid grid-cols-8 gap-1 sm:gap-2 mb-3" style={{minWidth:"560px"}}>
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
                        <div className="space-y-2" style={{minWidth:"560px"}}>
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
                                            const isOn  = schedules[d.fullDate]?.[sess] ?? false;
                                            const isPast = isSessionPast(d.fullDate, sess);
                                            return (
                                                <button
                                                    key={d.fullDate + sess}
                                                    onClick={() => toggleSession(d.fullDate, sess)}
                                                    disabled={isPast}
                                                    title={isPast ? "此時段已過期" : undefined}
                                                    className={`py-4 rounded-xl text-sm font-semibold border-2 transition-all select-none
                                                        ${isPast
                                                            ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed opacity-60"
                                                            : isOn
                                                                ? "bg-green-500 text-white border-transparent shadow-sm hover:bg-green-600"
                                                                : "bg-gray-50 text-gray-300 border-gray-200 hover:border-gray-300 hover:text-gray-400 cursor-pointer"
                                                        }`}
                                                >
                                                    {isPast ? "已過期" : isOn ? label : "—"}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                        </div>{/* /overflow-x-auto */}
                    </div>

                    {/* ── 本週開診預覽 ──────────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-4">
                            <Eye size={15} /> 本週開診預覽
                        </h3>
                        <div className="overflow-x-auto -mx-5 px-5"><div className="grid grid-cols-7 gap-1 sm:gap-2" style={{minWidth:"420px"}}>
                            {weekDates.map(d => {
                                const daySchedule = schedules[d.fullDate] || {};
                                const hasSessions = Object.values(daySchedule).some(Boolean);
                                return (
                                    <div key={d.fullDate}
                                        className={`rounded-lg p-3 border ${hasSessions ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                                        <div className="text-xs font-semibold text-gray-600 text-center mb-2">
                                            {d.day}<br />
                                            <span className="font-normal text-gray-400">{d.date}日</span>
                                        </div>
                                        <div className="space-y-1">
                                            {SESSION_KEYS.map(sess => {
                                                if (!daySchedule[sess]) return null;
                                                const { label, icon: Icon } = SESSION_GROUPS[sess];
                                                const isPast = isSessionPast(d.fullDate, sess);
                                                return (
                                                    <div key={sess}
                                                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium
                                                            ${isPast
                                                                ? "bg-gray-100 text-gray-400"
                                                                : "bg-green-100 text-green-700"}`}>
                                                        <Icon size={10} /> {isPast ? `${label}(過期)` : label}
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
                    </div></div>{/* /preview overflow */}

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