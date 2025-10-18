// ============ 工具函數 ============
export const calculateAge = (birthDate) => {
  if (!birthDate) return "未提供";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age}歲`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "未提供";
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

export const getGenderDisplay = (gender) => {
  return gender === "male"
    ? "男性"
    : gender === "female"
    ? "女性"
    : "未提供";
};

export const getGenderColor = (gender) => {
  return gender === "male" ? "from-blue-500 to-blue-600" : "from-pink-500 to-pink-600";
};

export const getSeverityColor = (severity) => {
  switch (severity) {
    case "輕度":
      return "bg-green-100 text-green-700 border-green-300";
    case "中度":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "重度":
      return "bg-orange-100 text-orange-700 border-orange-300";
    case "危急":
    case "致命":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};
