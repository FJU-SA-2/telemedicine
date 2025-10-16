import mysql.connector
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from datetime import datetime, timedelta, time
from apscheduler.schedulers.blocking import BlockingScheduler
import pytz

# ==================== 郵件設定 ====================

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "telemedicine.medongo@gmail.com"
SENDER_PASSWORD = "nkejdhcftcudzswi"  # ⚠️ 需要使用 Gmail App Password


# ==================== 資料庫連線 ====================
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="telemedicine"
    )


# ==================== 發送預約提醒郵件 ====================
def send_appointment_reminder(recipient_email, patient_name, doctor_name, specialty, appointment_datetime):
    """
    發送預約提醒郵件
    
    參數:
        recipient_email: 病患的 email
        patient_name: 病患姓名
        doctor_name: 醫生姓名
        specialty: 醫生專科
        appointment_datetime: 預約日期時間 (datetime 物件)
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = Header('醫隨行 MOG - 預約提醒通知', 'utf-8')
        
        # 格式化時間顯示
        formatted_date = appointment_datetime.strftime('%Y年%m月%d日')
        formatted_time = appointment_datetime.strftime('%H:%M')
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #3b82f6;">⏰ 預約提醒通知</h2>
            <p>親愛的 <strong>{patient_name}</strong> 您好，</p>
            <p>您的預約即將開始，請做好準備：</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>📅 預約日期：</strong>{formatted_date}</p>
                <p style="margin: 8px 0;"><strong>🕐 預約時間：</strong>{formatted_time}</p>
                <p style="margin: 8px 0;"><strong>👨‍⚕️ 看診醫師：</strong>{doctor_name} 醫師</p>
                <p style="margin: 8px 0;"><strong>🏥 專科：</strong>{specialty}</p>
            </div>
            
            <p style="color: #dc2626; font-weight: bold;">⚠️ 您的預約將在 3 分鐘後開始，請準時上線！</p>
            
            <p>請確保您的網路連線穩定，並準備好相關的醫療資料。</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 12px;">© 醫隨行 MOG · 保障您的健康與隱私</p>
        </body>
        </html>
        """
        
        
        
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ 預約提醒已成功發送到 {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ 郵件發送失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
def send_doctor_reminder(recipient_email, doctor_name, patient_name, specialty, appointment_datetime):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = Header('醫隨行 MOG - 即將開始的診療提醒', 'utf-8')

        formatted_date = appointment_datetime.strftime('%Y年%m月%d日')
        formatted_time = appointment_datetime.strftime('%H:%M')

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #3b82f6;">🩺 線上診療提醒</h2>
            <p>親愛的 <strong>{doctor_name}</strong> 醫師您好，</p>
            <p>您即將與病患 <strong>{patient_name}</strong> 進行線上診療。</p>

            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p>📅 日期：{formatted_date}</p>
                <p>🕐 時間：{formatted_time}</p>
                <p>🏥 專科：{specialty}</p>
            </div>

            <p style="color: #dc2626; font-weight: bold;">⚠️ 您的診療將在 3 分鐘後開始，請準時上線！</p>
            <p>請確認設備及網路連線穩定。</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 12px;">© 醫隨行 MOG · 保障您的健康與隱私</p>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)

        print(f"✅ 醫師提醒已發送給 {recipient_email}")
        return True
    except Exception as e:
        print(f"❌ 醫師郵件發送失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# ==================== 輔助函式：轉換 timedelta 為 time ====================
def timedelta_to_time(td):
    """
    將 timedelta 轉換為 time 物件
    MySQL 的 TIME 型態會被讀取為 timedelta
    """
    if isinstance(td, time):
        return td
    
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return time(hour=hours, minute=minutes, second=seconds)

# ==================== 查詢並發送提醒 ====================
def check_and_send_reminders():
    """
    檢查所有即將在 3 分鐘後開始的預約，並發送提醒
    """
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # 設定台灣時區
        taipei_tz = pytz.timezone('Asia/Taipei')
        now = datetime.now(taipei_tz)
        
        # 計算 3 分鐘後的時間
        target_time = now + timedelta(minutes=3)
        
        # 查詢即將開始的預約（狀態為「已確認」）
        query = """
        SELECT 
            a.appointment_id,
            a.appointment_date,
            a.appointment_time,
            p.first_name as patient_first_name,
            p.last_name as patient_last_name,
            d.first_name as doctor_first_name,
            d.last_name as doctor_last_name,
            d.specialty,
            u.email as patient_email,
            du.email as doctor_email
        FROM appointments a
        JOIN patient p ON a.patient_id = p.patient_id
        JOIN doctor d ON a.doctor_id = d.doctor_id
        JOIN users u ON p.user_id = u.user_id
        JOIN users du ON d.user_id = du.user_id
        WHERE a.status = '已確認'
        AND a.appointment_date = %s
        AND a.appointment_time BETWEEN %s AND %s
        """
        
        # 設定時間範圍（3分鐘後的前後1分鐘，避免遺漏）
        start_time = (target_time - timedelta(minutes=1)).time()
        end_time = (target_time + timedelta(minutes=1)).time()
        target_date = target_time.date()
        
        cursor.execute(query, (target_date, start_time, end_time))
        appointments = cursor.fetchall()
        
        print(f"🔍 [{now.strftime('%Y-%m-%d %H:%M:%S')}] 檢查中... 找到 {len(appointments)} 筆即將開始的預約")
        
        # 發送提醒
        for apt in appointments:
            patient_name = f"{apt['patient_first_name']}{apt['patient_last_name']}"
            doctor_name = f"{apt['doctor_first_name']}{apt['doctor_last_name']}"
            specialty = apt['specialty'] or "一般門診"
            
            # 將 appointment_time 轉換為 time 物件（處理 timedelta）
            appointment_time = timedelta_to_time(apt['appointment_time'])
            
            # 組合完整的預約時間
            appointment_datetime = datetime.combine(
                apt['appointment_date'], 
                appointment_time
            )
            appointment_datetime = taipei_tz.localize(appointment_datetime)
            
            print(f"📧 正在發送提醒給: {patient_name} ({apt['patient_email']})")
            
            send_appointment_reminder(
                recipient_email=apt['patient_email'],
                patient_name=patient_name,
                doctor_name=doctor_name,
                specialty=specialty,
                appointment_datetime=appointment_datetime
            )
            print(f"📧 正在發送提醒給醫師: {doctor_name} ({apt['doctor_email']})")
            send_doctor_reminder(
                 recipient_email=apt['doctor_email'],
                 doctor_name=doctor_name,
                patient_name=patient_name,
                specialty=specialty,
                appointment_datetime=appointment_datetime
             )
        
        cursor.close()
        db.close()
        
    except Exception as e:
        print(f"❌ 檢查預約時發生錯誤: {str(e)}")
        import traceback
        traceback.print_exc()

# ==================== 主程式：啟動排程器 ====================
def start_reminder_scheduler():
    """
    啟動排程器，每分鐘檢查一次是否有需要發送提醒的預約
    """
    scheduler = BlockingScheduler(timezone='Asia/Taipei')
    
    # 每分鐘執行一次檢查
    scheduler.add_job(
        check_and_send_reminders,
        'cron',
        minute='*',  # 每分鐘執行
        id='appointment_reminder'
    )
    
    print("=" * 60)
    print("🚀 預約提醒系統已啟動")
    print("⏰ 每分鐘自動檢查即將開始的預約")
    print("📧 將在預約前 3 分鐘發送提醒郵件")
    print("=" * 60)
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\n⛔ 預約提醒系統已停止")

# ==================== 執行程式 ====================
if __name__ == "__main__":
    # 測試單次執行（用於開發測試）
    check_and_send_reminders()
    
    # 啟動持續運行的排程器（正式環境使用）
    # start_reminder_scheduler()