// ============ 統計卡片組件 ============
const colorMap = {
  blue:  { border: "border-blue-500",  text: "text-blue-500"  },
  pink:  { border: "border-pink-500",  text: "text-pink-500"  },
  green: { border: "border-green-500", text: "text-green-500" },
  red:   { border: "border-red-500",   text: "text-red-500"   },
};

export default function StatCard({ title, value, icon: Icon, color }) {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${colors.border} hover:shadow-lg transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <Icon className={colors.text} size={32} />
      </div>
    </div>
  );
}