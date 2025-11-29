// ============ 搜尋與篩選組件 ============
import { Search, SortAsc } from "lucide-react";

export default function SearchAndFilter({ 
  searchTerm, 
  setSearchTerm, 
  filterGender, 
  setFilterGender,
  sortBy,
  setSortBy 
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋患者姓名或病歷號碼..."
            className="text-gray-700 w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'male', 'female'].map((gender) => (
            <button
              key={gender}
              onClick={() => setFilterGender(gender)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                filterGender === gender
                  ? gender === 'female' ? 'bg-pink-500 text-white shadow-md' : 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {gender === 'all' ? '全部' : gender === 'male' ? '男性' : '女性'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        <SortAsc size={20} className="text-gray-500" />
        <span className="text-sm text-gray-600 font-semibold mr-2">排序：</span>
        {[
          { value: 'recent', label: '最近就診' },
          { value: 'name', label: '姓名' },
          { value: 'appointments', label: '就診次數' }
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSortBy(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              sortBy === value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}