"use client";
import { useState, useEffect } from 'react';
import {
  Calendar, Video, FileText, Users, Clock,
  CheckCircle, ArrowRight, Stethoscope, Heart, Monitor,
  ChevronRight, AlertCircle, Menu, X, ZoomIn,
  MessageCircle, MessageSquare, User, CreditCard,
  UserCheck, Star, Shield, Pencil, Plus, Trash2, Save, ImagePlus
} from 'lucide-react';
import Sidebar from "../../components/Mech_Sidebar";
import Navbar from "../../components/Navbar";
// ─────────────────────────────────────────────
// 病患端使用步驟
// ─────────────────────────────────────────────
const patientSteps = [
  {
    id: 1,
    icon: User,
    title: "註冊帳號",
    color: "from-blue-500 to-blue-600",
    description: "輕鬆建立您的個人健康帳戶",
    images: ["/images/1.png", "/images/2.png", "/images/3.png", "/images/4.png"],
    details: [
      "選擇「患者」身份開始註冊流程",
      "使用電子郵件建立帳號",
      "填寫基本個人資料與設定安全密碼",
      "輸入手機驗證碼完成身份驗證",
      "註冊完成，立即開始使用平台功能!",
    ],
  },
  {
    id: 2,
    icon: Calendar,
    title: "瀏覽與收藏醫師",
    color: "from-purple-500 to-purple-600",
    description: "找到最適合您的專業醫師",
    images: ["/images/5.png", "/images/6.png", "/images/7.png"],
    details: [
      "瀏覽各專科醫師列表,查看醫師背景與專長",
      "點擊「查看更多」了解醫師詳細資料",
      "點擊星星圖示將喜歡的醫師加入收藏清單",
      "在「我的收藏」中快速找到您收藏的醫師",
      "隨時管理收藏清單,方便日後預約!",
    ],
  },
  {
    id: 3,
    icon: CreditCard,
    title: "預約與線上付款",
    color: "from-green-500 to-green-600",
    description: "簡單三步驟完成看診預約",
    images: [
      "/images/11.png", "/images/12.png", "/images/13.png",
      "/images/14.png", "/images/15.png", "/images/16.png",
    ],
    details: [
      "在線上預約頁面查看醫師的可預約時段",
      "選擇最適合您的看診日期與時間",
      "詳細描述您的症狀,如需修改可點擊編輯",
      "確認預約資訊無誤後進入付款頁面",
      "選擇付款方式完成交易,預約成功!系統將發送確認通知",
    ],
  },
  {
    id: 4,
    icon: Calendar,
    title: "取消預約",
    color: "from-orange-500 to-orange-600",
    description: "彈性調整您的看診安排",
    images: ["/images/17.png", "/images/18.png"],
    details: [
      "在「我的預約」中找到想要取消的預約項目",
      "點擊「取消預約」按鈕進入取消流程",
      "填寫取消原因(可選填)並送出申請",
      "注意:預約時間 2 天內取消僅退還 50% 費用",
      "取消成功後將收到系統通知與退款確認",
    ],
  },
  {
    id: 5,
    icon: Video,
    title: "視訊看診與評分",
    color: "from-red-500 to-red-600",
    description: "享受便利的線上醫療服務",
    images: ["/images/8.png", "/images/19.png", "/images/20.png"],
    details: [
      "預約時間到達前,等待醫師開啟視訊會議室",
      "收到通知後點擊「進入看診室」開始視訊",
      "與醫師進行即時視訊問診,清楚說明症狀",
      "看診過程將自動錄影保存,可隨時回顧",
      "看診結束後為醫師評分,幫助其他患者參考",
      "也可點擊看診紀錄為之前的看診進行評分",
    ],
  },
  {
    id: 6,
    icon: FileText,
    title: "經驗分享區",
    color: "from-indigo-500 to-indigo-600",
    description: "與社群分享您的就醫經驗",
    images: ["/images/9.png", "/images/21.png", "/images/22.png"],
    details: [
      "點擊「發布」按鈕開始撰寫您的經驗分享",
      "輸入標題與內容,分享您的就醫心得",
      "可選擇「匿名發布」保護個人隱私",
      "在他人的文章下方發表留言互動交流",
      "留言時也可選擇匿名,自由表達想法",
    ],
  },
  {
    id: 7,
    icon: User,
    title: "問題回報",
    color: "from-blue-500 to-blue-600",
    description: "您的回饋幫助我們做得更好",
    images: ["/images/10.png"],
    details: [
      "點擊「問題回報」進入反饋表單",
      "勾選遇到的問題類型或功能建議",
      "詳細描述問題情況或您的改善建議",
      "我們會仔細審閱每一則回饋意見",
      "持續改進平台,提供更優質的服務體驗",
    ],
  },
  {
    id: 8,
    icon: MessageCircle,
    title: "AI聊天室",
    color: "from-indigo-500 to-indigo-600",
    description: "系統在每個頁面的右下角皆設有 AI 聊天室，方便使用者隨時進行線上視訊看診相關的諮詢與協助。",
    images: ["/images/37.png", "/images/38.png"],
    details: [
      "每個頁面右下角皆可快速開啟 AI 聊天室",
      "看診前協助進行症狀初步詢問與整理",
      "輔助說明線上視訊看診流程",
      "提供基本健康與就醫相關資訊",
      "提升線上醫療服務的整體互動體驗",
    ],
  },
];

