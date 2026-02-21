"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Mech_Sidebar from "../components/Mech_Sidebar";
import {
  Menu,
  Users,
  UserCheck,
  Search,
  ChevronRight,
  Stethoscope,
  HeartPulse,
  CalendarDays,
  ShieldCheck,
  Clock,
  MoreHorizontal,
} from "lucide-react";

// ── 假資料（串接 API 後替換） ──────────────────────────────────────────
const MOCK_DOCTORS = [
  { id: 1, name: "王志明", department: "心臟科", status: "在職", patients: 38, today: 5 },
  { id: 2, name: "林雅婷", department: "內科",   status: "在職", patients: 52, today: 3 },
  { id: 3, name: "陳俊宏", department: "骨科",   status: "在職", patients: 27, today: 7 },
  { id: 4, name: "張淑芬", department: "兒科",   status: "停診", patients: 44, today: 0 },
];

const MOCK_PATIENTS = [
  { id: 1, name: "李建國", age: 62, status: "住院", doctor: "王志明", lastVisit: "2025-02-20" },
  { id: 2, name: "吳美玲", age: 35, status: "門診", doctor: "林雅婷", lastVisit: "2025-02-21" },
  { id: 3, name: "黃信智", age: 48, status: "門診", doctor: "陳俊宏", lastVisit: "2025-02-19" },
  { id: 4, name: "劉雅雯", age: 27, status: "出院", doctor: "張淑芬", lastVisit: "2025-02-18" },
  { id: 5, name: "蔡志遠", age: 55, status: "住院", doctor: "王志明", lastVisit: "2025-02-17" },
];

// ── 小元件 ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    在職: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    停診: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
    住院: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    門診: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
    出院: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── 主元件 ────────────────────────────────────────────────────────────
const TelemedicineDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [isOpen, setIsOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        if (data.authenticated && data.user && data.user.role === "doctor") {
          setApprovalStatus(data.user.approval_status);
        } else {
          setApprovalStatus("unauthorized");
        }
      } catch {
        setApprovalStatus("error");
      }
    }
    fetchApprovalStatus();
  }, []);

  const filteredDoctors = MOCK_DOCTORS.filter((d) =>
    d.name.includes(doctorSearch) || d.department.includes(doctorSearch)
  );
  const filteredPatients = MOCK_PATIENTS.filter((p) =>
    p.name.includes(patientSearch) || p.doctor.includes(patientSearch)
  );

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Mech_Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        approvalStatus={approvalStatus}
      />

      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        <main className="p-6 md:p-8 max-w-7xl mx-auto">

          {/* 歡迎標題 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">機構管理中心</h1>
            <p className="text-gray-500 text-sm mt-1">管理本院醫師與患者的總覽資訊</p>
          </div>

          {/* 統計卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Stethoscope}  label="本院醫師" value={MOCK_DOCTORS.length}  sub="位醫師"       color="bg-blue-500" />
            <StatCard icon={HeartPulse}   label="本院患者" value={MOCK_PATIENTS.length} sub="位患者"       color="bg-teal-500" />
            <StatCard icon={CalendarDays} label="今日看診" value={MOCK_DOCTORS.reduce((s, d) => s + d.today, 0)} sub="診次" color="bg-violet-500" />
            <StatCard icon={ShieldCheck}  label="住院中"   value={MOCK_PATIENTS.filter(p => p.status === "住院").length} sub="位患者" color="bg-orange-500" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* 醫師管理 */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-blue-500" />
                  <h2 className="font-semibold text-gray-800">醫師管理</h2>
                  <span className="ml-1 bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {MOCK_DOCTORS.length} 位
                  </span>
                </div>
                <button className="text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors">
                  查看全部 <ChevronRight size={14} />
                </button>
              </div>

              <div className="px-6 py-3 border-b border-gray-50">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜尋醫師姓名或科別..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {filteredDoctors.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">查無結果</div>
                ) : (
                  filteredDoctors.map((doc) => (
                    <div key={doc.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {doc.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 text-sm">{doc.name}</p>
                          <StatusBadge status={doc.status} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{doc.department} ‧ 患者 {doc.patients} 位</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-700">{doc.today}</p>
                        <p className="text-xs text-gray-400">今日診次</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 患者管理 */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-teal-500" />
                  <h2 className="font-semibold text-gray-800">患者管理</h2>
                  <span className="ml-1 bg-teal-50 text-teal-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {MOCK_PATIENTS.length} 位
                  </span>
                </div>
                <button className="text-sm text-teal-500 hover:text-teal-700 font-medium flex items-center gap-1 transition-colors">
                  查看全部 <ChevronRight size={14} />
                </button>
              </div>

              <div className="px-6 py-3 border-b border-gray-50">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜尋患者姓名或主治醫師..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {filteredPatients.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">查無結果</div>
                ) : (
                  filteredPatients.map((pt) => (
                    <div key={pt.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {pt.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 text-sm">{pt.name}</p>
                          <StatusBadge status={pt.status} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{pt.age} 歲 ‧ 主治：{pt.doctor}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-gray-400 justify-end">
                          <Clock size={11} />
                          <p className="text-xs">{pt.lastVisit}</p>
                        </div>
                        <p className="text-xs text-gray-400">最近看診</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。</p>
        </div>
      </div>
    </div>
  );
};

export default TelemedicineDashboard;