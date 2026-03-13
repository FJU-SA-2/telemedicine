// PatientDetailModal.jsx
import { useState, useEffect } from "react";
import { X, User, AlertTriangle, Shield, Phone, MapPin, Calendar, FileText, Activity, Pill, Cigarette } from "lucide-react";
import * as utils from "./Utils";
import MedicalHistory from "./MedicalHistory";

export default function PatientDetailModal({ patient, onClose }) {
  const [loading, setLoading] = useState(true);
  const [patientDetail, setPatientDetail] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function fetchPatientDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/doctors/patients/${patient.patient_id}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setPatientDetail(data.patient);
          setHistory(data.history);
        }
      } catch (err) {
        console.error("獲取患者詳情錯誤:", err);
      } finally {
        setLoading(false);
      }
    }
    if (patient?.patient_id) fetchPatientDetail();
  }, [patient?.patient_id]);

  const p = patientDetail || patient;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4 sm:p-4">
      {/* 手機/平板皆置中，保留四周邊距 */}
      <div className="bg-white rounded-2xl w-full sm:max-w-4xl shadow-2xl max-h-[88vh] overflow-y-auto">

        {/* 標題區 */}
        <div className={`sticky top-0 bg-gradient-to-r ${utils.getGenderColor(p.gender)} text-white p-4 sm:p-6 rounded-t-2xl z-10`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg shrink-0">
                {p.first_name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-2xl font-bold truncate">{p.first_name}{p.last_name}</h3>
                <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                  病歷號：#{p.patient_id} | {utils.getGenderDisplay(p.gender)} | {utils.calculateAge(p.date_of_birth)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition shrink-0"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">載入中...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* ===== 基本資料區塊 ===== */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 sm:p-5">
                <h4 className="font-bold text-base sm:text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <User size={20} className="text-blue-600 shrink-0" /> 基本資料
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* 出生日期 */}
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">出生日期</p>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">
                      {p.date_of_birth ? utils.formatDate(p.date_of_birth) : "未提供"}
                    </p>
                  </div>

                  {/* 身分證字號 */}
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">身分證字號</p>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">{p.id_number || "未提供"}</p>
                  </div>

                  {/* 聯絡電話 */}
                  <div className="flex items-start gap-2">
                    <Phone size={15} className="text-green-600 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">聯絡電話</p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">{p.phone_number || "未提供"}</p>
                    </div>
                  </div>

                  {/* 吸菸狀態 */}
                  <div className="flex items-start gap-2">
                    <Cigarette size={15} className="text-orange-600 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">吸菸狀態</p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
                        {p.smoking_status === "yes" ? "有吸菸" : p.smoking_status === "quit" ? "已戒菸" : "無"}
                      </p>
                    </div>
                  </div>

                  {/* 居住地址 */}
                  <div className="sm:col-span-2 flex items-start gap-2">
                    <MapPin size={15} className="text-red-600 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">居住地址</p>
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">{p.address || "未提供"}</p>
                    </div>
                  </div>

                  {/* 緊急聯絡人 */}
                  {(p.emergency_contact_name || p.emergency_contact_phone) && (
                    <>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">緊急聯絡人</p>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">{p.emergency_contact_name || "未提供"}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">緊急聯絡人電話</p>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">{p.emergency_contact_phone || "未提供"}</p>
                      </div>
                    </>
                  )}

                  {/* 藥物過敏史 */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={15} className="text-red-600 shrink-0" />
                      <p className="text-xs sm:text-sm text-gray-500 font-semibold">藥物過敏史</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-gray-800 whitespace-pre-wrap text-sm">{p.drug_allergies || "無藥物過敏紀錄"}</p>
                    </div>
                  </div>

                  {/* 慢性病/重大疾病史 */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={15} className="text-orange-600 shrink-0" />
                      <p className="text-xs sm:text-sm text-gray-500 font-semibold">慢性病/重大疾病史</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-gray-800 whitespace-pre-wrap text-sm">{p.medical_history || "無重大疾病史紀錄"}</p>
                    </div>
                  </div>

                  {/* 就診統計 */}
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">總就診次數</p>
                    <p className="font-semibold text-blue-600 text-lg sm:text-xl">{p.total_appointments || 0} 次</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">最近就診日期</p>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">
                      {p.last_appointment_date ? utils.formatDate(p.last_appointment_date) : "無"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ===== 完整病歷紀錄區塊 ===== */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-5">
                <h4 className="font-bold text-base sm:text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-green-600 shrink-0" /> 完整病歷紀錄
                </h4>
                <MedicalHistory patientId={patient.patient_id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}