"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import DoctorSidebar from "../components/DoctorSidebar";
import { Menu, Calendar, Clock, CheckCircle, XCircle, User, FileText, Search, DollarSign, X, AlertCircle } from "lucide-react";

export default function DoctorAppointmentManagement() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState("home");
    const [isOpen, setIsOpen] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState(null);


    useEffect(() => {
        async function fetchApprovalStatus() {
            try {
                const res = await fetch("/api/me", {
                    credentials: 'include'
                });
                const data = await res.json();
                
                console.log("📡 API 回應:", data);
                console.log("📡 approval_status:", data.user?.approval_status);
                
                if (data.authenticated && data.user && data.user.role === 'doctor') {
                    const status = data.user.approval_status;
                    setApprovalStatus(status);
                    console.log("✅ 已設定 approvalStatus 為:", status);
                }
            } catch (error) {
                console.error("❌ Failed to fetch approval status:", error);
            }
        }
        fetchApprovalStatus();
    }, []);


    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            
            const meRes = await fetch("/api/me");
            const meData = await meRes.json();
            const doctorId = meData.user?.doctor_id;

            if (!doctorId) {
                alert("您不是醫師,無法訪問此頁面");
                return;
            }

            const response = await fetch(`/api/appointments?doctor_id=${doctorId}`);
            
            if (!response.ok) {
                throw new Error("獲取預約失敗");
            }
            
            const data = await response.json();
            setAppointments(data);
            setLoading(false);
        } catch (error) {
            console.error("載入預約失敗:", error);
            alert("載入預約資料失敗,請檢查網路連線");
            setLoading(false);
        }
    };

    // ✅ 修改:取消預約功能 - 需填寫理由
    const handleCancel = async () => {
        if (!cancellationReason.trim()) {
            alert("請填寫取消理由");
            return;
        }

        if (!confirm("確定要取消此預約嗎?取消後時段將重新開放。")) return;

        setProcessing(true);
        try {
            const response = await fetch("/api/appointments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointment_id: selectedAppointment.appointment_id,
                    cancellation_reason: cancellationReason
                })
            });

            if (response.ok) {
                alert("預約已取消,時段已釋放");
                fetchAppointments();
                setShowCancelModal(false);
                setShowDetailModal(false);
                setCancellationReason("");
            } else {
                const error = await response.json();
                alert(error.error || "操作失敗,請稍後再試");
            }
        } catch (error) {
            console.error("取消預約錯誤:", error);
            alert("操作失敗");
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    };

    const getDayName = (dateStr) => {
        const date = new Date(dateStr);
        const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
        return dayNames[date.getDay()];
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "已確認": return "bg-green-100 text-green-800 border-green-300";
            case "已完成": return "bg-blue-100 text-blue-800 border-blue-300";
            case "已取消": return "bg-gray-100 text-gray-800 border-gray-300";
            default: return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "已確認": return <CheckCircle size={18} />;
            case "已完成": return <CheckCircle size={18} />;
            case "已取消": return <XCircle size={18} />;
            default: return <AlertCircle size={18} />;
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        if (filterStatus !== "all" && apt.status !== filterStatus) return false;
        if (searchTerm) {
            const patientName = `${apt.patient_last_name}${apt.patient_first_name}`;
            if (!patientName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        }
        return true;
    });

    const statusCounts = {
        all: appointments.length,
        已確認: appointments.filter(a => a.status === "已確認").length,
        已完成: appointments.filter(a => a.status === "已完成").length,
        已取消: appointments.filter(a => a.status === "已取消").length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-semibold">載入中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-50">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-3 fixed top-2 left-4 text-gray-700 z-50 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white"
                >
                    <Menu size={24} />
                </button>
            )}

            <DoctorSidebar 
                isOpen={isOpen} 
                setIsOpen={setIsOpen} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                approvalStatus={approvalStatus}  
            />
            
            <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
                <Navbar setIsSidebarOpen={setIsOpen} />

                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
                    <div className="mb-6">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">預約管理</h1>
                        <p className="text-gray-600">查看和管理您的患者預約</p>
                    </div>

                    {/* 統計卡片 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                        {[
                            { key: "all", label: "全部", icon: Calendar, color: "blue" },
                            { key: "已確認", label: "已確認", icon: CheckCircle, color: "green" },
                            { key: "已完成", label: "已完成", icon: CheckCircle, color: "blue" },
                            { key: "已取消", label: "已取消", icon: XCircle, color: "gray" }
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = filterStatus === item.key;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => setFilterStatus(item.key)}
                                    className={`p-4 rounded-xl transition-all transform hover:scale-105 ${
                                        isActive
                                            ? `bg-${item.color}-500 text-white shadow-lg`
                                            : "bg-white text-gray-700 hover:shadow-md border-2 border-gray-200"
                                    }`}
                                >
                                    <Icon className={`mx-auto mb-2 ${isActive ? "text-white" : `text-${item.color}-500`}`} size={24} />
                                    <div className={`text-2xl font-bold mb-1 ${isActive ? "text-white" : "text-gray-800"}`}>
                                        {statusCounts[item.key]}
                                    </div>
                                    <div className={`text-xs ${isActive ? "text-white/90" : "text-gray-600"}`}>{item.label}</div>
                                </button>
                            );
                        })}
                    </div>

                    {/* 搜尋欄 */}
                    <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜尋患者姓名..."
                                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* 預約列表 */}
                    <div className="space-y-4">
                        {filteredAppointments.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-16 text-center border border-gray-100">
                                <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium text-gray-500">目前沒有符合條件的預約</p>
                                <p className="text-sm text-gray-400 mt-2">請調整篩選條件或等待新的預約</p>
                            </div>
                        ) : (
                            filteredAppointments.map((apt) => (
                                <div
                                    key={apt.appointment_id}
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
                                >
                                    <div className="p-5 md:p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                                                    {apt.patient_first_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-gray-800">
                                                        {apt.patient_first_name}{apt.patient_last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">#{apt.appointment_id}</p>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusColor(apt.status)}`}
                                            >
                                                {getStatusIcon(apt.status)}
                                                {apt.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={18} className="text-blue-600" />
                                                <div>
                                                    <p className="text-xs text-gray-500">日期</p>
                                                    <p className="font-semibold text-gray-800 text-sm">{formatDate(apt.appointment_date)}</p>
                                                    <p className="text-xs text-gray-500">{getDayName(apt.appointment_date)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={18} className="text-green-600" />
                                                <div>
                                                    <p className="text-xs text-gray-500">時間</p>
                                                    <p className="font-bold text-gray-800 text-lg">{apt.appointment_time?.substring(0, 5)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {apt.symptoms && (
                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                                    <FileText size={14} />
                                                    症狀描述
                                                </p>
                                                <p className="text-sm text-gray-700 line-clamp-2">{apt.symptoms}</p>
                                            </div>
                                        )}

                                        {apt.amount && (
                                            <div className="mb-4 flex items-center gap-2 text-sm">
                                                <DollarSign size={16} className="text-green-600" />
                                                <span className="text-gray-600">費用:</span>
                                                <span className="font-bold text-green-600">NT$ {apt.amount}</span>
                                                {apt.payment_method && <span className="text-gray-500">({apt.payment_method})</span>}
                                            </div>
                                        )}

                                        {/* ✅ 簡化操作按鈕:只保留查看詳情和取消 */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedAppointment(apt);
                                                    setShowDetailModal(true);
                                                }}
                                                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                                            >
                                                查看詳情
                                            </button>
                                            {apt.status === "已確認" && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAppointment(apt);
                                                        setShowCancelModal(true);
                                                    }}
                                                    disabled={processing}
                                                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-semibold disabled:opacity-50 shadow-md hover:shadow-lg"
                                                >
                                                    取消預約
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 詳情彈窗 */}
                {showDetailModal && selectedAppointment && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold">預約詳情</h3>
                                    <p className="text-blue-100 text-sm mt-1">#{selectedAppointment.appointment_id}</p>
                                </div>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-white hover:bg-white/20 p-2 rounded-full transition"
                                >
                                    <XCircle size={28} />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
                                    <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                        <User size={20} className="text-blue-600" />
                                        患者資訊
                                    </h4>
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                            {selectedAppointment.patient_last_name?.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-xl text-gray-800 mb-2">
                                                {selectedAppointment.patient_last_name}{selectedAppointment.patient_first_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                        <Calendar size={22} className="text-blue-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">預約日期</p>
                                            <p className="font-bold text-gray-800 text-lg">
                                                {formatDate(selectedAppointment.appointment_date)} {getDayName(selectedAppointment.appointment_date)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                        <Clock size={22} className="text-green-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">預約時間</p>
                                            <p className="font-bold text-gray-800 text-2xl">
                                                {selectedAppointment.appointment_time?.substring(0, 5)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex-shrink-0 mt-1">{getStatusIcon(selectedAppointment.status)}</div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-2">預約狀態</p>
                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(selectedAppointment.status)}`}>
                                                {selectedAppointment.status}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedAppointment.symptoms && (
                                        <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                            <FileText size={22} className="text-yellow-600 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600 mb-2 font-semibold">症狀描述</p>
                                                <div className="bg-white rounded-lg p-4 text-gray-700 border border-yellow-100">
                                                    {selectedAppointment.symptoms}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedAppointment.cancellation_reason && (
                                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                                            <AlertCircle size={22} className="text-red-600 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600 mb-2 font-semibold">取消理由</p>
                                                <div className="bg-white rounded-lg p-4 text-gray-700 border border-red-100">
                                                    {selectedAppointment.cancellation_reason}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedAppointment.amount && (
                                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                                            <DollarSign size={22} className="text-green-600 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">支付資訊</p>
                                                <p className="font-bold text-green-600 text-xl">NT$ {selectedAppointment.amount}</p>
                                                {selectedAppointment.payment_method && (
                                                    <p className="text-sm text-gray-600 mt-1">支付方式:{selectedAppointment.payment_method}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ 取消預約彈窗 - 需填寫理由 */}
                {showCancelModal && selectedAppointment && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
                                <h3 className="text-xl font-bold">取消預約</h3>
                                <p className="text-red-100 text-sm mt-1">預約 #{selectedAppointment.appointment_id}</p>
                            </div>

                            <div className="p-6">
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-yellow-800 font-semibold mb-1">注意事項</p>
                                            <p className="text-xs text-yellow-700">
                                                取消後時段將重新開放,患者可能會收到通知。請填寫取消理由。
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        取消理由 <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        placeholder="請填寫取消理由,例如:&#10;• 臨時有其他手術安排&#10;• 身體不適無法看診&#10;• 其他緊急事項"
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-sm resize-none text-black"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowCancelModal(false);
                                            setCancellationReason("");
                                        }}
                                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                                    >
                                        返回
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={!cancellationReason.trim() || processing}
                                        className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? "處理中..." : "確認取消"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}