// ─────────────────────────────────────────────
// 醫師端使用步驟
// ─────────────────────────────────────────────
const doctorSteps = [
  {
    id: 1,
    icon: UserCheck,
    title: "醫師註冊與審核",
    color: "from-blue-500 to-blue-600",
    description: "快速完成專業醫師認證,開啟線上診療之旅",
    images: ["/images/1.png", "/images/23.png", "/images/24.png", "/images/4.png"],
    details: [
      "選擇「醫師」身份進行註冊,填寫基本聯絡資訊",
      "設定安全的帳號密碼,保護您的專業帳戶",
      "上傳醫師執照及相關證明文件(支持 PDF、JPG 格式)",
      "系統將在 1-3 個工作天內完成審核並通知結果",
      "審核通過後立即啟用帳號,開始使用完整平台功能",
    ],
  },
  {
    id: 2,
    icon: Calendar,
    title: "設定看診時間表",
    color: "from-purple-500 to-purple-600",
    description: "彈性安排門診時段,掌握工作節奏",
    images: ["/images/26.png"],
    details: [
      "進入「排班管理」功能,查看您的可用時段",
      "選擇想要開放看診的日期與時間區間",
      "可設定單次或重複性排班,靈活調整時間安排",
      "隨時暫停或關閉特定時段,應對突發狀況",
      "點擊儲存後,系統將自動開放預約給患者",
    ],
  },
  {
    id: 3,
    icon: Users,
    title: "查看預約清單",
    color: "from-green-500 to-green-600",
    description: "一目了然掌握所有預約資訊",
    images: ["/images/27.png", "/images/30.png"],
    details: [
      "進入「預約管理」查看今日、未來及已取消的預約安排",
      "點擊任一預約可查看患者詳細資料與主訴症狀",
      "系統會顯示患者基本健康資訊,協助診前準備",
      "可搜尋患者姓名,快速找到所需資訊",
    ],
  },
  {
    id: 4,
    icon: Calendar,
    title: "取消預約",
    color: "from-orange-500 to-orange-600",
    description: "妥善處理突發狀況,維護醫病關係",
    images: ["/images/27.png", "/images/28.png"],
    details: [
      "在「預約管理」中找到需要取消的預約項目",
      "點擊「取消預約」按鈕,進入取消流程",
      "填寫取消原因(此資訊將通知患者)",
      "確認送出後,系統將自動通知患者並退還費用",
      "該時段將重新開放,供其他患者預約",
    ],
  },
  {
    id: 5,
    icon: Video,
    title: "查看預約紀錄",
    color: "from-red-500 to-red-600",
    description: "完整追蹤所有診療歷程",
    images: ["/images/31.png"],
    details: [
      "進入「預約紀錄」功能,查看歷史預約資料",
      "可檢視已確認、已完成及已取消的看診記錄與診療內容",
      "查看已取消的預約及取消原因,便於追蹤管理",
      "可給予已完成視訊看診的患者一些建議與處方供患者參考",
    ],
  },
  {
    id: 6,
    icon: FileText,
    title: "查看患者病歷",
    color: "from-indigo-500 to-indigo-600",
    description: "完整病歷系統,提供更精準的診療",
    images: ["/images/32.png", "/images/33.png"],
    details: [
      "進入「患者病歷」功能,查看所有就診過的患者列表",
      "系統自動整理每位患者的完整就診歷程",
      "點擊「查看完整病歷」可查看詳細診療記錄",
      "包含過往主訴、診斷、處方等重要醫療資訊",
      "可搜尋患者姓名、病歷號碼及性別,快速找到該患者",
      "協助您更全面了解患者健康狀況,提供連貫性照護",
    ],
  },
  {
    id: 7,
    icon: Video,
    title: "視訊看診",
    color: "from-pink-500 to-pink-600",
    description: "高品質視訊系統,如同面對面問診",
    images: ["/images/35.png", "/images/34.png"],
    details: [
      "在預約時間前 5 分鐘開啟會議室",
      "點擊「進入視訊看診室」,系統會進行設備檢測",
      "等待患者進入,開始進行線上診療",
      "使用清晰的視訊與音訊功能進行專業問診",
      "看診過程自動錄影並加密保存,保障醫病雙方權益",
    ],
  },
  {
    id: 8,
    icon: MessageSquare,
    title: "問題回報",
    color: "from-teal-500 to-teal-600",
    description: "您的回饋幫助我們做得更好",
    images: ["/images/36.png"],
    details: [
      "點擊頁面上的「問題回報」按鈕",
      "勾選您遇到的問題類型(可複選)",
      "詳細描述具體問題或建議事項",
      "我們的技術團隊將在 24 小時內回覆",
      "持續優化平台功能,提供更好的使用體驗",
    ],
  },
];

