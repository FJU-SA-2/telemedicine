"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu , User, Heart, Stethoscope, Award, BookOpen, Building2, Phone, Calendar, Clock, Save, X, Edit2, Upload, CheckCircle, AlertCircle } from "lucide-react";
import DoctorSidebar from "../components/DoctorSidebar";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [trialDaysLeft, setTrialDaysLeft] = useState(null);
  const [trialEndDate, setTrialEndDate] = useState(null);
  const trialMonths = 6;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);


  // 編輯表單狀態
  const [formData, setFormData] = useState({
    id_number: "",
    smoking_status: "no",
    drug_allergies: "",
    medical_history: "",
    chronic_disease: [],   
    other_chronic_disease: "",
    height: "",            
    weight: "", 
    emergency_contact_name: "",
    emergency_contact_phone: ""
  });

  // 醫師表單
  const [doctorForm, setDoctorForm] = useState({
    phone_number: "",
    specialty: "",
    practice_hospital: "",
    education: "",
    description: "",
    experience: "",
    qualifications: "",
    consultation_fee: 0,
    consultation_type: "現場看診",
    photo: ""
  });

useEffect(() => {
  function handleClickOutside(event) {
  if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
  setDropdownOpen(false);
  }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const fetchUser = async () => {
   setLoading(true);
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/login");
          return null;
        }

        const data = await res.json();
        
        if (data.authenticated && data.user) {
          setUser(data.user);

          // 計算免費試用期
        if (data.user.created_at) {
          const created = new Date(data.user.created_at);
          const end = new Date(created);
          end.setMonth(created.getMonth() + trialMonths);

          const today = new Date();
          const diff = end - today;
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

          setTrialEndDate(end.toISOString().split("T")[0]);
          setTrialDaysLeft(days);
        }

           // 如果是病人，初始化表單資料
          if (data.user.role === "patient" && data.user.patientProfile) {
            const profile = data.user.patientProfile;
            setFormData({
              id_number: profile.id_number || "",
              smoking_status: profile.smoking_status || "no",
              drug_allergies: profile.drug_allergies || "",
              medical_history: profile.medical_history || "",
              chronic_disease: Array.isArray(profile.chronic_disease)
                ? profile.chronic_disease
                : typeof profile.chronic_disease === "string" && profile.chronic_disease
                ? profile.chronic_disease.split(",")
                : [],
              other_chronic_disease: profile.other_chronic_disease || "", 
              height: profile.height || "",                    
              weight: profile.weight || "", 
              emergency_contact_name: profile.emergency_contact_name || "",
              emergency_contact_phone: profile.emergency_contact_phone || ""
            });
          }

          // 初始化醫師表單
          if (data.user.role === "doctor" && data.user.doctorProfile) {
            const profile = data.user.doctorProfile;
            setDoctorForm({
              phone_number: profile.phone_number || "",
              specialty: profile.specialty || "",
              practice_hospital: profile.practice_hospital || "",
              education: profile.education || "",
              description: profile.description || "",
              experience: profile.experience || "",
              qualifications: profile.qualifications || "",
              consultation_fee: profile.consultation_fee || 0,
              consultation_type: profile.consultation_type || "現場看診",
              photo: profile.photo || ""
            });
          }
          return data.user; // 成功時返回用戶資料
        } else {
          router.push("/auth");
          return null;
        }
      } catch (error) {
        console.error("取得使用者資料失敗:", error);
        router.push("/auth");
        return null;
      } finally {
        setLoading(false);
      }
    };
 useEffect(() => {
    fetchUser();
  }, [router]);

  const handlePhotoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // 確保只選擇一個檔案
      setSelectedPhotoFile(e.target.files[0]);
    } else {
      setSelectedPhotoFile(null);
    }
  };

  // ⭐ NEW: 處理照片上傳
  const handlePhotoUpload = async () => {
    if (!selectedPhotoFile) {
      alert("請先選擇照片檔案");
      return;
    }
    
    setUploadingPhoto(true);
    
    const formData = new FormData();
    formData.append('photo', selectedPhotoFile); // 需與後端 request.files['photo'] 對應
    
    try {
      // 呼叫照片上傳 API (請確保您的後端服務在 localhost:5000)
      const res = await fetch("/api/doctor/upload-photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        alert("照片上傳成功！");
        // ⭐ 關鍵：更新 doctorForm 狀態，使用後端回傳的 photo_path 更新 'photo' 欄位
        setDoctorForm(prev => ({
            ...prev,
            photo: data.photo_path 
        }));
        setSelectedPhotoFile(null); // 清除選中的檔案
      } else {
        alert(data.message || "照片上傳失敗，請重試");
      }
      
    } catch (error) {
      console.error("照片上傳錯誤:", error);
      alert("照片上傳失敗，請重試");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



const handleSave = async () => {
  setSaving(true);
  
  try {
    const isPatient = user.role === "patient";
    const endpoint = isPatient 
      ? "/api/patient/profile"
      : "/api/doctor/profile";
    
    const requestBody = isPatient ? formData : doctorForm;

    // 1. 執行 PUT 請求更新資料
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(requestBody)
    });
  
    const data = await res.json(); // 取得 PUT 請求的結果 (成功或失敗訊息)

    if (res.ok) {
      // fetchUser 內部會呼叫 /api/me 並執行 setUser(data.user) 來刷新狀態
      const updatedUser = await fetchUser(); 

      if (updatedUser) {
        alert("個人資料更新成功！");
        setEditing(false); // 結束編輯模式
      } else {
        // 如果 PUT 成功但重新 GET 失敗
        alert("更新成功，但重新載入資料失敗。請嘗試手動刷新頁面。");
        setEditing(false);
      }
    } else {
      // PUT 請求失敗
      alert(data.message || "更新失敗，請重試");
    }
    
  } catch (error) {
    console.error("更新錯誤:", error);
    alert("更新失敗，請重試");
  } finally {
    setSaving(false);
  }
};

  const handleCancel = () => {
    // 恢復原始資料
    if (user.patientProfile) {
      const profile = user.patientProfile;
      setFormData({
        id_number: profile.id_number || "",
        smoking_status: profile.smoking_status || "no",
        drug_allergies: profile.drug_allergies || "",
        medical_history: profile.medical_history || "",
        chronic_disease: profile.chronic_disease
          ? profile.chronic_disease.split(",")
          : [],
        other_chronic_disease: profile.other_chronic_disease || "",  
        height: profile.height || "",                    
        weight: profile.weight || "",    
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || ""
      });
    }
    if (user.role === "doctor" && user.doctorProfile) {
      const profile = user.doctorProfile;
      setDoctorForm({
        phone_number: profile.phone_number || "",
        specialty: profile.specialty || "",
        practice_hospital: profile.practice_hospital || "",
        education: profile.education || "",
        description: profile.description || "",
        experience: profile.experience || "",
        qualifications: profile.qualifications || "",
        consultation_fee: profile.consultation_fee || 0,
        consultation_type: profile.consultation_type || "現場看診",
        photo: profile.photo || ""
      });
    }
    setEditing(false);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        alert("登出成功");
          // 清除 localStorage
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');
        localStorage.removeItem('email');
        router.push("/login");
      } else {
        alert("登出失敗，請再試一次");
      }
    } catch (error) {
      console.error("登出錯誤:", error);
      alert("登出失敗，請再試一次");
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center text-gray-500">載入中...</div>
      </main>
    );
  }

  if (!user) {
    return null;
  }
  const isPatient = user.role === "patient";
  const isDoctor = user.role === "doctor";
  const profile = user.patientProfile || {};
  const doctorProfile = user.doctorProfile || {};
  
    return (
    <div className="relative min-h-screen bg-gradient-to-br from-[var(--color-periwinkle)]/30 via-white to-[var(--color-light-cyan)]/30">
      
            {/* Sidebar 開關按鈕（sidebar 關閉時顯示） */}
            {!isOpen && (
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition "
                aria-label="開啟選單"
              >
                <Menu size={24} />
              </button>
            )}

      {isDoctor ? (
        <DoctorSidebar  
          isOpen={isOpen} 
          setIsOpen={setIsOpen}
          approvalStatus={user.approval_status}
        />
      ) : (
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      )}

      {/* 手機/平板 sidebar 遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 主內容：手機 overlay 不推移，桌機才推移 */}
      <div className={`transition-all duration-300 bg-white min-h-screen ${isOpen ? "md:ml-64" : "ml-0"}`}>
        {/* 頂部導覽列 */}
        <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6">個人檔案</h1>
      {/* <div className="mt-8">
      <Link 
        href={user.role === "doctor" ? "/doctorpage" : "/PatientPage"} 
        className="inline-block px-5 py-2 rounded-lg bg-[var(--color-azure)] text-white font-medium hover:bg-[var(--color-lime-cream)] transition-colors mr-4"
      >
        返回首頁
      </Link>
        
         <button 
          onClick={handleLogout} 
          className="inline-block px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
        >
          登出
        </button>
          </div><br></br> */}
      <div className="p-4 sm:p-5 rounded-xl border border-indigo-300 bg-indigo-50 mb-6">
  <h2 className="font-bold text-indigo-700 text-lg flex items-center gap-2">
    🚀 免費試用期
  </h2>

  <p className="text-gray-700 mt-2">
    到期日： <span className="font-semibold">{trialEndDate}</span>
  </p>

  {trialDaysLeft > 0 ? (
    <p className="text-green-700 font-semibold">
      ⏳ 還剩 {trialDaysLeft} 天，立即升級解鎖完整功能！
    </p>
  ) : (
    <p className="text-red-700 font-semibold">
      🔒 試用已到期，升級後即可繼續使用
    </p>
  )}

  <button
    onClick={() => {
    if (!user) return; // 避免 user 還沒拿到資料
    router.push(user.role === "doctor" ? "/docplan" : "/plan");
  }}
    className="mt-4 w-full py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
  >
    查看方案 & 升級
  </button>
</div>

      

      {/* 基本資料 */}
      <div className="bg-white shadow-xl rounded-2xl p-5 sm:p-6 mb-6 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <User className="text-blue-600" size={28} />
              <h2 className="text-2xl font-bold text-gray-800">基本資料</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br rounded-xl hover:bg-gray-100 transition-colors">
                <p className="text-xs sm:text-sm text-[var(--color-mahogany)] font-medium mb-1">姓名</p>
                <p className="text-lg font-semibold text-gray-800">
                  {user.role === "mech" ? (user.mechanism_name || user.username) : `${user.first_name || ""}${user.last_name || ""}`}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br rounded-xl hover:bg-gray-100 transition-colors">
                <p className="text-xs sm:text-sm text-[var(--color-mahogany)] font-medium mb-1">電子郵件</p>
                <p className="text-lg font-semibold text-gray-800 break-all">{user.email}</p>
              </div>

              <div className="p-3 sm:p-4 bg-gradient-to-br rounded-xl hover:bg-gray-100 transition-colors">
                <p className="text-xs sm:text-sm text-[var(--color-mahogany)] font-medium mb-1">身份</p>
                <p className="text-lg font-semibold text-gray-800">
                  {user.role === "patient" ? "病患" : user.role === "doctor" ? "醫生" : user.role}
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gradient-to-br rounded-xl hover:bg-gray-100 transition-colors">
                {user.role === "patient" ? (
                  <>
                    <p className="text-xs sm:text-sm text-[var(--color-mahogany)] font-medium mb-1">生日 / 年齡</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {user.patientProfile?.date_of_birth
                        ? `${user.patientProfile.date_of_birth}(${user.age} 歲)`
                        : "未填寫"}
                    </p>
                  </>
                ) : user.role === "doctor" ? (
                  <>
                    <p className="text-sm text-orange-700 font-medium mb-1">驗證狀態</p>
                    <div className="flex items-center gap-2">
                      {user.approval_status === "approved" && (
                        <>
                          <CheckCircle className="text-green-600" size={20} />
                          <span className="text-xl font-bold text-green-700">已通過</span>
                        </>
                      )}
                      {user.approval_status === "pending" && (
                        <>
                          <Clock className="text-yellow-600" size={20} />
                          <span className="text-xl font-bold text-yellow-700">審核中</span>
                        </>
                      )}
                      {user.approval_status === "rejected" && (
                        <>
                          <AlertCircle className="text-red-600" size={20} />
                          <span className="text-xl font-bold text-red-700">未通過</span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-orange-700 font-medium mb-1">使用者名稱</p>
                    <p className="text-xl font-bold text-gray-800">{user.username}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 病患健康資料 */}
          {isPatient && (
            <div className="bg-white shadow-xl rounded-2xl p-5 sm:p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <Heart className="text-red-600" size={28} />
                  <h2 className="text-2xl font-bold text-gray-800">健康資料</h2>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium transform hover:-translate-y-0.5"
                  >
                    <Edit2 size={18} />
                    編輯資料
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <p className="text-sm text-gray-600 font-medium mb-2">身分證字號</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile.id_number || "未填寫"}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <p className="text-sm text-gray-600 font-medium mb-2">吸菸狀況</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile.smoking_status === "yes" ? "有吸菸" : 
                       profile.smoking_status === "quit" ? "已戒菸" : "無"}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <p className="text-sm text-gray-600 font-medium mb-2">身高</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile.height ? profile.height + " cm" : "未填寫"}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <p className="text-sm text-gray-600 font-medium mb-2">體重</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile.weight ? profile.weight + " kg" : "未填寫"}
                    </p>
                  </div>

                  <div className="md:col-span-2 p-4 bg-red-50 rounded-xl">
                    <p className="text-sm text-red-700 font-medium mb-2">藥物過敏</p>
                    <p className="text-lg font-semibold text-gray-800 whitespace-pre-wrap">
                      {profile.drug_allergies || "無"}
                    </p>
                  </div>

                  <div className="md:col-span-2 p-4 bg-yellow-50 rounded-xl">
                    <p className="text-sm text-yellow-700 font-medium mb-2">重大疾病史</p>
                    <p className="text-lg font-semibold text-gray-800 whitespace-pre-wrap">
                      {profile.medical_history || "無"}
                    </p>
                  </div>

                  <div className="md:col-span-2 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-700 font-medium mb-2">慢性疾病</p>
                    <p className="text-lg font-semibold text-gray-800 whitespace-pre-wrap">
                      {(() => {
                        const chronicList = Array.isArray(profile.chronic_disease)
                          ? profile.chronic_disease
                          : profile.chronic_disease
                          ? profile.chronic_disease.split(",")
                          : [];

                        if (chronicList.length === 0 && !profile.other_chronic_disease) {
                          return "無";
                        }

                        const displayList = chronicList.filter(item => item && item !== "其他");

                        if (chronicList.includes("其他") && profile.other_chronic_disease) {
                          displayList.push(profile.other_chronic_disease);
                        }

                        return displayList.join("、") || "無";
                      })()}
                    </p>
                  </div>

                  <div className="md:col-span-2 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                      <Phone size={22} />
                      緊急聯絡人
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-sm text-purple-700 font-medium mb-1">姓名</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {profile.emergency_contact_name || "未填寫"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-purple-700 font-medium mb-1">電話</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {profile.emergency_contact_phone || "未填寫"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        身分證字號
                      </label>
                      <input
                        type="text"
                        name="id_number"
                        value={formData.id_number}
                        onChange={handleInputChange}
                        maxLength="10"
                        className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="請輸入身分證字號"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        吸菸狀況
                      </label>
                      <select
                        name="smoking_status"
                        value={formData.smoking_status}
                        onChange={handleInputChange}
                        className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="no">無</option>
                        <option value="yes">有吸菸</option>
                        <option value="quit">已戒菸</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        身高 (cm)
                      </label>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="請輸入身高"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        體重 (kg)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="請輸入體重"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      藥物過敏
                    </label>
                    <textarea
                      name="drug_allergies"
                      value={formData.drug_allergies}
                      onChange={handleInputChange}
                      rows="3"
                      className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="請輸入過敏藥物(如有多項請分行填寫)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      重大疾病史
                    </label>
                    <textarea
                      name="medical_history"
                      value={formData.medical_history}
                      onChange={handleInputChange}
                      rows="3"
                      className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="請輸入重大疾病史(如有多項請分行填寫)"
                    />
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      慢性疾病 (可複選)
                    </label>
                    <div
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white cursor-pointer flex justify-between items-center hover:border-blue-400 transition-all"
                    >
                      <span className="text-gray-700">
                        {formData.chronic_disease.length === 0
                          ? "請選擇"
                          : formData.chronic_disease
                              .filter(item => item !== "其他")
                              .concat(
                                formData.chronic_disease.includes("其他") &&
                                formData.other_chronic_disease
                                  ? [formData.other_chronic_disease]
                                  : []
                              )
                              .join("、")}
                      </span>
                      <span className="text-gray-400">▼</span>
                    </div>

                    {dropdownOpen && (
                      <div className="text-gray-700 absolute mt-2 w-full border-2 border-gray-200 bg-white rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto p-4">
                        {[
                          "高血壓",
                          "糖尿病",
                          "高血脂",
                          "心臟病",
                          "氣喘",
                          "甲狀腺疾病",
                          "腎臟病",
                          "肝病"
                        ].map((disease) => (
                          <label key={disease} className="flex items-center gap-3 mb-3 hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.chronic_disease.includes(disease)}
                              onChange={(e) => {
                                let updated = [...formData.chronic_disease];
                                if (e.target.checked) {
                                  updated.push(disease);
                                } else {
                                  updated = updated.filter(item => item !== disease);
                                }
                                setFormData({ ...formData, chronic_disease: updated });
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="font-medium">{disease}</span>
                          </label>
                        ))}

                        <label className="flex items-center gap-3 mt-4 pt-4 border-t-2 border-gray-100 hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.chronic_disease.includes("其他")}
                            onChange={(e) => {
                              let updated = [...formData.chronic_disease];
                              if (e.target.checked) {
                                updated.push("其他");
                              } else {
                                updated = updated.filter(item => item !== "其他");
                                setFormData({ ...formData, other_chronic_disease: "" });
                              }
                              setFormData({ ...formData, chronic_disease: updated });
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="font-medium">其他(請填寫)</span>
                        </label>

                        {formData.chronic_disease.includes("其他") && (
                          <input
                            type="text"
                            className="mt-3 w-full px-4 py-2 border-2 border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="請輸入疾病名稱"
                            value={formData.other_chronic_disease}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                other_chronic_disease: e.target.value
                              })
                            }
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                      <Phone size={22} />
                      緊急聯絡人
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-purple-700 mb-2">
                          姓名
                        </label>
                        <input
                          type="text"
                          name="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={handleInputChange}
                          className="text-gray-700 w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="請輸入緊急聯絡人姓名"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-700 mb-2">
                          電話
                        </label>
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={handleInputChange}
                          className="text-gray-700 w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="請輸入緊急聯絡人電話"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 transform hover:-translate-y-0.5"
                    >
                      <Save size={20} />
                      {saving ? "儲存中..." : "儲存"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 transform hover:-translate-y-0.5"
                    >
                      <X size={20} />
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 醫師專業資料 */}
          {isDoctor && (
            <div className="bg-white shadow-xl rounded-2xl p-5 sm:p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <Stethoscope className="text-blue-600" size={28} />
                  <h2 className="text-2xl font-bold text-gray-800">專業資料</h2>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium transform hover:-translate-y-0.5"
                  >
                    <Edit2 size={18} />
                    編輯資料
                  </button>
                )}
              </div>

              {/* 醫師頭像區 */}
              <div className="mb-8 pb-6 border-b-2 border-gray-100">
                {/* 手機垂直排列，sm 以上水平排列 */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <p className="text-sm text-gray-600 font-medium mb-3">個人頭像</p>
                    <div className="relative group">
                      <img
                        className="h-28 w-28 sm:h-32 sm:w-32 object-cover rounded-2xl border-4 border-blue-200 shadow-lg group-hover:shadow-xl transition-shadow"
                        src={doctorForm.photo 
                          ? `/uploads/profile_pictures/${doctorForm.photo}`
                          : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23dbeafe'/%3E%3Ccircle cx='64' cy='48' r='24' fill='%2393c5fd'/%3E%3Cellipse cx='64' cy='104' rx='36' ry='22' fill='%2393c5fd'/%3E%3C/svg%3E"
                        }
                        alt="醫師頭像"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23dbeafe'/%3E%3Ccircle cx='64' cy='48' r='24' fill='%2393c5fd'/%3E%3Cellipse cx='64' cy='104' rx='36' ry='22' fill='%2393c5fd'/%3E%3C/svg%3E"
                        }}
                      />
                      {editing && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={28} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {editing && (
                    <div className="flex-grow min-w-0">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        上傳新頭像
                      </label>
                      <div className="space-y-3">
                        {/* 手機：file input 和按鈕各佔一行；sm 以上水平並排 */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <input 
                            type="file" 
                            accept=".png,.jpg,.jpeg" 
                            onChange={handlePhotoFileChange}
                            className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 file:transition-all"
                            disabled={uploadingPhoto}
                          />
                          <button 
                            onClick={handlePhotoUpload}
                            disabled={uploadingPhoto || !selectedPhotoFile}
                            className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md text-sm font-medium disabled:from-gray-400 disabled:to-gray-400"
                          >
                            <Upload size={16} />
                            {uploadingPhoto ? "上傳中..." : "儲存照片"}
                          </button>
                        </div>
                        {selectedPhotoFile && (
                          <p className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg break-all">
                            已選擇: <span className="font-semibold">{selectedPhotoFile.name}</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-500">支援格式: JPG, PNG</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="text-blue-600" size={20} />
                      <p className="text-sm text-blue-700 font-medium">主治科別</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {doctorProfile.specialty || "未填寫"}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="text-purple-600" size={20} />
                      <p className="text-sm text-purple-700 font-medium">現任執醫院/診所</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {doctorProfile.practice_hospital || "未填寫"}
                    </p>
                  </div>

                  <div className="md:col-span-2 p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="text-green-600" size={20} />
                      <p className="text-sm text-green-700 font-semibold">個人簡介</p>
                    </div>
                    <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {doctorProfile.description || "未填寫"}
                    </p>
                  </div>

                  <div className="md:col-span-2 p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="text-orange-600" size={20} />
                      <p className="text-sm text-orange-700 font-semibold">專業經歷</p>
                    </div>
                    <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {doctorProfile.experience || "未填寫"}
                    </p>
                  </div>

                  <div className="md:col-span-2 p-5 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="text-pink-600" size={20} />
                      <p className="text-sm text-pink-700 font-semibold">學位與認證</p>
                    </div>
                    <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {doctorProfile.qualifications || "未填寫"}
                    </p>
                  </div>

                  <div className="md:col-span-2 p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="text-indigo-600" size={20} />
                      <p className="text-sm text-indigo-700 font-semibold">學歷</p>
                    </div>
                    <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {doctorProfile.education || "未填寫"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        主治科別
                      </label>
                      <input
                        type="text"
                        name="specialty"
                        value={doctorForm.specialty}
                        onChange={(e) =>
                          setDoctorForm({ ...doctorForm, specialty: e.target.value })
                        }
                        className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="例如: 內科、外科、小兒科"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        醫院/診所名稱
                      </label>
                      <input
                        type="text"
                        name="practice_hospital"
                        value={doctorForm.practice_hospital}
                        onChange={(e) =>
                          setDoctorForm({ ...doctorForm, practice_hospital: e.target.value })
                        }
                        className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="請輸入執業醫院或診所"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      個人簡介
                    </label>
                    <textarea
                      name="description"
                      value={doctorForm.description}
                      onChange={(e) =>
                        setDoctorForm({ ...doctorForm, description: e.target.value })
                      }
                      rows="4"
                      className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="請簡短介紹您的專長與服務理念"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      專業經歷
                    </label>
                    <textarea
                      name="experience"
                      value={doctorForm.experience}
                      onChange={(e) =>
                        setDoctorForm({ ...doctorForm, experience: e.target.value })
                      }
                      rows="4"
                      className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="請列出您的工作經歷與專業成就"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      學位與認證
                    </label>
                    <textarea
                      name="qualifications"
                      value={doctorForm.qualifications}
                      onChange={(e) =>
                        setDoctorForm({ ...doctorForm, qualifications: e.target.value })
                      }
                      rows="3"
                      className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="請列出您的專業認證與執照"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      學歷
                    </label>
                    <textarea
                      name="education"
                      value={doctorForm.education}
                      onChange={(e) =>
                        setDoctorForm({ ...doctorForm, education: e.target.value })
                      }
                      rows="3"
                      className="text-gray-700 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="請填寫您的教育背景"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 transform hover:-translate-y-0.5"
                    >
                      <Save size={20} />
                      {saving ? "儲存中..." : "儲存"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 transform hover:-translate-y-0.5"
                    >
                      <X size={20} />
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      {/* Footer */}
                <div className="bg-gray-800 text-white py-6 sm:py-8">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-gray-400 text-xs sm:text-sm">
                            © 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
                        </p>
                    </div>
                </div>
    </div>
  );
}