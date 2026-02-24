"use client";
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Mech_Sidebar from "../components/Mech_Sidebar";
import {
  Menu, Users, UserCheck, Search, ChevronRight, Stethoscope,
  HeartPulse, CalendarDays, ShieldCheck, Clock, X, Edit2,
  Trash2, AlertCircle, CheckCircle, Phone, Plus, Save,
  Loader2, RefreshCw,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════
//  工具元件
// ════════════════════════════════════════════════════════════════════

const StatusBadge = ({ status }) => {
  const styles = {
    approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    pending:  "bg-amber-50  text-amber-700  ring-1 ring-amber-200",
    rejected: "bg-rose-50   text-rose-600   ring-1 ring-rose-200",
    已確認:   "bg-blue-50   text-blue-700   ring-1 ring-blue-200",
    已完成:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    已取消:   "bg-gray-100  text-gray-500   ring-1 ring-gray-200",
  };
  const labels = { approved: "審核通過", pending: "審核中", rejected: "已拒絕" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-500"}`}>
      {labels[status] || status}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      {loading
        ? <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mt-1" />
        : <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>}
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
    {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
  </div>
);

const SkeletonRow = () => (
  <div className="px-6 py-4 flex items-center gap-4">
    <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
    </div>
  </div>
);

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "請求失敗");
  return data;
}

const calcAge = (dob) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
};

