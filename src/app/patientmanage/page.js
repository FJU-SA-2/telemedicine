"use client";
import { useState, useEffect } from "react";
import { User, Menu, Calendar } from "lucide-react";
import StatCard from "./StatCard";
import SearchAndFilter from "./SearchAndFilter";
import PatientCard from "./PatientCard";
import PatientDetailModal from "./PatientDetailModal";
import Navbar from "../components/Navbar";
import DoctorSidebar from "../components/DoctorSidebar";

export default function DoctorPatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("patients");
  const [isOpen, setIsOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [error, setError] = useState(null);

  // 獲取醫師審核狀態
  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", { credentials: 'include' });
        const data = await res.json();
        if (data.authenticated && data.user?.role === 'doctor') {
          setApprovalStatus(data.user.approval_status);
        }
      } catch (err) {
        console.error("Failed to fetch approval status:", err);
      }
    }
    fetchApprovalStatus();
  }, []);

  // 從資料庫獲取患者列表
  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true);
        const res = await fetch("/api/doctors/patients", { credentials: 'include' });
        
        if (!res.ok) {
          if (res.status === 401) {
            setError("請先登入");
            return;
          }
          throw new Error("獲取患者列表失敗");
        }
        
        const data = await res.json();
        setPatients(data);
      } catch (err) {
        console.error("載入患者資料錯誤:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  const filteredAndSortedPatients = patients
    .filter(patient => {
      if (filterGender !== "all" && patient.gender !== filterGender) return false;
      if (searchTerm) {
        const name = `${patient.last_name}${patient.first_name}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        if (!name.includes(search) && !patient.patient_id.toString().includes(search)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.last_appointment_date || 0) - new Date(a.last_appointment_date || 0);
      } else if (sortBy === "name") {
        return `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`);
      } else if (sortBy === "appointments") {
        return (b.total_appointments || 0) - (a.total_appointments || 0);
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition">
          <Menu size={24} />
        </button>
      )}

      <DoctorSidebar isOpen={isOpen} setIsOpen={setIsOpen} activeTab={activeTab} setActiveTab={setActiveTab} approvalStatus={approvalStatus} />
      
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar setIsSidebarOpen={setIsOpen} />

        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <User className="text-blue-600" size={36} />
              我的患者
            </h1>
            <p className="text-gray-600">顯示曾經預約過您的所有患者</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard title="總患者數" value={patients.length} icon={User} color="blue" />
            <StatCard title="女性患者" value={patients.filter(p => p.gender === "female").length} icon={User} color="pink" />
            <StatCard title="男性患者" value={patients.filter(p => p.gender === "male").length} icon={User} color="blue" />
            <StatCard title="總預約數" value={patients.reduce((sum, p) => sum + (p.total_appointments || 0), 0)} icon={Calendar} color="green" />
          </div>

          <SearchAndFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterGender={filterGender} setFilterGender={setFilterGender} sortBy={sortBy} setSortBy={setSortBy} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPatients.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-md p-16 text-center border border-gray-100">
                <User size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">
                  {patients.length === 0 ? "目前還沒有患者預約過您" : "沒有符合條件的患者"}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {patients.length === 0 ? "當患者預約您的門診後，將會顯示在這裡" : "請調整篩選條件"}
                </p>
              </div>
            ) : (
              filteredAndSortedPatients.map(patient => (
                <PatientCard key={patient.patient_id} patient={patient} onPatientClick={handlePatientClick} />
              ))
            )}
          </div>

          {showDetailModal && selectedPatient && (
            <PatientDetailModal patient={selectedPatient} onClose={() => setShowDetailModal(false)} />
          )}
        </div>
      </div>
    {/* Footer */}
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