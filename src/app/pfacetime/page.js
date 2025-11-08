"use client";
import { useState, useEffect, useRef } from 'react';
import { Menu,Video, PhoneOff, Monitor, Clock, FileText, AlertCircle, User, Calendar, Heart, CheckCircle, PlayCircle, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RatingModal from '../components/RatingModal';

export default function PatientVideoConsultation() {
  const [appointments, setAppointments] = useState([]);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [isOpen, setIsOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completedAppointment, setCompletedAppointment] = useState(null);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  // ✅ 載入 Jitsi API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.JitsiMeetExternalAPI) {
      setJitsiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Jitsi API 載入完成');
      setJitsiLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Jitsi API 載入失敗');
      setError('無法載入視訊服務，請重新整理頁面');
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    fetchUpcomingAppointments();
    fetchConsultationHistory();
    const interval = setInterval(fetchUpcomingAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await fetch('/api/appointments', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // 過濾出即將到來的預約 (狀態為「待確認」或「已確認」)
        const upcoming = data.filter(apt => 
          apt.status === '待確認' || apt.status === '已確認'
        );
        
        setAppointments(upcoming);
      } else {
        setError('無法獲取預約資訊');
      }
    } catch (err) {
      console.error('獲取預約失敗:', err);
      setError('網路連接失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConsultationHistory = async () => {
    try {
      const response = await fetch('/api/appointments', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // 過濾出已完成的看診記錄
        const completed = data.filter(apt => 
          apt.status === 'completed'
        );
        
        setConsultationHistory(completed);
      }
    } catch (err) {
      console.error('獲取看診記錄失敗:', err);
    }
  };

  const checkIfRated = async (appointmentId) => {
    try {
      const response = await fetch(`/api/ratings/check/${appointmentId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.hasRated;
      }
      return false;
    } catch (error) {
      console.error('檢查評分狀態失敗:', error);
      return false;
    }
  };

  const joinMeeting = async (appointment) => {
    if (!jitsiLoaded || !window.JitsiMeetExternalAPI) {
      setError('視訊服務尚未準備好，請稍後再試');
      return;
    }

    // 檢查是否有 meeting_room_id
    if (!appointment.meeting_room_id) {
      setError('醫師尚未開啟會議室，請稍後再試');
      return;
    }

    try {
      setIsLoading(true);
      setSelectedDoctor(appointment);
      setCurrentMeeting(appointment);
      setIsMeetingActive(true);

      setTimeout(() => {
        initJitsi(appointment.meeting_room_id, appointment);
      }, 100);

    } catch (err) {
      console.error('加入會議失敗:', err);
      setError('無法加入會議，請稍後再試');
      setIsMeetingActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const initJitsi = (roomId, appointment) => {
    if (!jitsiContainerRef.current || typeof window === 'undefined' || !window.JitsiMeetExternalAPI) {
      console.error('Jitsi 初始化條件不滿足');
      setError('視訊服務初始化失敗');
      return;
    }

    try {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }

      const domain = 'meet.jit.si';
      const options = {
        roomName: `MedOnGo_${roomId}`,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableInviteFunctions: true,
          requireDisplayName: true,
          enableNoAudioDetection: true,
          enableNoisyMicDetection: true,
          resolution: 720,
          constraints: {
            video: {
              height: { ideal: 720, max: 1080, min: 360 }
            }
          }
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'chat',
            'raisehand', 'settings', 'hangup'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#0f172a',
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          MOBILE_APP_PROMO: false
        },
        userInfo: {
          displayName: `患者`
        }
      };

      console.log('🎬 加入 Jitsi 會議室:', roomId);
      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      api.addEventListener('videoConferenceJoined', () => {
        console.log('✅ 已加入會議');
      });

      api.addEventListener('participantJoined', (participant) => {
        console.log('👤 醫師已加入:', participant.displayName);
      });

      api.addEventListener('videoConferenceLeft', () => {
        console.log('👋 已離開會議');
        handleMeetingEnd();
      });

      api.addEventListener('readyToClose', () => {
        console.log('🔚 會議準備關閉');
        handleMeetingEnd();
      });

    } catch (err) {
      console.error('❌ Jitsi 初始化失敗:', err);
      setError('視訊初始化失敗，請重新開始');
      setIsMeetingActive(false);
    }
  };

  const handleMeetingEnd = async () => {
    console.log('📚 處理會議結束...');

    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      } catch (err) {
        console.error('清理 Jitsi 實例失敗:', err);
      }
    }

    // ✅ 儲存當前預約資訊以便評分
    const appointmentToRate = currentMeeting;

    setIsMeetingActive(false);
    setCurrentMeeting(null);
    setSelectedDoctor(null);
    
    // ✅ 重新獲取資料
    await fetchUpcomingAppointments();
    await fetchConsultationHistory();

    // ✅ 檢查是否需要評分 (預約狀態為 completed 且未評分)
    if (appointmentToRate) {
      try {
        // 檢查預約狀態
        const response = await fetch(`/api/appointments?appointment_id=${appointmentToRate.appointment_id}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const appointments = await response.json();
          if (appointments.length > 0 && appointments[0].status === 'completed') {
            // 檢查是否已評分
            const hasRated = await checkIfRated(appointmentToRate.appointment_id);
            
            if (!ratingData.hasRated) {
              setTimeout(() => {
                setCompletedAppointment(appointmentToRate);
                setShowRatingModal(true);
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('檢查評分狀態失敗:', error);
      }
    }
  };

  const leaveMeeting = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    handleMeetingEnd();
  };

  const handleRatingSubmit = async (ratingData) => {
    console.log('評分已提交:', ratingData);
    // 重新獲取看診記錄以顯示最新評分
    await fetchConsultationHistory();
  };

  const viewRecording = async (appointmentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/recording`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.appointment.recording_url) {
          // 開啟錄影播放視窗
          window.open(`http://localhost:5000/api/recording/${data.appointment.recording_url}`, '_blank');
        } else {
          setError('此次看診尚無錄影記錄');
        }
      }
    } catch (err) {
      console.error('獲取錄影失敗:', err);
      setError('無法獲取錄影記錄');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // ====== UI 渲染 ======
  if (isLoading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (isMeetingActive && currentMeeting) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <Heart className="w-6 h-6" />
            <div>
              <h2 className="font-semibold text-lg">視訊看診中</h2>
              <p className="text-sm text-blue-100">
                醫師: {currentMeeting.doctor_first_name} {currentMeeting.doctor_last_name}
                <span className="mx-2">•</span>
                {currentMeeting.doctor_specialty}
                <span className="mx-2">•</span>
                {currentMeeting.practice_hospital}
              </p>
            </div>
          </div>

          <button
            onClick={leaveMeeting}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="font-semibold">離開看診</span>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div ref={jitsiContainerRef} className="flex-1 bg-gray-900" />

          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                醫師資訊
              </h3>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">主治醫師</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {selectedDoctor?.doctor_first_name} {selectedDoctor?.doctor_last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">專科</p>
                    <p className="font-semibold text-gray-900">{selectedDoctor?.doctor_specialty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">執業醫院</p>
                    <p className="font-semibold text-gray-900">{selectedDoctor?.practice_hospital}</p>
                  </div>
                </div>
              </div>

              {selectedDoctor?.symptoms && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-yellow-600" />
                    您的症狀描述
                  </h4>
                  <p className="text-gray-700 text-sm">{selectedDoctor.symptoms}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Monitor className="w-4 h-4 mr-2 text-blue-600" />
                  看診提醒
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>請確保麥克風和攝影機正常運作</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>找一個安靜、光線充足的環境</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>準備好相關的檢查報告或藥單</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>看診過程將自動錄影以供日後查閱</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <>
      <div className="relative min-h-screen bg-gray-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="p-3 fixed top-2 left-4 text-gray-700 z-50 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white"
          >
            <Menu size={24} />
          </button>
        )}

        <Sidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
          <Navbar setIsSidebarOpen={setIsOpen} />

          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span>{showHistory ? "返回預約" : "看診記錄"}</span>
                </button>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">發生錯誤</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              )}

              {!jitsiLoaded && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-yellow-800 font-medium">視訊服務載入中...</p>
                    <p className="text-yellow-600 text-sm mt-1">請稍候,視訊功能準備中</p>
                  </div>
                </div>
              )}

              {!showHistory ? (
                <>
                  {/* Statistics cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">即將看診</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">
                            {appointments.length}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">看診記錄</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">
                            {consultationHistory.length}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">視訊狀態</p>
                          <p className="text-3xl font-bold text-blue-600 mt-1">
                            {jitsiLoaded ? "就緒" : "載入中"}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Video className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Appointments list */}
                  {appointments.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-gray-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        目前沒有即將到來的看診預約
                      </h2>
                      <p className="text-gray-500 mb-6">
                        當您預約視訊看診時,將會顯示在此處
                      </p>
                      <button
                        onClick={fetchUpcomingAppointments}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        重新整理
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">即將到來的看診</h2>
                      {appointments.map((appointment) => (
                        <div
                          key={appointment.appointment_id}
                          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                        >
                          <div className="flex items-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mr-4">
                              <User className="w-8 h-8 text-blue-600" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                  {appointment.doctor_first_name}{" "}
                                  {appointment.doctor_last_name} 醫師
                                </h3>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                  {appointment.doctor_specialty}
                                </span>
                              </div>

                              <div className="flex flex-col space-y-1 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    預約時間: {appointment.appointment_date}{" "}
                                    {appointment.appointment_time}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Monitor className="w-4 h-4" />
                                  <span>{appointment.practice_hospital}</span>
                                </div>
                                {appointment.symptoms && (
                                  <div className="flex items-center space-x-2">
                                    <FileText className="w-4 h-4" />
                                    <span className="truncate max-w-md">
                                      症狀: {appointment.symptoms}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col space-y-2">
                              {appointment.meeting_room_id ? (
                                <button
                                  onClick={() => joinMeeting(appointment)}
                                  disabled={isLoading || !jitsiLoaded}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                  <Video className="w-5 h-5" />
                                  <span className="font-semibold">
                                    {jitsiLoaded ? "進入看診" : "載入中..."}
                                  </span>
                                </button>
                              ) : (
                                <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
                                  <p className="text-yellow-800 text-sm font-medium">
                                    等待醫師開啟會議室
                                  </p>
                                  <p className="text-yellow-600 text-xs mt-1">
                                    請稍候,醫師將會在預約時間開始看診
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tips section */}
                  <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-blue-600" />
                      視訊看診須知
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-gray-600">
                      {[
                        {
                          icon: <Video className="w-3 h-3 text-blue-600" />,
                          title: "高品質視訊",
                          desc: "清晰的影像和聲音確保診療品質",
                        },
                        {
                          icon: <Clock className="w-3 h-3 text-blue-600" />,
                          title: "準時看診",
                          desc: "請在預約時間準時進入會議室",
                        },
                        {
                          icon: <FileText className="w-3 h-3 text-blue-600" />,
                          title: "看診記錄",
                          desc: "所有診療記錄將自動保存供您查閱",
                        },
                        {
                          icon: <Monitor className="w-3 h-3 text-blue-600" />,
                          title: "錄影保護",
                          desc: "看診過程錄影,保障您的權益",
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            {item.icon}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Consultation history */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">看診記錄</h2>
                      <button
                        onClick={fetchConsultationHistory}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        重新整理
                      </button>
                    </div>

                    {consultationHistory.length === 0 ? (
                      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          尚無看診記錄
                        </h2>
                        <p className="text-gray-500">
                          完成視訊看診後,記錄將會顯示在此處
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {consultationHistory.map((record) => (
                          <div
                            key={record.appointment_id}
                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                          >
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start space-x-4">
                                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                      {record.doctor_first_name}{" "}
                                      {record.doctor_last_name} 醫師
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {record.doctor_specialty} •{" "}
                                      {record.practice_hospital}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {formatDate(record.appointment_date)}{" "}
                                      {record.appointment_time}
                                    </p>
                                  </div>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                  已完成
                                </span>
                              </div>

                              {record.symptoms && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                  <p className="text-xs text-gray-500 mb-1">主訴症狀</p>
                                  <p className="text-sm text-gray-700">
                                    {record.symptoms}
                                  </p>
                                </div>
                              )}

                              {record.consultation_notes && (
                                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                  <p className="text-xs text-gray-500 mb-1">
                                    醫師診斷與建議
                                  </p>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {record.consultation_notes}
                                  </p>
                                </div>
                              )}

                              {/* ✅ 顯示評分 */}
                              {record.rating && (
                                <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                                  <p className="text-xs text-gray-500 mb-2">您的評分</p>
                                  <div className="flex items-center space-x-2 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`text-xl ${
                                          star <= record.rating
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  {record.rating_comment && (
                                    <p className="text-sm text-gray-700">
                                      {record.rating_comment}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  {record.recording_duration && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        看診時長:{" "}
                                        {formatDuration(record.recording_duration)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2">
                                  {/* ✅ 評分按鈕 */}
                                  {!record.rating && (
                                    <button
                                      onClick={() => {
                                        setCompletedAppointment(record);
                                        setShowRatingModal(true);
                                      }}
                                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                                    >
                                      <span>⭐</span>
                                      <span>評分</span>
                                    </button>
                                  )}
                                  
                                  {record.recording_url && (
                                    <button
                                      onClick={() =>
                                        viewRecording(record.appointment_id)
                                      }
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                                    >
                                      <PlayCircle className="w-4 h-4" />
                                      <span>觀看錄影</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ 評分彈窗 */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setCompletedAppointment(null);
        }}
        appointment={completedAppointment}
        onSubmit={handleRatingSubmit}
      />
    </>
  );
}