'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function PostDetail() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id;
  
  const [isOpen, setIsOpen] = useState(false); // 側邊欄狀態
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState({
    content: '',
    is_anonymous: false
  });
  const [submitting, setSubmitting] = useState(false);

  // 獲取文章詳情
  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/experience/posts/${postId}`,
        {
          credentials: 'include'  // 重要：讓請求攜帶 cookie (session)
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setPost(data.post);
      } else {
        alert('文章不存在');
        router.push('/experience');
      }
    } catch (error) {
      console.error('獲取文章失敗:', error);
      alert('獲取文章失敗');
    } finally {
      setLoading(false);
    }
  };

  // 提交留言
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.content.trim()) {
      alert('留言內容不能為空');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/experience/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',  // 重要：讓請求攜帶 cookie (session)
          body: JSON.stringify(newComment)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        alert('留言成功！');
        setNewComment({ content: '', is_anonymous: false });
        fetchPost(); // 重新載入文章和留言
      } else {
        alert(data.message || '留言失敗');
      }
    } catch (error) {
      console.error('留言失敗:', error);
      alert('留言失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 刪除文章
  const handleDeletePost = async () => {
    if (!confirm('確定要刪除這篇文章嗎？')) return;

    try {
      const response = await fetch(
        `/api/experience/posts/${postId}`,
        {
          method: 'DELETE',
          credentials: 'include'  // 重要：讓請求攜帶 cookie (session)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        alert('文章已刪除');
        router.push('/experience');
      } else {
        alert(data.message || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗');
    }
  };

  // 刪除留言
  const handleDeleteComment = async (commentId) => {
    if (!confirm('確定要刪除這則留言嗎？')) return;

    try {
      const response = await fetch(
        `/api/experience/comments/${commentId}`,
        {
          method: 'DELETE',
          credentials: 'include'  // 重要：讓請求攜帶 cookie (session)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        alert('留言已刪除');
        fetchPost();
      } else {
        alert(data.message || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗');
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gray-50">
        {/* 選單按鈕 */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="p-3 fixed top-2 left-4 text-gray-800 z-30 bg-white rounded-lg transition"
          >
            <Menu size={24} />
          </button>
        )}

        {/* 側邊欄 */}
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

        {/* 主內容 */}
        <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
          <Navbar />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  // 從 session 取得當前用戶 ID（需要從後端 API 取得）
  const currentUserId = post.user_id; // 暫時用這個判斷，實際應該另外取得當前登入用戶
  const isAuthor = currentUserId === post.user_id;

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* 選單按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      {/* 側邊欄 */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* 主內容 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        {/* 導覽列 */}
        <Navbar />
        
        {/* 文章詳情內容 */}
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">

            {/* 返回按鈕 */}
            <button
              onClick={() => router.push('/experience')}
              className="mb-6 p-3 hover:bg-gray-100 rounded-full transition-colors inline-flex items-center justify-center"
              aria-label="返回"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>

            {/* 文章內容 */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-800">{post.title}</h1>
                {isAuthor && (
                  <button
                    onClick={handleDeletePost}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                  >
                    刪除文章
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-gray-600 mb-6 pb-4 border-b">
                <span>作者：{post.author_name}</span>
                <span>發布時間：{new Date(post.created_at).toLocaleString('zh-TW')}</span>
              </div>
              
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {post.content}
              </div>
            </div>

            {/* 留言區 */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                留言 ({post.comments?.length || 0})
              </h2>

              {/* 留言表單 */}
              <form onSubmit={handleSubmitComment} className="mb-8">
                <textarea
                  value={newComment.content}
                  onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                  rows="4"
                  placeholder="寫下您的留言..."
                  className="text-gray-700 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <div className="flex justify-between items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newComment.is_anonymous}
                      onChange={(e) => setNewComment({...newComment, is_anonymous: e.target.checked})}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-gray-700">匿名留言</span>
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {submitting ? '送出中...' : '送出留言'}
                  </button>
                </div>
              </form>

              {/* 留言列表 */}
              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-4">
                  {post.comments.map((comment) => {
                    const isCommentAuthor = currentUserId === comment.user_id;
                    return (
                      <div key={comment.id} className="border-l-4 border-blue-200 pl-4 py-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800">
                              {comment.author_name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.created_at).toLocaleString('zh-TW')}
                            </span>
                          </div>
                          {isCommentAuthor && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              刪除
                            </button>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">尚無留言，成為第一位留言者吧！</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}