// ════════════════════════════════════════════════════════════════════
//  醫師編輯 Modal
// ════════════════════════════════════════════════════════════════════
const DoctorEditModal = ({ doctor, onClose, onSaved }) => {
  const [form, setForm] = useState({
    specialty: doctor.specialty || "",
    phone_number: doctor.phone_number || "",
    practice_hospital: doctor.practice_hospital || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/mechanism/doctors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, doctor_id: doctor.doctor_id }),
      });
      onSaved("醫師資料已更新");
    } catch (e) {
      onSaved(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">編輯醫師資料</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">醫師姓名</p>
            <p className="text-gray-800 font-medium">{doctor.first_name}{doctor.last_name}</p>
          </div>
          {[
            { key: "specialty", label: "專科" },
            { key: "phone_number", label: "聯絡電話" },
            { key: "practice_hospital", label: "執業院所" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
              <input type="text" value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">取消</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            儲存
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  患者詳情 Modal（含預約紀錄）
// ════════════════════════════════════════════════════════════════════
const PatientDetailModal = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const [pd, appts] = await Promise.all([
          apiFetch(`/api/mechanism/patients/${patientId}`),
          apiFetch(`/api/mechanism/patients/${patientId}/appointments`),
        ]);
        setPatient(pd);
        setForm(pd);
        setAppointments(appts.appointments);
      } catch (e) {
        showToast(e.message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/mechanism/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setPatient(form);
      setEditing(false);
      showToast("患者資料已更新");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const smokingLabel = { yes: "有吸菸", no: "不吸菸", quit: "已戒菸" };

  const editableFields = [
    { key: "phone_number", label: "電話", type: "text" },
    { key: "address", label: "地址", type: "text" },
    { key: "height", label: "身高 (cm)", type: "number" },
    { key: "weight", label: "體重 (kg)", type: "number" },
    { key: "emergency_contact_name", label: "緊急聯絡人", type: "text" },
    { key: "emergency_contact_phone", label: "緊急聯絡電話", type: "text" },
    { key: "drug_allergies", label: "藥物過敏", type: "textarea" },
    { key: "medical_history", label: "病史", type: "textarea" },
    { key: "chronic_disease", label: "慢性病", type: "textarea" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-800">患者詳情</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-teal-500" />
          </div>
        ) : patient ? (
          <>
            <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {patient.last_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{patient.first_name}{patient.last_name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{patient.gender === "male" ? "男" : "女"}</span>
                    {calcAge(patient.date_of_birth) && <><span>·</span><span>{calcAge(patient.date_of_birth)} 歲</span></>}
                    {patient.phone_number && <><span>·</span><span className="flex items-center gap-1"><Phone size={12} />{patient.phone_number}</span></>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
              {[{ id: "info", label: "基本資料" }, { id: "appointments", label: `預約紀錄 (${appointments.length})` }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                    ${activeTab === tab.id ? "border-teal-500 text-teal-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {activeTab === "info" && (
                editing ? (
                  <div className="space-y-4">
                    {editableFields.map(({ key, label, type }) => (
                      <div key={key}>
                        <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
                        {type === "textarea" ? (
                          <textarea value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none" />
                        ) : (
                          <input type={type} value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "出生日期", value: patient.date_of_birth || "—" },
                      { label: "身分證字號", value: patient.id_number || "—" },
                      { label: "身高", value: patient.height ? `${patient.height} cm` : "—" },
                      { label: "體重", value: patient.weight ? `${patient.weight} kg` : "—" },
                      { label: "吸菸狀況", value: smokingLabel[patient.smoking_status] || "—" },
                      { label: "地址", value: patient.address || "—", full: true },
                      { label: "藥物過敏", value: patient.drug_allergies || "—", full: true },
                      { label: "病史", value: patient.medical_history || "—", full: true },
                      { label: "慢性病", value: patient.chronic_disease || "—", full: true },
                      { label: "緊急聯絡人", value: patient.emergency_contact_name || "—" },
                      { label: "緊急聯絡電話", value: patient.emergency_contact_phone || "—" },
                    ].map(({ label, value, full }) => (
                      <div key={label} className={`bg-gray-50 rounded-xl p-3 ${full ? "sm:col-span-2" : ""}`}>
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === "appointments" && (
                <div className="space-y-3">
                  {appointments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">目前無預約紀錄</div>
                  ) : appointments.map(appt => (
                    <div key={appt.appointment_id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800 text-sm">{appt.appointment_date} {appt.appointment_time}</span>
                            <StatusBadge status={appt.status} />
                          </div>
                          <p className="text-xs text-gray-500">主治醫師：{appt.doctor_name}（{appt.specialty}）</p>
                          {appt.symptoms && <p className="text-xs text-gray-500 mt-1">症狀：{appt.symptoms}</p>}
                        </div>
                        {appt.amount && (
                          <span className="text-sm font-semibold text-gray-700 flex-shrink-0">NT$ {Number(appt.amount).toLocaleString()}</span>
                        )}
                      </div>
                      {appt.consultation_notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-400">看診記錄</p>
                          <p className="text-xs text-gray-600 mt-0.5">{appt.consultation_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center py-16 text-gray-400">載入失敗</div>
        )}

        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  新增醫師 Modal
// ════════════════════════════════════════════════════════════════════
const AddDoctorModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "male",
    specialty: "",
    practice_hospital: "",
    phone_number: "",
    approval_status: "pending",
    certificate_path: "",
    email: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) { setError("姓名為必填"); return; }
    if (!form.email) { setError("Email 為必填"); return; }
    if (!form.password || form.password.length < 6) { setError("密碼為必填且至少 6 個字元"); return; }
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/mechanism/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onSaved("醫師已新增");
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400";
  const selectCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-800">新增醫師</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-2 rounded-lg text-sm">
              <AlertCircle size={14} />{error}
            </div>
          )}

          {/* ── 醫師基本資料（doctor 表） ── */}
          <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">姓 <span className="text-rose-500">*</span></label>
                  <input type="text" value={form.last_name} onChange={e => set("last_name", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">名 <span className="text-rose-500">*</span></label>
                  <input type="text" value={form.first_name} onChange={e => set("first_name", e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">性別</label>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)} className={selectCls}>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                <div>
                  
                </div>
              </div>
              {[
                { key: "specialty",         label: "專科",     placeholder: "例：內科、外科" },
                { key: "phone_number",      label: "聯絡電話", placeholder: "09xx-xxx-xxx" },
                { key: "practice_hospital", label: "執業院所", placeholder: "醫院名稱" },
                { key: "certificate_path",  label: "證書路徑", placeholder: "上傳後填入路徑（選填）" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
                  <input type="text" value={form[key] || ""} onChange={e => set(key, e.target.value)}
                    placeholder={placeholder} className={inputCls} />
                </div>
              ))}
          </div>

          {/* ── 帳號資訊（users 表） ── */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">登入帳號設定</p>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Email <span className="text-rose-500">*</span></label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="doctor@example.com" className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">密碼 <span className="text-rose-500">*</span></label>
              <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
                placeholder="至少 6 個字元" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">取消</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}新增
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  新增患者 Modal
// ════════════════════════════════════════════════════════════════════
const AddPatientModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ gender: "male", smoking_status: "no" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) { setError("姓名為必填"); return; }
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/mechanism/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, user_id: 0 }),
      });
      onSaved("患者已新增");
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-800">新增患者</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-2 rounded-lg text-sm">
              <AlertCircle size={14} />{error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">姓 <span className="text-rose-500">*</span></label>
              <input type="text" value={form.last_name || ""} onChange={e => set("last_name", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">名 <span className="text-rose-500">*</span></label>
              <input type="text" value={form.first_name || ""} onChange={e => set("first_name", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">性別</label>
              <select value={form.gender} onChange={e => set("gender", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200">
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">出生日期</label>
              <input type="date" value={form.date_of_birth || ""} onChange={e => set("date_of_birth", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200" />
            </div>
          </div>
          {[{ key: "phone_number", label: "電話" }, { key: "id_number", label: "身分證字號" }, { key: "address", label: "地址" }].map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
              <input type="text" value={form[key] || ""} onChange={e => set(key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400" />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">身高 (cm)</label>
              <input type="number" value={form.height || ""} onChange={e => set("height", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">體重 (kg)</label>
              <input type="number" value={form.weight || ""} onChange={e => set("weight", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">吸菸</label>
              <select value={form.smoking_status} onChange={e => set("smoking_status", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200">
                <option value="no">不吸菸</option>
                <option value="yes">有吸菸</option>
                <option value="quit">已戒菸</option>
              </select>
            </div>
          </div>
          {[{ key: "drug_allergies", label: "藥物過敏" }, { key: "medical_history", label: "病史" }, { key: "chronic_disease", label: "慢性病" }].map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
              <textarea rows={2} value={form[key] || ""} onChange={e => set(key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 resize-none" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {[{ key: "emergency_contact_name", label: "緊急聯絡人" }, { key: "emergency_contact_phone", label: "緊急聯絡電話" }].map(({ key, label }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
                <input type="text" value={form[key] || ""} onChange={e => set(key, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">取消</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}新增
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  主元件
// ════════════════════════════════════════════════════════════════════
const TelemedicineDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorStatus, setDoctorStatus] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientGender, setPatientGender] = useState("");

  const [editingDoctor, setEditingDoctor] = useState(null);
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [viewingPatientId, setViewingPatientId] = useState(null);
  const [addingPatient, setAddingPatient] = useState(false);
  const [removingDoctorId, setRemovingDoctorId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        setApprovalStatus(data.authenticated && data.user?.role === "doctor" ? data.user.approval_status : "unauthorized");
      } catch {
        setApprovalStatus("error");
      }
    })();
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try { setStats(await apiFetch("/api/mechanism/stats")); }
    catch (e) { showToast(e.message, "error"); }
    finally { setStatsLoading(false); }
  }, []);

  const fetchDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const p = new URLSearchParams();
      if (doctorSearch) p.set("search", doctorSearch);
      if (doctorStatus) p.set("status", doctorStatus);
      const data = await apiFetch(`/api/mechanism/doctors?${p}`);
      setDoctors(data.doctors);
    } catch (e) { showToast(e.message, "error"); }
    finally { setDoctorsLoading(false); }
  }, [doctorSearch, doctorStatus]);

  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const p = new URLSearchParams();
      if (patientSearch) p.set("search", patientSearch);
      if (patientGender) p.set("gender", patientGender);
      const data = await apiFetch(`/api/mechanism/patients?${p}`);
      setPatients(data.patients);
    } catch (e) { showToast(e.message, "error"); }
    finally { setPatientsLoading(false); }
  }, [patientSearch, patientGender]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { const t = setTimeout(fetchDoctors, doctorSearch ? 400 : 0); return () => clearTimeout(t); }, [fetchDoctors]);
  useEffect(() => { const t = setTimeout(fetchPatients, patientSearch ? 400 : 0); return () => clearTimeout(t); }, [fetchPatients]);

  const handleRemoveDoctor = async (doctorId) => {
    if (!window.confirm("確定要解除此醫師與本機構的關聯嗎？")) return;
    setRemovingDoctorId(doctorId);
    try {
      await apiFetch(`/api/mechanism/doctors/${doctorId}/remove`, { method: "PATCH" });
      showToast("已解除醫師關聯");
      fetchDoctors();
      fetchStats();
    } catch (e) { showToast(e.message, "error"); }
    finally { setRemovingDoctorId(null); }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans">
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition">
          <Menu size={24} />
        </button>
      )}

      <Mech_Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} approvalStatus={approvalStatus} />

      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />
        <main className="p-6 md:p-8 max-w-7xl mx-auto">

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">機構管理中心</h1>
              <p className="text-gray-500 text-sm mt-1">管理本院醫師與患者的總覽資訊</p>
            </div>
            <button onClick={() => { fetchStats(); fetchDoctors(); fetchPatients(); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg border border-gray-200 transition">
              <RefreshCw size={14} /> 重新整理
            </button>
          </div>

          {/* 統計卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard icon={Stethoscope}  label="本院醫師"  value={stats?.total_doctors ?? "—"}      sub="位醫師"  color="bg-blue-500"   loading={statsLoading} />
            <StatCard icon={HeartPulse}   label="本院患者"  value={stats?.total_patients ?? "—"}     sub="位患者"   color="bg-teal-500"   loading={statsLoading} />
            <StatCard icon={CalendarDays} label="今日看診"  value={stats?.today_appointments ?? "—"} sub="診次"     color="bg-violet-500" loading={statsLoading} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* ── 醫師管理 ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-blue-500" />
                  <h2 className="font-semibold text-gray-800">醫師管理</h2>
                  <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">{doctors.length} 位</span>
                </div>
                <button onClick={() => setAddingDoctor(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                  <Plus size={14} /> 新增醫師
                </button>
              </div>
              <div className="px-6 py-3 border-b border-gray-50 flex gap-2 flex-shrink-0">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="搜尋醫師姓名或專科..." value={doctorSearch}
                    onChange={e => setDoctorSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" />
                </div>
               
              </div>
              <div className="divide-y divide-gray-50 overflow-y-auto flex-1" style={{ maxHeight: "22rem" }}>
                {doctorsLoading
                  ? [0,1,2].map(i => <SkeletonRow key={i} />)
                  : doctors.length === 0
                    ? <div className="py-12 text-center text-gray-400 text-sm">查無結果</div>
                    : doctors.map(doc => (
                      <div key={doc.doctor_id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {doc.last_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800 text-sm">{doc.first_name}{doc.last_name}</p>
                            
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{doc.specialty || "未填專科"} ‧ 總診次 {doc.total_appointments}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-700">{doc.today_appointments ?? 0}</p>
                          <p className="text-xs text-gray-400">今日診次</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                          <button onClick={() => setEditingDoctor(doc)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition" title="編輯">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleRemoveDoctor(doc.doctor_id)}
                            disabled={removingDoctorId === doc.doctor_id}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition disabled:opacity-50" title="解除關聯">
                            {removingDoctorId === doc.doctor_id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </section>

            {/* ── 患者管理 ── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-teal-500" />
                  <h2 className="font-semibold text-gray-800">患者管理</h2>
                  <span className="bg-teal-50 text-teal-600 text-xs font-medium px-2 py-0.5 rounded-full">{patients.length} 位</span>
                </div>
              </div>
              <div className="px-6 py-3 border-b border-gray-50 flex gap-2 flex-shrink-0">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="搜尋患者姓名..." value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
                </div>
                <select value={patientGender} onChange={e => setPatientGender(e.target.value)}
                  className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-600">
                  <option value="">全部性別</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <div className="divide-y divide-gray-50 overflow-y-auto flex-1" style={{ maxHeight: "22rem" }}>
                {patientsLoading
                  ? [0,1,2].map(i => <SkeletonRow key={i} />)
                  : patients.length === 0
                    ? <div className="py-12 text-center text-gray-400 text-sm">查無結果</div>
                    : patients.map(pt => (
                      <div key={pt.patient_id}
                        className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                        onClick={() => setViewingPatientId(pt.patient_id)}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {pt.last_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800 text-sm">{pt.first_name}{pt.last_name}</p>
                            <span className="text-xs text-gray-400">{pt.gender === "male" ? "男" : "女"}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {calcAge(pt.date_of_birth) ? `${calcAge(pt.date_of_birth)} 歲 ‧ ` : ""}
                            總診次 {pt.total_appointments}
                            {pt.chronic_disease ? ` ‧ ${pt.chronic_disease.substring(0, 12)}` : ""}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-gray-400 justify-end">
                            <Clock size={11} />
                            <p className="text-xs">{pt.last_appointment?.substring(0, 10) || "—"}</p>
                          </div>
                          <p className="text-xs text-gray-400">最近看診</p>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 text-gray-400 transition-all flex-shrink-0" />
                      </div>
                    ))}
              </div>
            </section>

          </div>
        </main>
      </div>

      <div className="bg-gray-800 text-white py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。</p>
        </div>
      </div>

      {/* Modals */}
      {editingDoctor && (
        <DoctorEditModal doctor={editingDoctor} onClose={() => setEditingDoctor(null)}
          onSaved={(msg, type = "success") => { setEditingDoctor(null); showToast(msg, type); if (type === "success") fetchDoctors(); }} />
      )}
      {addingDoctor && (
        <AddDoctorModal onClose={() => setAddingDoctor(false)}
          onSaved={(msg) => { setAddingDoctor(false); showToast(msg); fetchDoctors(); fetchStats(); }} />
      )}
      {viewingPatientId && (
        <PatientDetailModal patientId={viewingPatientId} onClose={() => setViewingPatientId(null)} />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default TelemedicineDashboard;