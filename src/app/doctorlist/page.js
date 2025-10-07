"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu, Calendar, Clock, Filter, CheckCircle } from "lucide-react";


// 假資料
const mockDoctors = [
  { doctor_id: 1, name: "張心怡", specialty: "心臟科", experience_years: 10, introduction: "專業心臟科醫師" },
  { doctor_id: 2, name: "林怡君", specialty: "皮膚科", experience_years: 8, introduction: "皮膚科專家" },
  { doctor_id: 3, name: "李志明", specialty: "骨科", experience_years: 12, introduction: "骨科醫師" }
];


// 預約模態視窗
function BookingModal({ doctor, onClose, onConfirm }) {
  const [selectedDate, setSelectedDate] = useState("2025-10-05");
  const [selectedTime, setSelectedTime] = useState("09:00");


  const weekDates = [
    { day: "週日", date: 5, fullDate: "2025-10-05" },
    { day: "週一", date: 6, fullDate: "2025-10-06" },
    { day: "週二", date: 7, fullDate: "2025-10-07" },
    { day: "週三", date: 8, fullDate: "2025-10-08" },
    { day: "週四", date: 9, fullDate: "2025-10-09" },
    { day: "週五", date: 10, fullDate: "2025-10-10" },
    { day: "週六", date: 11, fullDate: "2025-10-11" }
  ];


  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30",
    "17:00"
  ];


  const getDayName = (fullDate) => {
    const dateObj = weekDates.find(d => d.fullDate === fullDate);
    return dateObj ? dateObj.day : "";
  };


  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto">
        <div className="p-6">
          {/* 醫師資訊和關閉按鈕 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                {doctor.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-base">{doctor.name}</h3>
                <p className="text-sm text-gray-500">{doctor.specialty}</p>
              </div>
            </div>
          </div>


          {/* 選擇日期 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-gray-700 mb-3">選擇日期</h4>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((item) => (
                <button
                  key={item.fullDate}
                  onClick={() => setSelectedDate(item.fullDate)}
                  className={`py-2 px-1 rounded-lg text-center transition ${
                    selectedDate === item.fullDate
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  <div className="text-xs mb-1">{item.day}</div>
                  <div className="text-base font-medium">{item.date}</div>
                </button>
              ))}
            </div>
          </div>


          {/* 選擇時段 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-gray-700 mb-3">選擇時段</h4>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition ${
                    selectedTime === time
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>


          {/* 預約資訊確認 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">預約資訊確認</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p>醫師：{doctor.name} ({doctor.specialty})</p>
              <p>日期：{selectedDate.split('-')[1]}月{selectedDate.split('-')[2]}日 {getDayName(selectedDate)}</p>
              <p>時間：{selectedTime}</p>
              <p>方式：視訊診療</p>
            </div>
          </div>


          {/* 確認預約按鈕 */}
          <button
            onClick={() => onConfirm({ doctor, date: selectedDate, time: selectedTime })}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
          >
            確認預約
          </button>
        </div>
      </div>
    </div>
  );
}


// 預約頁面
function BookingPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);


  const specialties = ["all", "心臟科", "神經科", "骨科", "皮膚科"];


  const filteredDoctors = mockDoctors.filter(doctor =>
    selectedSpecialty === "all" || doctor.specialty === selectedSpecialty
  );


  const handleBooking = (bookingData) => {
    console.log("預約資料:", bookingData);
    setShowModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showSuccess && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>預約成功!</span>
        </div>
      )}


      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">瀏覽醫師</h2>
        <div className="flex gap-2 flex-wrap">
          {specialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setSelectedSpecialty(specialty)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedSpecialty === specialty
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {specialty === "all" ? "全部科別" : specialty}
            </button>
          ))}
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map(doctor => (
          <div key={doctor.doctor_id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {doctor.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{doctor.name}</h3>
                <p className="text-blue-600 text-sm">{doctor.specialty}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {doctor.experience_years} 年經驗
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">{doctor.introduction}</p>
            <button
              onClick={() => {
                setSelectedDoctor(doctor);
                setShowModal(true);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              立即預約
            </button>
          </div>
        ))}
      </div>


      {showModal && selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => setShowModal(false)}
          onConfirm={handleBooking}
        />
      )}
    </div>
  );
}


// 首頁組件
function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);


  // 幻燈片內容
  const slides = [
    {
      title: "專業遠距醫療服務",
      description: "隨時隨地獲得專業醫療諮詢",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop",
      bgColor: "from-blue-500 to-indigo-600"
    },
    {
      title: "經驗豐富的醫療團隊",
      description: "匯聚各科專業醫師為您服務",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&h=600&fit=crop",
      bgColor: "from-green-500 to-teal-600"
    },
    {
      title: "便捷的線上預約",
      description: "一鍵預約，輕鬆管理您的健康",
      image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=600&fit=crop",
      bgColor: "from-purple-500 to-pink-600"
    },
    {
      title: "安全的隱私保護",
      description: "您的健康資訊受到完善保護",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&h=600&fit=crop",
      bgColor: "from-orange-500 to-red-600"
    }
  ];


  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };


  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };


  const goToSlide = (index) => {
    setCurrentSlide(index);
  };


  return (
    <div>
      {/* 幻燈片輪播 */}
      <div className="relative w-full h-[600px] overflow-hidden bg-gray-900">
        {/* 幻燈片內容 */}
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="min-w-full h-full relative">
              {/* 背景圖片 */}
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
             
              {/* 漸層遮罩 */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgColor} opacity-60`}></div>


              {/* 文字內容 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
                <h2 className="text-5xl font-bold mb-4 text-center drop-shadow-lg">
                  {slide.title}
                </h2>
                <p className="text-2xl text-center drop-shadow-md">
                  {slide.description}
                </p>
              </div>
            </div>
          ))}
        </div>


        {/* 左箭頭按鈕 */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm p-3 rounded-full transition-all duration-300 group"
          aria-label="上一張"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>


        {/* 右箭頭按鈕 */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm p-3 rounded-full transition-all duration-300 group"
          aria-label="下一張"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>


        {/* 底部指示點 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`前往第 ${index + 1} 張`}
            />
          ))}
        </div>
      </div>


      {/* 平台介紹區域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          為什麼選擇我們？
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">不限特定地點</h3>
            <p className="text-gray-600">隨地都能獲得醫療諮詢</p>
          </div>


          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">資料安全保障</h3>
            <p className="text-gray-600">符合醫療隱私保護標準</p>
          </div>


          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">專業醫療團隊</h3>
            <p className="text-gray-600">經驗豐富的認證醫師</p>
          </div>
        </div>
      </div>
    </div>
  );
}


function SettingsPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">設定</h2>
      <p className="text-gray-600">功能開發中...</p>
    </div>
  );
}


// 主應用程式
export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("reserve");


  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* 選單按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow hover:bg-gray-50"
        >
          <Menu size={24} className="text-gray-600" />
        </button>
      )}


      {/* 側邊欄 */}
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />


      {/* 主內容區 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />
        {activeTab === "home" && <HomePage />}
        {activeTab === "reserve" && <BookingPage />}
        {activeTab === "doctorlist" && <BookingPage />}
        {activeTab === "settings" && <SettingsPage />}
      </div>
    </div>
  );
}

