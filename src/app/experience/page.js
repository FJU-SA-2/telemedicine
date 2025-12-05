'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
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

  // 檢查登入狀態
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include'
        });
        const data = await response.json();
        console.log('登入狀態:', data);
        setIsLoggedIn(data.authenticated || false);
      } catch (error) {
        console.error('檢查登入狀態失敗:', error);
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
        {
          credentials: 'include'
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
        setTotalPages(Math.ceil(data.total / data.per_page));
      }
    } catch (error) {
      console.error('獲取文章失敗:', error);
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
        headers: {
          'Content-Type': 'application/json'
        },
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
    } catch (error) {
      console.error('發布文章失敗:', error);
      alert('發布文章失敗');
    }
  };

  const viewPost = (postId) => {
    router.push(`/experience/${postId}`);
  };

  const handleCreateButtonClick = () => {
    if (!isLoggedIn) {
      alert('請先登入');
      return;
    }
    setShowCreateModal(true);
  };

  useEffect(() => {
    fetchPosts(currentPage, keyword);
  }, [currentPage]);

  return (
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />
        
        <div className="py-8">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">經驗分享區</h1>
              <p className="text-gray-600">分享您的就醫經驗，幫助更多人</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="搜尋文章關鍵字..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="text-gray-700 flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  搜尋
                </button>
                {isSearching && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    清空
                  </button>
                )}
              </form>
            </div>

            <button
              onClick={handleCreateButtonClick}
              className="fixed bottom-10 right-20 w-16 h-16 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 hover:shadow-xl transition-all flex items-center justify-center z-40 text-3xl"
              title="發布文章"
            >
              +
            </button>
           
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">載入中...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">尚無文章，成為第一位分享者吧！</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                    onClick={() => viewPost(post.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-xl font-semibold text-gray-800 flex-1">
                        {post.title}
                      </h2>
                      <span className="text-sm text-gray-500 ml-4">
                        {new Date(post.created_at).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>作者：{post.author_name}</span>
                      <span>💬 {post.comment_count} 則留言</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一頁
                </button>
                <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一頁
                </button>
              </div>
            )}

            {showCreateModal && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                  <h2 className="text-2xl font-bold mb-4">發布新文章</h2>
                  <form onSubmit={handleCreatePost}>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">標題</label>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="請輸入文章標題"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">內容</label>
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        rows="10"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="分享您的經驗..."
                      />
                    </div>
                    <div className="mb-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPost.is_anonymous}
                          onChange={(e) => setNewPost({...newPost, is_anonymous: e.target.checked})}
                          className="mr-2 w-4 h-4"
                        />
                        <span className="text-gray-700">匿名發布</span>
                      </label>
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setNewPost({ title: '', content: '', is_anonymous: false });
                        }}
                        className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        發布
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}