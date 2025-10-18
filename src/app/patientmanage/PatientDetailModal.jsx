// ============ 患者詳情彈窗組件 ============
import { useState } from "react";
import { X, User, History, AlertTriangle, Shield, Heart, TrendingUp } from "lucide-react";
import * as utils from "./Utils";
import MedicalHistory from "./MedicalHistory";
import AllergyList from "./AllergyList";
import ChronicConditionList from "./ChronicConditionList";
import VitalSignsChart from "./VitalSignsChart";
import VitalSignsList from "./VitalSignsList";

export default function PatientDetailModal({ patient, onClose }) {
  const [activeTab, setActiveTab] = useState("history");
  const [loading, setLoading] = useState(false);

  // 模擬數據
  const mockHistory = [
    {
      doctor_name: "張醫師",
      specialty: "內科",
      appointment_date: "2024-10-15",
      appointment_time: "14:30",
      symptoms: "發燒、咳嗽",
      diagnoses: "急性上呼吸道感染",
      prescriptions: "退燒藥、止咳藥"
    }
  ];

  const mockAllergies = [
    {
      allergen_name: "青黴素",
      allergen_type: "藥物",
      severity: "重度",
      reaction: "皮疹、呼吸困難"
    }
  ];

  const mockConditions = [
    {
      condition_name: "高血壓",
      icd_code: "I10",
      current_status: "控制良好",
      notes: "定期服藥控制中"
    }
  ];

  const mockVitals = [
    {
      measurement_date: "2024-10-15",
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      heart_rate: 72,
      temperature: 36.5,
      weight: 70
    },
    {
      measurement_date: "2024-10-10",
      blood_pressure_systolic: 125,
      blood_pressure_diastolic: 82,
      heart_rate: 75,
      temperature: 36.6,
      weight: 70.5
    }
  ];

  const tabs = [
    { id: "history", label: "就診紀錄", icon: History, color: "blue" },
    { id: "allergies", label: "過敏史", icon: AlertTriangle, color: "red" },
    { id: "chronic", label: "慢性疾病", icon: Shield, color: "orange" },
    { id: "vitals", label: "生命徵象", icon: Heart, color: "green" },
    { id: "trends", label: "趨勢圖表", icon: TrendingUp, color: "purple" }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* 彈窗標題 */}
        <div className={`sticky top-0 bg-gradient-to-r ${utils.getGenderColor(patient.gender)} text-white p-6 rounded-t-2xl z-10`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {patient.first_name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{patient.last_name}{patient.first_name}</h3>
                <p className="text-white/80 text-sm mt-1">
                  病歷號：#{patient.patient_id} | {utils.getGenderDisplay(patient.gender)} | {utils.calculateAge(patient.date_of_birth)}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition">
              <X size={28} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 患者基本資料 */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-5 mb-6">
            <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-blue-600" /> 基本資料
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">出生日期</p>
                <p className="font-semibold text-gray-800">
                  {patient.date_of_birth ? utils.formatDate(patient.date_of_birth) : "未提供"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">聯絡電話</p>
                <p className="font-semibold text-gray-800">{patient.phone_number || "未提供"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">就診次數</p>
                <p className="font-semibold text-gray-800">{patient.total_appointments || 0} 次</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-sm text-gray-600 mb-1">居住地址</p>
                <p className="font-semibold text-gray-800">{patient.address || "未提供"}</p>
              </div>
            </div>
          </div>

          {/* 分頁標籤 */}
          <div className="flex gap-2 mb-6 border-b-2 border-gray-200 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === id
                    ? `text-${color}-600 border-b-4 border-${color}-600 -mb-0.5`
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} />
                  {label}
                </div>
              </button>
            ))}
          </div>

          {/* 分頁內容 */}
          {activeTab === "history" && <MedicalHistory history={mockHistory} />}
          {activeTab === "allergies" && <AllergyList allergies={mockAllergies} />}
          {activeTab === "chronic" && <ChronicConditionList conditions={mockConditions} />}
          {activeTab === "vitals" && <VitalSignsList vitals={mockVitals} />}
          {activeTab === "trends" && <VitalSignsChart vitals={mockVitals} />}
        </div>
      </div>
    </div>
  );
}