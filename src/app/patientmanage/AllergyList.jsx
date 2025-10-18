// ============ 過敏史組件 ============
import { Shield, AlertTriangle } from "lucide-react";
import * as utils from "./Utils";
export default function AllergyList({ allergies }) {
  if (allergies.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">無過敏史紀錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allergies.map((allergy, index) => (
        <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-600" size={24} />
              <div>
                <h5 className="font-bold text-lg text-gray-800">{allergy.allergen_name}</h5>
                <p className="text-sm text-gray-600">{allergy.allergen_type}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${utils.getSeverityColor(allergy.severity)}`}>
              {allergy.severity}
            </span>
          </div>
          {allergy.reaction && (
            <div className="bg-white rounded-lg p-3 mb-2 border border-red-100">
              <p className="text-xs text-gray-600 mb-1 font-semibold">過敏反應</p>
              <p className="text-sm text-gray-700">{allergy.reaction}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}