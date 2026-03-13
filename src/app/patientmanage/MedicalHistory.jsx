import { FileText, AlertCircle, Video, Calendar, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function MedicalHistory({ patientId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) fetchMedicalHistory();
  }, [patientId]);

  const fetchMedicalHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patient/${patientId}/medical-records`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('無法獲取病歷記錄');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error('獲取病歷失敗:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (timeString) => timeString?.substring(0, 5) || '';

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-600 mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">載入病歷中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 text-sm">暫無就診紀錄</p>
      </div>
    );
  }

  return (
    <div className="relative max-h-[50vh] sm:max-h-[600px] overflow-y-auto">
      <div className="relative pl-8 sm:pl-12 pr-2 sm:pr-4 pb-4">
        {/* 時間軸線 */}
        <div className="absolute left-5 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-200 pointer-events-none"></div>

        <div className="space-y-6 sm:space-y-8 relative">
          {history.map((record) => (
            <div key={record.appointment_id} className="relative">
              {/* 時間軸節點 */}
              <div className="absolute -left-6 sm:-left-9 top-2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white border-2 border-gray-400 rounded-full z-10"></div>

              {/* 卡片 */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">

                {/* 標題區塊 */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/50">
                  {/* 手機垂直排列，sm 以上水平排列 */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">
                        {record.doctor_first_name && record.doctor_last_name
                          ? `${record.doctor_first_name}${record.doctor_last_name}`
                          : record.doctor_name || '未知'} 醫師
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">{record.doctor_specialty}</p>
                    </div>
                    <div className="flex sm:flex-col sm:text-right gap-3 sm:gap-0 shrink-0">
                      <div className="flex items-center gap-1.5 text-gray-700 text-xs sm:text-sm">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDate(record.appointment_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-0 sm:mt-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatTime(record.appointment_time)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 內容區塊 */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
                  {/* 主訴症狀 */}
                  {record.symptoms && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1 h-4 bg-amber-500 rounded shrink-0"></div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">主訴症狀</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800 leading-relaxed pl-3">{record.symptoms}</p>
                    </div>
                  )}

                  {/* 診斷與就診記錄 */}
                  {record.consultation_notes && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1 h-4 bg-emerald-500 rounded shrink-0"></div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">診斷與就診記錄</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line pl-3">{record.consultation_notes}</p>
                    </div>
                  )}

                  {/* 醫師建議與處方 */}
                  {record.doctor_advice && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1 h-4 bg-blue-500 rounded shrink-0"></div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">醫師建議與處方</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line pl-3">{record.doctor_advice}</p>
                    </div>
                  )}

                  {/* 錄影記錄 */}
                  {record.recording_url && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Video className="w-4 h-4 text-gray-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-700">視訊錄影記錄</p>
                            <p className="text-xs text-gray-500 mt-0.5">時長: {formatDuration(record.recording_duration)}</p>
                          </div>
                        </div>
                        <a
                          href={`/api/recording/${record.recording_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md transition-colors bg-white hover:bg-blue-50 shrink-0"
                        >
                          查看錄影
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* 底部資訊 */}
                <div className="px-4 sm:px-5 py-2 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-right">記錄編號 #{record.appointment_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}