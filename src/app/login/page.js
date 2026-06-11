'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, UserCheck, ArrowLeft, Mail, Lock, Phone,
  Shield, Building2, ChevronDown, Clock, CheckCircle, X, AlertCircle
} from 'lucide-react';

/* ─────────────────────────── helpers ─────────────────────────── */
const CHRONIC_OPTIONS = [
  '高血壓', '糖尿病', '心臟病', '高血脂', '氣喘', '慢性腎病', '甲狀腺疾病', '其他',
];

/* ─────────────────────────── Toast 元件 ─────────────────────────── */
function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium pointer-events-auto
            animate-[slideDown_0.3s_ease]
            ${t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          <span className="mt-0.5 shrink-0">
            {t.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          </span>
          <span className="flex-1 whitespace-pre-line leading-relaxed">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── useToast hook ─────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

/* ─────────────────────────── sub-components ─────────────────────────── */
function FieldWrapper({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={17} />}
      <input
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm placeholder:text-gray-400`}
        {...props}
      />
    </div>
  );
}

function SelectInput({ children, ...props }) {
  return (
    <div className="relative">
      <select
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm appearance-none"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
    </div>
  );
}

function RoleBadge({ color, label }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>
      {label}
    </span>
  );
}

/* ─────────────────────────── schedule card ─────────────────────────── */
function ScheduleCard({ schedule, selected, onSelect }) {
  const slots = { morning: '上午診', afternoon: '下午診', evening: '夜診' };
  return (
    <button
      type="button"
      disabled={!schedule.is_available}
      onClick={() => onSelect(schedule.schedule_id)}
      className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm
        ${!schedule.is_available ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' :
          selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className={selected ? 'text-blue-600' : 'text-gray-400'} />
          <span className={`font-medium ${selected ? 'text-blue-700' : 'text-gray-700'}`}>
            {schedule.schedule_date}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${selected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
            {slots[schedule.time_slot] || schedule.time_slot}
          </span>
        </div>
        {schedule.is_available ? (
          selected
            ? <CheckCircle size={16} className="text-blue-500" />
            : <span className="text-xs text-green-600 font-medium">可預約</span>
        ) : (
          <span className="text-xs text-gray-400">已額滿</span>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1 pl-5">
        醫師 ID：{schedule.doctor_id}
      </div>
    </button>
  );
}

/* ─────────────────────────── main component ─────────────────────────── */
export default function TelemedicineAuth() {
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToast();

  // step: 'role' | 'auth' | 'guest-form' | 'verify'
  const [currentStep, setCurrentStep] = useState('role');
  const [selectedRole, setSelectedRole] = useState(''); // 'patient' | 'guest' | 'mech'
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ── login fields ── */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // 所有角色統一用 password 欄位

  /* ── guest registration fields ── */
  const [guestForm, setGuestForm] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    email: '',
    phone: '',
    id_number: '',
    smoking_status: 'no',
    drug_allergies: '',
    medical_history: '',
    chronic_disease: [],
    other_chronic_disease: '',
    height: '',
    weight: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  /* ── schedules ── */
  // schedules 已移至 reserve 頁面處理

  /* ── verify ── */
  const [verificationCode, setVerificationCode] = useState('');

  /* ─── theme ─── */
  const theme = {
    patient: { badge: 'bg-blue-100 text-blue-700', btn: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700', color: 'blue', label: '複診病患' },
    guest: { badge: 'bg-green-100 text-green-700', btn: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700', color: 'green', label: '初診病患' },
    mech: { badge: 'bg-purple-100 text-purple-700', btn: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700', color: 'purple', label: '機構' },
  }[selectedRole] || { btn: 'from-blue-500 to-blue-600', label: '' };

  /* ─── navigation ─── */
  const transition = (fn, delay = 400) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => { fn(); setIsAnimating(false); }, delay);
  };

  const handleRoleSelect = (role) => transition(() => {
    setSelectedRole(role);
    setCurrentStep(role === 'guest' ? 'guest-form' : 'auth');
  });

  const handleBack = () => transition(() => {
    if (currentStep === 'verify') { setCurrentStep('guest-form'); setVerificationCode(''); }
    else if (currentStep === 'guest-form' || currentStep === 'auth') { setCurrentStep('role'); setSelectedRole(''); }
    else { setCurrentStep('role'); }
  });

  /* ─── guest form helpers ─── */
  const setGuest = (field, value) => setGuestForm(f => ({ ...f, [field]: value }));

  const toggleChronic = (option) => {
    setGuestForm(f => ({
      ...f,
      chronic_disease: f.chronic_disease.includes(option)
        ? f.chronic_disease.filter(x => x !== option)
        : [...f.chronic_disease, option],
    }));
  };

  /* ─── submit handlers ─── */

  // 複診病患 login: email + password（預設為身份證字號，可自行修改）
  const handlePatientLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { showToast('請輸入電子信箱與密碼', 'error'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, role: 'patient' }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { showToast(data.message || '登入失敗，請確認帳號或密碼', 'error'); return; }
      const { user } = data;
      if (user) {
        localStorage.setItem('user_id', user.user_id);
        localStorage.setItem('user_type', user.role);
        localStorage.setItem('email', user.email);
        localStorage.setItem('account_status', user.account_status || 'active');
      }
      router.push('/PatientPage');
    } catch (err) {
      console.error(err);
      showToast('登入失敗，請稍後再試', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 機構 / 醫師 login: email + password_hash (users table)
  const handleMechLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { showToast('請輸入電子信箱與密碼', 'error'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { showToast(data.message || '登入失敗，請確認帳號或密碼', 'error'); return; }
      const { user } = data;
      if (user) {
        localStorage.setItem('user_id', user.user_id);
        localStorage.setItem('user_type', user.role);
        localStorage.setItem('email', user.email);
      }
      if (user?.role === 'doctor') {
        router.push('/doctorpage');
      } else if (user?.role === 'mech') {
        router.push('/mechpage');
      } else {
        showToast(`不支援的角色：${user?.role}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('登入失敗，請稍後再試', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 初診病患：只建立帳號與病患資料，預約到 reserve 頁面進行
  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestForm.first_name || !guestForm.last_name) { showToast('請填寫姓名', 'error'); return; }
    if (!guestForm.id_number) { showToast('請填寫身份證字號', 'error'); return; }
    if (!guestForm.email) { showToast('請填寫電子信箱（作為登入帳號）', 'error'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/register/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('account_status', 'unverified');
        localStorage.setItem('user_id', data.user_id);
        showToast(
          `帳號建立成功！\n登入帳號：${guestForm.email}\n初始密碼：您的身份證字號`,
          'success',
          5000
        );
        setTimeout(() => router.push('/reserve'), 2000);
      } else {
        showToast(data.message || '建立失敗，請稍後再試', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('發生錯誤，請稍後再試', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const animClass = `transition-all duration-400 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`;

  /* ─── render ─── */
  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">醫隨行 · MOG</h1>
          <p className="text-sm text-gray-500 mt-1">遠距醫療整合平台</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 transition-all duration-500 ${isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`} />

          <div className="relative z-10">

            {/* Back button */}
            {currentStep !== 'role' && (
              <button
                onClick={() => currentStep === 'role' ? router.push('/') : handleBack()}
                className="absolute -left-2 -top-1 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {/* ════════════ ROLE SELECTION ════════════ */}
            {currentStep === 'role' && (
              <div className={animClass}>
                <h2 className="text-xl font-bold text-center text-gray-800 mb-6">請選擇您的身份</h2>
                <div className="space-y-3">

                  <button onClick={() => handleRoleSelect('patient')}
                    className="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors shrink-0">
                        <UserCheck className="text-blue-600" size={22} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">複診病患</p>
                        <p className="text-gray-500 text-xs">曾在本院就診，使用帳號登入</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => handleRoleSelect('guest')}
                    className="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors shrink-0">
                        <User className="text-green-600" size={22} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">初診病患</p>
                        <p className="text-gray-500 text-xs">首次就診，免帳號直接預約</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => handleRoleSelect('mech')}
                    className="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors shrink-0">
                        <Building2 className="text-purple-600" size={22} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">機構 / 醫師</p>
                        <p className="text-gray-500 text-xs">使用電子信箱與密碼登入</p>
                      </div>
                    </div>
                  </button>

                </div>
              </div>
            )}

            {/* ════════════ PATIENT LOGIN ════════════ */}
            {currentStep === 'auth' && selectedRole === 'patient' && (
              <div className={animClass}>
                <div className="text-center mb-5">
                  <RoleBadge color="blue" label="複診病患登入" />
                  <p className="text-xs text-gray-500 mt-2">使用電子信箱及身份證字號登入</p>
                </div>

                <form onSubmit={handlePatientLogin} className="space-y-4">
                  <FieldWrapper label="電子信箱">
                    <TextInput icon={Mail} type="email" placeholder="registered@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </FieldWrapper>

                  <FieldWrapper label="密碼">
                    <TextInput icon={Lock} type="password" placeholder="初次登入請以身份證字號作為密碼"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                  </FieldWrapper>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-1.5 text-gray-600">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      記住我
                    </label>
                    <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">
                      忘記密碼？
                    </button>
                  </div>

                  <button type="submit" disabled={isLoading}
                    className={`w-full py-3 rounded-lg text-white font-medium text-sm transition-all bg-gradient-to-r ${theme.btn} disabled:opacity-60`}>
                    {isLoading ? '登入中...' : '立即登入'}
                  </button>
                </form>
              </div>
            )}

            {/* ════════════ MECH LOGIN ════════════ */}
            {currentStep === 'auth' && selectedRole === 'mech' && (
              <div className={animClass}>
                <div className="text-center mb-5">
                  <RoleBadge color="purple" label="機構 / 醫師登入" />
                  <p className="text-xs text-gray-500 mt-2">使用電子信箱及密碼登入</p>
                </div>

                <form onSubmit={handleMechLogin} className="space-y-4">
                  <FieldWrapper label="電子信箱">
                    <TextInput icon={Mail} type="email" placeholder="institution@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </FieldWrapper>

                  <FieldWrapper label="密碼">
                    <TextInput icon={Lock} type="password" placeholder="請輸入密碼"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                  </FieldWrapper>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-1.5 text-gray-600">
                      <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      記住我
                    </label>
                    <button type="button" className="text-purple-600 hover:text-purple-700 font-medium">
                      忘記密碼？
                    </button>
                  </div>

                  <button type="submit" disabled={isLoading}
                    className={`w-full py-3 rounded-lg text-white font-medium text-sm transition-all bg-gradient-to-r ${theme.btn} disabled:opacity-60`}>
                    {isLoading ? '登入中...' : '機構登入'}
                  </button>
                </form>
              </div>
            )}

            {/* ════════════ GUEST FORM ════════════ */}
            {currentStep === 'guest-form' && (
              <div className={animClass}>
                <div className="text-center mb-4">
                  <RoleBadge color="green" label="初診預約" />
                  <p className="text-xs text-gray-500 mt-1.5">免帳號，填寫基本資料後即可預約</p>
                </div>

                <form onSubmit={handleGuestSubmit} className="space-y-4">

                  {/* ── 基本資料 ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <FieldWrapper label="姓氏">
                      <TextInput type="text" placeholder="陳" value={guestForm.first_name}
                        onChange={e => setGuest('first_name', e.target.value)} required />
                    </FieldWrapper>
                    <FieldWrapper label="名字">
                      <TextInput type="text" placeholder="小明" value={guestForm.last_name}
                        onChange={e => setGuest('last_name', e.target.value)} required />
                    </FieldWrapper>
                  </div>

                  <FieldWrapper label="生理性別">
                    <SelectInput value={guestForm.gender} onChange={e => setGuest('gender', e.target.value)} required>
                      <option value="">請選擇</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                    </SelectInput>
                  </FieldWrapper>

                  <FieldWrapper label="電子信箱（作為登入帳號）">
                    <TextInput icon={Mail} type="email" placeholder="your@email.com"
                      value={guestForm.email} onChange={e => setGuest('email', e.target.value)} required />
                  </FieldWrapper>

                  <FieldWrapper label="手機號碼">
                    <TextInput icon={Phone} type="tel" placeholder="09xxxxxxxx"
                      value={guestForm.phone} onChange={e => setGuest('phone', e.target.value)} />
                  </FieldWrapper>

                  <FieldWrapper label="身份證字號">
                    <TextInput icon={Shield} type="text" placeholder="A123456789"
                      value={guestForm.id_number} onChange={e => setGuest('id_number', e.target.value.toUpperCase())}
                      maxLength={10} required />
                  </FieldWrapper>

                  {/* ── 健康資訊 ── */}
                  <div className="border-t pt-3 mt-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">健康資訊</p>

                    <div className="space-y-3">
                      <FieldWrapper label="吸菸狀況">
                        <SelectInput value={guestForm.smoking_status} onChange={e => setGuest('smoking_status', e.target.value)}>
                          <option value="no">不吸菸</option>
                          <option value="quit">曾吸菸（已戒）</option>
                          <option value="yes">目前吸菸</option>
                        </SelectInput>
                      </FieldWrapper>

                      <FieldWrapper label="藥物過敏">
                        <TextInput type="text" placeholder="如無請填「無」"
                          value={guestForm.drug_allergies} onChange={e => setGuest('drug_allergies', e.target.value)} />
                      </FieldWrapper>

                      <FieldWrapper label="病史">
                        <textarea
                          value={guestForm.medical_history}
                          onChange={e => setGuest('medical_history', e.target.value)}
                          rows={2}
                          placeholder="請簡述過去病史（如無請填「無」）"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm placeholder:text-gray-400 resize-none"
                        />
                      </FieldWrapper>

                      <FieldWrapper label="慢性病（可複選）">
                        <div className="flex flex-wrap gap-2">
                          {CHRONIC_OPTIONS.map(opt => (
                            <button
                              key={opt} type="button"
                              onClick={() => toggleChronic(opt)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                                ${guestForm.chronic_disease.includes(opt)
                                  ? 'bg-green-500 text-white border-green-500'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {guestForm.chronic_disease.includes('其他') && (
                          <TextInput type="text" placeholder="請說明其他慢性病"
                            value={guestForm.other_chronic_disease}
                            onChange={e => setGuest('other_chronic_disease', e.target.value)}
                          />
                        )}
                      </FieldWrapper>

                      <div className="grid grid-cols-2 gap-3">
                        <FieldWrapper label="身高 (cm)">
                          <TextInput type="number" placeholder="170"
                            value={guestForm.height} onChange={e => setGuest('height', e.target.value)} min="50" max="250" />
                        </FieldWrapper>
                        <FieldWrapper label="體重 (kg)">
                          <TextInput type="number" placeholder="65"
                            value={guestForm.weight} onChange={e => setGuest('weight', e.target.value)} min="10" max="300" />
                        </FieldWrapper>
                      </div>
                    </div>
                  </div>

                  {/* ── 緊急聯絡人 ── */}
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">緊急聯絡人</p>
                    <div className="space-y-3">
                      <FieldWrapper label="姓名">
                        <TextInput icon={User} type="text" placeholder="緊急聯絡人姓名"
                          value={guestForm.emergency_contact_name}
                          onChange={e => setGuest('emergency_contact_name', e.target.value)} />
                      </FieldWrapper>
                      <FieldWrapper label="電話">
                        <TextInput icon={Phone} type="tel" placeholder="09xxxxxxxx"
                          value={guestForm.emergency_contact_phone}
                          onChange={e => setGuest('emergency_contact_phone', e.target.value)} />
                      </FieldWrapper>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                    完成後將建立您的帳號，並導向預約頁面進行實體診預約。
                  </div>

                  <button type="submit" disabled={isLoading}
                    className={`w-full py-3 rounded-lg text-white font-medium text-sm transition-all bg-gradient-to-r ${theme.btn} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {isLoading ? '建立中...' : '建立帳號並前往預約'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        <div className="text-center mt-6 text-xs text-gray-400">
          © 醫隨行 MOG · 保障您的健康與隱私
        </div>
      </div>
    </div>
    </>
  );
}