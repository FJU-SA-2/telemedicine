// ============ 趨勢圖表組件 ============
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Droplet, Heart } from 'lucide-react';

export default function VitalSignsChart({ vitals }) {
  if (vitals.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">無足夠資料顯示趨勢圖表</p>
      </div>
    );
  }

  const chartData = vitals.slice(0, 10).reverse().map(vital => ({
    date: new Date(vital.measurement_date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
    收縮壓: vital.blood_pressure_systolic,
    舒張壓: vital.blood_pressure_diastolic,
    心率: vital.heart_rate,
    體重: vital.weight
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
        <h5 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Droplet className="text-red-600" size={20} /> 血壓趨勢
        </h5>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="收縮壓" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="舒張壓" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
        <h5 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Heart className="text-pink-600" size={20} /> 心率與體重趨勢
        </h5>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="心率" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="體重" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}