// ─────────────────────────────────────────────
// 主頁面元件
// ─────────────────────────────────────────────
export default function IntroductionPage() {
  const [activeRole, setActiveRole] = useState('patient'); // 'patient' | 'doctor'
  const [activeStep, setActiveStep] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ── 編輯模式 ──
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [patientStepsData, setPatientStepsData] = useState(patientSteps.map(s => ({ ...s, details: [...s.details], images: [...s.images] })));
  const [doctorStepsData, setDoctorStepsData] = useState(doctorSteps.map(s => ({ ...s, details: [...s.details], images: [...s.images] })));
  const [newImageInputs, setNewImageInputs] = useState({});

  // 切換身份時重置圖片索引
  const handleRoleChange = (role) => {
    setActiveRole(role);
    setCurrentImageIndex({});
    setActiveStep(null);
  };

  const steps = activeRole === 'patient' ? patientStepsData : doctorStepsData;
  const setSteps = activeRole === 'patient' ? setPatientStepsData : setDoctorStepsData;

  // ── 編輯 helper ──
  const updateStepField = (role, stepId, field, value) => {
    const setter = role === 'patient' ? setPatientStepsData : setDoctorStepsData;
    setter(prev => prev.map(s => s.id === stepId ? { ...s, [field]: value } : s));
  };

  const updateDetail = (role, stepId, idx, value) => {
    const setter = role === 'patient' ? setPatientStepsData : setDoctorStepsData;
    setter(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      const details = [...s.details];
      details[idx] = value;
      return { ...s, details };
    }));
  };

  const addDetail = (role, stepId) => {
    const setter = role === 'patient' ? setPatientStepsData : setDoctorStepsData;
    setter(prev => prev.map(s => s.id === stepId ? { ...s, details: [...s.details, ''] } : s));
  };

  const removeDetail = (role, stepId, idx) => {
    const setter = role === 'patient' ? setPatientStepsData : setDoctorStepsData;
    setter(prev => prev.map(s => s.id === stepId ? { ...s, details: s.details.filter((_, i) => i !== idx) } : s));
  };

  const addImage = (role, stepId) => {
    const key = `${role}-${stepId}`;
    const url = (newImageInputs[key] || '').trim();
    if (!url) return;
    const setter = role === 'patient' ? setPatientStepsData : setDoctorStepsData;
    setter(prev => prev.map(s => s.id === stepId ? { ...s, images: [...s.images, url] } : s));
    setNewImageInputs(prev => ({ ...prev, [key]: '' }));
  };

  const removeImage = (role, stepId, idx) => {
    const setter = role === 'patient' ? setPatientStepsData : setDoctorStepsData;
    setter(prev => prev.map(s => s.id === stepId ? { ...s, images: s.images.filter((_, i) => i !== idx) } : s));
  };

  // 鍵盤控制燈箱
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') lightboxPrev();
      else if (e.key === 'ArrowRight') lightboxNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex, lightboxImages]);

  const handlePrevImage = (stepId) => {
    setCurrentImageIndex(prev => {
      const cur = prev[stepId] || 0;
      const step = steps.find(s => s.id === stepId);
      return { ...prev, [stepId]: cur === 0 ? step.images.length - 1 : cur - 1 };
    });
  };

  const handleNextImage = (stepId) => {
    setCurrentImageIndex(prev => {
      const cur = prev[stepId] || 0;
      const step = steps.find(s => s.id === stepId);
      return { ...prev, [stepId]: cur === step.images.length - 1 ? 0 : cur + 1 };
    });
  };

  const openLightbox = (images, index) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxImage(images[index]);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage(null);
  };

  const lightboxPrev = () => {
    const newIndex = lightboxIndex === 0 ? lightboxImages.length - 1 : lightboxIndex - 1;
    setLightboxIndex(newIndex);
    setLightboxImage(lightboxImages[newIndex]);
  };

  const lightboxNext = () => {
    const newIndex = lightboxIndex === lightboxImages.length - 1 ? 0 : lightboxIndex + 1;
    setLightboxIndex(newIndex);
    setLightboxImage(lightboxImages[newIndex]);
  };

  // 根據身份決定主題色
  const isPatient = activeRole === 'patient';

  const features = isPatient
    ? [
        { icon: Clock,       title: "線上服務",     description: "隨時隨地都能預約看診" },
        { icon: Stethoscope, title: "專業醫師團隊", description: "各科專業醫師為您服務" },
        { icon: Monitor,     title: "高品質視訊",   description: "清晰流暢的視訊通話"   },
        { icon: Heart,       title: "隱私保護",     description: "嚴格保護您的個人資料" },
      ]
    : [
        { icon: Clock,   title: "彈性排班",   description: "自由安排看診時間,工作生活平衡" },
        { icon: Shield,  title: "資料安全",   description: "醫療資訊加密保護,符合法規要求" },
        { icon: Video,   title: "高品質視訊", description: "穩定流暢的視訊通話體驗" },
        { icon: Star,    title: "專業形象",   description: "建立個人品牌,獲得更多病患信任" },
      ];
  const themeGradient = isPatient
    ? 'from-blue-600 to-purple-600'
    : 'from-teal-500 to-emerald-600';
  const themeBg = isPatient
    ? 'from-blue-50 via-purple-50 to-pink-50'
    : 'from-teal-50 via-emerald-50 to-cyan-50';

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${themeBg} transition-all duration-500`}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
          aria-label="開啟選單"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`transition-all duration-300 ${isOpen ? 'md:ml-64' : 'ml-0'}`}>
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-12">

          {/* ── 修改按鈕 ── */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold text-sm"
            >
              <Pencil className="w-4 h-4" />
              修改內容
            </button>
          </div>
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              遠距線上醫療看診平台
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              打破時間與空間限制，讓優質醫療服務觸手可及
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <span className="text-blue-600 font-semibold">✓ 即時預約</span>
              </div>
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <span className="text-purple-600 font-semibold">✓ 視訊看診</span>
              </div>
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <span className="text-green-600 font-semibold">✓ 完整紀錄</span>
              </div>
            </div>
          </div>

          {/* ── 身份切換 Tab ── */}
          <div className="flex justify-center mb-14">
            <div className="bg-white rounded-2xl p-2 shadow-xl flex gap-2 border border-gray-100">
              {/* 病患按鈕 */}
              <button
                onClick={() => handleRoleChange('patient')}
                className={`
                  relative flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg
                  transition-all duration-300 select-none
                  ${isPatient
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}
                `}
              >
                <User className="w-6 h-6" />
                病患使用流程
                {isPatient && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                )}
              </button>

              {/* 分隔線 */}
              <div className="w-px bg-gray-200 self-stretch mx-1" />

              {/* 醫師按鈕 */}
              <button
                onClick={() => handleRoleChange('doctor')}
                className={`
                  relative flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg
                  transition-all duration-300 select-none
                  ${!isPatient
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg scale-105'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}
                `}
              >
                <Stethoscope className="w-6 h-6" />
                醫師使用流程
                {!isPatient && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                )}
              </button>
            </div>
          </div>

          {/* ── 當前身份說明標題 ── */}
          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${themeGradient} text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg`}>
              {isPatient
                ? <><User className="w-5 h-5" /> 病患端使用流程</>
                : <><Stethoscope className="w-5 h-5" /> 醫師端使用流程</>
              }
            </div>
          </div>

          {/* ── 使用步驟 ── */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
              使用流程
            </h3>

            <div className="space-y-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={`${activeRole}-${step.id}`}
                    className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
                    onMouseEnter={() => setActiveStep(step.id)}
                    onMouseLeave={() => setActiveStep(null)}
                  >
                    <div className="flex flex-col lg:flex-row gap-8 items-center">

                      {/* 左側：說明 */}
                      <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center`}>
                            <Icon className="w-10 h-10 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-4 py-1 bg-gradient-to-br ${themeGradient} text-white rounded-full text-sm font-bold`}>
                                步驟 {step.id}
                              </span>
                            </div>
                            <h4 className="text-3xl font-bold text-gray-800">{step.title}</h4>
                          </div>
                        </div>

                        <p className="text-lg text-gray-600">{step.description}</p>

                        <div className="space-y-3">
                          {step.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-gray-700">
                              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-base">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 右側：圖片輪播 */}
                      <div className="flex-1 w-full">
                        <div className="relative group">
                          <div
                            className="rounded-2xl overflow-hidden border-4 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-zoom-in relative"
                            onClick={() => openLightbox(step.images, currentImageIndex[step.id] || 0)}
                          >
                            <img
                              src={step.images[currentImageIndex[step.id] || 0]}
                              alt={`${step.title}示意圖 ${(currentImageIndex[step.id] || 0) + 1}`}
                              className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                                <ZoomIn className="w-8 h-8 text-gray-800" />
                              </div>
                            </div>
                          </div>

                          {step.images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePrevImage(step.id); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
                              >
                                <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleNextImage(step.id); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
                              >
                                <ChevronRight className="w-6 h-6 text-gray-800" />
                              </button>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                {step.images.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => ({ ...prev, [step.id]: idx })); }}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${(currentImageIndex[step.id] || 0) === idx ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'}`}
                                  />
                                ))}
                              </div>
                              <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                                {(currentImageIndex[step.id] || 0) + 1} / {step.images.length}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="flex justify-center mt-8">
                        <div className={`w-12 h-12 bg-gradient-to-br ${themeGradient} rounded-full flex items-center justify-center transform rotate-90`}>
                          <ChevronRight className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 平台特色 ── */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">平台特色</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 注意事項（依身份切換） ── */}
          {isPatient ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 mb-16">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">重要提醒</h4>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    本平台提供之「心理諮商」與「精神科線上諮詢」服務屬於非醫療性質，
                    僅提供心理支持、情緒陪伴、生活適應建議與健康相關資訊。
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    諮詢內容不包含醫療診斷、開立藥物處方、醫療證明或任何醫療行為。
                    如有緊急醫療需求，請立即撥打 119 或前往最近的醫療機構。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 mb-16">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">醫師注意事項</h4>
                  <ul className="text-gray-700 leading-relaxed space-y-2">
                    <li>• 請確保您的醫師執照在有效期限內</li>
                    <li>• 線上看診需遵守醫療法規與倫理規範</li>
                    <li>• 建議在安靜、光線充足的環境進行視訊看診</li>
                    <li>• 請保護病患隱私,不得洩露病患資訊</li>
                    <li>• 如遇緊急狀況,請引導病患就近就醫</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          <div className={`text-center bg-gradient-to-br ${themeGradient} rounded-3xl p-12 text-white shadow-2xl`}>
            <h3 className="text-4xl font-bold mb-4">準備好開始了嗎？</h3>
            <p className="text-xl mb-8 text-blue-100">
              立即註冊，體驗便捷的線上醫療服務
            </p>
            <a
              href="/doctorlist"
              className="inline-flex bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg items-center gap-3"
            >
              立即開始
              <ArrowRight className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 MedOnGo. 讓醫療服務更便捷、更貼心。</p>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all z-10"
          >
            <X className="w-8 h-8 text-white" />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full text-lg font-semibold">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
          <div
            className="relative max-w-6xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="放大檢視"
              className="w-full h-full object-contain rounded-lg"
            />
            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={lightboxPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 hover:bg-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
                >
                  <ChevronRight className="w-8 h-8 text-gray-800 rotate-180" />
                </button>
                <button
                  onClick={lightboxNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 hover:bg-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
                >
                  <ChevronRight className="w-8 h-8 text-gray-800" />
                </button>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
                  {lightboxImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setLightboxIndex(idx); setLightboxImage(lightboxImages[idx]); }}
                      className={`w-3 h-3 rounded-full transition-all ${lightboxIndex === idx ? 'bg-white w-10' : 'bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            按 ESC 關閉 {lightboxImages.length > 1 && '• 使用 ← → 切換圖片'}
          </div>
        </div>
      )}
      {/* ── 修改內容 Modal ── */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">修改使用流程內容</h2>
                  <p className="text-sm text-gray-500">編輯各步驟的標題、說明、詳細步驟與圖片</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* 選擇編輯哪個身份 */}
              <div className="flex gap-3">
                {['patient', 'doctor'].map(role => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                      activeRole === role
                        ? role === 'patient'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                          : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {role === 'patient' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                    {role === 'patient' ? '病患流程' : '醫師流程'}
                  </button>
                ))}
              </div>

              {/* 步驟卡片列表 */}
              {(activeRole === 'patient' ? patientStepsData : doctorStepsData).map((step) => {
                const Icon = step.icon;
                const role = activeRole;
                const imgKey = `${role}-${step.id}`;
                return (
                  <div key={`edit-${role}-${step.id}`} className={`border-2 rounded-2xl overflow-hidden ${role === 'patient' ? 'border-blue-100' : 'border-teal-100'}`}>
                    {/* 卡片 Header */}
                    <div className={`px-6 py-4 bg-gradient-to-r ${step.color} flex items-center gap-3`}>
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-bold text-lg">步驟 {step.id}</span>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* 標題 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">標題</label>
                        <input
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                          value={step.title}
                          onChange={e => updateStepField(role, step.id, 'title', e.target.value)}
                        />
                      </div>

                      {/* 說明 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">說明</label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition resize-none"
                          value={step.description}
                          onChange={e => updateStepField(role, step.id, 'description', e.target.value)}
                        />
                      </div>

                      {/* 詳細步驟 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">詳細步驟</label>
                        <div className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                              <input
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                                value={detail}
                                onChange={e => updateDetail(role, step.id, idx, e.target.value)}
                              />
                              <button
                                onClick={() => removeDetail(role, step.id, idx)}
                                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => addDetail(role, step.id)}
                          className="mt-2 flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700 font-semibold transition"
                        >
                          <Plus className="w-4 h-4" /> 新增步驟
                        </button>
                      </div>

                      {/* 圖片管理 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">圖片路徑</label>
                        <div className="space-y-2">
                          {step.images.map((img, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                              <input
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                                value={img}
                                onChange={e => {
                                  const setter = role === 'patient' ? setPatientStepsData : setDoctorStepsData;
                                  setter(prev => prev.map(s => {
                                    if (s.id !== step.id) return s;
                                    const images = [...s.images];
                                    images[idx] = e.target.value;
                                    return { ...s, images };
                                  }));
                                }}
                              />
                              <button
                                onClick={() => removeImage(role, step.id, idx)}
                                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* 新增圖片 */}
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            className="flex-1 border border-dashed border-purple-300 rounded-lg px-3 py-2 text-sm text-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-purple-300 transition placeholder-gray-400"
                            placeholder="輸入圖片路徑，例如 /images/new.png"
                            value={newImageInputs[imgKey] || ''}
                            onChange={e => setNewImageInputs(prev => ({ ...prev, [imgKey]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') addImage(role, step.id); }}
                          />
                          <button
                            onClick={() => addImage(role, step.id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-semibold transition"
                          >
                            <ImagePlus className="w-4 h-4" /> 新增
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-gray-100 px-8 py-5 flex justify-end gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
              >
                取消
              </button>
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-md transition"
              >
                <Save className="w-4 h-4" /> 儲存變更
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}