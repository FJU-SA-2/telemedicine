export default function PricingPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">方案與價格</h1>
      <p className="text-gray-600 mb-8">
        選擇最適合你的方案
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 免費方案 */}
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="text-2xl font-bold mt-2">$0</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✔ 基本功能</li>
            <li>✔ 限制使用</li>
          </ul>
        </div>

        {/* 進階方案 */}
        <div className="border rounded-xl p-6 bg-indigo-50">
          <h2 className="text-xl font-semibold">升級版</h2>
          <p className="text-2xl font-bold mt-2">NTD260</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✔ 無限制使用</li>
            <li>✔ 優先支援</li>
          </ul>
        </div>

        {/* 企業方案 */}
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold">企業版</h2>
          <p className="text-2xl font-bold mt-2">請直接聯繫我們</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✔ 客製化功能</li>
            <li>✔ 專屬支援</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
