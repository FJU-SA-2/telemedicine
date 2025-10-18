// ============ 就診紀錄組件 ============
import { FileText, AlertCircle, Activity, Pill } from "lucide-react";
import * as utils from "./Utils";

export default function MedicalHistory({ history }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">暫無就診紀錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {history.map((record, index) => (
        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow">
                {record.doctor_name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-800">{record.doctor_name} 醫師</p>
                <p className="text-sm text-gray-600">{record.specialty}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-blue-600">{utils.formatDate(record.appointment_date)}</p>
              <p className="text-xs text-gray-500">{record.appointment_time?.substring(0, 5)}</p>
            </div>
          </div>

          {record.symptoms && (
            <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1 flex items-center gap-1 font-semibold">
                <AlertCircle size={14} /> 主訴症狀
              </p>
              <p className="text-sm text-gray-700">{record.symptoms}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {record.diagnoses && (
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1 font-semibold">
                  <Activity size={14} className="text-green-600" /> 診斷
                </p>
                <p className="text-sm text-gray-700">{record.diagnoses}</p>
              </div>
            )}
            {record.prescriptions && (
              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1 font-semibold">
                  <Pill size={14} className="text-purple-600" /> 處方
                </p>
                <p className="text-sm text-gray-700">{record.prescriptions}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}