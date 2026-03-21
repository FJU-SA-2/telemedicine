'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Menu, ArrowLeft } from 'lucide-react';
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function PostDetail() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [isOpen, setIsOpen] = useState(false);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState({ content: '', is_anonymous: false });
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/experience/posts/${postId}`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setPost(data.post);
      } else {
        alert('文章不存在');
        router.push('/experience');
      }
    } catch {
      alert('獲取文章失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.content.trim()) { alert('留言內容不能為空'); return; }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/experience/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newComment)
      });
      const data = await response.json();
      if (data.success) {
        setNewComment({ content: '', is_anonymous: false });
        fetchPost();
      } else {
        alert(data.message || '留言失敗');
      }
    } catch {
      alert('留言失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('確定要刪除這篇文章嗎？')) return;
    try {
      const response = await fetch(`/api/experience/posts/${postId}`, { method: 'DELETE', credentials: 'include' });
      const data = await response.json();
      if (data.success) { alert('文章已刪除'); router.push('/experience'); }
      else alert(data.message || '刪除失敗');
    } catch {
      alert('刪除失敗');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('確定要刪除這則留言嗎？')) return;
    try {
      const response = await fetch(`/api/experience/comments/${commentId}`, { method: 'DELETE', credentials: 'include' });
      const data = await response.json();
      if (data.success) fetchPost();
      else alert(data.message || '刪除失敗');
    } catch {
      alert('刪除失敗');
    }
  };

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId]);

  // ── 統一外層結構（不抽 Layout component，避免每次 re-render 重建導致 input 失去焦點）
  return (
    <div className="relative flex flex-col min-h-screen bg-gray-50">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition">
          <Menu size={24} />
        </button>
      )}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"} flex flex-col`}>
        <Navbar />

        {/* 載入中 */}
        {loading && (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-500 text-sm">載入中...</p>
            </div>
          </div>
        )}

        {/* 文章內容 */}
        {!loading && post && (
          <div className="py-5 sm:py-8 flex-1">
            <div className="max-w-4xl mx-auto px-3 sm:px-4">

              {/* 返回按鈕 */}
              <button
                onClick={() => router.push('/experience')}
                className="mb-4 sm:mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition text-sm"
              >
                <ArrowLeft size={18} />
                <span>返回列表</span>
              </button>

              {/* 文章 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 mb-4 sm:mb-6">
                <div className="flex justify-between items-start gap-3 mb-4">
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-800 leading-tight flex-1">{post.title}</h1>
                  {post.is_author && (
                    <button
                      onClick={handleDeletePost}
                      className="flex-shrink-0 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs sm:text-sm whitespace-nowrap"
                    >
                      刪除文章
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-5 pb-4 border-b border-gray-100">
                  <span>作者：{post.author_name}</span>
                  <span>·</span>
                  <span>{new Date(post.created_at).toLocaleString('zh-TW')}</span>
                </div>
                <div className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </div>
              </div>

              {/* 留言區 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-5">
                  留言 ({post.comments?.length || 0})
                </h2>

                {/* 留言表單 */}
                <form onSubmit={handleSubmitComment} className="mb-6 sm:mb-8">
                  <textarea
                    value={newComment.content}
                    onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                    rows="4"
                    placeholder="寫下您的留言..."
                    className="text-gray-700 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none mb-3"
                  />
                  <div className="flex justify-between items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={newComment.is_anonymous}
                        onChange={(e) => setNewComment({...newComment, is_anonymous: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700 text-sm">匿名留言</span>
                    </label>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                    >
                      {submitting ? '送出中...' : '送出留言'}
                    </button>
                  </div>
                </form>

                {/* 留言列表 */}
                {post.comments && post.comments.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="border-l-4 border-blue-200 pl-3 sm:pl-4 py-2 sm:py-3">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 min-w-0">
                            <span className="font-semibold text-gray-800 text-sm">{comment.author_name}</span>
                            <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString('zh-TW')}</span>
                          </div>
                          {comment.is_author && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="flex-shrink-0 text-red-400 hover:text-red-600 text-xs whitespace-nowrap"
                            >
                              刪除
                            </button>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8 text-sm">尚無留言，成為第一位留言者吧！</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">© 2025 MedOnGo. 讓醫療服務更便捷、更貼心。</p>
          </div>
        </footer>
      </div>
    </div>
  );
}