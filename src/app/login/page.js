'use client';
import React, { use, useState } from 'react';
import { User, UserCheck, ArrowLeft, Mail, Lock, Phone, Calendar, MapPin, House, VenusAndMars } from 'lucide-react';

export default function TelemedicineAuth() {
  const [currentStep, setCurrentStep] = useState('role'); // 'role', 'auth', 'register'
  const [selectedRole, setSelectedRole] = useState(''); // 'patient', 'doctor'
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
  const [isAnimating, setIsAnimating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState(''); // 只有病患需要
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState(''); // 新增性別狀態
  const [specialty, setSpecialty] = useState(''); // 只有醫生需要
  const [clinic, setClinic] = useState(''); // 只有醫生需要
  const [address, setAddress] = useState(''); // 住家地址

  const handleSubmit = async (e) => {
    e.preventDefault(); // 防止表單提交後頁面刷新

    // 組成要送給後端的資料
    const bodyData = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      phone_number: phone,
      date_of_birth: birthDate,
      role: selectedRole,
      gender,
      specialty: selectedRole === 'doctor' ? specialty : null,
      practice_hospital: selectedRole === 'doctor' ? clinic : null,
      address
    };

    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      alert(data.message);

      if (res.ok) {
        switchToLogin(); // 註冊成功後回到登入頁
      }
    } catch (err) {
      console.error(err);
      alert("發生錯誤，請稍後再試。");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // 登入成功 → 導回首頁
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      alert("登入失敗，請稍後再試。");
    }
  };

  const handleRoleSelect = (role) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedRole(role);

    setTimeout(() => {
      setCurrentStep('auth');
      setIsAnimating(false);
    }, 500);
  };

  const handleBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      if (currentStep === 'register') {
        setCurrentStep('auth');
        setAuthMode('login');
      } else {
        setCurrentStep('role');
        setSelectedRole('');
      }
      setIsAnimating(false);
    }, 300);
  };

  const switchToRegister = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentStep('register');
      setIsAnimating(false);
    }, 300);
  };

  const switchToLogin = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentStep('auth');
      setAuthMode('login');
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">遠距醫療平台</h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">

          {/* Background Animation */}
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 transition-all duration-500 ${isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}></div>

          <div className="relative z-10">

            {/* Back Button */}
            {currentStep !== 'role' && (
              <button
                onClick={handleBack}
                className="absolute  -left-5 p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-200 active:bg-gray-300flex items-center justify-center"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            {/* Role Selection */}
            {currentStep === 'role' && (
              <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">請選擇您的身份</h2>

                <div className="space-y-4">
                  <button
                    onClick={() => handleRoleSelect('patient')}
                    className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group transform hover:scale-105"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <User className="text-blue-600" size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-800">我是病患</h3>
                        <p className="text-gray-600 text-sm">尋求專業醫療諮詢與服務</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelect('doctor')}
                    className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 group transform hover:scale-105"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <UserCheck className="text-green-600" size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-800">我是醫生</h3>
                        <p className="text-gray-600 text-sm">提供專業醫療服務與諮詢</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Login Form */}
            {currentStep === 'auth' && authMode === 'login' && (
              <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${selectedRole === 'patient' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {selectedRole === 'patient' ? <User size={16} /> : <UserCheck size={16} />}
                    <span>{selectedRole === 'patient' ? '病患登入' : '醫生登入'}</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">電子信箱</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                        placeholder="請輸入您的電子信箱"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                        placeholder="請輸入您的密碼"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-600">記住我</span>
                    </label>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
                      忘記密碼？
                    </button>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all transform hover:scale-105 ${selectedRole === 'patient'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      }`}
                  >
                    立即登入
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <span className="text-gray-600">還沒有帳號？ </span>
                  <button
                    onClick={switchToRegister}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    立即註冊
                  </button>
                </div>
              </div>
            )}

            {/* Register Form */}
            {currentStep === 'register' && (
              <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${selectedRole === 'patient' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {selectedRole === 'patient' ? <User size={16} /> : <UserCheck size={16} />}
                    <span>{selectedRole === 'patient' ? '病患註冊' : '醫生註冊'}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 ">姓氏</label>
                      <input
                        value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                        placeholder="姓氏"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">名字</label>
                      <input
                        value={lastName} onChange={(e) => setLastName(e.target.value)}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                        placeholder="名字"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">生理性別</label>

                    <select value={gender} onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black">
                      <option value="">請選擇</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                    </select>

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ">電子信箱</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                        placeholder="請輸入電子信箱"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">手機號碼</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        value={phone} onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                        placeholder="請輸入手機號碼"
                      />
                    </div>
                  </div>
                  {selectedRole === 'patient' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">出生日期</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                            type="date"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">住家地址</label>
                        <div className="relative">
                          <House className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            value={address} onChange={(e) => setAddress(e.target.value)}
                            type="text"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                            placeholder="請輸入住家地址"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedRole === 'doctor' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">執業科別</label>
                        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black">
                          <option value="">請選擇科別</option>
                          <option value="internal">內科</option>
                          <option value="surgery">外科</option>
                          <option value="pediatrics">小兒科</option>
                          <option value="gynecology">婦產科</option>
                          <option value="psychiatry">精神科</option>
                          <option value="dermatology">皮膚科</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">執業地點</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            value={clinic} onChange={(e) => setClinic(e.target.value)}
                            type="text"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                            placeholder="請輸入執業醫院或診所"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                        placeholder="請設定密碼"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">確認密碼</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        type="password"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                        placeholder="請再次輸入密碼"
                      />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">密碼與確認密碼不一致</p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">
                      我同意 <button type="button" className="text-blue-600 hover:text-blue-700">服務條款</button> 和
                      <button type="button" className="text-blue-600 hover:text-blue-700"> 隱私政策</button>
                    </span>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all transform hover:scale-105 ${selectedRole === 'patient'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      }`}
                  >
                    完成註冊
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <span className="text-gray-600">已經有帳號？ </span>
                  <button
                    onClick={switchToLogin}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    立即登入
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 遠距醫療平台. 保障您的健康與隱私</p>
        </div>
      </div>
    </div>
  );
}