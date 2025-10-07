"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu, Calendar, Clock, Filter, CheckCircle } from "lucide-react";


// 假資料
const mockDoctors = [
  { doctor_id: 1, name: "陳建宏", specialty: "心臟內科", experience_years: 10, introduction: "專業心臟科醫師" },
  { doctor_id: 2, name: "林怡君", specialty: "皮膚科", experience_years: 8, introduction: "皮膚科專家" },
  { doctor_id: 3, name: "李志明", specialty: "骨科", experience_years: 12, introduction: "骨科醫師" }
];


const mockTimeSlots = [
  { slot_id: 1, doctor_id: 1, date: "2025-10-10", start_time: "09:00", end_time: "09:30", status: "available" },
  { slot_id: 2, doctor_id: 1, date: "2025-10-10", start_time: "10:00", end_time: "10:30", status: "available" },
  { slot_id: 3, doctor_id: 2, date: "2025-10-11", start_time: "14:00", end_time: "14:30", status: "available" }
];


function BookingPage({ onBookAppointment }) {
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);


  const specialties = ["all", ...new Set(mockDoctors.map(d => d.specialty))];


  const filteredDoctors = mockDoctors.filter(doctor =>
    selectedSpecialty === "all" || doctor.specialty === selectedSpecialty
  );


  const availableSlots = selectedDoctor
    ? mockTimeSlots.filter(slot =>
        slot.doctor_id === selectedDoctor.doctor_id &&
        slot.status === "available" &&
        (!selectedDate || slot.date === selectedDate)
      )
    : [];


  const handleBooking = () => {
    if (selectedSlot && symptoms.trim()) {
      onBookAppointment?.({
        doctor: selectedDoctor,
        slot: selectedSlot,
        symptoms
      });
      setShowModal(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedDoctor(null);
        setSelectedSlot(null);
        setSymptoms("");
        setSelectedDate("");
      }, 3000);
    }
  };


  return (
    <div className="p-6">
      {showSuccess && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CheckCircle size={24} />
          <span className="font-semibold">預約成功!</span>
        </div>
      )}


      {/* 篩選區 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Filter className="text-blue-600" />
          篩選條件
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇科別
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setSelectedDoctor(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有科別</option>
              {specialties.filter(s => s !== "all").map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇日期 (選填)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>


      {/* 醫生列表 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">選擇醫生</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map(doctor => (
            <div
              key={doctor.doctor_id}
              onClick={() => setSelectedDoctor(doctor)}
              className={`border rounded-lg p-4 cursor-pointer transition ${
                selectedDoctor?.doctor_id === doctor.doctor_id
                  ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500"
                  : "hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {doctor.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{doctor.name}</h3>
                  <p className="text-sm text-blue-600">{doctor.specialty}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {doctor.experience_years || 0} 年經驗
                  </p>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {doctor.introduction || ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* 時段選擇 & Modal ... */}
      {/* 可依照你原本的 BookingPage 代碼加上 */}
    </div>
  );
}


export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);


  const handleBookAppointment = (data) => {
    console.log("預約資料:", data);
  };


  return (
    <div className="relative">
      {/* 打開按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray z-50"
        >
          <Menu size={24} />
        </button>
      )}


      {/* 側邊欄 */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />


      {/* 內容區，點開 Sidebar 時往右推 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />
        <BookingPage onBookAppointment={handleBookAppointment} />
      </div>
    </div>
  );
}



