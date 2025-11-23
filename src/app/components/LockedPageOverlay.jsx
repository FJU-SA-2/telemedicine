import { Lock, LogIn, UserPlus } from 'lucide-react';

// 鎖定頁面元件 - 當使用者未登入時顯示
export default function LockedPageOverlay({ pageName, icon: Icon }) {
  return (
    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-30 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-8 text-center">
        {/* 鎖定圖示 */}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            {Icon && <Icon className="w-12 h-12 text-gray-400" />}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center border-4 border-white">
            <Lock className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* 標題 */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          需要登入才能使用
        </h2>

        {/* 說明文字 */}
        <p className="text-gray-600 mb-6">
          「{pageName}」功能需要登入後才能使用。<br />
          請先登入或註冊您的帳號。
        </p>

        {/* 操作按鈕 */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            立即登入
          </button>
          
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-lg font-semibold border-2 border-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            註冊新帳號
          </button>
        </div>

        {/* 額外提示 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            登入後您可以：
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>✓ 預約線上視訊看診</li>
            <li>✓ 查看預約記錄</li>
            <li>✓ 收藏喜歡的醫師</li>
            <li>✓ 回報問題與建議</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 使用範例:
// import LockedPageOverlay from './LockedPageOverlay';
// import { Star } from 'lucide-react';
// 
// function FavoritesPage() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//
//   useEffect(() => {
//     async function checkAuth() {
//       try {
//         const res = await fetch('/api/me', { credentials: 'include' });
//         if (res.ok) {
//           const data = await res.json();
//           setUser(data.user);
//         }
//       } catch (err) {
//         console.error('檢查登入狀態失敗:', err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     checkAuth();
//   }, []);
//
//   if (loading) return <div>載入中...</div>;
//
//   return (
//     <div className="relative">
//       {/* 原本的頁面內容 */}
//       <YourPageContent />
//       
//       {/* 如果未登入,顯示鎖定覆蓋層 */}
//       {!user && <LockedPageOverlay pageName="收藏列表" icon={Star} />}
//     </div>
//   );
// }