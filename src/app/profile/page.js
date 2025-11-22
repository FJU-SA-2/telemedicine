"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
 import { Menu } from "lucide-react";
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


  // 編輯表單狀態
  const [formData, setFormData] = useState({
    id_number: "",
    smoking_status: "no",
    drug_allergies: "",
    medical_history: "",
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
    <div className="relative min-h-screen bg-gray-50">
      {/* Sidebar 開關按鈕（只在 Sidebar 關閉時顯示） */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-700 z-50 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white"
        >
          <Menu size={24} />
        </button>
      )}

      {/* 側邊欄 */}
      {isPatient && (
        <Sidebar  
          isOpen={isOpen} 
          setIsOpen={setIsOpen} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      )}

      {isDoctor && (
        <DoctorSidebar  
          isOpen={isOpen} 
          setIsOpen={setIsOpen}
          approvalStatus={user.approval_status}
        />
      )}
      {/* 主內容 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        {/* 頂部導覽列 */}
        <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">個人檔案</h1>
      <div className="mt-8">
      <Link 
        href={user.role === "doctor" ? "/doctorpage" : "/"} 
        className="inline-block px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors mr-4"
      >
        返回首頁
      </Link>
        
         <button 
          onClick={handleLogout} 
          className="inline-block px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
        >
          登出
        </button>
          </div><br></br>
      <div className="p-5 rounded-xl border border-indigo-300 bg-indigo-50 mb-6">
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
    onClick={() => router.push("/pricing")}
    className="mt-4 w-full py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
  >
    查看方案 & 升級
  </button>
</div>

      

      {/* 基本資料 */}
      <div className="bg-white shadow rounded-xl p-6 space-y-4 border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">基本資料</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">姓名</p>
            <p className="text-lg font-medium text-gray-800">
              {user.first_name}{user.last_name} 
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">電子郵件</p>
            <p className="text-lg font-medium text-gray-800">{user.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">身份</p>
            <p className="text-lg font-medium text-gray-800">
              {user.role === "patient" ? "病患" : user.role === "doctor" ? "醫生" : user.role}
            </p>
          </div>

          <div>
            {user.role === "patient" ? (
              <>
                <p className="text-sm text-gray-500">生日 /年齡</p>
                <p className="text-lg font-medium text-gray-800">
                  {user.patientProfile?.date_of_birth
                    ? `${user.patientProfile.date_of_birth}（${user.age} 歲）`
                    : "未填寫"}
                </p>
              </>
            ) : user.role === "doctor" ? (
              <>
                <p className="text-sm text-gray-500">驗證狀態</p>
                <p className="text-lg font-medium text-gray-800">
                  {user.approval_status === "approved" && "已通過"}
                  {user.approval_status === "pending" && "審核中"}
                  {user.approval_status === "rejected" && "未通過"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">使用者名稱</p>
                <p className="text-lg font-medium text-gray-800">{user.username}</p>
              </>
            )}
          </div>
          



        </div>
      </div>
      

      {/* 病患專屬：健康資料 */}
      {isPatient && (
        <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">健康資料</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                編輯資料
              </button>
              
            )}
          </div>
          

          {!editing ? (
            // 顯示模式
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">身分證字號</p>
                <p className="text-lg font-medium text-gray-800">
                  {profile.id_number || "未填寫"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">藥物過敏</p>
                <p className="text-lg font-medium text-gray-800 whitespace-pre-wrap">
                  {profile.drug_allergies || "無"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">重大疾病史</p>
                <p className="text-lg font-medium text-gray-800 whitespace-pre-wrap">
                  {profile.medical_history || "無"}
                </p>
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">緊急聯絡人</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">姓名</p>
                    <p className="text-lg font-medium text-gray-800">
                      {profile.emergency_contact_name || "未填寫"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">電話</p>
                    <p className="text-lg font-medium text-gray-800">
                      {profile.emergency_contact_phone || "未填寫"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">吸菸狀況</p>
                    <p className="text-lg font-medium text-gray-800">
                      {profile.smoking_status === "yes" ? "有吸菸" : 
                      profile.smoking_status === "quit" ? "已戒菸" : "無"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 編輯模式
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  身分證字號
                </label>
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleInputChange}
                  maxLength="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="請輸入身分證字號"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  吸菸狀況
                </label>
                <select
                  name="smoking_status"
                  value={formData.smoking_status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="no">無</option>
                  <option value="yes">有吸菸</option>
                  <option value="quit">已戒菸</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  藥物過敏
                </label>
                <textarea
                  name="drug_allergies"
                  value={formData.drug_allergies}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="請輸入過敏藥物（如有多項請分行填寫）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  重大疾病史
                </label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="請輸入重大疾病史（如有多項請分行填寫）"
                />
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">緊急聯絡人</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓名
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="請輸入緊急聯絡人姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="請輸入緊急聯絡人電話"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? "儲存中..." : "儲存"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 px-5 py-2 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors disabled:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 醫師專業資料 */}
      {isDoctor && (
        
        <div className="bg-white shadow rounded-xl p-6 border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">專業資料</h2>
            
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                編輯資料
              </button>
            )}
          </div>

          <div className="mb-6 pb-6 border-b border-gray-100 flex items-start gap-6">
      {/* 1. 照片顯示 */}
      <div className="flex-shrink-0">
        <p className="text-sm text-gray-500 mb-1">個人頭像</p>
        <img
          className="h-24 w-24 object-cover rounded-full border-2 border-gray-200"
          // 使用 doctorForm.photo 讀取當前狀態
          src={doctorForm.photo 
            ? `http://localhost:5000/uploads/profile_pictures/${doctorForm.photo}` // ⚠️ 確保後端 app.py 的路徑正確
            : "/default-doctor-photo.png" // 預設圖
          }
          alt="醫師頭像"
          onError={(e) => {
              e.target.onerror = null; // 避免無限循環
              e.target.src="/default-doctor-photo.png"
          }}
        />
      </div>
      {editing && (
        // 2. 編輯模式下的上傳控制項
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            上傳新頭像
          </label>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".png,.jpg,.jpeg" 
              onChange={handlePhotoFileChange} // 綁定到我們之前定義的檔案選擇函式
              className="flex-grow text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={uploadingPhoto}
            />
            
            <button 
              onClick={handlePhotoUpload} // 綁定到我們之前定義的上傳函式
              disabled={uploadingPhoto || !selectedPhotoFile}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:bg-gray-400 whitespace-nowrap"
            >
              {uploadingPhoto ? "上傳中..." : "儲存照片"}
            </button>
          </div>
          {selectedPhotoFile && (
              <p className="text-sm text-gray-600 mt-2">
                  已選擇檔案: {selectedPhotoFile.name}
              </p>
          )}
          <p className="text-xs text-gray-500 mt-1">請選擇檔案後點擊「儲存照片」進行上傳。</p>
        </div>
      )}
    </div>
    

          {!editing ? (
             <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">主治科別</p>
                  <p className="text-lg font-medium text-gray-800">
                    {doctorProfile.specialty || "未填寫"}
                  </p>
                </div>
              <div>
                  <p className="text-sm text-gray-500">現任執醫院/診所</p>
                  <p className="text-lg font-medium text-gray-800">
                    {doctorProfile.practice_hospital || "未填寫"}
                  </p>
                </div>
                <div>
                <p className="text-sm text-gray-500">個人簡介</p>
                <p className="text-lg font-medium text-gray-800 whitespace-pre-wrap">
                  {doctorProfile.description || "未填寫"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">專業經歷</p>
                <p className="text-lg font-medium text-gray-800 whitespace-pre-wrap">
                  {doctorProfile.experience || "未填寫"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">學位與認證</p>
                <p className="text-lg font-medium text-gray-800 whitespace-pre-wrap">
                  {doctorProfile.qualifications || "未填寫"}
                </p>
              </div> 
              <div>
                  <p className="text-sm text-gray-500">掛號費</p>
                  <p className="text-lg font-medium text-gray-800">
                    {doctorProfile.consultation_fee !== undefined && doctorProfile.consultation_fee !== null 
                      ? doctorProfile.consultation_fee 
                      : "未填寫"}
                  </p>
              </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">學歷</p>
                <p className="text-lg font-medium text-gray-800 whitespace-pre-wrap">
                  {doctorProfile.education || "未填寫"}
                </p>
              </div>

              

              
            </div>
          ) : (
            // ✅ 醫師編輯模式
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        主治科別
      </label>
      <input
        type="text"
        name="specialty"
        value={doctorForm.specialty}
        onChange={(e) =>
          setDoctorForm({ ...doctorForm, specialty: e.target.value })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        醫院／診所名稱
      </label>
      <input
        type="text"
        name="practice_hospital"
        value={doctorForm.practice_hospital}
        onChange={(e) =>
          setDoctorForm({ ...doctorForm, practice_hospital: e.target.value })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
        {/* 個人簡介 */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        個人簡介
      </label>
      <textarea
        name="description"
        value={doctorForm.description}
        onChange={(e) =>
          setDoctorForm({ ...doctorForm, description: e.target.value })
        }
        rows="3"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    {/* 專業經歷 */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        專業經歷
      </label>
      <textarea
        name="experience"
        value={doctorForm.experience}
        onChange={(e) =>
          setDoctorForm({ ...doctorForm, experience: e.target.value })
        }
        rows="3"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    {/* 學位與認證 */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        學位與認證
      </label>
      <textarea
        name="qualifications"
        value={doctorForm.qualifications}
        onChange={(e) =>
          setDoctorForm({ ...doctorForm, qualifications: e.target.value })
        }
        rows="3"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    {/* 學歷 */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        學歷
      </label>
      <textarea
        name="education"
        value={doctorForm.education}
        onChange={(e) =>
          setDoctorForm({ ...doctorForm, education: e.target.value })
        }
        rows="2"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>


    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">掛號費</label>
      <input
        type="number"
        name="consultation_fee"
        value={doctorForm.consultation_fee}
        onChange={(e) =>
          setDoctorForm({
            ...doctorForm,
            consultation_fee: parseInt(e.target.value) || 0,
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div className="flex gap-3 pt-4">
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex-1 px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
      >
        {saving ? "儲存中..." : "儲存"}
      </button>
      <button
        onClick={handleCancel}
        disabled={saving}
        className="flex-1 px-5 py-2 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors disabled:bg-gray-400"
      >
        取消
      </button>
    </div>
  </div>
  )}
</div>
)}
      
        </main>
      </div>
    </div>
  );
}