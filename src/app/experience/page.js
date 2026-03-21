'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, X, Plus } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function ExperienceSharing() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    is_anonymous: false
  });

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('/api/me', { credentials: 'include' });
        const data = await response.json();
        setIsLoggedIn(data.authenticated || false);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

  const fetchPosts = async (page = 1, searchKeyword = '') => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/experience/posts?page=${page}&per_page=10&keyword=${searchKeyword}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
        setTotalPages(Math.ceil(data.total / data.per_page));
      }
    } catch {
      alert('獲取文章失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setIsSearching(true);
    fetchPosts(1, keyword);
  };

  const handleClearSearch = () => {
    setKeyword('');
    setIsSearching(false);
    setCurrentPage(1);
    fetchPosts(1, '');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('標題和內容不能為空');
      return;
    }
    try {
      const response = await fetch('/api/experience/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newPost)
      });
      const data = await response.json();
      if (data.success) {
        alert('文章發布成功！');
        setShowCreateModal(false);
        setNewPost({ title: '', content: '', is_anonymous: false });
        fetchPosts(currentPage, keyword);
      } else {
        alert(data.message || '發布失敗');
      }
    } catch {
      alert('發布文章失敗');
    }
  };

  const handleCreateButtonClick = () => {
    if (!isLoggedIn) { alert('請先登入'); return; }
    setShowCreateModal(true);
  };

  useEffect(() => {
    fetchPosts(currentPage, keyword);
  }, [currentPage]);

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-[var(--color-periwinkle)]/30 via-white to-[var(--color-light-cyan)]/30">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"} flex flex-col`}>
        <Navbar />

        <div className="py-6 sm:py-8 flex-1">
          <div className="max-w-5xl mx-auto px-3 sm:px-4">

            {/* 標題 */}
            <div className="mb-5 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">經驗分享區</h1>
              <p className="text-sm sm:text-base text-gray-600">分享您的就醫經驗，幫助更多人</p>
            </div>

            {/* 搜尋欄 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-4 sm:mb-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="搜尋文章關鍵字..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="text-gray-700 w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-sm"
                  />
                  {keyword && (
                    <button type="button" onClick={() => setKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button type="submit" className="px-4 py-2 bg-[var(--color-azure)] text-white rounded-lg hover:opacity-90 transition text-sm font-medium whitespace-nowrap">
                  搜尋
                </button>
                {isSearching && (
                  <button type="button" onClick={handleClearSearch} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm whitespace-nowrap">
                    清空
                  </button>
                )}
              </form>
            </div>

            {/* 文章列表 */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-500 text-sm">載入中...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
                <p className="text-gray-500">尚無文章，成為第一位分享者吧！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition cursor-pointer"
                    onClick={() => router.push(`/experience/${post.id}`)}
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex-1 leading-tight line-clamp-2">
                        {post.title}
                      </h2>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {new Date(post.created_at).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>作者：{post.author_name}</span>
                      <span>💬 {post.comment_count} 則留言</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 分頁 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6 mb-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                >
                  上一頁
                </button>
                <span className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                >
                  下一頁
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className={`transition-all duration-300 ${isOpen ? "md:ml-0" : ""} bg-gray-800 text-white py-8 mt-auto`}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">© 2025 MedOnGo. 讓醫療服務更便捷、更貼心。</p>
          </div>
        </footer>

        {/* 發布按鈕 */}
        <button
              onClick={handleCreateButtonClick}
              className="fixed bottom-10 right-20 w-16 h-16 bg-[var(--color-lime-cream)] text-white rounded-full shadow-lg hover:bg-[var(--color-periwinkle)] hover:shadow-xl transition-all flex items-center justify-center z-40 text-3xl"
              title="發布文章"
            >
              +
            </button>
      </div>

      {/* 發文 Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 sm:px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-gray-800 text-lg sm:text-xl font-bold">發布新文章</h2>
              <button onClick={() => { setShowCreateModal(false); setNewPost({ title: '', content: '', is_anonymous: false }); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="p-5 sm:p-6">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1.5">標題</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="text-gray-800 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  placeholder="請輸入文章標題"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1.5">內容</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  rows="8"
                  className="text-gray-800 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
                  placeholder="分享您的經驗..."
                />
              </div>
              <div className="mb-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPost.is_anonymous}
                    onChange={(e) => setNewPost({...newPost, is_anonymous: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 text-sm">匿名發布</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewPost({ title: '', content: '', is_anonymous: false }); }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-sm font-medium"
                >
                  發布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}