// ============ 生命徵象組件 ============
import { Heart, Droplet, Thermometer, Weight } from "lucide-react";
import * as utils from "./Utils";

export default function VitalSignsList({ vitals }) {
  if (vitals.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">無生命徵象紀錄</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {vitals.slice(0, 10).map((vital, index) => (
        <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">{utils.formatDate(vital.measurement_date)}</p>
          <div className="grid grid-cols-2 gap-3">
            {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
              <div className="flex items-center gap-2">
                <Droplet size={16} className="text-red-600" />
                <div>
                  <p className="text-xs text-gray-600">血壓</p>
                  <p className="text-sm font-bold text-gray-800">
                    {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                  </p>
                </div>
              </div>
            )}
            {vital.heart_rate && (
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-pink-600" />
                <div>
                  <p className="text-xs text-gray-600">心率</p>
                  <p className="text-sm font-bold text-gray-800">{vital.heart_rate} bpm</p>
                </div>
              </div>
            )}
            {vital.temperature && (
              <div className="flex items-center gap-2">
                <Thermometer size={16} className="text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">體溫</p>
                  <p className="text-sm font-bold text-gray-800">{vital.temperature}°C</p>
                </div>
              </div>
            )}
            {vital.weight && (
              <div className="flex items-center gap-2">
                <Weight size={16} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">體重</p>
                  <p className="text-sm font-bold text-gray-800">{vital.weight} kg</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}