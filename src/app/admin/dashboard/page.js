'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, XCircle, Eye, Clock, Mail, Phone, MapPin, FileText, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

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
        fetchPendingDoctors();
      } else {
        alert(data.message || '操作失敗');
      }
    } catch (err) {
      console.error(err);
      alert('操作失敗');
    }
  };

  const handleLogout = () => {
    if (confirm('確定要登出嗎?')) {
      router.push('/');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">醫隨行 MOG 管理系統</h1>
                <p className="text-sm text-gray-500">醫師註冊審核</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
          <div className="flex items-center space-x-3">
            <Clock className="text-orange-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">待審核醫師</p>
              <p className="text-2xl font-bold text-gray-900">{doctors.length} 位</p>
            </div>
          </div>
        </div>

        {/* Doctors List */}
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
                      onClick={() => setSelectedDoctor(doctor)}
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
      </main>

      {/* Modal - View Certificate */}
      {selectedDoctor && !rejectionReason && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedDoctor.first_name}{selectedDoctor.last_name} - 執業證明
              </h3>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {selectedDoctor.certificate_path ? (
                <img
                  src={`http://127.0.0.1:5000/api/admin/certificate/${selectedDoctor.certificate_path.split('/').pop()}`}
                  alt="執業證明"
                  className="w-full rounded-lg border"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">未上傳執業證明</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedDoctor(null)}
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

      {/* Modal - Rejection Reason */}
      {selectedDoctor && rejectionReason !== null && rejectionReason !== undefined && (
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