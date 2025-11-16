"use client";
import { useState, useEffect } from "react";
import { User, Menu, Calendar } from "lucide-react";
import StatCard from "./StatCard";
import SearchAndFilter from "./SearchAndFilter";
import PatientCard from "./PatientCard";
import PatientDetailModal from "./PatientDetailModal";
import Navbar from "../components/Navbar";
import DoctorSidebar from "../components/DoctorSidebar";

// ============ 主組件 ============
export default function DoctorPatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [isOpen, setIsOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null); // 🔥 添加這行

  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", {
          credentials: 'include'
        });
        const data = await res.json();
        
        if (data.authenticated && data.user && data.user.role === 'doctor') {
          setApprovalStatus(data.user.approval_status);
        }
      } catch (error) {
        console.error("Failed to fetch approval status:", error);
      }
    }
    fetchApprovalStatus();
  }, []);


  useEffect(() => {
    // 模擬數據載入
    setTimeout(() => {
      setPatients([
        {
          patient_id: 1001,
          first_name: "小明",
          last_name: "王",
          gender: "male",
          date_of_birth: "1985-03-15",
          phone_number: "0912-345-678",
          address: "台北市大安區忠孝東路123號",
          total_appointments: 12,
          last_appointment_date: "2024-10-15"
        },
        {
          patient_id: 1002,
          first_name: "小華",
          last_name: "李",
          gender: "female",
          date_of_birth: "1990-07-22",
          phone_number: "0923-456-789",
          address: "新北市板橋區中山路456號",
          total_appointments: 8,
          last_appointment_date: "2024-10-10"
        },
        {
          patient_id: 1003,
          first_name: "大明",
          last_name: "陳",
          gender: "male",
          date_of_birth: "1978-11-30",
          phone_number: "0934-567-890",
          address: "桃園市中壢區中正路789號",
          total_appointments: 25,
          last_appointment_date: "2024-10-18"
        },
        {
          patient_id: 1004,
          first_name: "小美",
          last_name: "林",
          gender: "female",
          date_of_birth: "1992-05-18",
          phone_number: "0945-678-901",
          address: "台中市西屯區文心路321號",
          total_appointments: 15,
          last_appointment_date: "2024-10-12"
        },
        {
          patient_id: 1005,
          first_name: "志強",
          last_name: "黃",
          gender: "male",
          date_of_birth: "1980-09-25",
          phone_number: "0956-789-012",
          address: "高雄市前鎮區中華路654號",
          total_appointments: 20,
          last_appointment_date: "2024-10-08"
        },
        {
          patient_id: 1006,
          first_name: "雅婷",
          last_name: "張",
          gender: "female",
          date_of_birth: "1988-12-03",
          phone_number: "0967-890-123",
          address: "台南市東區大同路147號",
          total_appointments: 6,
          last_appointment_date: "2024-10-05"
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  const filteredAndSortedPatients = patients
    .filter(patient => {
      if (filterGender !== "all" && patient.gender !== filterGender) return false;
      if (searchTerm) {
        const patientName = `${patient.last_name}${patient.first_name}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        if (!patientName.includes(searchLower) && !patient.patient_id.toString().includes(searchLower)) {
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

  return (
  <div className="relative min-h-screen bg-gray-50">
    {/* 側邊欄開關按鈕 */}
    {!isOpen && (
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 fixed top-2 left-4 text-gray-700 z-50 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white"
      >
        <Menu size={24} />
      </button>
    )}

    {/* 側邊欄 */}
    <DoctorSidebar
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      approvalStatus={approvalStatus}  // 🔥 添加這行
    />
    
    {/* 主內容 */}
    <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
      {/* 導覽列 */}
      <Navbar setIsSidebarOpen={setIsOpen} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
        {/* 標題區 */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <User className="text-blue-600" size={36} />
            患者列表
          </h1>
         
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard
            title="總患者數"
            value={patients.length}
            icon={User}
            color="blue"
          />
          <StatCard
            title="女性患者"
            value={patients.filter((p) => p.gender === "female").length}
            icon={User}
            color="pink"
          />
          <StatCard
            title="男性患者"
            value={patients.filter((p) => p.gender === "male").length}
            icon={User}
            color="blue"
          />
          <StatCard
            title="總預約數"
            value={patients.reduce(
              (sum, p) => sum + (p.total_appointments || 0),
              0
            )}
            icon={Calendar}
            color="green"
          />
        </div>

        {/* 搜尋與篩選 */}
        <SearchAndFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterGender={filterGender}
          setFilterGender={setFilterGender}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* 患者列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedPatients.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-md p-16 text-center border border-gray-100">
              <User size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">
                目前沒有符合條件的患者
              </p>
              <p className="text-sm text-gray-400 mt-2">
                請調整篩選條件
              </p>
            </div>
          ) : (
            filteredAndSortedPatients.map((patient) => (
              <PatientCard
                key={patient.patient_id}
                patient={patient}
                onPatientClick={handlePatientClick}
              />
            ))
          )}
        </div>

        {/* 患者詳情彈窗 */}
        {showDetailModal && selectedPatient && (
          <PatientDetailModal
            patient={selectedPatient}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </div>
    </div>
  </div>
);}
