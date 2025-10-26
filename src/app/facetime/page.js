"use client";
import { useState, useEffect, useRef } from 'react';
import { Menu, Video, PhoneOff, Monitor, Users, Clock, FileText, AlertCircle, User, Calendar, Stethoscope, Circle, Mic, MicOff, VideoOff as VideoOffIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import DoctorSidebar from '../components/DoctorSidebar';

export default function DoctorVideoConsultation() {
  const [appointments, setAppointments] = useState([]);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [isOpen, setIsOpen] = useState(false);

  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  // 載入 Jitsi API
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
      setError('無法載入視訊服務,請重新整理頁面');
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
    const interval = setInterval(fetchUpcomingAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/appointments/upcoming', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
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

  const calculateAge = (dob) => {
    if (!dob) return '未提供';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age}歲`;
  };

  const startMeeting = async (appointment) => {
    if (!jitsiLoaded || !window.JitsiMeetExternalAPI) {
      setError('視訊服務尚未準備好,請稍後再試');
      return;
    }

    try {
      setIsLoading(true);
      setSelectedPatient(appointment);

      const response = await fetch('http://localhost:5000/api/meeting/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointment_id: appointment.appointment_id })
      });

      if (!response.ok) throw new Error('無法創建會議室');

      const data = await response.json();
      setCurrentMeeting({ ...appointment, meeting_room_id: data.meeting_room_id });
      setIsMeetingActive(true);

      setTimeout(() => {
        initJitsi(data.meeting_room_id, appointment);
      }, 100);

    } catch (err) {
      console.error('開始會議失敗:', err);
      setError('無法開始會議,請稍後再試');
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
            'microphone', 'camera', 'desktop', 'chat',
            'raisehand', 'settings', 'hangup'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#0f172a',
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          MOBILE_APP_PROMO: false
        },
        userInfo: {
          displayName: `醫師`
        }
      };

      console.log('🎬 初始化 Jitsi 會議室:', roomId);
      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      api.addEventListener('videoConferenceJoined', () => {
        console.log('✅ 已加入會議');
        console.log('🎬 2秒後自動啟動錄影...');
        setTimeout(() => {
          console.log('🎬 執行 startRecording()');
          startRecording();
        }, 2000);
      });

      api.addEventListener('participantJoined', (participant) => {
        console.log('👤 參與者加入:', participant.displayName);
      });

      api.addEventListener('audioMuteStatusChanged', ({ muted }) => {
        setIsMuted(muted);
      });

      api.addEventListener('videoMuteStatusChanged', ({ muted }) => {
        setIsVideoOff(muted);
      });

      api.addEventListener('videoConferenceLeft', () => {
        console.log('👋 已離開會議');
        handleMeetingEnd();
      });

      api.addEventListener('readyToClose', () => {
        console.log('📚 會議準備關閉');
        handleMeetingEnd();
      });

    } catch (err) {
      console.error('❌ Jitsi 初始化失敗:', err);
      setError('視訊初始化失敗,請重新開始');
      setIsMeetingActive(false);
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎥 準備開始錄影...');

      const userStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm'
      ];

      let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

      if (!selectedMimeType) {
        throw new Error('瀏覽器不支援錄影功能');
      }

      console.log('✅ 使用 MIME 類型:', selectedMimeType);

      const mediaRecorder = new MediaRecorder(userStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          const sizeMB = (event.data.size / 1024 / 1024).toFixed(2);
          console.log(`📦 收集數據塊 #${recordedChunksRef.current.length}: ${sizeMB} MB`);
        } else {
          console.warn('⚠️ 收到空數據塊');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ 錄影已停止');
        const totalSize = recordedChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        console.log(`📊 總數據量: ${totalSizeMB} MB`);
        console.log(`📊 總數據塊: ${recordedChunksRef.current.length} 個`);
        
        if (recordedChunksRef.current.length > 0) {
          console.log('💾 開始保存錄影...');
          await saveRecording();
        } else {
          console.error('❌ 沒有錄影數據可保存');
          setError('錄影數據為空,請重新嘗試');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder 錯誤:', event.error);
        setError('錄影過程發生錯誤: ' + event.error?.message);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);

      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('✅ 錄影已開始 (狀態:', mediaRecorder.state, ')');

      userStream.getTracks().forEach(track => {
        track.onended = () => {
          console.log(`⚠️ 軌道 ${track.kind} 已結束`);
        };
      });

    } catch (err) {
      console.error('❌ 錄影啟動失敗:', err);
      if (err.name === 'NotAllowedError') {
        setError('請授予攝像頭和麥克風權限');
      } else if (err.name === 'NotFoundError') {
        setError('找不到攝像頭或麥克風');
      } else {
        setError('無法啟動錄影功能: ' + err.message);
      }
    }
  };

  const saveRecording = async () => {
    console.log('💾 saveRecording 被調用');
    console.log('📦 recordedChunks 數量:', recordedChunksRef.current.length);
    
    if (recordedChunksRef.current.length === 0) {
      console.warn('⚠️ 沒有錄影數據');
      setError('沒有錄影數據可保存');
      return;
    }

    try {
      console.log('💾 開始處理錄影文件...');

      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const blobSize = blob.size / 1024 / 1024;

      console.log(`📦 Blob 大小: ${blobSize.toFixed(2)} MB`);

      if (blob.size === 0) {
        console.error('❌ 錄影文件大小為 0');
        setError('錄影文件無效');
        return;
      }

      const formData = new FormData();
      const filename = `consultation_${currentMeeting.appointment_id}_${Date.now()}.webm`;
      formData.append('video', blob, filename);
      formData.append('appointment_id', currentMeeting.appointment_id);
      formData.append('duration', recordingDuration);

      console.log('📤 開始上傳錄影...');
      console.log('📋 FormData 內容:');
      console.log('  - video:', filename, `(${blobSize.toFixed(2)} MB)`);
      console.log('  - appointment_id:', currentMeeting.appointment_id);
      console.log('  - duration:', recordingDuration);

      const response = await fetch('http://localhost:5000/api/meeting/upload-recording', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('📡 伺服器回應狀態:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 錄影上傳成功:', result);
        setError(null);
      } else {
        const error = await response.json();
        console.error('❌ 錄影上傳失敗:', error);
        setError('錄影上傳失敗: ' + (error.message || '未知錯誤'));
      }
    } catch (err) {
      console.error('❌ 錄影保存錯誤:', err);
      setError('錄影保存失敗: ' + err.message);
    }
  };

  const stopRecording = () => {
    console.log('⏹️ stopRecording 被調用');
    
    if (mediaRecorderRef.current) {
      console.log('📊 MediaRecorder 狀態:', mediaRecorderRef.current.state);
      
      if (mediaRecorderRef.current.state === 'recording') {
        console.log('⏹️ 正在停止錄影...');
        
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        mediaRecorderRef.current.stop();
        
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
          console.log(`🛑 停止軌道: ${track.kind}`);
        });
        
        setIsRecording(false);
        console.log('✅ 錄影已停止,等待保存...');
        
      } else {
        console.log(`⚠️ MediaRecorder 狀態不是 recording: ${mediaRecorderRef.current.state}`);
      }
    } else {
      console.log('⚠️ mediaRecorderRef.current 不存在');
    }
  };

  const handleMeetingEnd = async () => {
    if (!currentMeeting) return;

    console.log('📚 處理會議結束...');
    console.log('📊 當前 isRecording 狀態:', isRecording);
    console.log('📦 recordedChunks 數量:', recordedChunksRef.current?.length || 0);

    if (isRecording) {
      console.log('⏹️ 停止錄影中...');
      stopRecording();
      
      console.log('⏳ 等待錄影保存完成 (5秒)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log('ℹ️ 沒有進行中的錄影');
    }

    try {
      console.log('📤 發送會議結束請求...');
      const response = await fetch('http://localhost:5000/api/meeting/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appointment_id: currentMeeting.appointment_id,
          consultation_notes: consultationNotes,
          recording_duration: recordingDuration
        })
      });

      if (response.ok) {
        console.log('✅ 會議記錄已儲存');
      } else {
        const error = await response.json();
        console.error('❌ 會議記錄儲存失敗:', error);
      }
    } catch (err) {
      console.error('❌ 儲存會議記錄失敗:', err);
    }

    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      } catch (err) {
        console.error('清理 Jitsi 實例失敗:', err);
      }
    }

    setIsMeetingActive(false);
    setCurrentMeeting(null);
    setSelectedPatient(null);
    setConsultationNotes('');
    setRecordingDuration(0);

    console.log('✅ 會議已完全結束');
    fetchUpcomingAppointments();
  };

  const endMeeting = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    handleMeetingEnd();
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (isMeetingActive && currentMeeting) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <Stethoscope className="w-6 h-6" />
            <div>
              <h2 className="font-semibold text-lg">視訊看診進行中</h2>
              <p className="text-sm text-emerald-100">
                患者: {currentMeeting.patient_first_name} {currentMeeting.patient_last_name}
                <span className="mx-2">•</span>
                {calculateAge(currentMeeting.patient_dob)}
                <span className="mx-2">•</span>
                {currentMeeting.patient_gender === 'male' ? '男' : '女'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isRecording && (
              <div className="flex items-center space-x-2 bg-red-500/20 px-4 py-2 rounded-lg animate-pulse">
                <Circle className="w-3 h-3 text-red-400 fill-current" />
                <span className="font-mono text-sm font-semibold">{formatDuration(recordingDuration)}</span>
                <span className="text-xs">錄影中</span>
              </div>
            )}

            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-lg"
              >
                <Circle className="w-4 h-4 fill-current" />
                <span className="text-sm font-semibold">開始錄影</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-lg"
              >
                <Circle className="w-4 h-4" />
                <span className="text-sm font-semibold">停止錄影</span>
              </button>
            )}

            <button
              onClick={endMeeting}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="font-semibold">結束看診</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div ref={jitsiContainerRef} className="flex-1 bg-gray-900" />

          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-emerald-600" />
                患者資訊
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">姓名</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPatient?.patient_first_name} {selectedPatient?.patient_last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">年齡 / 性別</p>
                    <p className="font-semibold text-gray-900">
                      {calculateAge(selectedPatient?.patient_dob)} / {selectedPatient?.patient_gender === 'male' ? '男性' : '女性'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">出生日期</p>
                    <p className="font-semibold text-gray-900">{selectedPatient?.patient_dob || '未提供'}</p>
                  </div>
                </div>
              </div>

              {selectedPatient?.symptoms && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-yellow-600" />
                    主訴症狀
                  </h4>
                  <p className="text-gray-700 text-sm">{selectedPatient.symptoms}</p>
                </div>
              )}

              {isRecording ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Circle className="w-4 h-4 text-red-500 animate-pulse fill-current" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900">正在錄影</p>
                      <p className="text-xs text-red-600">時長: {formatDuration(recordingDuration)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ 錄影進行中,請勿關閉頁面
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900">未開始錄影</p>
                      <p className="text-xs text-yellow-600">請點擊上方「開始錄影」按鈕</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-emerald-600" />
                  看診記錄
                </h4>
                <textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="請輸入診斷、處方建議等資訊...&#10;&#10;例如:&#10;- 診斷:上呼吸道感染&#10;- 處方:止咳糖漿、退燒藥&#10;- 建議:多休息、多喝水"
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 結束看診時將自動保存記錄和錄影
                </p>
              </div>
            </div>
          </div>
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

      <DoctorSidebar isOpen={isOpen} setIsOpen={setIsOpen} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar setIsSidebarOpen={setIsOpen} />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">今日看診</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{appointments.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">等待中</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {appointments.filter(a => a.status === '已確認').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">視訊看診</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">
                      {jitsiLoaded ? '已啟用' : '載入中'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">目前沒有待看診患者</h2>
                <p className="text-gray-500 mb-6">當有新預約時,將會顯示在此處</p>
                <button
                  onClick={fetchUpcomingAppointments}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  重新整理
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">待看診患者</h2>
                {appointments.map((appointment, index) => (
                  <div
                    key={appointment.appointment_id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="flex items-center p-6">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-emerald-600 font-bold text-lg">{index + 1}</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {appointment.patient_first_name} {appointment.patient_last_name}
                          </h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                            {appointment.patient_gender === 'male' ? '男' : '女'}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {calculateAge(appointment.patient_dob)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>預約時間: {appointment.appointment_time}</span>
                          </div>
                          {appointment.symptoms && (
                            <div className="flex items-center space-x-1">
                              <FileText className="w-4 h-4" />
                              <span className="truncate max-w-md">{appointment.symptoms}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => startMeeting(appointment)}
                        disabled={isLoading || !jitsiLoaded}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        <Video className="w-5 h-5" />
                        <span className="font-semibold">
                          {jitsiLoaded ? '開始看診' : '載入中...'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Monitor className="w-5 h-5 mr-2 text-emerald-600" />
                視訊看診功能
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Video className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">高清視訊通話</p>
                    <p className="text-sm">支援 HD 畫質,確保清晰的診療體驗</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Monitor className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">螢幕共享</p>
                    <p className="text-sm">可分享檢查報告或醫療資料給患者</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">即時記錄</p>
                    <p className="text-sm">在看診過程中記錄診斷與處方建議</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Circle className="w-3 h-3 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">自動錄影</p>
                    <p className="text-sm">看診過程自動錄影,保護醫病雙方權益</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}