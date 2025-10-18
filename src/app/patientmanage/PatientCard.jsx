// ============ 患者卡片組件 ============
import { ChevronRight, Phone, MapPin } from "lucide-react";
import * as utils from "./Utils";

export default function PatientCard({ patient, onPatientClick }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all border border-gray-100 overflow-hidden cursor-pointer transform hover:-translate-y-1 duration-300">
      <div className={`h-2 bg-gradient-to-r`}></div>
      
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4" onClick={() => onPatientClick(patient)}>
          <div className={`w-16 h-16 bg-gradient-to-br ${utils.getGenderColor(patient.gender)} rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0`}>
            {patient.first_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-800 truncate">
              {patient.last_name}{patient.first_name}
            </h3>
            <p className="text-sm text-gray-500">病歷號：#{patient.patient_id}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {utils.getGenderDisplay(patient.gender)}
              </span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                {utils.calculateAge(patient.date_of_birth)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4 pb-4 border-b border-gray-100" onClick={() => onPatientClick(patient)}>
          {patient.phone_number && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={16} className="text-green-600 flex-shrink-0" />
              <span className="truncate">{patient.phone_number}</span>
            </div>
          )}
          {patient.address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{patient.address}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-gray-600 mb-1">總就診次數</p>
            <p className="text-lg font-bold text-blue-600">{patient.total_appointments || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <p className="text-xs text-gray-600 mb-1">最近就診</p>
            <p className="text-xs font-semibold text-green-600">
              {patient.last_appointment_date ? new Date(patient.last_appointment_date).toLocaleDateString('zh-TW', {month: 'short', day: 'numeric'}) : "無紀錄"}
            </p>
          </div>
        </div>

        <button 
          onClick={() => onPatientClick(patient)}
          className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          查看完整病歷
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}