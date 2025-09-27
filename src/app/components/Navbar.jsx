import Link from 'next/link';

export default function Navbar() {
  return (
<header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">遠距醫療平台</h1>
            </div>
            <Link href="/login">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                登入
              </button>
            </Link>
            </div>
          </div>
      </header>
  );
}