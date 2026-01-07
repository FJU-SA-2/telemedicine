'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, XCircle, Eye, Clock, Mail, Phone, MapPin, FileText, LogOut, Users } from 'lucide-react';

function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const getRoleText = (role) => {
    const map = {
      'patient': '患者',
      'doctor': '醫師',
      'unknown': '未知'
    };
    return map[role] || '未知';
  };

  const getRoleBadgeColor = (role) => {
    const colorMap = {
      'patient': 'bg-blue-100 text-blue-700',
      'doctor': 'bg-purple-100 text-purple-700',
      'unknown': 'bg-gray-100 text-gray-700'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-700';
  };
  
  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/admin/feedback');
      
      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || '載入失敗');
        } catch (parseError) {
          const text = await res.text();
          throw new Error(text || '載入失敗');
        }
      }

      const data = await res.json();
      setFeedbacks(data);
      setUnreadCount(data.filter(f => f.status === 'unread').length);
    } catch (err) {
      console.error('載入回報錯誤:', err);
      setError('無法載入回報資料');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    if (!confirm('確認要標示為已處理嗎?')) return;
    try {
      const res = await fetch('/api/admin/feedback/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: id }),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
          const json = JSON.parse(text);
          message = json.message || JSON.stringify(json);
        } catch (_) {}
        throw new Error(message || '操作失敗');
      }

      alert('已標示為已處理');
      fetchFeedbacks();
    } catch (err) {
      console.error('更新狀態錯誤:', err);
      alert(err.message || '操作失敗');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center border">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
        <div className="flex items-center space-x-3">
          <FileText className="text-indigo-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">未處理回報</p>
            <p className="text-2xl font-bold text-gray-900">{unreadCount} 筆</p>
          </div>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
          <Clock className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 text-lg">目前沒有任何回報</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {feedbacks.map((f) => (
            <div key={f.feedback_id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {f.first_name}{f.last_name || ''}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(f.user_role)}`}>
                        {getRoleText(f.user_role)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(f.created_at).toLocaleString('zh-TW')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                      f.status === 'unread' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                    {f.status === 'unread' ? (
                      <>
                        <Clock size={14} />
                        <span>未處理</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span>已處理</span>
                      </>
                    )}
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{f.feedback_text}</p>

                {f.categories && f.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {f.categories.map((cat, index) => (
                      <span key={index} className="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {f.status === 'unread' && (
                  <button
                    onClick={() => markAsRead(f.feedback_id)}
                    className="flex items-center space-x-2 text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={16} />
                    <span>標示為已處理</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('doctors');
  const [users, setUsers] = useState([]);
  const [userType, setUserType] = useState('doctor');
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  // 修正：當 activeTab, userType 或 searchQuery 改變時重新載入資料
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'ratings') {
      fetchRatings();
    }
  }, [activeTab, userType, searchQuery]);

  // 修正：清理證書 URL 以防止記憶體洩漏
  useEffect(() => {
    return () => {
      if (certificateUrl) {
        URL.revokeObjectURL(certificateUrl);
      }
    };
  }, [certificateUrl]);

  const fetchPendingDoctors = async () => {
    try {
      const res = await fetch('/api/admin/pending-doctors', {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 403) {
          alert('請先登入管理者帳號');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch');
      }

      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error(err);
      alert('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const url = `/api/admin/users?type=${userType}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
      
      const res = await fetch(url, {
        credentials: 'include',
      });

      if (!res.ok) {
        let errorMessage = `載入失敗 (HTTP ${res.status})`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const text = await res.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert('載入使用者失敗');
    }
  };

  const fetchRatings = async () => {
    setRatingsLoading(true);
    try {
      const res = await fetch('/api/admin/ratings', {
        credentials: 'include',
      });

      const responseText = await res.text();

      if (!res.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`HTTP ${res.status}: ${responseText || 'Failed to fetch ratings'}`);
        }
        throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch ratings`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('回應格式錯誤');
      }

      setRatings(data);
    } catch (err) {
      console.error('載入評論錯誤:', err);
      alert(`載入評論失敗: ${err.message}`);
    } finally {
      setRatingsLoading(false);
    }
  };

  const handleApprove = async (doctorId) => {
    if (!confirm('確定要核准此醫師的註冊嗎?')) return;

    try {
      const res = await fetch(`/api/admin/approve-doctor/${doctorId}`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        alert('已核准並發送通知郵件!');
        setSelectedDoctor(null);
        fetchPendingDoctors();
      } else {
        alert(data.message || '操作失敗');
      }
    } catch (err) {
      console.error(err);
      alert('操作失敗');
    }
  };

  const handleReject = async (doctorId) => {
    if (!rejectionReason.trim()) {
      alert('請輸入拒絕原因');
      return;
    }

    if (!confirm('確定要拒絕此醫師的註冊嗎?')) return;

    try {
      const res = await fetch(`/api/admin/reject-doctor/${doctorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('已拒絕該醫師註冊');
        setSelectedDoctor(null);
        setRejectionReason('');
        setShowRejectionModal(false);
        fetchPendingDoctors();
      } else {
        alert(data.message || '操作失敗');
      }
    } catch (err) {
      console.error(err);
      alert('操作失敗');
    }
  };

  const handleDeleteUser = async (userId, role) => {
    if (!confirm('確定要刪除此使用者嗎?此操作無法復原!')) return;

    try {
      const res = await fetch(`/api/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('使用者已刪除');
        fetchUsers();
      } else {
        alert(data.message || '刪除失敗');
      }
    } catch (err) {
      console.error(err);
      alert('刪除失敗');
    }
  };

  const handleLogout = async () => {
    if (confirm('確定要登出嗎?')) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          credentials: 'include',
        });

        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');
        localStorage.removeItem('email');
        
        router.push('/login');
      } catch (err) {
        console.error('登出錯誤:', err);
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');
        localStorage.removeItem('email');
        router.push('/login');
      }
    }
  };

  const loadCertificate = async (certificatePath) => {
    if (!certificatePath) {
      setCertificateUrl('');
      return;
    }

    setCertificateLoading(true);
    const filename = certificatePath.split('/').pop();

    try {
      const res = await fetch(`/api/admin/certificate/${filename}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        console.error('載入證明失敗:', res.status);
        setCertificateUrl('');
        setCertificateLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setCertificateUrl(url);
    } catch (err) {
      console.error('載入證明錯誤:', err);
      setCertificateUrl('');
    } finally {
      setCertificateLoading(false);
    }
  };

  const getSpecialtyText = (specialty) => {
    const map = {
      'internal': '內科',
      'surgery': '外科',
      'pediatrics': '小兒科',
      'gynecology': '婦產科',
      'psychiatry': '精神科',
      'dermatology': '皮膚科',
    };
    return map[specialty] || specialty;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">醫隨行 MOG 管理系統</h1>
                <p className="text-sm text-gray-500">後台</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>登出</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 border flex space-x-2">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'doctors' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            待審核醫師
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            使用者管理
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'ratings' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            查看評論
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'feedback' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            問題回報
          </button>
        </div>

        {activeTab === 'doctors' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
              <div className="flex items-center space-x-3">
                <Clock className="text-orange-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600">待審核醫師</p>
                  <p className="text-2xl font-bold text-gray-900">{doctors.length} 位</p>
                </div>
              </div>
            </div>

            {doctors.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
                <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 text-lg">目前沒有待審核的醫師</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {doctors.map((doctor) => (
                  <div key={doctor.doctor_id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {doctor.first_name}{doctor.last_name} 醫師
                          </h3>
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            {getSpecialtyText(doctor.specialty)}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full flex items-center space-x-1">
                          <Clock size={14} />
                          <span>待審核</span>
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail size={16} />
                          <span className="text-sm">{doctor.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone size={16} />
                          <span className="text-sm">{doctor.phone_number}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin size={16} />
                          <span className="text-sm">{doctor.practice_hospital}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <FileText size={16} />
                          <span className="text-sm">
                            註冊時間: {new Date(doctor.registration_date).toLocaleDateString('zh-TW')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowRejectionModal(false);
                            loadCertificate(doctor.certificate_path);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye size={18} />
                          <span>查看執照</span>
                        </button>
                        <button
                          onClick={() => handleApprove(doctor.doctor_id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={18} />
                          <span>核准</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowRejectionModal(true);
                            setRejectionReason('');
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle size={18} />
                          <span>拒絕</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
                
        {activeTab === 'users' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border flex space-x-2">
              <button
                onClick={() => {
                  setUserType('doctor');
                  setSearchQuery('');
                }}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                  userType === 'doctor' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                醫師管理
              </button>
              <button
                onClick={() => {
                  setUserType('patient');
                  setSearchQuery('');
                }}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                  userType === 'patient' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                患者管理
              </button>
            </div>
            
            <div className="mb-6">
              <input
                type="text"
                placeholder={`搜尋 ${userType === 'doctor' ? '醫師姓名' : '患者姓名'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-gray-700 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-shadow"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
              <div className="flex items-center space-x-3">
                <Users className="text-blue-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">
                    {userType === 'doctor' ? '已審核醫師' : '註冊患者'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{users.length} 位</p>
                </div>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
                <Users className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 text-lg">
                  {searchQuery ? '找不到符合的結果' : `目前沒有${userType === 'doctor' ? '醫師' : '患者'}資料`}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {users.map((user) => (
                  <div key={user.user_id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.first_name}{user.last_name || ''} {userType === 'doctor' && '醫師'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            註冊時間: {new Date(user.registration_date).toLocaleString('zh-TW')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.account_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {user.account_status === 'active' ? '正常' : '已停用'}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail size={16} />
                          <span className="text-sm">{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone size={16} />
                          <span className="text-sm">{user.phone_number || '未提供'}</span>
                        </div>
                        {userType === 'doctor' && (
                          <>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <FileText size={16} />
                              <span className="text-sm">{getSpecialtyText(user.specialty)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <MapPin size={16} />
                              <span className="text-sm">{user.practice_hospital}</span>
                            </div>
                          </>
                        )}
                        {userType === 'patient' && user.date_of_birth && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <FileText size={16} />
                            <span className="text-sm">
                              出生日期: {new Date(user.date_of_birth).toLocaleDateString('zh-TW')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleDeleteUser(user.user_id, userType)}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle size={18} />
                          <span>刪除使用者</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'ratings' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
              <div className="flex items-center space-x-3">
                <FileText className="text-indigo-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">總評論數</p>
                  <p className="text-2xl font-bold text-gray-900">{ratings.length} 則</p>
                </div>
              </div>
            </div>

            {ratingsLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">載入中...</p>
              </div>
            ) : ratings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 text-lg">目前沒有任何評論</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {ratings.map((rating) => (
                  <div key={rating.rating_id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            患者: {rating.patient_first_name}{rating.patient_last_name || ''}
                          </h3>
                          <p className="text-sm text-gray-600">
                            評價醫師: {rating.doctor_first_name}{rating.doctor_last_name} 醫師
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(rating.created_at).toLocaleString('zh-TW')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-2xl ${i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      {rating.comment && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-gray-700 whitespace-pre-wrap">{rating.comment}</p>
                        </div>
                      )}

                      {rating.appointment_id && (
                        <p className="text-xs text-gray-500 mt-3">
                          預約編號: #{rating.appointment_id}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'feedback' && <FeedbackList />}
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 MedOnGo. 讓醫療服務更便捷、更貼心。
          </p>
        </div>
      </footer>

      {selectedDoctor && !showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedDoctor.first_name}{selectedDoctor.last_name} - 執業證明
              </h3>
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  if (certificateUrl) {
                    URL.revokeObjectURL(certificateUrl);
                  }
                  setCertificateUrl('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {certificateLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">載入中...</p>
                </div>
              ) : certificateUrl ? (
                <img
                  src={certificateUrl}
                  alt="執業證明"
                  className="w-full rounded-lg border"
                />
              ) : selectedDoctor.certificate_path ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-red-300 mb-4" size={48} />
                  <p className="text-red-500">無法載入執業證明</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">未上傳執業證明</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  if (certificateUrl) {
                    URL.revokeObjectURL(certificateUrl);
                  }
                  setCertificateUrl('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                關閉
              </button>
              <button
                onClick={() => handleApprove(selectedDoctor.doctor_id)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle size={18} />
                <span>核准此醫師</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDoctor && showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">拒絕原因</h3>
            </div>
            
            <div className="p-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="請輸入拒絕此醫師註冊的原因..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-black"
              />
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleReject(selectedDoctor.doctor_id)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                確認拒絕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}