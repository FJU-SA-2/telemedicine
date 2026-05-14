"use client";
import { useState, useEffect } from "react";
import {
  Menu, X, Search, Pencil, UserRound, Phone, Stethoscope,
  CheckCircle, XCircle, Clock, GraduationCap, Briefcase, Award,
  SlidersHorizontal, Calendar, ChevronDown, ChevronUp, Wifi, MapPin,
} from "lucide-react";
import MechSidebar from "../../components/Mech_Sidebar";
import Navbar from "../../components/Navbar";

// ==================== 編輯彈窗 ====================
function EditDoctorModal({ doctor, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: doctor.first_name || "",
    last_name: doctor.last_name || "",
    specialty: doctor.specialty || "",
    phone_number: doctor.phone_number || "",
    gender: doctor.gender || "male",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/mechanism/doctors/${doctor.doctor_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (!res.ok) throw new Error("更新失敗");
      onSaved({ ...doctor, ...form });
    } catch (err) {
      setError("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-5">編輯醫師資料</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">姓</label>
              <input name="last_name" value={form.last_name} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">名</label>
              <input name="first_name" value={form.first_name} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">專科</label>
            <input name="specialty" value={form.specialty} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">聯絡電話</label>
            <input name="phone_number" value={form.phone_number} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">性別</label>
            <select name="gender" value={form.gender} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            取消
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 審核狀態 Badge ====================
function StatusBadge({ status }) {
  const map = {
    approved: { label: "已核准", color: "bg-green-100 text-green-700", Icon: CheckCircle },
    pending:  { label: "審核中", color: "bg-yellow-100 text-yellow-700", Icon: Clock },
    rejected: { label: "已拒絕", color: "bg-red-100 text-red-600", Icon: XCircle },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ==================== 排班列表（重新設計）====================
function ScheduleList({ schedules }) {
  const grouped = schedules.reduce((acc, s) => {
    const key = s.schedule_date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      m: d.getMonth() + 1,
      day: d.getDate(),
      wd: WEEKDAYS[d.getDay()],
    };
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, slots]) => {
        const { m, day, wd } = formatDate(date);
        const physicalSlots = slots.filter(s => s.schedule_type === "physical");
        const onlineSlots   = slots.filter(s => s.schedule_type === "online");

        return (
          <div key={date}>
            {/* 日期標題列 */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-1 rounded-lg shrink-0">
                <Calendar size={11} />
                <span className="text-xs font-bold">{m}/{day}</span>
              </div>
              <span className="text-xs font-semibold text-gray-500">週{wd}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* 實體診 */}
            {physicalSlots.length > 0 && (
              <div className="mb-2.5">
                <div className="flex items-center gap-1 mb-1.5">
                  <MapPin size={11} className="text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-semibold">實體診</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {physicalSlots.map((s, i) => (
                    <span key={i}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tabular-nums">
                      {s.time_slot.slice(0, 5)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 線上診 */}
            {onlineSlots.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <Wifi size={11} className="text-sky-500" />
                  <span className="text-xs text-sky-600 font-semibold">線上診</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {onlineSlots.map((s, i) => (
                    <span key={i}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold tabular-nums">
                      {s.time_slot.slice(0, 5)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== 醫師卡片 ====================
function DoctorCard({ doctor, onEdit }) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedules, setSchedules] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const avatarColors = [
    "bg-blue-500", "bg-indigo-500", "bg-violet-500",
    "bg-cyan-500", "bg-teal-500", "bg-sky-500",
  ];
  const colorIdx = (doctor.last_name?.charCodeAt(0) || 0) % avatarColors.length;

  const handleToggleSchedule = async () => {
    if (!showSchedule && schedules === null) {
      setLoadingSchedule(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/mechanism/doctors/${doctor.doctor_id}/schedules`,
          { credentials: "include" }
        );
        const data = await res.json();
        setSchedules(Array.isArray(data) ? data : []);
      } catch {
        setSchedules([]);
      } finally {
        setLoadingSchedule(false);
      }
    }
    setShowSchedule((prev) => !prev);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col border border-gray-100">

      {/* ── 上半：頭像 + 基本資料（置中） ── */}
      <div className="relative flex flex-col items-center pt-8 pb-4 px-5">
        {/* 編輯按鈕（右上角） */}
        <button
          onClick={() => onEdit(doctor)}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition"
          title="編輯資料"
        >
          <Pencil size={14} />
        </button>

        {/* 頭像 */}
        <div className={`w-24 h-24 rounded-full overflow-hidden shrink-0 ${avatarColors[colorIdx]} flex items-center justify-center shadow`}>
          {doctor.photo ? (
            <img
              src={`http://localhost:5000/uploads/profile_pictures/${doctor.photo}`}
              className="w-full h-full object-cover"
              alt={`${doctor.last_name}${doctor.first_name}`}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <span className="text-white font-bold text-3xl">
              {doctor.last_name?.charAt(0) || "醫"}
            </span>
          )}
        </div>

        {/* 姓名 */}
        <h3 className="mt-3 font-bold text-gray-800 text-lg leading-tight text-center">
          {doctor.last_name}{doctor.first_name}
        </h3>

        {/* 科別標籤 */}
        <span className="mt-2 px-3 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
          {doctor.specialty || "未填寫"}
        </span>

        {/* 院所 */}
        <p className="mt-1.5 text-sm text-gray-500">{doctor.practice_hospital || "未填寫"}</p>

        {/* 審核狀態 */}
        <div className="mt-2">
          <StatusBadge status={doctor.approval_status} />
        </div>

        {/* 諮詢費用（若有） */}
        {doctor.consultation_fee != null && (
          <p className="mt-2 text-blue-600 font-bold text-base">
            NT$ {Number(doctor.consultation_fee).toLocaleString()}
          </p>
        )}
      </div>

      {/* ── 中段：學經歷 ── */}
      <div className="border-t border-gray-100 mx-4" />
      <div className="px-5 py-4 space-y-2.5 flex-1">
        {doctor.education && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <GraduationCap size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <span><span className="font-medium text-gray-700">學歷：</span>{doctor.education}</span>
          </div>
        )}
        {doctor.experience && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Briefcase size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <span><span className="font-medium text-gray-700">經歷：</span>{doctor.experience}</span>
          </div>
        )}
        {doctor.certifications && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Award size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <span><span className="font-medium text-gray-700">認證：</span>{doctor.certifications}</span>
          </div>
        )}
        {!doctor.education && !doctor.experience && !doctor.certifications && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserRound size={14} className="text-gray-400 shrink-0" />
              <span>{doctor.gender === "female" ? "女" : "男"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <span>{doctor.phone_number || "未填寫"}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── 排班展開按鈕 ── */}
      <div className="px-5 pb-4">
        <button
          onClick={handleToggleSchedule}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700 border border-gray-100"
        >
          <span className="flex items-center gap-2">
            <Calendar size={14} className="text-blue-500" />
            近期排班
          </span>
          {showSchedule
            ? <ChevronUp size={14} className="text-gray-400" />
            : <ChevronDown size={14} className="text-gray-400" />}
        </button>

        {/* 排班內容 */}
        {showSchedule && (
          <div className="mt-3">
            {loadingSchedule ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">載入中...</span>
              </div>
            ) : schedules?.length === 0 ? (
              <div className="flex flex-col items-center py-5 text-gray-300 gap-1.5">
                <Calendar size={24} />
                <span className="text-xs">近 7 天無排班</span>
              </div>
            ) : (
              <ScheduleList schedules={schedules} />
            )}
          </div>
        )}
      </div>

    </div>
  );
}

// ==================== 主頁面 ====================
export default function MechDoctorListPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [mech, setMech] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(undefined);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("所有科別");
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setMech(data.user);
          setApprovalStatus(data.user?.approval_status);
        }
      } catch (err) {
        console.error("取得機構資訊失敗:", err);
      }
    }
    fetchMe();
  }, []);

  useEffect(() => {
    if (!mech?.mechanism_name) return;
    async function fetchDoctors() {
      try {
        const res = await fetch(
          `/api/doctors?practice_hospital=${encodeURIComponent(mech.mechanism_name)}`,
          { credentials: "include" }
        );
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter(
          (d) => d.practice_hospital === mech.mechanism_name
        );
        setDoctors(filtered);
      } catch (err) {
        console.error("取得醫師資料失敗:", err);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, [mech]);

  const specialties = ["所有科別", ...Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean)))];

  const filteredDoctors = doctors.filter((d) => {
    const matchKeyword = !keyword ||
      `${d.last_name}${d.first_name} ${d.specialty} ${d.phone_number} ${d.practice_hospital}`
        .toLowerCase().includes(keyword.toLowerCase());
    const matchSpecialty = specialtyFilter === "所有科別" || d.specialty === specialtyFilter;
    return matchKeyword && matchSpecialty;
  });

  const handleSaved = (updated) => {
    setDoctors((prev) => prev.map((d) => (d.doctor_id === updated.doctor_id ? updated : d)));
    setEditingDoctor(null);
    setToast("醫師資料已更新");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
          aria-label="開啟選單"
        >
          <Menu size={24} />
        </button>
      )}

      <MechSidebar isOpen={isOpen} setIsOpen={setIsOpen} approvalStatus={approvalStatus} />

      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setIsOpen(false)} />
      )}

      <div className={`transition-all duration-300 min-h-screen ${isOpen ? "md:ml-64" : "ml-0"}`}>
        <Navbar />
        <div className="pt-6 pb-10 px-4 md:px-8 max-w-6xl mx-auto">

          {/* 頁首 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">醫師介紹</h1>
            <p className="text-sm text-gray-500 mt-1">{mech?.mechanism_name || "本機構"} 旗下醫師列表</p>
          </div>

          {/* 篩選條件 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold text-sm">
              <SlidersHorizontal size={16} className="text-blue-500" />
              篩選條件
            </div>
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜尋醫師姓名、科別、院所..."
                className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              />
              {keyword && (
                <button onClick={() => setKeyword("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">科別</label>
                <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700">
                  {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">院所</label>
                <select disabled className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400">
                  <option>{mech?.mechanism_name || "本機構"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* 醫師數量 */}
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {filteredDoctors.length}
            </span>
            <span className="text-sm text-gray-500">位醫師符合條件</span>
          </div>

          {/* 載入中 */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">載入中...</p>
              </div>
            </div>
          )}

          {/* 無資料 */}
          {!loading && filteredDoctors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Stethoscope size={40} className="mb-3 opacity-30" />
              <p className="text-sm">目前沒有符合條件的醫師</p>
            </div>
          )}

          {/* 醫師卡片列表 */}
          {!loading && filteredDoctors.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor.doctor_id} doctor={doctor} onEdit={setEditingDoctor} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 編輯彈窗 */}
      {editingDoctor && (
        <EditDoctorModal
          doctor={editingDoctor}
          onClose={() => setEditingDoctor(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm">
          <CheckCircle size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}