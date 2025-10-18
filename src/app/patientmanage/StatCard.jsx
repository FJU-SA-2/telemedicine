
export default function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-4 border-l-4 border-${color}-500 hover:shadow-lg transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <Icon className={`text-${color}-500`} size={32} />
      </div>
    </div>
  );
}