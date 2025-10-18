// ============ 慢性疾病組件 ============
import { Activity, Shield } from "lucide-react";
export default function ChronicConditionList({ conditions }) {
  if (conditions.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">無慢性疾病紀錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conditions.map((condition, index) => (
        <div key={index} className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Shield className="text-orange-600" size={24} />
              <div>
                <h5 className="font-bold text-lg text-gray-800">{condition.condition_name}</h5>
                {condition.icd_code && <p className="text-sm text-gray-600">ICD-10: {condition.icd_code}</p>}
              </div>
            </div>
            {condition.current_status && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                condition.current_status === "控制良好" ? "bg-green-100 text-green-700" :
                condition.current_status === "穩定" ? "bg-blue-100 text-blue-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {condition.current_status}
              </span>
            )}
          </div>
          {condition.notes && (
            <div className="bg-white rounded-lg p-3 border border-orange-100">
              <p className="text-sm text-gray-700">{condition.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}