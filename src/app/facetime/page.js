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
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  // 診間內側邊資訊面板（手機用）
  const [showPatientPanel, setShowPatientPanel] = useState(false);

  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const currentMeetingRef = useRef(null); // 避免 async callback stale closure

  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", { credentials: 'include' });
        const data = await res.json();
        if (data.authenticated && data.user && data.user.role === 'doctor') {
          setApprovalStatus(data.user.approval_status);
          setDoctorInfo(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch approval status:", error);
      }
    }
    fetchApprovalStatus();
  }, []);

  // 載入 Jitsi API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.JitsiMeetExternalAPI) { setJitsiLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => setJitsiLoaded(true);
    script.onerror = () => setError('無法載入視訊服務,請重新整理頁面');
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  useEffect(() => {
    fetchUpcomingAppointments();
    const interval = setInterval(fetchUpcomingAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await fetch('/api/appointments/upcoming', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        setError('無法獲取預約資訊');
      }
    } catch (err) {
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
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
      const response = await fetch('/api/meeting/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointment_id: appointment.appointment_id })
      });
      if (!response.ok) throw new Error('無法創建會議室');
      const data = await response.json();
      const meetingData = { ...appointment, meeting_room_id: data.meeting_room_id };
      setCurrentMeeting(meetingData);
      currentMeetingRef.current = meetingData;
      setIsMeetingActive(true);
      setTimeout(() => { initJitsi(data.meeting_room_id, appointment); }, 100);
    } catch (err) {
      setError('無法開始會議,請稍後再試');
      setIsMeetingActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const initJitsi = (roomId, appointment) => {
    if (!jitsiContainerRef.current || typeof window === 'undefined' || !window.JitsiMeetExternalAPI) {
      setError('視訊服務初始化失敗');
      return;
    }
    try {
      if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null; }
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
          constraints: { video: { height: { ideal: 720, max: 1080, min: 360 } } }
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'settings', 'hangup'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#0f172a',
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          MOBILE_APP_PROMO: false
        },
        userInfo: { displayName: doctorInfo ? `${doctorInfo.first_name} ${doctorInfo.last_name}` : '醫師' }
      };
      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;
      api.addEventListener('videoConferenceJoined', () => { console.log('✅ 已加入會議'); });
      api.addEventListener('audioMuteStatusChanged', ({ muted }) => setIsMuted(muted));
      api.addEventListener('videoMuteStatusChanged', ({ muted }) => setIsVideoOff(muted));
      api.addEventListener('videoConferenceLeft', () => handleMeetingEnd());
      api.addEventListener('readyToClose', () => handleMeetingEnd());
    } catch (err) {
      setError('視訊初始化失敗,請重新開始');
      setIsMeetingActive(false);
    }
  };

  const startRecording = async () => {
    try {
      // 嘗試直接抓取 Jitsi iframe 內的 video 元素串流
      let stream = null;

      // 方法1: 從 Jitsi iframe 內抓取所有 video 串流並合併
      const iframe = jitsiContainerRef.current?.querySelector('iframe');
      if (iframe) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          const videos = iframeDoc?.querySelectorAll('video');
          const videoStreams = [];
          videos?.forEach(video => {
            if (video.srcObject instanceof MediaStream) {
              videoStreams.push(video.srcObject);
            }
          });

          if (videoStreams.length > 0) {
            // 合併所有視訊/音訊軌道
            const allTracks = videoStreams.flatMap(s => s.getTracks());
            stream = new MediaStream(allTracks);
          }
        } catch (e) {
          console.warn('無法直接存取 iframe 內容（跨域限制），改用螢幕錄製');
        }
      }

      // 方法2: 若無法直接抓 iframe，改用 captureStream 錄製 canvas 或退回 getUserMedia
      if (!stream) {
        // 嘗試抓取自己的鏡頭+麥克風（至少錄到醫師端）
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 }
        });
      }

      const mimeTypes = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm;codecs=h264,opus','video/webm'];
      let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!selectedMimeType) throw new Error('瀏覽器不支援錄影功能');

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType, videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.ondataavailable = (event) => { if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => { if (recordedChunksRef.current.length > 0) await saveRecording(); else setError('錄影數據為空,請重新嘗試'); };
      mediaRecorder.onerror = (event) => setError('錄影過程發生錯誤: ' + event.error?.message);
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
      stream.getTracks().forEach(track => { track.onended = () => stopRecording(); });
    } catch (err) {
      if (err.name === 'NotAllowedError') setError('請授予攝像頭和麥克風權限');
      else if (err.name === 'NotFoundError') setError('找不到攝像頭或麥克風');
      else setError('無法啟動錄影功能: ' + err.message);
    }
  };

  const saveRecording = async () => {
    if (recordedChunksRef.current.length === 0) { setError('沒有錄影數據可保存'); return; }
    const meeting = currentMeetingRef.current;
    if (!meeting || !meeting.appointment_id) { setError('無法取得預約資訊，錄影儲存失敗'); return; }
    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      if (blob.size === 0) { setError('錄影文件無效'); return; }
      const formData = new FormData();
      const filename = `consultation_${meeting.appointment_id}_${Date.now()}.webm`;
      formData.append('video', blob, filename);
      formData.append('appointment_id', meeting.appointment_id);
      formData.append('duration', recordingDuration);
      const response = await fetch('/api/meeting/upload-recording', { method: 'POST', credentials: 'include', body: formData });
      if (!response.ok) { const error = await response.json(); setError('錄影上傳失敗: ' + (error.message || '未知錯誤')); }
    } catch (err) {
      setError('錄影保存失敗: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleMeetingEnd = async () => {
    const meeting = currentMeetingRef.current;
    if (!meeting) return;
    if (isRecording) { stopRecording(); await new Promise(resolve => setTimeout(resolve, 5000)); }
    try {
      await fetch('/api/meeting/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointment_id: meeting.appointment_id, consultation_notes: consultationNotes, recording_duration: recordingDuration })
      });
    } catch (err) { console.error('儲存會議記錄失敗:', err); }
    if (jitsiApiRef.current) { try { jitsiApiRef.current.dispose(); jitsiApiRef.current = null; } catch (err) {} }
    setIsMeetingActive(false);
    setCurrentMeeting(null);
    currentMeetingRef.current = null;
    setSelectedPatient(null);
    setConsultationNotes('');
    setRecordingDuration(0);
    fetchUpcomingAppointments();
  };

  const endMeeting = () => {
    if (jitsiApiRef.current) jitsiApiRef.current.executeCommand('hangup');
    handleMeetingEnd();
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 載入中畫面
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

  // ── 診間畫面 ──────────────────────────────────────────────
  if (isMeetingActive && currentMeeting) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">

        {/* 頂部工具列 */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-2">
          {/* 左：患者資訊 */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Stethoscope className="w-5 h-5 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="font-semibold text-sm sm:text-lg leading-tight">視訊看診進行中</h2>
              <p className="text-xs text-emerald-100 truncate">
                {currentMeeting.patient_first_name} {currentMeeting.patient_last_name}
                <span className="mx-1">·</span>{calculateAge(currentMeeting.patient_dob)}
                <span className="mx-1">·</span>{currentMeeting.patient_gender === 'male' ? '男' : '女'}
              </p>
            </div>
          </div>

          {/* 右：操作按鈕 */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* 錄影狀態（手機上縮小） */}
            {isRecording && (
              <div className="flex items-center gap-1 bg-red-500/20 px-2 sm:px-4 py-1.5 rounded-lg animate-pulse">
                <Circle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 fill-current" />
                <span className="font-mono text-xs font-semibold hidden sm:inline">{formatDuration(recordingDuration)}</span>
                <span className="text-xs hidden sm:inline">錄影中</span>
              </div>
            )}

            {/* 錄影按鈕 */}
            {!isRecording ? (
              <button onClick={startRecording} className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 transition-all shadow-lg text-xs sm:text-sm">
                <Circle className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline font-semibold">開始錄影</span>
              </button>
            ) : (
              <button onClick={stopRecording} className="bg-gray-500 hover:bg-gray-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 transition-all shadow-lg text-xs sm:text-sm">
                <Circle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-semibold">停止錄影</span>
              </button>
            )}

            {/* 手機：顯示/隱藏患者資訊面板 */}
            <button
              onClick={() => setShowPatientPanel(!showPatientPanel)}
              className="lg:hidden bg-white/20 hover:bg-white/30 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 text-xs transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>資訊</span>
            </button>

            {/* 結束看診 */}
            <button onClick={endMeeting} className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition-all shadow-lg text-xs sm:text-sm">
              <PhoneOff className="w-4 h-4" />
              <span className="font-semibold hidden sm:inline">結束看診</span>
              <span className="font-semibold sm:hidden">結束</span>
            </button>
          </div>
        </div>

        {/* 主體：視訊 + 側邊資訊 */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Jitsi 視訊區 */}
          <div ref={jitsiContainerRef} className="flex-1 bg-gray-900 min-w-0" />

          {/* 患者資訊側邊欄：桌機固定顯示，手機用遮罩 */}
          {/* 手機遮罩背景 */}
          {showPatientPanel && (
            <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setShowPatientPanel(false)} />
          )}

          <div className={`
            bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0
            lg:relative lg:w-96 lg:block
            fixed right-0 top-0 h-full w-80 z-30 transition-transform duration-300
            ${showPatientPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            <div className="p-4 sm:p-6">
              {/* 手機關閉按鈕 */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="text-lg font-bold text-gray-900">患者資訊</h3>
                <button onClick={() => setShowPatientPanel(false)} className="text-gray-500 hover:text-gray-700 p-1">✕</button>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-6 hidden lg:flex items-center">
                <User className="w-5 h-5 mr-2 text-emerald-600" />
                患者資訊
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">姓名</p>
                    <p className="font-semibold text-gray-900">{selectedPatient?.patient_first_name} {selectedPatient?.patient_last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">年齡 / 性別</p>
                    <p className="font-semibold text-gray-900">{calculateAge(selectedPatient?.patient_dob)} / {selectedPatient?.patient_gender === 'male' ? '男性' : '女性'}</p>
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
                    <FileText className="w-4 h-4 mr-2 text-yellow-600" />主訴症狀
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
                  <p className="text-xs text-red-600 mt-2">⚠️ 錄影進行中,請勿關閉頁面</p>
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
                  <FileText className="w-4 h-4 mr-2 text-emerald-600" />看診記錄
                </h4>
                <textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="請輸入診斷、處方建議等資訊..."
                  className="text-gray-700 w-full h-48 sm:h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">💡 結束看診時將自動保存記錄和錄影</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 候診清單畫面 ──────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* 漢堡選單按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
          aria-label="開啟選單"
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

      {/* 主內容：手機 overlay sidebar 不推移，桌機推移 */}
      <div className={`transition-all duration-300 ${
          isOpen ? "md:ml-64" : "ml-0"
        }`}>
        <Navbar setIsSidebarOpen={setIsOpen} />

        {/* bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 */}
        <div className="min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

            {/* 錯誤提示 */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-red-800 font-medium">發生錯誤</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 flex-shrink-0">✕</button>
              </div>
            )}

            {/* 視訊服務載入中提示 */}
            {!jitsiLoaded && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-800 font-medium">視訊服務載入中...</p>
                  <p className="text-yellow-600 text-sm mt-1">請稍候,視訊功能準備中</p>
                </div>
              </div>
            )}

            {/* 統計卡片：手機 1 欄，sm 以上 2 欄 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">今日看診</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{appointments.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">視訊看診</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{jitsiLoaded ? '已啟用' : '載入中'}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* 候診清單 */}
            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">目前沒有待看診患者</h2>
                <p className="text-gray-500 mb-6 text-sm sm:text-base">當有新預約時,將會顯示在此處</p>
                <button
                  onClick={fetchUpcomingAppointments}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  重新整理
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">待看診患者</h2>
                {appointments.map((appointment, index) => (
                  <div key={appointment.appointment_id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    {/* 手機：垂直排列；桌機：水平排列 */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* 序號 + 患者資訊 */}
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 font-bold">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-base sm:text-xl font-bold text-gray-900">
                              {appointment.patient_first_name} {appointment.patient_last_name}
                            </h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {appointment.patient_gender === 'male' ? '男' : '女'}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {calculateAge(appointment.patient_dob)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>{appointment.appointment_time}</span>
                            </div>
                            {appointment.symptoms && (
                              <div className="flex items-center gap-1 min-w-0">
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate max-w-xs">{appointment.symptoms}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 開始看診按鈕：手機全寬 */}
                      <button
                        onClick={() => startMeeting(appointment)}
                        disabled={isLoading || !jitsiLoaded}
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        <Video className="w-5 h-5" />
                        <span className="font-semibold">{jitsiLoaded ? '開始看診' : '載入中...'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 功能說明卡片 */}
            <div className="mt-6 sm:mt-8 bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Monitor className="w-5 h-5 mr-2 text-emerald-600" />視訊看診功能
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600">
                {[
                  { icon: Video, bg: 'bg-emerald-100', color: 'text-emerald-600', title: '高清視訊通話', desc: '支援 HD 畫質,確保清晰的診療體驗' },
                  { icon: Monitor, bg: 'bg-emerald-100', color: 'text-emerald-600', title: '螢幕共享', desc: '可分享檢查報告或醫療資料給患者' },
                  { icon: FileText, bg: 'bg-emerald-100', color: 'text-emerald-600', title: '即時記錄', desc: '在看診過程中記錄診斷與處方建議' },
                  { icon: Circle, bg: 'bg-red-100', color: 'text-red-600', title: '自動錄影', desc: '看診過程自動錄影,保護醫病雙方權益' },
                ].map(({ icon: Icon, bg, color, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className={`w-6 h-6 ${bg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-3 h-3 ${color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{title}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm sm:text-base">© 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。</p>
        </div>
      </div>
    </div>
  );
}