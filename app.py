from flask import Flask, jsonify, request, session
from flask_cors import CORS
from mysql.connector import Error
import mysql.connector
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
from datetime import datetime, timedelta
from email.header import Header
from werkzeug.utils import secure_filename
import os
from flask import send_from_directory
from datetime import datetime, timedelta
import secrets
from flask import send_file
import threading 
from datetime import datetime, timedelta
from flask import Response
import json
from functools import wraps
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import (
    MessageEvent, TextMessage, TextSendMessage,
    TemplateSendMessage, ButtonsTemplate, URIAction,
    FlexSendMessage, FollowEvent
)
from dotenv import load_dotenv
import re
load_dotenv()
os.environ['LINE_CHANNEL_SECRET'] = '284dabf028558ab491a1358ac425d912'
LINE_CHANNEL_SECRET = os.getenv('LINE_CHANNEL_SECRET')
LINE_CHANNEL_ACCESS_TOKEN = os.getenv('LINE_CHANNEL_ACCESS_TOKEN')
print(f"🔑 SECRET: '{LINE_CHANNEL_SECRET}'")
print(f"🔑 TOKEN: '{LINE_CHANNEL_ACCESS_TOKEN}'")
line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(LINE_CHANNEL_SECRET)

app = Flask(__name__)
app.secret_key = "your-very-secret-key-change-this"  # ⚠️ 改成更安全的密鑰

# ⚠️ 重要：CORS 設定要放在最前面
CORS(app, 
     supports_credentials=True,
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     allow_headers=["Content-Type"],
     expose_headers=["Set-Cookie"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
app.url_map.strict_slashes = False

# Session 設定
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,  # 本地開發用 False
    SESSION_COOKIE_NAME="telemedicine_session",
    SESSION_COOKIE_PATH="/",
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=30),  # Session 30分鐘過期
    SESSION_REFRESH_EACH_REQUEST=True
)

# 連接 MySQL
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="telemedicine"
    )



# 檔案上傳設定
UPLOAD_FOLDER = 'uploads/certificates'
PROFILE_PICTURE_FOLDER = 'uploads/profile_pictures'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
ALLOWED_PHOTO_EXTENSIONS = {'png', 'jpg', 'jpeg'} # 確保允許的格式存在

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# 確保上傳資料夾存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROFILE_PICTURE_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
def allowed_photo_file(filename):
    """檢查上傳檔案的副檔名是否為允許的照片格式"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_PHOTO_EXTENSIONS



# 生成6位數驗證碼
def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

# Gmail 設定（放在檔案開頭的全域變數區）
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "telemedicine.medongo@gmail.com"
SENDER_PASSWORD = "nkejdhcftcudzswi"  # ⚠️ 需要使用 Gmail App Password

# 發送驗證郵件
def send_verification_email(recipient_email, verification_code):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = Header('醫隨行 MOG - 註冊驗證碼', 'utf-8')
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #3b82f6;">歡迎註冊醫隨行 MOG</h2>
            <p>您的驗證碼是：</p>
            <h1 style="color: #3b82f6; letter-spacing: 5px;">{verification_code}</h1>
            <p>驗證碼將在 <strong>10 分鐘</strong> 後失效。</p>
            <p>如果這不是您的操作，請忽略此郵件。</p>
            <hr>
            <p style="color: #666; font-size: 12px;">© 醫隨行 MOG · 保障您的健康與隱私</p>
        </body>
        </html>
        """
        
        # 純文字版本（備用）
        text_body = f"""
        歡迎註冊醫隨行 MOG
        
        您的驗證碼是：{verification_code}
        
        驗證碼將在 10 分鐘後失效。
        如果這不是您的操作，請忽略此郵件。
        
        © 醫隨行 MOG · 保障您的健康與隱私
        """
        
        # ⚠️ 這裡也要改
        part1 = MIMEText(text_body, 'plain', 'utf-8')
        part2 = MIMEText(html_body, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ 驗證碼已成功發送到 {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ 郵件發送失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# 病患註冊成功郵件函數
def send_patient_registration_success_email(recipient_email, patient_name):
    """病患註冊成功後發送歡迎郵件"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = Header('醫隨行 MOG - 註冊成功通知', 'utf-8')
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #10b981; text-align: center;">🎉 歡迎加入醫隨行 MOG</h2>
                <p>親愛的 {patient_name} 您好：</p>
                <p>恭喜您成功註冊醫隨行 MOG！</p>
                
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <h3 style="color: #059669; margin-top: 0;">✨ 免費試用期福利</h3>
                    <p style="font-size: 16px; margin: 10px 0;">
                        <strong>現在開始享有 6 個月免費試用期！</strong>
                    </p>
                    <p style="margin: 10px 0;">
                        試用期內您可以：<br>
                        ✓ 無限制線上預約<br>
                        ✓ 視訊諮詢服務<br>
                        ✓ 完整就診記錄保存<br>
                        ✓ 24/7 隨時查詢
                    </p>
                </div>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <h3 style="color: #2563eb; margin-top: 0;">💳 訂閱方案說明</h3>
                    <p style="font-size: 16px; margin: 10px 0;">
                        試用期結束後，將以 <strong style="color: #2563eb; font-size: 18px;">$199/月</strong> 開始會員訂閱
                    </p>
                    <p style="color: #666; font-size: 14px; margin: 10px 0;">
                        * 試用期結束前我們會提前通知您<br>
                        * 您可隨時取消訂閱，無需支付違約金
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/auth" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                        立即開始使用
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    如有任何問題，歡迎隨時聯繫我們的客服團隊。
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © 醫隨行 MOG · 保障您的健康與隱私<br>
                    這是一封自動發送的郵件，請勿直接回覆
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        歡迎加入醫隨行 MOG
        
        親愛的 {patient_name} 您好：
        
        恭喜您成功註冊醫隨行 MOG！
        
        【免費試用期福利】
        現在開始享有 6 個月免費試用期！
        
        試用期內您可以：
        ✓ 無限制線上預約
        ✓ 視訊諮詢服務
        ✓ 完整就診記錄保存
        ✓ 24/7 隨時查詢
        
        【訂閱方案說明】
        試用期結束後，將以 $199/月 開始會員訂閱
        
        * 試用期結束前我們會提前通知您
        * 您可隨時取消訂閱，無需支付違約金
        
        立即開始使用：http://localhost:3000/auth
        
        © 醫隨行 MOG · 保障您的健康與隱私
        """
        
        part1 = MIMEText(text_body, 'plain', 'utf-8')
        part2 = MIMEText(html_body, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ 病患註冊成功郵件已發送至 {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ 郵件發送失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# 醫師審核通過郵件函數
def send_approval_email(recipient_email, doctor_name):
    """醫師審核通過後發送郵件"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = Header('醫隨行 MOG - 審核通過通知', 'utf-8')
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #10b981; text-align: center;">🎉 恭喜！您的資料已審核通過</h2>
                <p>親愛的 {doctor_name} 醫師，您好：</p>
                <p>您的註冊資料已通過審核，現在您可以開始使用醫隨行 MOG 平台了！</p>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <h3 style="color: #2563eb; margin-top: 0;">您現在可以：</h3>
                    <ul style="line-height: 1.8;">
                        <li>✓ 登入系統開始使用</li>
                        <li>✓ 設定您的看診時段</li>
                        <li>✓ 接受病患預約</li>
                        <li>✓ 進行線上問診服務</li>
                    </ul>
                </div>
                
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <h3 style="color: #059669; margin-top: 0;">✨ 免費試用期福利</h3>
                    <p style="font-size: 16px; margin: 10px 0;">
                        <strong>現在開始享有 6 個月免費試用期！</strong>
                    </p>
                    <p style="margin: 10px 0;">
                        試用期內享有完整平台功能，無任何限制。
                    </p>
                </div>
                
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <h3 style="color: #d97706; margin-top: 0;">💳 訂閱方案說明</h3>
                    <p style="font-size: 16px; margin: 10px 0;">
                        試用期結束後，將以 <strong style="color: #d97706; font-size: 18px;">$199/月</strong> 開始會員訂閱
                    </p>
                    <p style="color: #666; font-size: 14px; margin: 10px 0;">
                        * 試用期結束前我們會提前通知您<br>
                        * 您可隨時取消訂閱，無需支付違約金<br>
                        * 訂閱期間享有完整技術支援與平台更新
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/auth" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                        立即登入開始使用
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    如有任何問題或需要協助，歡迎隨時聯繫我們的技術支援團隊。
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © 醫隨行 MOG · 保障您的健康與隱私<br>
                    這是一封自動發送的郵件，請勿直接回覆
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        恭喜！您的資料已審核通過
        
        親愛的 {doctor_name} 醫師，您好：
        
        您的註冊資料已通過審核，現在您可以開始使用醫隨行 MOG 平台了！
        
        【您現在可以】
        ✓ 登入系統開始使用
        ✓ 設定您的看診時段
        ✓ 接受病患預約
        ✓ 進行線上問診服務
        
        【免費試用期福利】
        現在開始享有 6 個月免費試用期！
        試用期內享有完整平台功能，無任何限制。
        
        【訂閱方案說明】
        試用期結束後，將以 $199/月 開始會員訂閱
        
        * 試用期結束前我們會提前通知您
        * 您可隨時取消訂閱，無需支付違約金
        * 訂閱期間享有完整技術支援與平台更新
        
        立即登入：http://localhost:3000/auth
        
        © 醫隨行 MOG · 保障您的健康與隱私
        """
        
        part1 = MIMEText(text_body, 'plain', 'utf-8')
        part2 = MIMEText(html_body, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ 審核通過郵件已發送至 {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ 郵件發送失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# 確保 send_registration_received_email 函數存在（醫師註冊收到通知）
def send_registration_received_email(recipient_email, doctor_name):
    """醫師註冊後發送資料已收到郵件"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = Header('醫隨行 MOG - 註冊資料已收到', 'utf-8')
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">感謝您註冊醫隨行 MOG</h2>
            <p>親愛的 {doctor_name} 醫師,您好:</p>
            <p>我們已收到您的註冊資料及執業證明文件。</p>
            <p>我們的審核團隊將在 <strong>1-3 個工作天</strong> 內完成資料審核。</p>
            <p>審核完成後,系統將自動發送通知信件到此信箱,屆時您即可開始:</p>
            <ul>
                <li>✓ 設定看診時段</li>
                <li>✓ 接受病患預約</li>
                <li>✓ 進行線上問診</li>
            </ul>
            <p>如有任何問題,歡迎隨時聯繫我們。</p>
            <hr>
            <p style="color: #666; font-size: 12px;">© 醫隨行 MOG · 保障您的健康與隱私</p>
        </body>
        </html>
        """
        
        text_body = f"""
        感謝您註冊醫隨行 MOG
        
        親愛的 {doctor_name} 醫師,您好:
        
        我們已收到您的註冊資料及執業證明文件。
        我們的審核團隊將在 1-3 個工作天內完成資料審核。
        
        審核完成後,系統將自動發送通知信件到此信箱。
        
        © 醫隨行 MOG · 保障您的健康與隱私
        """
        
        part1 = MIMEText(text_body, 'plain', 'utf-8')
        part2 = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"❌ 郵件發送失敗: {str(e)}")
        return False



@app.route('/api/doctor/appointments-data', methods=['GET'])
def get_doctor_dashboard_data():
    # 這裡的 doctor_id = 1 是硬編碼，在真實環境中應從 Session 或 Token 中取得
    doctor_id = session.get('doctor_id')
    
    conn = get_db() 
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

       
        today_appointments_query = """
            SELECT
                a.appointment_id,
                CONCAT(p.first_name, p.last_name) AS patient_name, 
                TIME_FORMAT(a.appointment_time, '%H:%i') AS time, 
                IFNULL(a.symptoms, '未知') AS symptoms,
                a.status
            FROM
                appointments a
            JOIN
                patient p ON a.patient_id = p.patient_id
            WHERE
                a.doctor_id = %s AND a.appointment_date = CURDATE()
            ORDER BY
                a.appointment_time ASC;
        """
        cursor.execute(today_appointments_query, (doctor_id,))
        today_appointments = cursor.fetchall()

        weekly_stats_query = """
            WITH RECURSIVE date_range AS (
                -- 計算本週一的日期
                SELECT DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AS date_day
                UNION ALL
                SELECT DATE_ADD(date_day, INTERVAL 1 DAY)
                FROM date_range
                WHERE date_day < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)
            )
            SELECT
                DATE_FORMAT(dr.date_day, '%Y-%m-%d') AS date_day,
                COALESCE(COUNT(a.appointment_id), 0) AS total_appointments
            FROM
                date_range dr
            LEFT JOIN
                appointments a ON a.appointment_date = dr.date_day AND a.doctor_id = %s
            GROUP BY
                dr.date_day
            ORDER BY
                dr.date_day ASC;
        """
        cursor.execute(weekly_stats_query, (doctor_id,))
        weekly_stats = cursor.fetchall()

        return jsonify({
            "todayAppointments": today_appointments,
            "weeklyStats": weekly_stats
        })

    except Exception as e:
        print(f"Error fetching dashboard data: {e}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if 'cursor' in locals() and cursor is not None:
             cursor.close()
        if conn is not None:
             conn.close()
@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                d.doctor_id,
                d.first_name,
                d.last_name,
                d.gender,
                d.specialty,
                d.practice_hospital,
                d.phone_number,
                di.consultation_type,
                di.consultation_fee,
                di.description,
                di.photo
            FROM doctor d
            LEFT JOIN doctor_info di ON d.doctor_id = di.doctor_id
            WHERE d.approval_status = 'approved'
        """)
        doctors = cursor.fetchall()
        return jsonify(doctors)
    except Exception as e:
        print(f"❌ 取得醫師錯誤: {str(e)}")
        return jsonify({"error": "查詢失敗"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/send-verification", methods=["POST"])
def send_verification():
    """發送驗證碼到用戶郵箱"""
    data = request.get_json()
    email = data.get("email")
    
    if not email:
        return jsonify({'message': '請提供電子信箱'}), 400
    
    # 檢查 email 是否已存在
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        db.close()
        return jsonify({'message': '此 Email 已被註冊'}), 400
    cursor.close()
    db.close()
    
    # 生成驗證碼
    verification_code = generate_verification_code()
    
    # 發送郵件
    if not send_verification_email(email, verification_code):
        return jsonify({'message': '驗證碼發送失敗，請稍後再試'}), 500
    
    # ⭐ 關鍵修改：保留已上傳的 certificate
    existing_certificate = None
    if 'pending_registration' in session and 'certificate' in session['pending_registration']:
        existing_certificate = session['pending_registration']['certificate']
        print(f"🔍 保留已上傳的證明檔案: {existing_certificate}")
    
    # 將驗證碼和過期時間存入 session
    session['verification_code'] = verification_code
    session['verification_email'] = email
    session['verification_expiry'] = (datetime.now() + timedelta(minutes=10)).isoformat()
    
    # ⭐ 暫存註冊資料，並保留 certificate
    session['pending_registration'] = data
    if existing_certificate:
        session['pending_registration']['certificate'] = existing_certificate
        print(f"✅ 已將證明檔案加回 session: {existing_certificate}")
    
    session.modified = True  # ⭐ 強制標記 session 已修改

    print(f"📦 最終 Session 內容: {session.get('pending_registration')}")
    
    return jsonify({
        'success': True,
        'message': '驗證碼已發送至您的信箱'
    }), 200

@app.route("/api/verify-code", methods=["POST"])
def verify_code():
    """驗證用戶輸入的驗證碼"""
    data = request.get_json()
    user_code = data.get("code")
    
    # ⚠️ 加入除錯訊息
    print("=" * 50)
    print("收到驗證碼請求")
    print(f"用戶輸入的驗證碼: {user_code}")
    print(f"Session 內容: {dict(session)}")
    print(f"Session ID: {request.cookies.get('telemedicine_session')}")
    print("=" * 50)

    if not user_code:
        return jsonify({'message': '請輸入驗證碼'}), 400
    
    # 檢查 session 中是否有驗證碼
    stored_code = session.get('verification_code')
    stored_email = session.get('verification_email')
    expiry = session.get('verification_expiry')
    
    print(f"儲存的驗證碼: {stored_code}")
    print(f"儲存的 Email: {stored_email}")
    print(f"過期時間: {expiry}")

    if not stored_code or not expiry:
        print("❌ 驗證碼或過期時間不存在於 session 中")
        return jsonify({'message': '驗證碼已過期，請重新發送'}), 400
    
    # 檢查是否過期
    expiry_time = datetime.fromisoformat(expiry)
    current_time = datetime.now()
    print(f"當前時間: {current_time}")
    print(f"過期時間: {expiry_time}")
    
    if current_time > expiry_time:
        print("❌ 驗證碼已過期")
        return jsonify({'message': '驗證碼已過期，請重新發送'}), 400
    
    # 驗證碼比對
    if user_code != stored_code:
        print(f"❌ 驗證碼錯誤: 輸入 {user_code} vs 正確 {stored_code}")
        return jsonify({'message': '驗證碼錯誤'}), 400
    
    # 驗證成功,執行註冊
    registration_data = session.get('pending_registration')
    if not registration_data:
        return jsonify({'message': '註冊資料遺失,請重新註冊'}), 400
    
    certificate_filename = registration_data.get("certificate") # ⭐ 取得證明檔案名稱
    print(f"📦 註冊資料內容: {registration_data}")  # ⭐ 查看註冊資料

    # 取得註冊資料
    first_name = registration_data.get("first_name")
    last_name = registration_data.get("last_name")
    email = registration_data.get("email")
    password = registration_data.get("password")
    role = registration_data.get("role")
    phone_number = registration_data.get("phone_number")
    gender = registration_data.get("gender")
    date_of_birth = registration_data.get("date_of_birth")
    specialty = registration_data.get("specialty")
    practice_hospital = registration_data.get("practice_hospital")
    address = registration_data.get("address")
    certificate_path = registration_data.get("certificate")  # ⭐ 取得證書路徑
    certificate_filename = registration_data.get("certificate")  # ⭐ 取得證明檔案名稱

    print(f"📄 Certificate filename: {certificate_filename}")  # ⭐ 確認有沒有值

    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        username = first_name + last_name
        
        # 插入 users 表
        sql_user = """
            INSERT INTO users (username, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql_user, (username, email, password, role))
        db.commit()
        
        user_id = cursor.lastrowid
        
        if role == "patient":
            sql_patient = """
                INSERT INTO patient (user_id, first_name, last_name, gender, phone_number, date_of_birth, address)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql_patient, (user_id, first_name, last_name, gender, phone_number, date_of_birth, address))
        
        elif role == "doctor":
            # ⭐ 修改這裡:加入 certificate_path 和 approval_status
            sql_doctor = """
                INSERT INTO doctor (user_id, first_name, last_name, gender, phone_number, 
                                    specialty, practice_hospital, certificate_path, approval_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            """
            cursor.execute(sql_doctor, (
                user_id, first_name, last_name, gender, phone_number, 
                specialty, practice_hospital, certificate_filename  # ⭐ 這裡
            ))
            # ⭐ 取得剛插入的 doctor_id
            doctor_id = cursor.lastrowid

            # ⭐ 同步新增 doctor_info 資料表中的對應紀錄
            sql_doctor_info = """
                INSERT INTO doctor_info (
                    doctor_id, first_name, last_name, specialty, practice_hospital, phone_number
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql_doctor_info, (
                doctor_id, first_name, last_name, specialty, practice_hospital, phone_number
            ))
           
            # ⭐ 發送醫師註冊收到通知郵件
            doctor_name = first_name + last_name
            send_registration_received_email(email, doctor_name)
        
        db.commit()
        
        # 清除 session 中的驗證資料
        session.pop('verification_code', None)
        session.pop('verification_email', None)
        session.pop('verification_expiry', None)
        session.pop('pending_registration', None)
        
        return jsonify({
            'success': True,
            'message': '註冊成功，請等待管理員審核' if role == 'doctor' else '註冊成功',  # ⭐ 修改這裡
            'role': role  # ⭐ 回傳角色給前端
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"❌ 註冊失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'註冊失敗: {str(e)}'}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/login", methods=["POST"])
def login_user():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "請輸入帳號與密碼"}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "帳號不存在"}), 401

        if user["password_hash"] != password:
            return jsonify({"message": "密碼錯誤"}), 401

        role = user["role"]
        user_id = user["user_id"]

        patient_id = None
        doctor_id = None  
        first_name = ""
        last_name = ""

        if role == "patient":
            cursor.execute("SELECT * FROM patient WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if profile:
                patient_id = profile.get("patient_id")
                first_name = profile.get("first_name", "")
                last_name = profile.get("last_name", "")
        
        elif role == "doctor":
            cursor.execute("SELECT * FROM doctor WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if profile:
                doctor_id = profile.get("doctor_id")
                first_name = profile.get("first_name", "")
                last_name = profile.get("last_name", "")

        # ✅ 新增這兩行
        session.permanent = True  # 設定為永久 session
        app.permanent_session_lifetime = timedelta(days=7)  # 設定 7 天有效期
        
        # 儲存到 session
        session['user_id'] = user_id
        session['email'] = email
        session['role'] = role
        session['username'] = user["username"]
        session['patient_id'] = patient_id
        session['doctor_id'] = doctor_id
        session['first_name'] = first_name
        session['last_name'] = last_name

        print(f"✅ 登入成功 - Role: {role}, doctor_id: {doctor_id}, patient_id: {patient_id}")

        return jsonify({
            "success": True,
            "message": "登入成功",
            "user": {
                "user_id": user_id,
                "username": user["username"],
                "role": role,
                "email": email,
                "patient_id": patient_id,
                "doctor_id": doctor_id,
                "firstName": first_name,
                "lastName": last_name
            }
        }), 200

    except Exception as e:
        print(f"❌ 登入錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"登入失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/me", methods=["GET"])
def get_current_user():
    """取得當前登入使用者資訊"""
    print(f"🔍 /api/me session 內容: {dict(session)}")
    print(f"🔍 /api/me 收到的 Cookie header: {request.headers.get('Cookie', 'NONE')[:80]}")
    if 'user_id' not in session:
        return jsonify({"authenticated": False}), 401
    user_id = session.get('user_id')
    role = session.get('role')
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT username, email, role, created_at
            FROM users
            WHERE user_id = %s
        """, (user_id,))
        user_row = cursor.fetchone()

        if not user_row:
            return jsonify({"authenticated": False}), 404
        
        user_data = {
            "user_id": user_id,
            "username": session.get('username'),
            "email": session.get('email'),
            "role": role,
            "created_at": user_row["created_at"],
            "patient_id": session.get('patient_id'),
            "doctor_id": session.get('doctor_id'), 
            "first_name": session.get('first_name'), 
            "last_name": session.get('last_name')

        } 
    
    

  
        # 如果是病患,取得完整健康資料
        if role == "patient":
            cursor.execute("""
                SELECT patient_id, first_name, last_name, gender, phone_number, 
                       date_of_birth,TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) AS age,
                        address, id_number, smoking_status, 
                       drug_allergies, medical_history, emergency_contact_name, 
                       emergency_contact_phone, height, weight, chronic_disease, other_chronic_disease
                FROM patient 
                WHERE user_id = %s
            """, (user_id,))
            patient_data = cursor.fetchone()
            
            if patient_data:
                user_data["age"] = patient_data["age"]
                user_data['patientProfile'] = {
                    'patient_id': patient_data['patient_id'],
                    'gender': patient_data['gender'],
                    'phone_number': patient_data['phone_number'],
                    'date_of_birth': serialize_datetime(patient_data['date_of_birth']),
                    'address': patient_data['address'],
                    'id_number': patient_data['id_number'],
                    'smoking_status': patient_data['smoking_status'],
                    'drug_allergies': patient_data['drug_allergies'],
                    'medical_history': patient_data['medical_history'],
                    'emergency_contact_name': patient_data['emergency_contact_name'],
                    'emergency_contact_phone': patient_data['emergency_contact_phone'],
                    'height': patient_data.get('height') or "",
                    'weight': patient_data.get('weight') or "",
                    'chronic_disease': patient_data.get('chronic_disease') or [],
                    'other_chronic_disease': patient_data.get('other_chronic_disease') or ""
                }
        elif role == "mech":
            cursor.execute("""
                SELECT mechanism_id, mechanism_name
                FROM mechanism
                WHERE user_id = %s
            """, (user_id,))
            mech_data = cursor.fetchone()
            if mech_data:
                user_data["mechanism_id"] = mech_data["mechanism_id"]
                user_data["mechanism_name"] = mech_data["mechanism_name"]
        elif role == "doctor":
            cursor.execute("""
                SELECT  d.doctor_id, d.first_name, d.last_name, d.gender, d.phone_number, 
                        d.specialty, d.practice_hospital, 
                        di.education, di.description, di.experience, di.qualifications, 
                        di.consultation_fee, di.consultation_type, 
                        di.photo,
                        d.approval_status
                FROM doctor d
                LEFT JOIN doctor_info di ON d.doctor_id = di.doctor_id
                WHERE d.user_id = %s
            """, (user_id,))
            doctor_data = cursor.fetchone()
            
            if doctor_data:
                user_data["approval_status"] = doctor_data["approval_status"]
                user_data['doctorProfile'] = {
                    'doctor_id': doctor_data['doctor_id'],
                    'gender': doctor_data['gender'],
                    'phone_number': doctor_data['phone_number'],
                    'specialty': doctor_data['specialty'],
                    'practice_hospital': doctor_data['practice_hospital'],
                    'education': doctor_data['education'],
                    'description': doctor_data['description'],
                    'experience': doctor_data['experience'],
                    'qualifications': doctor_data['qualifications'],
                    'consultation_fee': doctor_data['consultation_fee'],
                    'consultation_type': doctor_data['consultation_type'],
                    'approval_status': doctor_data['approval_status'],
                    'photo': doctor_data.get('photo') or ""
                }
        
        return jsonify({
            "authenticated": True,
            "user": user_data
        }), 200
    except Error as e:
        # 確保有 except 區塊來捕獲資料庫錯誤
        print(f"❌ 獲取使用者資料失敗: {e}")
        return jsonify({"authenticated": True, "user": user_data, "error": f"資料庫錯誤: {e}"}), 200
    finally:
        # 確保有 finally 區塊來關閉連線
        cursor.close()
        db.close()




    

# 新增病患個人資料更新
@app.route("/api/patient/profile", methods=["PUT"])
def update_patient_profile():
    """更新病患的健康資料"""
    if 'user_id' not in session or session.get('role') != 'patient':
        return jsonify({"message": "請先登入病患帳號"}), 401

    data = request.get_json()
    user_id = session.get('user_id')

    # 取得要更新的欄位
    id_number = data.get("id_number")
    smoking_status = data.get("smoking_status")
    drug_allergies = data.get("drug_allergies")
    medical_history = data.get("medical_history")
    chronic_disease_list = data.get("chronic_disease", [])
    chronic_disease = ",".join(chronic_disease_list)
    other_chronic_disease = data.get("other_chronic_disease")
    height = data.get("height")                     
    weight = data.get("weight")
    emergency_contact_name = data.get("emergency_contact_name")
    emergency_contact_phone = data.get("emergency_contact_phone")

    db = get_db()
    cursor = db.cursor()

    try:
        sql = """
            UPDATE patient
            SET 
                id_number = %s,
                smoking_status = %s,
                drug_allergies = %s,
                medical_history = %s,
                chronic_disease = %s,
                other_chronic_disease = %s,       
                height = %s,                
                weight = %s, 
                emergency_contact_name = %s,
                emergency_contact_phone = %s
            WHERE user_id = %s
        """
        cursor.execute(sql, (
            id_number, smoking_status, drug_allergies, medical_history,
            chronic_disease, other_chronic_disease, height, weight,
            emergency_contact_name, emergency_contact_phone, user_id
        ))
        db.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "找不到病患資料或資料無變更"}), 404

        return jsonify({
            "success": True,
            "message": "病患資料更新成功"
        }), 200

    except Error as e:
        db.rollback()
        print(f"❌ 病患資料更新失敗: {e}")
        return jsonify({"message": f"更新失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


# 新增醫師專業資料更新
@app.route("/api/doctor/profile", methods=["PUT"])
def update_doctor_profile():
    """更新醫師的專業資料"""
    if 'user_id' not in session or session.get('role') != 'doctor':
        return jsonify({"message": "請先登入醫師帳號"}), 401

    user_id = session.get('user_id')
    data = request.get_json()

    # 取得要更新的欄位 (根據 page.js 編輯模式的欄位)
    phone_number = data.get("phone_number")
    specialty = data.get("specialty")
    practice_hospital = data.get("practice_hospital")
    education = data.get("education")
    description = data.get("description")
    experience = data.get("experience")
    qualifications = data.get("qualifications")
    consultation_fee = data.get("consultation_fee", 0)
    consultation_type = data.get("consultation_type", "現場看診")
    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # 取得對應 doctor_id
        cursor.execute("SELECT doctor_id FROM doctor WHERE user_id = %s", (user_id,))
        doctor = cursor.fetchone()

        if not doctor:
            return jsonify({"message": "找不到醫師資料"}), 404

        doctor_id = doctor["doctor_id"]

        # 1️⃣ 更新 doctor 表中的基本資料
        cursor.execute("""
            UPDATE doctor
            SET phone_number = %s,
                specialty = %s,
                practice_hospital = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE doctor_id = %s
        """, (phone_number, specialty, practice_hospital, doctor_id))

        # 2️⃣ 更新 doctor_info 表中的詳細資料
        cursor.execute("""
            UPDATE doctor_info
            SET phone_number = %s,
                specialty = %s,
                practice_hospital = %s,
                education = %s,
                description = %s,
                experience = %s,
                qualifications = %s,
                consultation_fee = %s,
                consultation_type = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE doctor_id = %s
        """, (
            phone_number, specialty, practice_hospital,
            education, description, experience, qualifications,
            consultation_fee, consultation_type, doctor_id
        ))
        db.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "找不到醫師資料或資料無變更"}), 404

        return jsonify({
            "success": True,
            "message": "醫師專業資料更新成功"
        }), 200

    except Error as e:
        db.rollback()
        print(f"❌ 醫師資料更新失敗: {e}")
        return jsonify({"message": f"更新失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()



@app.route("/uploads/profile_pictures/<filename>", methods=["GET"])
def get_doctor_photo(filename):
    """從 profile_pictures 資料夾提供醫師照片檔案"""
    return send_from_directory(PROFILE_PICTURE_FOLDER, filename)
# app.py (新增 /api/doctor/upload-photo 路由)

@app.route("/api/doctor/upload-photo", methods=["POST"])
def upload_doctor_photo():
    """上傳醫師個人照片，並在 doctor_info 中更新/新增 'photo' 欄位"""
    if 'user_id' not in session or session.get('role') != 'doctor':
        return jsonify({"message": "請先登入醫師帳號"}), 401
        
    doctor_id = session.get('doctor_id') # 假設 session 中有 doctor_id
    
    # ... (檔案檢查部分，與前次建議相同)
    if 'photo' not in request.files or request.files['photo'].filename == '':
        return jsonify({'message': '未選擇檔案'}), 400
    
    file = request.files['photo']
    
    if file and allowed_photo_file(file.filename):
        original_filename = secure_filename(file.filename)
        # 生成唯一檔名：doctor_id_時間戳_副檔名
        name, ext = os.path.splitext(original_filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{doctor_id}_{timestamp}{ext}" 
        
        filepath = os.path.join(PROFILE_PICTURE_FOLDER, unique_filename)
        
        # 儲存檔案
        file.save(filepath)
        
        db = get_db()
        cursor = db.cursor()
        
        try:
            # ⭐ CHECK: 檢查 doctor_info 是否存在該 doctor 的記錄
            cursor.execute("SELECT COUNT(*) FROM doctor_info WHERE doctor_id = %s", (doctor_id,))
        
            info_count = cursor.fetchone()[0]

            if info_count > 0:
                # ⭐ UPDATE: 如果記錄存在 (count > 0)，則更新 photo 欄位
                sql = """
                    UPDATE doctor_info
                    SET photo = %s
                    WHERE doctor_id = %s
                """
                cursor.execute(sql, (unique_filename, doctor_id))
            else:
                # ⭐ INSERT: 如果記錄不存在 (count == 0)，則新增一條記錄
                # 這裡假設 doctor_info 表格中的其他欄位可以為 NULL 或有預設值
                sql = """
                    INSERT INTO doctor_info (doctor_id, photo)
                    VALUES (%s, %s)
                """
                cursor.execute(sql, (doctor_id, unique_filename))

            db.commit()
            
            print(f"✅ 醫師照片已儲存並更新 DB: {filepath}")
            return jsonify({
                'success': True,
                'message': '照片上傳成功',
                'photo_path': unique_filename
            }), 200
            
        except Exception as e: # 保持使用 Exception 處理廣泛錯誤
            db.rollback()
            if os.path.exists(filepath):
                os.remove(filepath)
            print(f"❌ 資料庫更新失敗: {e}")
            return jsonify({"message": f"資料庫更新失敗或伺服器錯誤: {str(e)}"}), 500
        finally:
            cursor.close()
            db.close()
            
    return jsonify({'message': '不支持的檔案格式 (僅支持 PNG, JPG, JPEG)'}), 400

@app.route("/api/logout", methods=["POST"])
def logout_user():
    """登出"""
    session.clear()
    return jsonify({"message": "登出成功"}), 200
from datetime import date, datetime, time, timedelta

def serialize_datetime(obj):
    """將 MySQL 的 date/time/timedelta 轉換成字串"""
    if isinstance(obj, (date, datetime)):
        return obj.strftime('%Y-%m-%d')
    if isinstance(obj, time):
        return obj.strftime('%H:%M:%S')
    if isinstance(obj, timedelta):
        # 將 timedelta 轉換為時:分:秒格式
        total_seconds = int(obj.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02}:{minutes:02}:{seconds:02}"
    return obj


@app.route("/api/record", methods=["GET"])
def get_record():
    """病患的預約記錄"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    user_id = session['user_id']
    role = session.get('role')
    
    # 驗證是否為病患
    if role != 'patient':
        return jsonify({"message": "此功能僅供病患使用"}), 403
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        patient_id = session.get('patient_id')
        
        if not patient_id:
            return jsonify({"message": "找不到病患資料"}), 404
        
        query = """
            SELECT 
                a.appointment_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.cancellation_reason,
                a.doctor_advice,
                d.first_name,
                d.last_name,
                d.specialty as doctor_specialty
            FROM appointments a
            INNER JOIN doctor d ON a.doctor_id = d.doctor_id
            WHERE a.patient_id = %s
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        """
        
        cursor.execute(query, (patient_id,))
        appointments = cursor.fetchall()
        
        # 格式化資料，確保所有欄位都有值
        formatted_appointments = []
        for a in appointments:
            formatted_appointments.append({
                "appointment_id": a["appointment_id"],
                "appointment_date": serialize_datetime(a["appointment_date"]),
                "appointment_time": serialize_datetime(a["appointment_time"]),
                "status": a["status"] or "",
                "cancellation_reason": a["cancellation_reason"] or "",
                "doctor_advice": a["doctor_advice"] or "",
                "first_name": a["first_name"] or "",
                "last_name": a["last_name"] or "",
                "doctor_specialty": a["doctor_specialty"] or ""
            })
        
        print(f"✅ 成功取得 {len(formatted_appointments)} 筆病患預約記錄")
        return jsonify(formatted_appointments), 200
        
    except Exception as e:
        print(f"❌ 取得病患預約記錄失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"取得歷史記錄失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

        
@app.route("/api/recordoc", methods=["GET"])
def get_recordoc():
    """醫師的預約記錄"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    user_id = session['user_id']
    role = session.get('role')
    
    # 驗證是否為醫師
    if role != 'doctor':
        return jsonify({"message": "此功能僅供醫師使用"}), 403
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        doctor_id = session.get('doctor_id')
        
        if not doctor_id:
            return jsonify({"message": "找不到醫師資料"}), 404
        
        query = """
            SELECT 
                a.appointment_id,
                a.appointment_date,
                a.appointment_time,
                a.cancellation_reason,
                a.status,
                a.doctor_advice,
                p.first_name,
                p.last_name
            FROM appointments a
            INNER JOIN patient p ON a.patient_id = p.patient_id
            WHERE a.doctor_id = %s
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        """
        
        cursor.execute(query, (doctor_id,))
        appointments = cursor.fetchall()
        
        # 格式化資料，確保所有欄位都有值
        formatted_appointments = []
        for a in appointments:
            formatted_appointments.append({
                "appointment_id": a["appointment_id"],
                "appointment_date": serialize_datetime(a["appointment_date"]),
                "appointment_time": serialize_datetime(a["appointment_time"]),
                "status": a["status"] or "",
                "cancellation_reason": a["cancellation_reason"] or "",
                "doctor_advice": a["doctor_advice"] or "",
                "first_name": a["first_name"] or "",
                "last_name": a["last_name"] or ""
            })
        
        print(f"✅ 成功取得 {len(formatted_appointments)} 筆醫師預約記錄")
        return jsonify(formatted_appointments), 200
        
    except Exception as e:
        print(f"❌ 取得醫師預約記錄失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"取得歷史記錄失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()
@app.route("/api/recordmech", methods=["GET"])
def get_recordmech():
    """機構管理者的預約記錄（顯示該機構旗下所有醫師的預約）"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401

    user_id = session['user_id']
    role = session.get('role')

    # 驗證是否為機構管理者
    if role != 'mech':
        return jsonify({"message": "此功能僅供機構管理者使用"}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # 取得機構 ID
        cursor.execute(
            "SELECT mechanism_id FROM mechanism WHERE user_id = %s",
            (user_id,)
        )
        mechanism = cursor.fetchone()

        if not mechanism:
            return jsonify({"message": "找不到機構資料"}), 404

        mechanism_id = mechanism['mechanism_id']

        query = """
            SELECT
                a.appointment_id,
                a.appointment_date,
                a.appointment_time,
                a.cancellation_reason,
                a.status,
                a.doctor_advice,
                p.first_name  AS patient_first_name,
                p.last_name   AS patient_last_name,
                d.first_name  AS doctor_first_name,
                d.last_name   AS doctor_last_name,
                d.specialty
            FROM appointments a
            INNER JOIN patient p ON a.patient_id = p.patient_id
            INNER JOIN doctor d  ON a.doctor_id  = d.doctor_id
            WHERE d.mechanism_id = %s
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        """

        cursor.execute(query, (mechanism_id,))
        appointments = cursor.fetchall()

        # 格式化資料
        formatted_appointments = []
        for a in appointments:
            formatted_appointments.append({
                "appointment_id":     a["appointment_id"],
                "appointment_date":   serialize_datetime(a["appointment_date"]),
                "appointment_time":   serialize_datetime(a["appointment_time"]),
                "status":             a["status"] or "",
                "cancellation_reason": a["cancellation_reason"] or "",
                "doctor_advice":      a["doctor_advice"] or "",
                "patient_first_name": a["patient_first_name"] or "",
                "patient_last_name":  a["patient_last_name"] or "",
                "doctor_first_name":  a["doctor_first_name"] or "",
                "doctor_last_name":   a["doctor_last_name"] or "",
                "specialty":          a["specialty"] or "",
            })

        print(f"✅ 成功取得機構 {mechanism_id} 共 {len(formatted_appointments)} 筆預約記錄")
        return jsonify(formatted_appointments), 200

    except Exception as e:
        print(f"❌ 取得機構預約記錄失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"取得預約記錄失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()
@app.route('/api/appointments/<int:appointment_id>/advice', methods=['PUT'])

def update_doctor_advice(appointment_id):
    data = request.get_json()
    new_advice = data.get('doctor_advice')

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE appointments
        SET doctor_advice = %s
        WHERE appointment_id = %s
    """, (new_advice, appointment_id))

    conn.commit()

    return jsonify({"message": "Advice updated successfully"}), 200

   

#醫師註冊檔案上傳
@app.route("/api/upload-certificate", methods=["POST"])
def upload_certificate():
    """上傳醫師執業證明"""
    if 'file' not in request.files:
        return jsonify({'message': '未選擇檔案'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'message': '未選擇檔案'}), 400
    
    if file and allowed_file(file.filename):
        # ⭐ 修改這裡：確保檔名正確
        original_filename = secure_filename(file.filename)
        
        # 分離檔名和副檔名
        name, ext = os.path.splitext(original_filename)
        
        # 生成唯一檔名：時間戳_原始檔名.副檔名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{original_filename}"  # ⭐ 保留完整的檔名和副檔名
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # 儲存檔案
        file.save(filepath)
        
        # ⭐ 重點：檢查這裡
        if 'pending_registration' not in session:
            session['pending_registration'] = {}
        
        # ⭐ 只儲存檔名，不要儲存完整路徑
        session['pending_registration']['certificate'] = unique_filename
        session.modified = True  # ⭐ 強制標記 session 已修改
        
        print(f"✅ 檔案已儲存: {filepath}")
        print(f"📦 Session 內容: {session.get('pending_registration')}")
        
        return jsonify({
            'success': True,
            'message': '檔案上傳成功',
            'filename': unique_filename
        }), 200
    
    return jsonify({'message': '不支持的檔案格式 (僅支持 PDF, PNG, JPG)'}), 400


#管理者相關
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    """管理者登入"""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "請輸入帳號與密碼"}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM admin WHERE email = %s", (email,))
        admin = cursor.fetchone()

        if not admin or admin["password_hash"] != password:
            return jsonify({"message": "帳號或密碼錯誤"}), 401

        # ✅ 新增這兩行
        session.permanent = True
        app.permanent_session_lifetime = timedelta(days=7)
        
        session['user_id'] = admin["admin_id"]
        session['admin_id'] = admin["admin_id"]
        session['admin_email'] = email
        session['user_id'] = admin["admin_id"]
        session['is_admin'] = True

        return jsonify({
            "success": True,
            "message": "登入成功",
            "admin": {
                "admin_id": admin["admin_id"],
                "username": admin["username"],
                "email": email
            }
        }), 200

    except Exception as e:
        return jsonify({"message": f"登入失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

@app.route("/api/admin/pending-doctors", methods=["GET"])
def get_pending_doctors():
    """取得待審核醫師列表"""
    if not session.get('is_admin'):
        return jsonify({"message": "無權限"}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        sql = """
            SELECT d.*, u.email, u.created_at as registration_date
            FROM doctor d
            JOIN users u ON d.user_id = u.user_id
            WHERE d.approval_status = 'pending'
            ORDER BY u.created_at DESC
        """
        cursor.execute(sql)
        doctors = cursor.fetchall()

        return jsonify(doctors), 200

    except Exception as e:
        return jsonify({"message": f"查詢失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

@app.route("/api/admin/approve-doctor/<int:doctor_id>", methods=["POST"])
def approve_doctor(doctor_id):
    """核准醫師註冊"""
    if not session.get('is_admin'):
        return jsonify({"message": "無權限"}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # 取得醫師資料
        cursor.execute("""
            SELECT d.*, u.email 
            FROM doctor d
            JOIN users u ON d.user_id = u.user_id
            WHERE d.doctor_id = %s
        """, (doctor_id,))
        doctor = cursor.fetchone()

        if not doctor:
            return jsonify({"message": "找不到該醫師"}), 404

        # 更新審核狀態
        cursor.execute("""
            UPDATE doctor 
            SET approval_status = 'approved', approval_date = NOW()
            WHERE doctor_id = %s
        """, (doctor_id,))
        db.commit()

        # 發送審核通過郵件
        doctor_name = doctor['first_name'] + doctor['last_name']
        send_approval_email(doctor['email'], doctor_name)

        return jsonify({
            "success": True,
            "message": "已核准並發送通知郵件"
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"message": f"核准失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

@app.route("/api/admin/reject-doctor/<int:doctor_id>", methods=["POST"])
def reject_doctor(doctor_id):
    """拒絕醫師註冊"""
    if not session.get('is_admin'):
        return jsonify({"message": "無權限"}), 403

    data = request.get_json()
    reason = data.get("reason", "資料不符合要求")

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            UPDATE doctor 
            SET approval_status = 'rejected', approval_date = NOW(), rejection_reason = %s
            WHERE doctor_id = %s
        """, (reason, doctor_id))
        db.commit()

        return jsonify({
            "success": True,
            "message": "已拒絕該醫師註冊"
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"message": f"操作失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

# 將這些代碼替換到 app.py 中

@app.route("/api/admin/users", methods=["GET"])
def get_users():
    """獲取已審核的醫師或註冊患者列表"""
    if not session.get('is_admin'):
        return jsonify({"message": "無權限"}), 403

    user_type = request.args.get('type', 'doctor')
    search_query = request.args.get('search', '').strip()
    db = get_db()
    cursor = db.cursor(dictionary=True)

    params = []

    try:
        if user_type == 'doctor':
            sql = """
                SELECT 
                    d.doctor_id as user_id,
                    d.first_name,
                    d.last_name,
                    d.gender,
                    d.phone_number,
                    d.specialty,
                    d.practice_hospital,
                    d.approval_status,
                    u.email,
                    u.account_status,
                    u.created_at as registration_date
                FROM doctor d
                JOIN users u ON d.user_id = u.user_id
                WHERE d.approval_status = 'approved' 
            """
            if search_query:
                # 假設我們要搜尋 醫師的姓名、Email 或醫院
                sql += """
                    AND (
                        d.first_name LIKE %s OR 
                        d.last_name LIKE %s OR 
                        d.practice_hospital LIKE %s OR
                        u.email LIKE %s
                    )
                """
                # 使用 %s 作為佔位符，並將實際值添加到 params 列表中
                # 注意：LIKE 查詢需要手動添加 %
                search_term = f"%{search_query}%"
                params.extend([search_term, search_term, search_term, search_term])
                
            sql += " ORDER BY u.created_at DESC"

        else:  # patient
            sql = """
                SELECT 
                    p.patient_id as user_id,
                    p.first_name,
                    p.last_name,
                    p.gender,
                    p.phone_number,
                    p.date_of_birth,
                    u.email,
                    u.account_status,
                    u.created_at as registration_date
                FROM patient p
                JOIN users u ON p.user_id = u.user_id 
                
            """
            if search_query:
                # 由於 patient 沒有 approval_status，直接在 JOIN 之後加 WHERE
                sql += """
                    WHERE (
                    p.first_name LIKE %s OR 
                    p.last_name LIKE %s OR 
                    u.email LIKE %s
                    )
                """
                search_term = f"%{search_query}%"
                params.extend([search_term, search_term, search_term])
                sql += " ORDER BY u.created_at DESC"
        print(f"Executing SQL: {sql.strip()}") 
        print(f"with params: {params}")
        cursor.execute(sql, tuple(params))
        users = cursor.fetchall()

        # 格式化日期
        for user in users:
            if user.get('registration_date'):
                user['registration_date'] = serialize_datetime(user['registration_date'])
            if user.get('date_of_birth'):
                user['date_of_birth'] = serialize_datetime(user['date_of_birth'])

        return jsonify(users), 200

    except Exception as e:
        print(f"❌ 查詢使用者失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"查詢失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/admin/toggle-user-status/<int:user_id>", methods=["PATCH"])
def toggle_user_status(user_id):
    """啟用或停用使用者帳號"""
    if not session.get('is_admin'):
        return jsonify({"message": "無權限"}), 403

    data = request.get_json()
    new_status = data.get('status')  # 'active' 或 'suspended'
    
    if new_status not in ['active', 'suspended']:
        return jsonify({"message": "無效的狀態"}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # 先找出對應的 users.user_id
        # 前端傳來的 user_id 可能是 doctor_id 或 patient_id
        cursor.execute("""
            SELECT u.user_id 
            FROM users u
            LEFT JOIN doctor d ON u.user_id = d.user_id
            LEFT JOIN patient p ON u.user_id = p.user_id
            WHERE d.doctor_id = %s OR p.patient_id = %s
        """, (user_id, user_id))
        
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"message": "找不到使用者"}), 404
        
        actual_user_id = result['user_id']
        
        # 更新帳號狀態
        cursor.execute("""
            UPDATE users 
            SET account_status = %s 
            WHERE user_id = %s
        """, (new_status, actual_user_id))
        
        db.commit()

        action = "已停用" if new_status == 'suspended' else "已啟用"
        return jsonify({
            "success": True,
            "message": f"使用者{action}"
        }), 200

    except Exception as e:
        db.rollback()
        print(f"❌ 更新狀態失敗: {str(e)}")
        return jsonify({"message": f"操作失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/admin/delete-user/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    """刪除使用者（包含所有相關資料）"""
    if not session.get('is_admin'):
        return jsonify({"message": "無權限"}), 403

    data = request.get_json()
    role = data.get('role')  # 'doctor' 或 'patient'
    
    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        if role == 'doctor':
            # 先找出 users.user_id
            cursor.execute("SELECT user_id FROM doctor WHERE doctor_id = %s", (user_id,))
            result = cursor.fetchone()
            
            if not result:
                return jsonify({"message": "找不到醫師"}), 404
            
            actual_user_id = result['user_id']
            
            # 刪除順序：先刪除外鍵關聯的資料
            cursor.execute("DELETE FROM doctor_info WHERE doctor_id = %s", (user_id,))
            cursor.execute("DELETE FROM schedules WHERE doctor_id = %s", (user_id,))
            cursor.execute("DELETE FROM appointments WHERE doctor_id = %s", (user_id,))
            cursor.execute("DELETE FROM doctor WHERE doctor_id = %s", (user_id,))
            cursor.execute("DELETE FROM users WHERE user_id = %s", (actual_user_id,))
            
        else:  # patient
            cursor.execute("SELECT user_id FROM patient WHERE patient_id = %s", (user_id,))
            result = cursor.fetchone()
            
            if not result:
                return jsonify({"message": "找不到患者"}), 404
            
            actual_user_id = result['user_id']
            
            # 刪除患者相關資料
            cursor.execute("DELETE FROM appointments WHERE patient_id = %s", (user_id,))
            cursor.execute("DELETE FROM patient WHERE patient_id = %s", (user_id,))
            cursor.execute("DELETE FROM users WHERE user_id = %s", (actual_user_id,))
        
        db.commit()

        return jsonify({
            "success": True,
            "message": "使用者已刪除"
        }), 200

    except Exception as e:
        db.rollback()
        print(f"❌ 刪除失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"刪除失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()
        
# 1. 新增取得醫師 Profile 的 API
@app.route("/api/doctor/profile", methods=["GET"])
def get_doctor_profile():
    """取得醫師的 doctor_id 和基本資料"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"message": "缺少 user_id"}), 400
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        print(f"🔍 查詢 user_id={user_id} 的醫師資料")
        
        cursor.execute("""
            SELECT doctor_id, user_id, first_name, last_name, 
                   gender, phone_number, specialty, practice_hospital, 
                   approval_status
            FROM doctor 
            WHERE user_id = %s
        """, (user_id,))
        
        doctor = cursor.fetchone()
        
        if not doctor:
            print(f"❌ 找不到 user_id={user_id} 的醫師資料")
            return jsonify({"message": "找不到醫師資料"}), 404
        
        print(f"✅ 找到醫師: doctor_id={doctor['doctor_id']}, {doctor['first_name']}{doctor['last_name']}")
        return jsonify(doctor), 200
        
    except Exception as e:
        print(f"❌ 查詢失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"查詢失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


# 2. 取得排班資料
@app.route('/api/schedules/<int:doctor_id>', methods=['GET'])
def get_doctor_schedules(doctor_id):
    """
    取得醫師排班
    - 查詢前自動清理過期記錄
    - 只返回有效的排班資料
    """
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # ✅ 查詢前先清理過期記錄
        cursor.execute("""
            DELETE FROM schedules 
            WHERE doctor_id = %s 
            AND TIMESTAMP(schedule_date, time_slot) < NOW()
        """, (doctor_id,))
        
        deleted_count = cursor.rowcount
        if deleted_count > 0:
            print(f"✅ 查詢時清理了 {deleted_count} 筆過期排班")
            db.commit()
        
        # 查詢有效排班
        if start_date and end_date:
            query = """
                SELECT 
                    schedule_id,
                    doctor_id,
                    DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date,
                    time_slot,
                    is_available
                FROM schedules
                WHERE doctor_id = %s
                AND schedule_date BETWEEN %s AND %s
                ORDER BY schedule_date ASC, time_slot ASC
            """
            cursor.execute(query, (doctor_id, start_date, end_date))
        else:
            query = """
                SELECT 
                    schedule_id,
                    doctor_id,
                    DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date,
                    time_slot,
                    is_available
                FROM schedules
                WHERE doctor_id = %s
                ORDER BY schedule_date ASC, time_slot ASC
            """
            cursor.execute(query, (doctor_id,))
        
        schedules = cursor.fetchall()
        
        for s in schedules:
            for key, val in s.items():
                s[key] = serialize_datetime(val)
        
        cursor.close()
        db.close()
        
        return jsonify(schedules), 200
        
    except Exception as e:
        print(f"❌ 取得排班錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "查詢失敗"}), 500


# 取得所有排班（前端預約頁面使用）
@app.route('/api/schedules', methods=['GET'])
def get_all_schedules():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                schedule_id,
                doctor_id,
                DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date,
                time_slot,
                is_available
            FROM schedules
            WHERE is_available = 1
            AND TIMESTAMP(schedule_date, time_slot) >= NOW()
            ORDER BY schedule_date ASC, time_slot ASC
        """)
        schedules = cursor.fetchall()
        for s in schedules:
            for key, val in s.items():
                s[key] = serialize_datetime(val)
        return jsonify(schedules), 200
    except Exception as e:
        print(f"❌ 取得所有排班錯誤: {str(e)}")
        return jsonify({"error": "查詢失敗"}), 500
    finally:
        cursor.close()
        db.close()


# 3. 儲存排班
@app.route('/api/schedules', methods=['POST'])
def save_schedules():
    """
    儲存醫師排班
    - 只儲存「開診」的時段（is_available = 1）
    - 自動刪除過期的排班記錄
    - 檢查預約衝突
    """
    try:
        data = request.get_json()
        doctor_id = data.get('doctor_id')
        schedules = data.get('schedules', [])
        
        if not doctor_id:
            return jsonify({"error": "缺少必要參數"}), 400
        
        # 取得週範圍（前端送來的，確保全週都能正確刪除）
        week_start = data.get('week_start')
        week_end = data.get('week_end')
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # 步驟 1: 清理過期的排班記錄
        cursor.execute("""
            DELETE FROM schedules 
            WHERE doctor_id = %s 
            AND TIMESTAMP(schedule_date, time_slot) < NOW()
        """, (doctor_id,))
        
        deleted_count = cursor.rowcount
        if deleted_count > 0:
            print(f"✅ 已清理 {deleted_count} 筆過期排班記錄")
        
        # 步驟 2: 刪除這週所有舊排班（用前端傳來的週範圍，schedules 為空也能正確清除）
        if week_start and week_end:
            min_date, max_date = week_start, week_end
        elif schedules:
            dates = list(set([item['date'] for item in schedules]))
            min_date = min(dates)
            max_date = max(dates)
        else:
            db.commit()
            cursor.close()
            db.close()
            return jsonify({"success": True, "message": "無變更", "updated_count": 0}), 200
        
        # 步驟 3: 刪除該日期範圍內所有舊的排班記錄（準備重新插入）
        cursor.execute("""
            DELETE FROM schedules 
            WHERE doctor_id = %s 
            AND schedule_date BETWEEN %s AND %s
        """, (doctor_id, min_date, max_date))
        
        print(f"✅ 已清除 {min_date} 至 {max_date} 的舊排班記錄")
        
        # ✅ 步驟 4: 只插入「開診」的時段
        success_count = 0
        conflict_count = 0
        conflict_details = []
        
        for item in schedules:
            schedule_date = item.get('date')
            time_slot = item.get('time_slot')
            is_available = item.get('is_available', 0)
            
            if not schedule_date or not time_slot:
                continue
            
            # 只處理開診的時段
            if is_available != 1:
                continue
            
            # 檢查是否有預約（防止誤刪有預約的時段）
            cursor.execute("""
                SELECT 
                    a.appointment_id,
                    CONCAT(p.last_name, p.first_name) as patient_name
                FROM appointments a
                INNER JOIN patient p ON a.patient_id = p.patient_id
                WHERE a.doctor_id = %s 
                AND a.appointment_date = %s 
                AND a.appointment_time = %s
                AND a.status IN ('待確認', '已確認')
            """, (doctor_id, schedule_date, time_slot))
            
            existing_appointment = cursor.fetchone()
            
            # 插入開診時段
            cursor.execute("""
                INSERT INTO schedules (doctor_id, schedule_date, time_slot, is_available)
                VALUES (%s, %s, %s, 1)
            """, (doctor_id, schedule_date, time_slot))
            
            success_count += 1
        
        db.commit()
        cursor.close()
        db.close()
        
        response = {
            "success": True,
            "message": f"成功儲存 {success_count} 個開診時段",
            "updated_count": success_count,
            "deleted_expired": deleted_count
        }
        
        if conflict_count > 0:
            response["warning"] = f"有 {conflict_count} 個時段因已有預約而保留"
            response["conflicts"] = conflict_details
        
        return jsonify(response), 200
        
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        print(f"❌ 儲存排班錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "儲存失敗"}), 500

#讀取證明檔案
@app.route("/api/admin/certificate/<filename>", methods=["GET"])
def get_certificate(filename):
    """管理者查看醫師執業證明"""

    # ⭐ 加入詳細的除錯訊息
    print("=" * 60)
    print("📂 收到證明檔案請求")
    print(f"   檔案名: {filename}")
    print(f"   Session 內容: {dict(session)}")
    print(f"   is_admin: {session.get('is_admin')}")
    print(f"   admin_id: {session.get('admin_id')}")
    print("=" * 60)


    if not session.get('is_admin'):
        return jsonify({"message": "無權限"}), 403
    
    print(f"📂 請求檔案: {filename}")
    print(f"📁 檔案路徑: {app.config['UPLOAD_FOLDER']}")

    # ⭐ 先定義 full_path
    full_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    print(f"📁 完整路徑: {full_path}")
    print(f"📁 檔案是否存在: {os.path.exists(full_path)}")
    
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        print(f"❌ 檔案不存在: {str(e)}")
        return jsonify({"message": f"檔案不存在: {str(e)}"}), 404

@app.route("/api/admin/feedback/read", methods=["PATCH"])
def mark_feedback_read():
    """管理員標記回報為已處理"""
    if not session.get('is_admin'):
        return jsonify({"message": "無權限"}), 403
    
    data = request.get_json()
    feedback_id = data.get('feedback_id')
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 獲取回報資料
        cursor.execute("""
            SELECT patient_id, feedback_text 
            FROM feedback 
            WHERE feedback_id = %s
        """, (feedback_id,))
        
        feedback = cursor.fetchone()
        
        if not feedback:
            return jsonify({"message": "回報不存在"}), 404
        
        # 更新回報狀態
        cursor.execute("""
            UPDATE feedback 
            SET status = 'read'
            WHERE feedback_id = %s
        """, (feedback_id,))
        
        # ✅ 創建通知給患者
        if feedback['patient_id']:
            cursor.execute("""
                INSERT INTO notifications (patient_id, type, title, message, related_id)
                VALUES (%s, 'feedback_resolved', '問題回報已處理', %s, %s)
            """, (
                feedback['patient_id'],
                '感謝您的回報,我們已收到並處理您的問題',
                feedback_id
            ))
        
        db.commit()
        
        return jsonify({
            "success": True,
            "message": "已標記為已處理並通知患者"
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"❌ 更新失敗: {str(e)}")
        return jsonify({"message": f"操作失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

@app.route("/api/appointments/history", methods=["GET"])
def get_appointment_history():
    """獲取用戶的看診歷史記錄"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    user_id = session.get('user_id')
    role = session.get('role')
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        if role == 'patient':
            patient_id = session.get('patient_id')
            query = """
                SELECT 
                    a.appointment_id,
                    a.appointment_date,
                    a.appointment_time,
                    a.status,
                    a.symptoms,
                    a.consultation_notes,
                    a.recording_url,
                    a.recording_duration,
                    a.meeting_started_at,
                    a.meeting_ended_at,
                    d.doctor_id,
                    d.first_name as doctor_first_name,
                    d.last_name as doctor_last_name,
                    d.specialty as doctor_specialty,
                    d.practice_hospital
                FROM appointments a
                INNER JOIN doctor d ON a.doctor_id = d.doctor_id
                WHERE a.patient_id = %s 
                AND a.status = '已完成'
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
                LIMIT 50
            """
            cursor.execute(query, (patient_id,))
            
        elif role == 'doctor':
            doctor_id = session.get('doctor_id')
            query = """
                SELECT 
                    a.appointment_id,
                    a.appointment_date,
                    a.appointment_time,
                    a.status,
                    a.symptoms,
                    a.consultation_notes,
                    a.recording_url,
                    a.recording_duration,
                    a.meeting_started_at,
                    a.meeting_ended_at,
                    p.patient_id,
                    p.first_name as patient_first_name,
                    p.last_name as patient_last_name,
                    p.gender as patient_gender,
                    p.date_of_birth as patient_dob
                FROM appointments a
                INNER JOIN patient p ON a.patient_id = p.patient_id
                WHERE a.doctor_id = %s 
                AND a.status = '已完成'
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
                LIMIT 50
            """
            cursor.execute(query, (doctor_id,))
        else:
            return jsonify({"message": "無效的用戶角色"}), 400
        
        history = cursor.fetchall()
        
        # 格式化日期時間
        for record in history:
            record['appointment_date'] = serialize_datetime(record['appointment_date'])
            record['appointment_time'] = serialize_datetime(record['appointment_time'])
            if 'patient_dob' in record and record['patient_dob']:
                record['patient_dob'] = serialize_datetime(record['patient_dob'])
            if record.get('meeting_started_at'):
                record['meeting_started_at'] = serialize_datetime(record['meeting_started_at'])
            if record.get('meeting_ended_at'):
                record['meeting_ended_at'] = serialize_datetime(record['meeting_ended_at'])
        
        return jsonify(history), 200
        
    except Exception as e:
        print(f"❌ 獲取歷史記錄失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"獲取歷史記錄失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/meeting/check/<int:appointment_id>", methods=["GET"])
def check_meeting_room(appointment_id):
    """檢查會議室是否已創建（供病患端使用）"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 驗證該預約屬於當前用戶
        role = session.get('role')
        
        if role == 'patient':
            patient_id = session.get('patient_id')
            cursor.execute("""
                SELECT 
                    appointment_id,
                    meeting_room_id,
                    status,
                    meeting_started_at,
                    meeting_ended_at
                FROM appointments 
                WHERE appointment_id = %s AND patient_id = %s
            """, (appointment_id, patient_id))
        elif role == 'doctor':
            doctor_id = session.get('doctor_id')
            cursor.execute("""
                SELECT 
                    appointment_id,
                    meeting_room_id,
                    status,
                    meeting_started_at,
                    meeting_ended_at
                FROM appointments 
                WHERE appointment_id = %s AND doctor_id = %s
            """, (appointment_id, doctor_id))
        else:
            return jsonify({"message": "無效的用戶角色"}), 400
        
        appointment = cursor.fetchone()
        
        if not appointment:
            return jsonify({"message": "預約不存在或無權限"}), 404
        
        return jsonify({
            "success": True,
            "meeting_room_id": appointment['meeting_room_id'],
            "status": appointment['status'],
            "is_active": appointment['meeting_room_id'] is not None and appointment['meeting_ended_at'] is None,
            "has_started": appointment['meeting_started_at'] is not None
        }), 200
        
    except Exception as e:
        print(f"❌ 檢查會議室失敗: {str(e)}")
        return jsonify({"message": f"檢查會議室失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/meeting/start", methods=["POST"])
def start_meeting():
    """醫師開始會議時記錄開始時間"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    if session.get('role') != 'doctor':
        return jsonify({"message": "僅醫師可開始會議"}), 403
    
    data = request.get_json()
    appointment_id = data.get('appointment_id')
    
    if not appointment_id:
        return jsonify({"message": "缺少預約 ID"}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        # 更新會議開始時間
        cursor.execute("""
            UPDATE appointments 
            SET meeting_started_at = NOW()
            WHERE appointment_id = %s AND meeting_started_at IS NULL
        """, (appointment_id,))
        
        db.commit()
        
        return jsonify({
            "success": True,
            "message": "會議已開始"
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"❌ 記錄會議開始時間失敗: {str(e)}")
        return jsonify({"message": f"記錄失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


# 優化上傳錄影端點 - 增加錯誤處理和日誌
@app.route("/api/meeting/upload-recording", methods=["POST"])
def upload_recording_improved():
    """上傳看診錄影（改進版）"""
    print("=" * 60)
    print("📤 收到錄影上傳請求")
    
    if 'user_id' not in session:
        print("❌ 用戶未登入")
        return jsonify({"message": "請先登入"}), 401
    
    # 檢查是否為醫師
    if session.get('role') != 'doctor':
        print("❌ 非醫師用戶嘗試上傳")
        return jsonify({"message": "僅醫師可上傳錄影"}), 403
    
    if 'video' not in request.files:
        print("❌ 請求中沒有 video 檔案")
        return jsonify({'message': '未選擇錄影檔案'}), 400
    
    file = request.files['video']
    appointment_id = request.form.get('appointment_id')
    duration = request.form.get('duration', 0)
    
    print(f"📋 預約 ID: {appointment_id}")
    print(f"📹 檔案名稱: {file.filename}")
    print(f"⏱️  錄影時長: {duration} 秒")
    
    if not appointment_id:
        print("❌ 缺少預約 ID")
        return jsonify({'message': '缺少預約 ID'}), 400
    
    if file.filename == '':
        print("❌ 檔案名稱為空")
        return jsonify({'message': '未選擇檔案'}), 400
    
    try:
        # 驗證預約屬於當前醫師
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        doctor_id = session.get('doctor_id')
        cursor.execute("""
            SELECT appointment_id, doctor_id, status
            FROM appointments 
            WHERE appointment_id = %s AND doctor_id = %s
        """, (appointment_id, doctor_id))
        
        appointment = cursor.fetchone()
        
        if not appointment:
            print("❌ 預約不存在或無權限")
            return jsonify({'message': '預約不存在或無權限'}), 404
        
        # 生成唯一檔名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = secure_filename(f"recording_{appointment_id}_{timestamp}.webm")
        filepath = os.path.join(app.config['RECORDING_FOLDER'], filename)
        
        print(f"💾 儲存路徑: {filepath}")
        
        # 儲存檔案
        file.save(filepath)
        
        # 檢查檔案大小
        file_size = os.path.getsize(filepath)
        file_size_mb = file_size / 1024 / 1024
        
        print(f"✅ 檔案已儲存，大小: {file_size_mb:.2f} MB")
        
        if file_size == 0:
            print("❌ 儲存的檔案大小為 0")
            os.remove(filepath)
            return jsonify({'message': '錄影檔案無效'}), 400
        
        # 更新資料庫
        try:
            cursor.execute("""
                UPDATE appointments 
                SET recording_url = %s, 
                    recording_duration = %s,
                    updated_at = NOW()
                WHERE appointment_id = %s
            """, (filename, duration, appointment_id))
            db.commit()
            
            print(f"✅ 資料庫已更新")
            print("=" * 60)
            
            return jsonify({
                'success': True,
                'message': '錄影上傳成功',
                'filename': filename,
                'size': file_size,
                'size_mb': round(file_size_mb, 2)
            }), 200
            
        except Exception as e:
            db.rollback()
            print(f"❌ 資料庫更新失敗: {str(e)}")
            import traceback
            traceback.print_exc()
            # 刪除已上傳的檔案
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'message': f'儲存失敗: {str(e)}'}), 500
            
    except Exception as e:
        print(f"❌ 檔案儲存失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'上傳失敗: {str(e)}'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


# 添加檢查錄影是否存在的端點
@app.route("/api/recording/check/<int:appointment_id>", methods=["GET"])
def check_recording(appointment_id):
    """檢查錄影是否存在"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 驗證權限
        role = session.get('role')
        
        if role == 'patient':
            patient_id = session.get('patient_id')
            cursor.execute("""
                SELECT recording_url, recording_duration
                FROM appointments 
                WHERE appointment_id = %s AND patient_id = %s
            """, (appointment_id, patient_id))
        elif role == 'doctor':
            doctor_id = session.get('doctor_id')
            cursor.execute("""
                SELECT recording_url, recording_duration
                FROM appointments 
                WHERE appointment_id = %s AND doctor_id = %s
            """, (appointment_id, doctor_id))
        else:
            return jsonify({"message": "無效的用戶角色"}), 400
        
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"message": "預約不存在或無權限"}), 404
        
        has_recording = result['recording_url'] is not None
        
        return jsonify({
            "success": True,
            "has_recording": has_recording,
            "recording_url": result['recording_url'],
            "duration": result['recording_duration']
        }), 200
        
    except Exception as e:
        print(f"❌ 檢查錄影失敗: {str(e)}")
        return jsonify({"message": f"檢查失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

def generate_meeting_id():
    """生成唯一的會議室 ID"""
    return secrets.token_urlsafe(16)

@app.route("/api/appointments/upcoming", methods=["GET"])
def get_upcoming_appointments():
    """獲取用戶即將到來的預約(預約時間前10分鐘到後25分鐘)"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    user_id = session.get('user_id')
    role = session.get('role')
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 計算時間範圍
        now = datetime.now()
        ten_minutes_before = now - timedelta(minutes=10)  # 預約前10分鐘
        twenty_five_minutes_after = now + timedelta(minutes=25)  # 預約後25分鐘
        
        print(f"⏰ 時間範圍:")
        print(f"   當前時間: {now.strftime('%H:%M:%S')}")
        print(f"   搜尋範圍: {ten_minutes_before.strftime('%H:%M:%S')} ~ {twenty_five_minutes_after.strftime('%H:%M:%S')}")
        
        if role == 'patient':
            patient_id = session.get('patient_id')
            query = """
                SELECT 
                    a.appointment_id,
                    a.appointment_date,
                    a.appointment_time,
                    a.status,
                    a.meeting_room_id,
                    a.symptoms,
                    d.doctor_id,
                    d.first_name as doctor_first_name,
                    d.last_name as doctor_last_name,
                    d.specialty as doctor_specialty,
                    d.practice_hospital,
                    CONCAT(a.appointment_date, ' ', a.appointment_time) as appointment_datetime
                FROM appointments a
                INNER JOIN doctor d ON a.doctor_id = d.doctor_id
                WHERE a.patient_id = %s 
                AND a.status = '已確認'
                AND a.appointment_date = CURDATE()
                AND CONCAT(a.appointment_date, ' ', a.appointment_time) 
                    BETWEEN DATE_SUB(NOW(), INTERVAL 10 MINUTE) 
                    AND DATE_ADD(NOW(), INTERVAL 25 MINUTE)
                ORDER BY a.appointment_time
            """
            cursor.execute(query, (patient_id,))
            
        elif role == 'doctor':
            doctor_id = session.get('doctor_id')
            query = """
                SELECT 
                    a.appointment_id,
                    a.appointment_date,
                    a.appointment_time,
                    a.status,
                    a.meeting_room_id,
                    a.symptoms,
                    p.patient_id,
                    p.first_name as patient_first_name,
                    p.last_name as patient_last_name,
                    p.gender as patient_gender,
                    p.date_of_birth as patient_dob,
                    CONCAT(a.appointment_date, ' ', a.appointment_time) as appointment_datetime
                FROM appointments a
                INNER JOIN patient p ON a.patient_id = p.patient_id
                WHERE a.doctor_id = %s 
                AND a.status = '已確認'
                AND a.appointment_date = CURDATE()
                AND CONCAT(a.appointment_date, ' ', a.appointment_time) 
                    BETWEEN DATE_SUB(NOW(), INTERVAL 10 MINUTE) 
                    AND DATE_ADD(NOW(), INTERVAL 25 MINUTE)
                ORDER BY a.appointment_time
            """
            cursor.execute(query, (doctor_id,))
        else:
            return jsonify({"message": "無效的用戶角色"}), 400
        
        appointments = cursor.fetchall()
        
        # 格式化日期時間並添加額外信息
        for apt in appointments:
            apt['appointment_date'] = serialize_datetime(apt['appointment_date'])
            apt['appointment_time'] = serialize_datetime(apt['appointment_time'])
            if 'patient_dob' in apt and apt['patient_dob']:
                apt['patient_dob'] = serialize_datetime(apt['patient_dob'])
            
            # 計算剩餘時間(分鐘)
            if 'appointment_datetime' in apt:
                appt_dt = datetime.strptime(str(apt['appointment_datetime']), '%Y-%m-%d %H:%M:%S')
                time_diff = (now - appt_dt).total_seconds() / 60
                apt['minutes_since_appointment'] = int(time_diff)
                apt['can_join'] = apt['meeting_room_id'] is not None and -5 <= time_diff <= 25
                # 移除臨時欄位
                del apt['appointment_datetime']
        
        print(f"✅ 找到 {len(appointments)} 筆預約")
        for apt in appointments:
            print(f"   - ID: {apt['appointment_id']}, 時間: {apt['appointment_time']}, " 
                  f"經過: {apt.get('minutes_since_appointment', 0)}分鐘, "
                  f"可進入: {apt.get('can_join', False)}")
        
        return jsonify(appointments), 200
        
    except Exception as e:
        print(f"❌ 獲取預約失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"獲取預約失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/meeting/create", methods=["POST"])
def create_meeting_room():
    """創建或獲取會議室"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    data = request.get_json()
    appointment_id = data.get('appointment_id')
    
    if not appointment_id:
        return jsonify({"message": "缺少預約 ID"}), 400
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 檢查預約是否存在
        cursor.execute("""
            SELECT appointment_id, meeting_room_id, status 
            FROM appointments 
            WHERE appointment_id = %s
        """, (appointment_id,))
        
        appointment = cursor.fetchone()
        
        if not appointment:
            return jsonify({"message": "預約不存在"}), 404
        
        if appointment['status'] != '已確認':
            return jsonify({"message": "預約狀態不正確"}), 400
        
        # 如果已有會議室 ID，直接返回
        if appointment['meeting_room_id']:
            meeting_room_id = appointment['meeting_room_id']
        else:
            # 創建新的會議室 ID
            meeting_room_id = generate_meeting_id()
            
            # 更新到數據庫
            cursor.execute("""
                UPDATE appointments 
                SET meeting_room_id = %s 
                WHERE appointment_id = %s
            """, (meeting_room_id, appointment_id))
            db.commit()
        
        return jsonify({
            "success": True,
            "meeting_room_id": meeting_room_id,
            "appointment_id": appointment_id
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"❌ 創建會議室失敗: {str(e)}")
        return jsonify({"message": f"創建會議室失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

RECORDING_FOLDER = 'uploads/recordings'
ALLOWED_VIDEO_EXTENSIONS = {'webm', 'mp4', 'avi', 'mov'}
app.config['RECORDING_FOLDER'] = RECORDING_FOLDER
app.config['MAX_RECORDING_SIZE'] = 500 * 1024 * 1024  # 500MB
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB

# 確保錄影資料夾存在
os.makedirs(RECORDING_FOLDER, exist_ok=True)

def allowed_video_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS


@app.route("/api/meeting/upload-recording", methods=["POST"])
def upload_recording():
    """上傳看診錄影"""
    print("=" * 60)
    print("📤 收到錄影上傳請求")
    
    if 'user_id' not in session:
        print("❌ 用戶未登入")
        return jsonify({"message": "請先登入"}), 401
    
    if 'video' not in request.files:
        print("❌ 請求中沒有 video 檔案")
        return jsonify({'message': '未選擇錄影檔案'}), 400
    
    file = request.files['video']
    appointment_id = request.form.get('appointment_id')
    duration = request.form.get('duration', 0)
    
    print(f"檔案名稱: {file.filename}")
    print(f"檔案大小: {file.content_length if file.content_length else '未知'}")
    print(f"預約 ID: {appointment_id}")
    print(f"錄影時長: {duration} 秒")
    
    if not appointment_id:
        print("❌ 缺少預約 ID")
        return jsonify({'message': '缺少預約 ID'}), 400
    
    if file.filename == '':
        print("❌ 檔案名稱為空")
        return jsonify({'message': '未選擇檔案'}), 400
    
    try:
        # 生成唯一檔名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = secure_filename(f"recording_{appointment_id}_{timestamp}.webm")
        filepath = os.path.join(app.config['RECORDING_FOLDER'], filename)
        
        print(f"💾 儲存路徑: {filepath}")
        
        # 儲存檔案
        file.save(filepath)
        
        # 檢查檔案大小
        file_size = os.path.getsize(filepath)
        print(f"✅ 檔案已儲存，大小: {file_size / 1024 / 1024:.2f} MB")
        
        if file_size == 0:
            print("❌ 儲存的檔案大小為 0")
            os.remove(filepath)
            return jsonify({'message': '錄影檔案無效'}), 400
        
        # 更新資料庫
        db = get_db()
        cursor = db.cursor()
        
        try:
            cursor.execute("""
                UPDATE appointments 
                SET recording_url = %s, 
                    recording_duration = %s,
                    updated_at = NOW()
                WHERE appointment_id = %s
            """, (filename, duration, appointment_id))
            db.commit()
            
            print(f"✅ 資料庫已更新")
            print("=" * 60)
            
            return jsonify({
                'success': True,
                'message': '錄影上傳成功',
                'filename': filename,
                'size': file_size
            }), 200
            
        except Exception as e:
            db.rollback()
            print(f"❌ 資料庫更新失敗: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'message': f'儲存失敗: {str(e)}'}), 500
        finally:
            cursor.close()
            db.close()
            
    except Exception as e:
        print(f"❌ 檔案儲存失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'上傳失敗: {str(e)}'}), 500

@app.route("/api/meeting/end", methods=["POST"])
def end_meeting():
    """結束會議並更新預約狀態"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    data = request.get_json()
    appointment_id = data.get('appointment_id')
    consultation_notes = data.get('consultation_notes', '')
    recording_duration = data.get('recording_duration', 0)
    
    if not appointment_id:
        return jsonify({"message": "缺少預約 ID"}), 400
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 更新預約狀態為已完成，並記錄結束時間
        cursor.execute("""
            UPDATE appointments 
            SET status = '已完成',
                meeting_ended_at = NOW(),
                consultation_notes = %s
            WHERE appointment_id = %s
        """, (consultation_notes, appointment_id))
        
        db.commit()
        
        print(f"✅ 會議已結束 - appointment_id: {appointment_id}")
        
        return jsonify({
            "success": True,
            "message": "會議已結束"
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"❌ 結束會議失敗: {str(e)}")
        return jsonify({"message": f"結束會議失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/recording/<filename>", methods=["GET"])
def get_recording(filename):
    """獲取錄影檔案（支援 Range Request，手機串流播放）"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 從檔名提取 appointment_id
        appointment_id = filename.split('_')[1]
        
        cursor.execute("""
            SELECT patient_id, doctor_id 
            FROM appointments 
            WHERE appointment_id = %s
        """, (appointment_id,))
        
        appointment = cursor.fetchone()
        
        if not appointment:
            return jsonify({"message": "找不到相關預約"}), 404
        
        user_role = session.get('role')
        if user_role == 'doctor':
            if appointment['doctor_id'] != session.get('doctor_id'):
                return jsonify({"message": "無權限查看"}), 403
        elif user_role == 'patient':
            if appointment['patient_id'] != session.get('patient_id'):
                return jsonify({"message": "無權限查看"}), 403
        else:
            return jsonify({"message": "無效的用戶角色"}), 403
        
        file_path = os.path.join(app.config['RECORDING_FOLDER'], filename)
        if not os.path.exists(file_path):
            return jsonify({"message": "錄影檔案不存在"}), 404
        
        file_size = os.path.getsize(file_path)
        range_header = request.headers.get('Range')
        
        # 支援 Range Request（手機串流播放必要）
        if range_header:
            byte_start, byte_end = 0, file_size - 1
            match = range_header.replace('bytes=', '').split('-')
            if match[0]:
                byte_start = int(match[0])
            if match[1]:
                byte_end = int(match[1])
            
            length = byte_end - byte_start + 1
            
            def generate():
                with open(file_path, 'rb') as f:
                    f.seek(byte_start)
                    remaining = length
                    while remaining > 0:
                        chunk = f.read(min(8192, remaining))
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk
            
            response = Response(
                generate(),
                status=206,
                mimetype='video/webm',
                headers={
                    'Content-Range': f'bytes {byte_start}-{byte_end}/{file_size}',
                    'Accept-Ranges': 'bytes',
                    'Content-Length': str(length),
                    'Content-Disposition': f'inline; filename="{filename}"',
                }
            )
            return response
        else:
            # 非 Range 請求，直接回傳整個檔案
            response = send_from_directory(app.config['RECORDING_FOLDER'], filename)
            response.headers['Accept-Ranges'] = 'bytes'
            response.headers['Content-Type'] = 'video/webm'
            response.headers['Content-Disposition'] = f'inline; filename="{filename}"'
            return response
        
    except Exception as e:
        print(f"❌ 錄影檔案存取失敗: {str(e)}")
        return jsonify({"message": f"檔案不存在: {str(e)}"}), 404
    finally:
        cursor.close()
        db.close()

@app.route("/api/appointments/<int:appointment_id>/recording", methods=["GET"])
def get_appointment_recording_info(appointment_id):
    """獲取預約的錄影資訊"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                appointment_id,
                recording_url,
                recording_duration,
                consultation_notes,
                meeting_started_at,
                meeting_ended_at,
                status
            FROM appointments 
            WHERE appointment_id = %s
        """, (appointment_id,))
        
        appointment = cursor.fetchone()
        
        if not appointment:
            return jsonify({"message": "找不到預約"}), 404
        
        # 驗證權限
        cursor.execute("""
            SELECT patient_id, doctor_id 
            FROM appointments 
            WHERE appointment_id = %s
        """, (appointment_id,))
        
        auth_info = cursor.fetchone()
        user_role = session.get('role')
        
        if user_role == 'doctor' and auth_info['doctor_id'] != session.get('doctor_id'):
            return jsonify({"message": "無權限"}), 403
        elif user_role == 'patient' and auth_info['patient_id'] != session.get('patient_id'):
            return jsonify({"message": "無權限"}), 403
        
        # 格式化時間
        if appointment.get('meeting_started_at'):
            appointment['meeting_started_at'] = appointment['meeting_started_at'].isoformat()
        if appointment.get('meeting_ended_at'):
            appointment['meeting_ended_at'] = appointment['meeting_ended_at'].isoformat()
        
        return jsonify({
            "success": True,
            "appointment": appointment
        }), 200
        
    except Exception as e:
        print(f"❌ 查詢錄影資訊失敗: {str(e)}")
        return jsonify({"message": f"查詢失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


# 新增：獲取會議室狀態
@app.route("/api/meeting/status/<int:appointment_id>", methods=["GET"])
def get_meeting_status(appointment_id):
    """獲取會議室狀態"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                appointment_id,
                meeting_room_id,
                status,
                meeting_started_at,
                meeting_ended_at
            FROM appointments 
            WHERE appointment_id = %s
        """, (appointment_id,))
        
        appointment = cursor.fetchone()
        
        if not appointment:
            return jsonify({"message": "預約不存在"}), 404
        
        return jsonify({
            "success": True,
            "meeting_room_id": appointment['meeting_room_id'],
            "status": appointment['status'],
            "is_active": appointment['meeting_room_id'] is not None and appointment['meeting_ended_at'] is None
        }), 200
        
    except Exception as e:
        print(f"❌ 獲取會議狀態失敗: {str(e)}")
        return jsonify({"message": f"獲取會議狀態失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()




# 獲取文章列表（含搜尋功能）
@app.route('/api/experience/posts', methods=['GET'])
def get_posts():
    keyword = request.args.get('keyword', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    offset = (page - 1) * per_page
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        if keyword:
            # 使用 FULLTEXT 搜尋或 LIKE 搜尋
            query = """
                SELECT p.id, p.title, p.content, p.is_anonymous, p.created_at,
                       CASE WHEN p.is_anonymous THEN '匿名用戶' ELSE u.username END as author_name,
                       COUNT(c.id) as comment_count
                FROM posts p
                LEFT JOIN users u ON p.user_id = u.user_id
                LEFT JOIN comments c ON p.id = c.post_id
                WHERE p.title LIKE %s OR p.content LIKE %s
                GROUP BY p.id
                ORDER BY p.created_at DESC
                LIMIT %s OFFSET %s
            """
            search_term = f'%{keyword}%'
            cursor.execute(query, (search_term, search_term, per_page, offset))
        else:
            query = """
                SELECT p.id, p.title, p.content, p.is_anonymous, p.created_at,
                       CASE WHEN p.is_anonymous THEN '匿名用戶' ELSE u.username END as author_name,
                       COUNT(c.id) as comment_count
                FROM posts p
                LEFT JOIN users u ON p.user_id = u.user_id
                LEFT JOIN comments c ON p.id = c.post_id
                GROUP BY p.id
                ORDER BY p.created_at DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (per_page, offset))
        
        posts = cursor.fetchall()
        
        # 獲取總數
        if keyword:
            cursor.execute("SELECT COUNT(*) as total FROM posts WHERE title LIKE %s OR content LIKE %s", 
                         (search_term, search_term))
        else:
            cursor.execute("SELECT COUNT(*) as total FROM posts")
        
        total = cursor.fetchone()['total']
        
        return jsonify({
            'success': True,
            'posts': posts,
            'total': total,
            'page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()  # ← 加這行
        print("完整錯誤訊息:")  # ← 加這行
        print(error_details)  # ← 加這行
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 獲取單篇文章詳情
@app.route('/api/experience/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 獲取文章
        query = """
            SELECT p.id, p.title, p.content, p.is_anonymous, p.created_at, p.user_id,
                   CASE WHEN p.is_anonymous THEN '匿名用戶' ELSE u.username END as author_name
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.user_id
            WHERE p.id = %s
        """
        cursor.execute(query, (post_id,))
        post = cursor.fetchone()
        
        if not post:
            return jsonify({'success': False, 'message': '文章不存在'}), 404
        
        # 獲取留言
        query = """
            SELECT c.id, c.content, c.is_anonymous, c.created_at, c.user_id,
                   CASE WHEN c.is_anonymous THEN '匿名用戶' ELSE u.username END as author_name
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.user_id
            WHERE c.post_id = %s
            ORDER BY c.created_at ASC
        """
        cursor.execute(query, (post_id,))
        comments = cursor.fetchall()
        
        post['comments'] = comments
        
        return jsonify({
            'success': True,
            'post': post
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 創建文章
@app.route('/api/experience/posts', methods=['POST'])
def create_post():
    
    current_user_id = session['user_id'] 
    data = request.get_json()
    
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    is_anonymous = data.get('is_anonymous', False)
    
    if not title or not content:
        return jsonify({'success': False, 'message': '標題和內容不能為空'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        query = """
            INSERT INTO posts (user_id, title, content, is_anonymous)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (current_user_id, title, content, is_anonymous))
        conn.commit()
        
        post_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': '文章發布成功',
            'post_id': post_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 創建留言
@app.route('/api/experience/posts/<int:post_id>/comments', methods=['POST'])
def create_comment(post_id):
   
    current_user_id = session['user_id']
    data = request.get_json()
    content = data.get('content', '').strip()
    is_anonymous = data.get('is_anonymous', False)
    
    if not content:
        return jsonify({'success': False, 'message': '留言內容不能為空'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # 檢查文章是否存在
        cursor.execute("SELECT id FROM posts WHERE id = %s", (post_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': '文章不存在'}), 404
        
        query = """
            INSERT INTO comments (post_id, user_id, content, is_anonymous)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (post_id, current_user_id, content, is_anonymous))
        conn.commit()
        
        comment_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': '留言成功',
            'comment_id': comment_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 刪除文章（僅作者可刪除）
@app.route('/api/experience/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    # 暫時使用固定的 user_id，之後可以改成從 session 取得
    current_user_id = session['user_id'] # 或從 session['user_id'] 取得
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # 檢查是否為作者
        cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'success': False, 'message': '文章不存在'}), 404
        
        if result[0] != current_user_id:
            return jsonify({'success': False, 'message': '無權限刪除此文章'}), 403
        
        cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': '文章刪除成功'
        }), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 刪除留言（僅作者可刪除）
@app.route('/api/experience/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    
    current_user_id = session['user_id']  
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # 檢查是否為作者
        cursor.execute("SELECT user_id FROM comments WHERE id = %s", (comment_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'success': False, 'message': '留言不存在'}), 404
        
        if result[0] != current_user_id:
            return jsonify({'success': False, 'message': '無權限刪除此留言'}), 403
        
        cursor.execute("DELETE FROM comments WHERE id = %s", (comment_id,))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': '留言刪除成功'
        }), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    """獲取患者的通知列表"""
    if 'user_id' not in session or session.get('role') != 'patient':
        return jsonify({"message": "請先登入患者帳號"}), 401
    
    patient_id = session.get('patient_id')
    if not patient_id:
        return jsonify({"message": "找不到患者資料"}), 404
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 獲取通知列表(全部)
        cursor.execute("""
            SELECT 
                notification_id,
                type,
                title,
                message,
                related_id,
                is_read,
                created_at
            FROM notifications
            WHERE patient_id = %s
            ORDER BY created_at DESC
            LIMIT 200
        """, (patient_id,))
        
        notifications = cursor.fetchall()
        
        # 格式化時間
        for n in notifications:
            if n.get('created_at'):
                n['created_at'] = n['created_at'].isoformat()
        
        # 獲取未讀數量
        cursor.execute("""
            SELECT COUNT(*) as unread_count
            FROM notifications
            WHERE patient_id = %s AND is_read = FALSE
        """, (patient_id,))
        
        unread_count = cursor.fetchone()['unread_count']
        
        return jsonify({
            "notifications": notifications,
            "unread_count": unread_count
        }), 200
        
    except Exception as e:
        print(f"❌ 獲取通知失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"獲取通知失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/notifications/<int:notification_id>/read", methods=["PATCH"])
def mark_notification_read(notification_id):
    """標記單個通知為已讀"""
    if 'user_id' not in session or session.get('role') != 'patient':
        return jsonify({"message": "請先登入患者帳號"}), 401
    
    patient_id = session.get('patient_id')
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        # 確認通知屬於該患者
        cursor.execute("""
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE notification_id = %s AND patient_id = %s
        """, (notification_id, patient_id))
        
        db.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"message": "通知不存在或無權限"}), 404
        
        return jsonify({
            "success": True,
            "message": "已標記為已讀"
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"❌ 標記已讀失敗: {str(e)}")
        return jsonify({"message": f"操作失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/notifications/read-all", methods=["PATCH"])
def mark_all_notifications_read():
    """標記所有通知為已讀"""
    if 'user_id' not in session or session.get('role') != 'patient':
        return jsonify({"message": "請先登入患者帳號"}), 401
    
    patient_id = session.get('patient_id')
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE patient_id = %s AND is_read = FALSE
        """, (patient_id,))
        
        db.commit()
        
        return jsonify({
            "success": True,
            "message": f"已標記 {cursor.rowcount} 則通知為已讀"
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"❌ 全部標記已讀失敗: {str(e)}")
        return jsonify({"message": f"操作失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


# =============== 通知觸發函數 ===============

def create_notification(patient_id, notification_type, title, message, related_id=None):
    """創建通知的通用函數"""
    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO notifications (patient_id, type, title, message, related_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (patient_id, notification_type, title, message, related_id))
        
        db.commit()
        print(f"✅ 通知已創建: {title}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ 創建通知失敗: {str(e)}")
        return False
    finally:
        cursor.close()
        db.close()

def check_upcoming_appointments():
    """檢查 10 分鐘後的預約並發送提醒"""
    while True:
        try:
            db = get_db()
            cursor = db.cursor(dictionary=True)
            
            # 查詢 10 分鐘後的預約
            ten_minutes_later = datetime.now() + timedelta(minutes=10)
            
            cursor.execute("""
                SELECT 
                    a.appointment_id,
                    a.patient_id,
                    a.appointment_date,
                    a.appointment_time,
                    d.first_name as doctor_first_name,
                    d.last_name as doctor_last_name,
                    d.specialty
                FROM appointments a
                INNER JOIN doctor d ON a.doctor_id = d.doctor_id
                WHERE a.status = '已確認'
                AND CONCAT(a.appointment_date, ' ', a.appointment_time) 
                    BETWEEN %s AND %s
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.related_id = a.appointment_id 
                    AND n.type = 'appointment_reminder'
                )
            """, (
                ten_minutes_later.strftime('%Y-%m-%d %H:%M:%S'),
                (ten_minutes_later + timedelta(minutes=1)).strftime('%Y-%m-%d %H:%M:%S')
            ))
            
            appointments = cursor.fetchall()
            
            for apt in appointments:
                # 創建提醒通知
                doctor_name = f"{apt['doctor_last_name']}{apt['doctor_first_name']}"
                notification_message = f"""您的看診即將開始!

📅 看診時間: {apt['appointment_date']} {apt['appointment_time']}
👨‍⚕️ 醫師: {doctor_name} ({apt['specialty']})

⏰ 請準備好進入視訊會議室"""

                cursor.execute("""
                    INSERT INTO notifications (patient_id, type, title, message, related_id, is_read, created_at)
                    VALUES (%s, 'appointment_reminder', '看診提醒', %s, %s, FALSE, NOW())
                """, (apt['patient_id'], notification_message, apt['appointment_id']))
                
                db.commit()
                print(f"✅ 已發送看診提醒給患者 {apt['patient_id']}")
            
            cursor.close()
            db.close()
            
        except Exception as e:
            print(f"❌ 檢查預約提醒失敗: {str(e)}")
            import traceback
            traceback.print_exc()
        
        # 每分鐘檢查一次
        import time
        time.sleep(60)

def start_background_tasks():
    """啟動背景任務"""
    reminder_thread = threading.Thread(target=check_upcoming_appointments, daemon=True)
    reminder_thread.start()
    print("✅ 背景任務已啟動: 預約提醒檢查")

@app.route("/api/notifications/latest", methods=["GET"])
def get_latest_notifications():
    """獲取最近 1 分鐘內的新通知"""
    if 'user_id' not in session or session.get('role') != 'patient':
        return jsonify({"notifications": [], "count": 0}), 200
    
    patient_id = session.get('patient_id')
    since = request.args.get('since')  # ISO 時間戳
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        if since:
            # 查詢指定時間之後的通知
            cursor.execute("""
                SELECT 
                    notification_id,
                    type,
                    title,
                    message,
                    related_id,
                    is_read,
                    created_at
                FROM notifications
                WHERE patient_id = %s
                AND created_at > %s
                ORDER BY created_at DESC
            """, (patient_id, since))
        else:
            # 查詢最近 1 分鐘的通知
            cursor.execute("""
                SELECT 
                    notification_id,
                    type,
                    title,
                    message,
                    related_id,
                    is_read,
                    created_at
                FROM notifications
                WHERE patient_id = %s
                AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
                ORDER BY created_at DESC
            """, (patient_id,))
        
        notifications = cursor.fetchall()
        
        # 格式化時間
        for n in notifications:
            if n.get('created_at'):
                n['created_at'] = n['created_at'].isoformat()
        
        return jsonify({
            "notifications": notifications,
            "count": len(notifications)
        }), 200
        
    except Exception as e:
        print(f"❌ 獲取最新通知失敗: {str(e)}")
        return jsonify({"notifications": [], "count": 0}), 200
    finally:
        cursor.close()
        db.close()

@app.route("/api/notifications/count", methods=["GET"])
def get_unread_count():
    """快速獲取未讀通知數量"""
    if 'user_id' not in session or session.get('role') != 'patient':
        return jsonify({"count": 0}), 200
    
    patient_id = session.get('patient_id')
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM notifications
            WHERE patient_id = %s AND is_read = FALSE
        """, (patient_id,))
        
        result = cursor.fetchone()
        return jsonify({"count": result['count']}), 200
        
    except Exception as e:
        return jsonify({"count": 0}), 200
    finally:
        cursor.close()
        db.close()

@app.route('/api/doctor/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    try:
        if 'user_id' not in session:
            return jsonify({'error': '未授權'}), 401
        
        if session.get('role') != 'doctor':
            return jsonify({'error': '權限不足'}), 403
        
        doctor_id = session.get('doctor_id')
        if not doctor_id:
            return jsonify({'error': '無法獲取醫生資訊'}), 400
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        today = date.today().strftime('%Y-%m-%d')
        
        # 今日預約總數
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE doctor_id = %s 
            AND appointment_date = %s 
            AND status IN ('已確認', '已完成')
        """, (doctor_id, today))
        today_total = cursor.fetchone()['count'] or 0
        
        # 待處理
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE doctor_id = %s 
            AND appointment_date = %s 
            AND status = '已確認'
        """, (doctor_id, today))
        pending = cursor.fetchone()['count'] or 0
        
        # 已完成
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE doctor_id = %s 
            AND appointment_date = %s 
            AND status = '已完成'
        """, (doctor_id, today))
        completed = cursor.fetchone()['count'] or 0
        
        cursor.close()
        
        return jsonify({
            'success': True,
            'todayTotal': today_total,
            'pending': pending,
            'completed': completed,
            'date': today
        }), 200
        
    except Exception as e:
        print(f"錯誤: {str(e)}")
        return jsonify({'error': '伺服器錯誤'}), 500

@app.route("/api/patient/<int:patient_id>/medical-records", methods=["GET"])
def get_patient_medical_records(patient_id):
    """獲取病患的完整就診記錄"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 獲取該病患所有已完成的就診記錄
        query = """
            SELECT 
                a.appointment_id,
                a.appointment_date,
                a.appointment_time,
                a.symptoms,
                a.consultation_notes,
                a.doctor_advice,
                a.recording_url,
                a.recording_duration,
                d.doctor_id,
                d.first_name as doctor_first_name,
                d.last_name as doctor_last_name,
                d.specialty as doctor_specialty
            FROM appointments a
            INNER JOIN doctor d ON a.doctor_id = d.doctor_id
            WHERE a.patient_id = %s 
            AND a.status = '已完成'
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        """
        
        cursor.execute(query, (patient_id,))
        records = cursor.fetchall()
        
        # 格式化日期時間
        formatted_records = []
        for record in records:
            formatted_records.append({
                'appointment_id': record['appointment_id'],
                'appointment_date': serialize_datetime(record['appointment_date']),
                'appointment_time': serialize_datetime(record['appointment_time']),
                'symptoms': record['symptoms'] or '',
                'consultation_notes': record['consultation_notes'] or '',
                'doctor_advice': record['doctor_advice'] or '',
                'recording_url': record['recording_url'],
                'recording_duration': record['recording_duration'],
                'doctor_first_name': record['doctor_first_name'] or '',
                'doctor_last_name': record['doctor_last_name'] or '',
                'doctor_specialty': record['doctor_specialty']
            })
        
        return jsonify(formatted_records), 200
        
    except Exception as e:
        print(f"❌ 獲取病歷記錄失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"獲取病歷記錄失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

@app.route("/api/doctor/notifications", methods=["GET"])
def get_doctor_notifications():
    """獲取醫師的通知列表"""
    print("=" * 60)
    print("🔔 收到醫師通知請求")
    
    # 檢查登入狀態
    if 'user_id' not in session:
        print("❌ 用戶未登入")
        return jsonify({"message": "請先登入"}), 401
    
    # 檢查是否為醫師
    if session.get('role') != 'doctor':
        print(f"❌ 角色錯誤: {session.get('role')}")
        return jsonify({"message": "請先登入醫師帳號"}), 401
    
    doctor_id = session.get('doctor_id')
    if not doctor_id:
        print("❌ 找不到 doctor_id")
        return jsonify({"message": "找不到醫師資料"}), 404
    
    print(f"✅ 醫師 ID: {doctor_id}")
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        # 獲取通知列表(全部)
        query = """
            SELECT 
                notification_id,
                type,
                title,
                message,
                related_id,
                is_read,
                created_at
            FROM doctor_notifications
            WHERE doctor_id = %s
            ORDER BY created_at DESC
            LIMIT 200
        """
        
        cursor.execute(query, (doctor_id,))
        notifications = cursor.fetchall()
        
        print(f"📬 找到 {len(notifications)} 則通知")
        
        # 格式化時間
        for n in notifications:
            if n.get('created_at'):
                n['created_at'] = n['created_at'].isoformat()
        
        # 獲取未讀數量
        cursor.execute("""
            SELECT COUNT(*) as unread_count
            FROM doctor_notifications
            WHERE doctor_id = %s AND is_read = FALSE
        """, (doctor_id,))
        
        unread_count = cursor.fetchone()['unread_count']
        print(f"📨 未讀數量: {unread_count}")
        
        response_data = {
            "notifications": notifications,
            "unread_count": unread_count
        }
        
        print("✅ 成功返回通知")
        print("=" * 60)
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ 獲取醫師通知失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"獲取通知失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/doctor/notifications/<int:notification_id>/read", methods=["PATCH"])
def mark_doctor_notification_read(notification_id):
    """標記單個醫師通知為已讀"""
    if 'user_id' not in session or session.get('role') != 'doctor':
        return jsonify({"message": "請先登入醫師帳號"}), 401
    
    doctor_id = session.get('doctor_id')
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            UPDATE doctor_notifications 
            SET is_read = TRUE 
            WHERE notification_id = %s AND doctor_id = %s
        """, (notification_id, doctor_id))
        
        db.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"message": "通知不存在或無權限"}), 404
        
        return jsonify({
            "success": True,
            "message": "已標記為已讀"
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"❌ 標記已讀失敗: {str(e)}")
        return jsonify({"message": f"操作失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


@app.route("/api/doctor/notifications/read-all", methods=["PATCH"])
def mark_all_doctor_notifications_read():
    """標記所有醫師通知為已讀"""
    if 'user_id' not in session or session.get('role') != 'doctor':
        return jsonify({"message": "請先登入醫師帳號"}), 401
    
    doctor_id = session.get('doctor_id')
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            UPDATE doctor_notifications 
            SET is_read = TRUE 
            WHERE doctor_id = %s AND is_read = FALSE
        """, (doctor_id,))
        
        db.commit()
        
        return jsonify({
            "success": True,
            "message": f"已標記 {cursor.rowcount} 則通知為已讀"
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"❌ 全部標記已讀失敗: {str(e)}")
        return jsonify({"message": f"操作失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()



@app.route("/api/doctor/notifications/count", methods=["GET"])
def get_doctor_unread_count():
    """快速獲取醫師未讀通知數量"""
    if 'user_id' not in session or session.get('role') != 'doctor':
        return jsonify({"count": 0}), 200
    
    doctor_id = session.get('doctor_id')
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM doctor_notifications
            WHERE doctor_id = %s AND is_read = FALSE
        """, (doctor_id,))
        
        result = cursor.fetchone()
        return jsonify({"count": result['count']}), 200
        
    except Exception as e:
        return jsonify({"count": 0}), 200
    finally:
        cursor.close()
        db.close()



def create_doctor_notification(doctor_id, notification_type, title, message, related_id=None):
    """創建醫師通知的通用函數"""
    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO doctor_notifications (doctor_id, type, title, message, related_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (doctor_id, notification_type, title, message, related_id))
        
        db.commit()
        print(f"✅ 醫師通知已創建: {title}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ 創建醫師通知失敗: {str(e)}")
        return False
    finally:
        cursor.close()
        db.close()


@app.route("/api/cancel_appointment", methods=["POST"])
def cancel_appointment():
    """取消預約並發送通知給醫師和患者（含退款計算）"""
    print("=" * 60)
    print("🚫 收到取消預約請求")
    
    try:
        data = request.get_json()
        appointment_id = data.get("appointment_id")
        cancel_reason = data.get("cancellation_reason", "")

        if not cancel_reason.strip():
            return jsonify({"success": False, "message": "請填寫取消原因"}), 400

        db = get_db()
        cursor = db.cursor(dictionary=True)

        # 📋 獲取完整預約資訊
        cursor.execute("""
            SELECT 
                a.appointment_id,
                a.patient_id,
                a.doctor_id,
                a.appointment_date, 
                a.appointment_time, 
                a.status,
                d.first_name as doctor_first_name,
                d.last_name as doctor_last_name,
                d.specialty,
                p.first_name as patient_first_name,
                p.last_name as patient_last_name
            FROM appointments a
            LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
            LEFT JOIN patient p ON a.patient_id = p.patient_id
            WHERE a.appointment_id = %s
        """, (appointment_id,))
        
        appt = cursor.fetchone()

        if not appt:
            print("❌ 找不到此預約")
            return jsonify({"success": False, "message": "找不到此預約"}), 404

        if appt["status"] == "已取消":
            print("❌ 預約已取消")
            return jsonify({"success": False, "message": "預約已取消"}), 400

        if appt["status"] == "已完成":
            print("❌ 已完成的預約無法取消")
            return jsonify({"success": False, "message": "已完成的預約無法取消"}), 400

        appointment_date = appt["appointment_date"]
        appointment_time = appt["appointment_time"]
        
        # 處理 timedelta 轉換為 time
        if isinstance(appointment_time, timedelta):
            total_seconds = int(appointment_time.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            appointment_time = datetime.min.time().replace(hour=hours, minute=minutes, second=seconds)
        elif isinstance(appointment_time, datetime):
            appointment_time = appointment_time.time()

        appointment_datetime = datetime.combine(appointment_date, appointment_time)
        now = datetime.now()

        # 💰 計算退款比例
        diff = appointment_datetime - now
        diff_days = diff.total_seconds() / (24 * 3600)
        is_same_day = appointment_date == now.date()
        
        if is_same_day:
            refund_percentage = 20
            refund_message = "取消成功，將退回 20% 款項，於三日內退款"
        elif diff_days <= 2:
            refund_percentage = 50
            refund_message = "取消成功，將退回 50% 款項，於三日內退款"
        else:
            refund_percentage = 100
            refund_message = "取消成功，將全額退款，於三日內退款"

        patient_name = f"{appt['patient_first_name']}{appt['patient_last_name']}"
        doctor_name = f"{appt['doctor_first_name']}{appt['doctor_last_name']}"
        
        print(f"預約 ID: {appointment_id}")
        print(f"患者: {patient_name}")
        print(f"醫師: {doctor_name}")
        print(f"退款比例: {refund_percentage}%")
        print(f"原因: {cancel_reason}")

        # ✅ 更新預約狀態
        cursor.execute("""
            UPDATE appointments 
            SET status = '已取消', 
                cancellation_reason = %s,
                updated_at = NOW()
            WHERE appointment_id = %s
        """, (cancel_reason, appointment_id))

        # ✅ 釋放時段
        cursor.execute("""
            UPDATE schedules 
            SET is_available = '1' 
            WHERE doctor_id = %s AND schedule_date = %s AND time_slot = %s
        """, (appt["doctor_id"], appointment_date, appointment_time))

        db.commit()
        print("✅ 預約已取消，時段已釋放")

        # ✅ 發送通知給醫師
        doctor_notification = f"""患者已取消預約

📅 原預約時間: {appointment_date.strftime('%Y年%m月%d日')} {str(appointment_time)[:5]}
👤 患者: {patient_name}
📝 取消原因: {cancel_reason}

該時段已自動釋放，可供其他患者預約。"""

        try:
            cursor.execute("""
                INSERT INTO doctor_notifications (doctor_id, type, title, message, related_id)
                VALUES (%s, %s, %s, %s, %s)
            """, (appt["doctor_id"], 'appointment_cancelled', '預約已取消', doctor_notification, appointment_id))
            db.commit()
            print(f"✅ 已發送取消通知給醫師 {appt['doctor_id']}")
        except Exception as e:
            print(f"⚠️ 發送醫師通知失敗: {str(e)}")

        # ✅ 發送通知給患者
        patient_notification = f"""預約已取消

👨‍⚕️ 醫師: {doctor_name} ({appt['specialty']})
📅 原預約時間: {appointment_date.strftime('%Y年%m月%d日')} {str(appointment_time)[:5]}
📝 取消原因: {cancel_reason}
💰 退款說明: {refund_message}

如有疑問，請聯絡客服。"""

        try:
            cursor.execute("""
                INSERT INTO notifications (patient_id, type, title, message, related_id)
                VALUES (%s, %s, %s, %s, %s)
            """, (appt["patient_id"], 'appointment_cancelled', '預約已取消', patient_notification, appointment_id))
            db.commit()
            print(f"✅ 已發送取消通知給患者 {appt['patient_id']}")
        except Exception as e:
            print(f"⚠️ 發送患者通知失敗: {str(e)}")

        print("=" * 60)

        # ✅ 即時 LINE 推播給患者
        try:
            from line_notifier import notify_booking_cancelled
            notify_booking_cancelled(
                patient_id     = appt["patient_id"],
                patient_name   = patient_name,
                doctor_name    = doctor_name,
                specialty      = appt["specialty"],
                date_str       = appointment_date.strftime('%Y年%m月%d日'),
                time_str       = str(appointment_time)[:5],
                cancel_reason  = cancel_reason,
                refund_message = refund_message,
            )
        except Exception as line_err:
            print(f"⚠️ LINE 取消通知推播失敗: {line_err}")

        return jsonify({
            "success": True, 
            "message": refund_message,
            "refund_percentage": refund_percentage,
            "notification_sent": True
        }), 200

    except Exception as e:
        if 'db' in locals():
            db.rollback()
        print(f"❌ 取消預約錯誤: {e}")
        import traceback
        traceback.print_exc()
        print("=" * 60)
        return jsonify({"success": False, "message": "伺服器錯誤"}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


# 檢查即將到來的預約並發送提醒(醫師版)
def check_upcoming_appointments_for_doctor():
    """檢查醫師即將到來的預約並發送提醒"""
    while True:
        try:
            db = get_db()
            cursor = db.cursor(dictionary=True)
            
            ten_minutes_later = datetime.now() + timedelta(minutes=10)
            
            # 查詢 10 分鐘後的預約
            cursor.execute("""
                SELECT 
                    a.appointment_id, a.doctor_id, a.patient_id,
                    a.appointment_date, a.appointment_time,
                    p.first_name as patient_first_name,
                    p.last_name as patient_last_name,
                    p.date_of_birth
                FROM appointments a
                INNER JOIN patient p ON a.patient_id = p.patient_id
                WHERE a.status = '已確認'
                AND CONCAT(a.appointment_date, ' ', a.appointment_time) 
                    BETWEEN %s AND %s
                AND NOT EXISTS (
                    SELECT 1 FROM doctor_notifications n 
                    WHERE n.related_id = a.appointment_id 
                    AND n.type = 'appointment_reminder'
                )
            """, (
                ten_minutes_later.strftime('%Y-%m-%d %H:%M:%S'),
                (ten_minutes_later + timedelta(minutes=1)).strftime('%Y-%m-%d %H:%M:%S')
            ))
            
            appointments = cursor.fetchall()
            
            for apt in appointments:
                # 創建醫師提醒通知
                patient_name = f"{apt['patient_last_name']}{apt['patient_first_name']}"
                
                # 計算患者年齡
                age = ""
                if apt['date_of_birth']:
                    today = date.today()
                    age = today.year - apt['date_of_birth'].year
                    age = f", {age}歲"
                
                notification_message = f"""即將開始看診!

📅 看診時間: {apt['appointment_date']} {apt['appointment_time']}
👤 患者: {patient_name}{age}

⏰ 請準備進入視訊會議室"""

                create_doctor_notification(
                    apt['doctor_id'],
                    'appointment_reminder',
                    '看診提醒',
                    notification_message,
                    apt['appointment_id']
                )
                
                print(f"✅ 已發送看診提醒給醫師 {apt['doctor_id']}")
            
            db.commit()
            cursor.close()
            db.close()
            
        except Exception as e:
            print(f"❌ 檢查醫師預約提醒失敗: {str(e)}")
        
        import time
        time.sleep(60)


# 檢查已完成但未填寫建議的預約
def check_consultation_reminder():
    """檢查已完成但未填寫醫囑的預約,發送提醒"""
    while True:
        try:
            db = get_db()
            cursor = db.cursor(dictionary=True)
            
            # 查詢 30 分鐘前完成但未填寫醫囑的預約
            cursor.execute("""
                SELECT 
                    a.appointment_id, a.doctor_id,
                    a.meeting_ended_at,
                    p.first_name as patient_first_name,
                    p.last_name as patient_last_name
                FROM appointments a
                INNER JOIN patient p ON a.patient_id = p.patient_id
                WHERE a.status = '已完成'
                AND a.meeting_ended_at IS NOT NULL
                AND (a.doctor_advice IS NULL OR a.doctor_advice = '')
                AND a.meeting_ended_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                AND NOT EXISTS (
                    SELECT 1 FROM doctor_notifications n 
                    WHERE n.related_id = a.appointment_id 
                    AND n.type = 'consultation_reminder'
                )
            """)
            
            appointments = cursor.fetchall()
            
            for apt in appointments:
                patient_name = f"{apt['patient_last_name']}{apt['patient_first_name']}"
                
                notification_message = f"""請記得填寫醫囑建議

👤 患者: {patient_name}
⏰ 看診結束時間: {apt['meeting_ended_at'].strftime('%H:%M')}

📝 請盡快填寫診療建議和處方,以便患者查看。"""

                create_doctor_notification(
                    apt['doctor_id'],
                    'consultation_reminder',
                    '請填寫醫囑',
                    notification_message,
                    apt['appointment_id']
                )
                
                print(f"✅ 已發送填寫醫囑提醒給醫師 {apt['doctor_id']}")
            
            db.commit()
            cursor.close()
            db.close()
            
        except Exception as e:
            print(f"❌ 檢查醫囑提醒失敗: {str(e)}")
        
        import time
        time.sleep(300)  # 每 5 分鐘檢查一次


# 修改 start_background_tasks 函數
def start_background_tasks():
    """啟動背景任務"""
    # 患者預約提醒
    patient_reminder_thread = threading.Thread(
        target=check_upcoming_appointments, 
        daemon=True
    )
    patient_reminder_thread.start()
    
    # 醫師預約提醒
    doctor_reminder_thread = threading.Thread(
        target=check_upcoming_appointments_for_doctor, 
        daemon=True
    )
    doctor_reminder_thread.start()
    
    # 醫囑填寫提醒
    consultation_reminder_thread = threading.Thread(
        target=check_consultation_reminder, 
        daemon=True
    )
    consultation_reminder_thread.start()
    
    print("✅ 背景任務已啟動: 預約提醒、醫囑提醒")

@app.route('/api/doctor/appointments/<int:doctor_id>', methods=['GET'])
def get_doctor_appointments_range(doctor_id):
    """取得醫師指定日期範圍的預約資訊"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({"error": "缺少日期參數"}), 400
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        query = """
            SELECT 
                a.appointment_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.symptoms,
                p.patient_id,
                p.first_name as patient_first_name,
                p.last_name as patient_last_name,
                p.gender as patient_gender,
                p.date_of_birth as patient_dob
            FROM appointments a
            INNER JOIN patient p ON a.patient_id = p.patient_id
            WHERE a.doctor_id = %s
            AND a.appointment_date BETWEEN %s AND %s
            AND a.status IN ('待確認', '已確認', '已完成')
            ORDER BY a.appointment_date ASC, a.appointment_time ASC
        """
        
        cursor.execute(query, (doctor_id, start_date, end_date))
        appointments = cursor.fetchall()
        
        for apt in appointments:
            if apt['appointment_date']:
                apt['appointment_date'] = apt['appointment_date'].strftime('%Y-%m-%d')
            if apt['appointment_time']:
                total_seconds = int(apt['appointment_time'].total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                apt['appointment_time'] = f"{hours:02d}:{minutes:02d}:00"
            if apt['patient_dob']:
                apt['patient_dob'] = apt['patient_dob'].strftime('%Y-%m-%d')
        
        cursor.close()
        db.close()
        
        return jsonify(appointments), 200
        
    except Exception as e:
        print(f"❌ 取得預約資訊錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "伺服器錯誤"}), 500
def require_mechanism(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': '請先登入'}), 401
        db = get_db()
        cursor = db.cursor(dictionary=True)
        try:
            cursor.execute("SELECT mechanism_id FROM mechanism WHERE user_id = %s", (session['user_id'],))
            mech = cursor.fetchone()
            if not mech:
                return jsonify({'error': '權限不足'}), 403
            request.mechanism_id = mech['mechanism_id']
        finally:
            cursor.close()
            db.close()
        return f(*args, **kwargs)
    return decorated

@app.route("/webhook", methods=['POST'])
def webhook():
    signature = request.headers.get('X-Line-Signature', '')
    body = request.get_data(as_text=True)
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        return jsonify({'error': 'Invalid signature'}), 400
    return 'OK', 200

@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    user_message = event.message.text.strip()
    
    if '預約' in user_message:
        reply = '📅 請點選連結進行線上預約：\nhttps://your-medonco-url.com/booking'
    elif '視訊' in user_message or '看診' in user_message:
        reply = '🎥 請登入平台開始視訊看診：\nhttps://your-medonco-url.com/video'
    elif '紀錄' in user_message or '記錄' in user_message:
        reply = '📋 請登入查看您的就診紀錄：\nhttps://your-medonco-url.com/records'
    else:
        reply = '您好！我是醫隨行小幫手 👋\n請問有什麼可以協助您？\n\n📅 預約\n🎥 視訊看診\n📋 就診紀錄'

    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=reply)
    )


# ── 統計 ─────────────────────────────────────────────────────────────

@app.route('/api/mechanism/stats', methods=['GET'])
@require_mechanism
def get_mechanism_stats():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS total FROM doctor WHERE mechanism_id = %s", (request.mechanism_id,))
        total_doctors = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS total FROM doctor WHERE mechanism_id = %s AND approval_status = 'approved'", (request.mechanism_id,))
        approved_doctors = cursor.fetchone()['total']

        cursor.execute("""
            SELECT COUNT(DISTINCT a.patient_id) AS total
            FROM appointments a JOIN doctor d ON a.doctor_id = d.doctor_id
            WHERE d.mechanism_id = %s
        """, (request.mechanism_id,))
        total_patients = cursor.fetchone()['total']

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM appointments a JOIN doctor d ON a.doctor_id = d.doctor_id
            WHERE d.mechanism_id = %s AND DATE(a.appointment_date) = CURDATE()
        """, (request.mechanism_id,))
        today_appointments = cursor.fetchone()['total']

        return jsonify({
            'total_doctors': total_doctors,
            'approved_doctors': approved_doctors,
            'total_patients': total_patients,
            'today_appointments': today_appointments,
        })
    finally:
        cursor.close()
        db.close()


# ── 醫師管理 ──────────────────────────────────────────────────────────

@app.route('/api/mechanism/doctors', methods=['GET'])
@require_mechanism
def get_mechanism_doctors():
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '')

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        sql = """
            SELECT
                d.doctor_id, d.first_name, d.last_name, d.gender,
                d.specialty, d.phone_number, d.practice_hospital,
                d.approval_status, d.approval_date, d.created_at,
                COUNT(DISTINCT a.appointment_id) AS total_appointments,
                SUM(CASE WHEN DATE(a.appointment_date) = CURDATE() THEN 1 ELSE 0 END) AS today_appointments
            FROM doctor d
            LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
            WHERE d.mechanism_id = %s
        """
        params = [request.mechanism_id]

        if search:
            sql += " AND (d.first_name LIKE %s OR d.last_name LIKE %s OR d.specialty LIKE %s)"
            like = f'%{search}%'
            params += [like, like, like]

        if status_filter:
            sql += " AND d.approval_status = %s"
            params.append(status_filter)

        sql += " GROUP BY d.doctor_id ORDER BY d.created_at DESC"
        cursor.execute(sql, params)
        doctors = cursor.fetchall()

        for doc in doctors:
            for key in ['approval_date', 'created_at']:
                if doc.get(key):
                    doc[key] = doc[key].isoformat() if hasattr(doc[key], 'isoformat') else str(doc[key])
            # 修正 SUM/COUNT 可能回傳 None 或 Decimal 的問題
            doc['total_appointments'] = int(doc['total_appointments'] or 0)
            doc['today_appointments'] = int(doc['today_appointments'] or 0)

        return jsonify({'doctors': doctors, 'total': len(doctors)})
    finally:
        cursor.close()
        db.close()


@app.route('/api/mechanism/doctors/<int:doctor_id>', methods=['PUT'])
@require_mechanism
def update_mechanism_doctor(doctor_id):
    data = request.get_json() or {}
    allowed = ['specialty', 'phone_number', 'practice_hospital']
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        return jsonify({'error': '無可更新的欄位'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT doctor_id FROM doctor WHERE doctor_id = %s AND mechanism_id = %s",
            (doctor_id, request.mechanism_id)
        )
        if not cursor.fetchone():
            return jsonify({'error': '醫師不存在或無權限'}), 404

        set_clause = ', '.join([f"`{k}` = %s" for k in updates])
        cursor.execute(
            f"UPDATE doctor SET {set_clause} WHERE doctor_id = %s",
            list(updates.values()) + [doctor_id]
        )
        db.commit()
        return jsonify({'message': '更新成功'})
    finally:
        cursor.close()
        db.close()


@app.route('/api/mechanism/doctors/<int:doctor_id>/remove', methods=['PATCH'])
@require_mechanism
def remove_mechanism_doctor(doctor_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT doctor_id FROM doctor WHERE doctor_id = %s AND mechanism_id = %s",
            (doctor_id, request.mechanism_id)
        )
        if not cursor.fetchone():
            return jsonify({'error': '醫師不存在或無權限'}), 404

        cursor.execute("UPDATE doctor SET mechanism_id = NULL WHERE doctor_id = %s", (doctor_id,))
        db.commit()
        return jsonify({'message': '已解除關聯'})
    finally:
        cursor.close()
        db.close()


# ── 患者管理 ──────────────────────────────────────────────────────────

@app.route('/api/mechanism/patients', methods=['GET'])
@require_mechanism
def get_mechanism_patients():
    search = request.args.get('search', '').strip()
    gender_filter = request.args.get('gender', '')

    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        sql = """
            SELECT
                p.patient_id, p.first_name, p.last_name, p.gender,
                p.date_of_birth, p.phone_number, p.smoking_status, p.chronic_disease,
                MAX(a.appointment_date) AS last_appointment,
                COUNT(a.appointment_id) AS total_appointments
            FROM patient p
            JOIN appointments a ON p.patient_id = a.patient_id
            JOIN doctor d ON a.doctor_id = d.doctor_id
            WHERE d.mechanism_id = %s
        """
        params = [request.mechanism_id]

        if search:
            sql += " AND (p.first_name LIKE %s OR p.last_name LIKE %s OR p.id_number LIKE %s)"
            like = f'%{search}%'
            params += [like, like, like]

        if gender_filter:
            sql += " AND p.gender = %s"
            params.append(gender_filter)

        sql += " GROUP BY p.patient_id ORDER BY last_appointment DESC"
        cursor.execute(sql, params)
        patients = cursor.fetchall()

        for pt in patients:
            for key in ['date_of_birth', 'last_appointment']:
                if pt.get(key):
                    pt[key] = pt[key].isoformat() if hasattr(pt[key], 'isoformat') else str(pt[key])

        return jsonify({'patients': patients, 'total': len(patients)})
    finally:
        cursor.close()
        db.close()


@app.route('/api/mechanism/patients/<int:patient_id>', methods=['GET'])
@require_mechanism
def get_mechanism_patient_detail(patient_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT COUNT(*) AS cnt FROM appointments a
            JOIN doctor d ON a.doctor_id = d.doctor_id
            WHERE a.patient_id = %s AND d.mechanism_id = %s
        """, (patient_id, request.mechanism_id))
        if cursor.fetchone()['cnt'] == 0:
            return jsonify({'error': '患者不存在或無權限'}), 404

        cursor.execute("SELECT * FROM patient WHERE patient_id = %s", (patient_id,))
        patient = cursor.fetchone()

        for key in ['date_of_birth', 'created_at', 'updated_at']:
            if patient.get(key):
                patient[key] = patient[key].isoformat() if hasattr(patient[key], 'isoformat') else str(patient[key])

        return jsonify(patient)
    finally:
        cursor.close()
        db.close()


@app.route('/api/mechanism/patients/<int:patient_id>/appointments', methods=['GET'])
@require_mechanism
def get_mechanism_patient_appointments(patient_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                a.appointment_id, a.appointment_date, a.appointment_time,
                a.status, a.symptoms, a.consultation_notes, a.doctor_advice,
                a.amount, a.payment_method,
                CONCAT(d.first_name, d.last_name) AS doctor_name,
                d.specialty
            FROM appointments a
            JOIN doctor d ON a.doctor_id = d.doctor_id
            WHERE a.patient_id = %s AND d.mechanism_id = %s
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        """, (patient_id, request.mechanism_id))
        appts = cursor.fetchall()

        for ap in appts:
            if ap.get('appointment_date'):
                ap['appointment_date'] = ap['appointment_date'].isoformat() if hasattr(ap['appointment_date'], 'isoformat') else str(ap['appointment_date'])
            # mysql.connector 回傳 timedelta，轉成 HH:MM 字串
            if ap.get('appointment_time') and hasattr(ap['appointment_time'], 'total_seconds'):
                total = int(ap['appointment_time'].total_seconds())
                ap['appointment_time'] = f"{total // 3600:02d}:{(total % 3600) // 60:02d}"

        return jsonify({'appointments': appts, 'total': len(appts)})
    finally:
        cursor.close()
        db.close()

@app.route("/api/mechanism/doctors", methods=["POST"])
def add_doctor():
    try:
        data = request.get_json()

        first_name        = data.get("first_name")
        last_name         = data.get("last_name")
        gender            = data.get("gender", "male")
        specialty         = data.get("specialty", "")
        practice_hospital = data.get("practice_hospital", "")
        phone_number      = data.get("phone_number", "")
        approval_status   = data.get("approval_status", "pending")
        certificate_path  = data.get("certificate_path", "")
        email             = data.get("email")
        password          = data.get("password")

        if not first_name or not last_name:
            return jsonify({"error": "姓名為必填"}), 400
        if not email:
            return jsonify({"error": "Email 為必填"}), 400
        if not password or len(password) < 6:
            return jsonify({"error": "密碼至少 6 個字元"}), 400

        conn   = get_db()
        cursor = conn.cursor(dictionary=True)

        # 1. 從 mechanism 表取得 mechanism_id
        cursor.execute(
            "SELECT mechanism_id FROM mechanism WHERE user_id = %s",
            (session.get("user_id"),)
        )
        mech = cursor.fetchone()
        if not mech:
            cursor.close()
            conn.close()
            return jsonify({"error": "找不到機構資料，請重新登入"}), 403
        mechanism_id = mech["mechanism_id"]

        # 2. 檢查 email 是否重複
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "此 Email 已被註冊"}), 400

        # 3. 建立 users 帳號
        import bcrypt
        username  = f"{last_name}{first_name}"
        hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, 'doctor')",
            (username, email, hashed_pw)
        )
        user_id = cursor.lastrowid

        # 4. 插入 doctor 主表
        cursor.execute("""
            INSERT INTO doctor
              (user_id, first_name, last_name, gender, specialty,
               practice_hospital, phone_number,
               approval_status, certificate_path, mechanism_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, first_name, last_name, gender, specialty,
            practice_hospital, phone_number,
            approval_status, certificate_path, mechanism_id
        ))
        doctor_id = cursor.lastrowid

        # 5. 插入 doctor_info 副表（specialty/practice_hospital 為 NOT NULL）
        cursor.execute("""
            INSERT INTO doctor_info
              (doctor_id, user_id, first_name, last_name, gender,
               specialty, practice_hospital, phone_number)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            doctor_id, user_id, first_name, last_name, gender,
            specialty, practice_hospital, phone_number
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "醫師新增成功", "doctor_id": doctor_id}), 201

    except Exception as e:
        print("新增醫師錯誤:", e)
        return jsonify({"error": str(e)}), 500
# ─────────────────────────────────────────
# 機構排班（POST）
# ─────────────────────────────────────────
@app.route('/api/mechanism/schedules', methods=['POST'])
def mechanism_save_schedules():
    """機構管理員幫醫師儲存排班"""
    if 'user_id' not in session:
        return jsonify({'error': '未登入'}), 401

    data = request.get_json()
    if not data:
        return jsonify({'error': '無效的請求資料'}), 400

    doctor_id  = data.get('doctor_id')
    schedules  = data.get('schedules', [])
    week_start = data.get('week_start')
    week_end   = data.get('week_end')

    if not doctor_id:
        return jsonify({'error': '缺少 doctor_id'}), 400

    try:
        db = get_db()
        cursor = db.cursor()

        # 刪除過期排班
        cursor.execute("""
            DELETE FROM schedules
            WHERE doctor_id = %s
              AND TIMESTAMP(schedule_date, time_slot) < NOW()
        """, (doctor_id,))

        # 刪除該週舊排班
        if week_start and week_end:
            cursor.execute("""
                DELETE FROM schedules
                WHERE doctor_id = %s
                  AND schedule_date BETWEEN %s AND %s
            """, (doctor_id, week_start, week_end))
        elif schedules:
            dates = list(set([item['date'] for item in schedules]))
            for d in dates:
                cursor.execute("""
                    DELETE FROM schedules
                    WHERE doctor_id = %s AND schedule_date = %s
                """, (doctor_id, d))

        # 插入新排班
        for item in schedules:
            schedule_date = item.get('date')
            time_slot     = item.get('time_slot')
            is_available  = item.get('is_available', 1)

            if not schedule_date or not time_slot:
                continue

            cursor.execute("""
                INSERT INTO schedules (doctor_id, schedule_date, time_slot, is_available)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)
            """, (doctor_id, schedule_date, time_slot, is_available))

        db.commit()
        cursor.close()
        db.close()

        return jsonify({'message': '排班儲存成功'}), 200

    except Exception as e:
        print(f"機構排班儲存失敗: {e}")
        return jsonify({'error': '伺服器錯誤'}), 500


# ─────────────────────────────────────────
# 檢查 LINE 綁定狀態
# ─────────────────────────────────────────
@app.route('/api/line/binding-status', methods=['GET'])
def get_line_binding_status():
    """檢查當前登入用戶的 LINE 綁定狀態"""
    if 'user_id' not in session:
        return jsonify({'error': '未登入'}), 401
    
    user_id = session['user_id']
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT line_user_id FROM users WHERE user_id = %s",
        (user_id,)
    )
    user = cursor.fetchone()
    cursor.close()
    db.close()
    
    if not user:
        return jsonify({'error': '用戶不存在'}), 404
    
    is_bound = user['line_user_id'] is not None
    
    return jsonify({
        'is_bound': is_bound,
        'line_user_id': user['line_user_id'] if is_bound else None
    })
 
 
# ─────────────────────────────────────────
# 解除 LINE 綁定
# ─────────────────────────────────────────
@app.route('/api/line/unbind', methods=['POST'])
def unbind_line():
    """解除當前登入用戶的 LINE 綁定"""
    if 'user_id' not in session:
        return jsonify({'error': '未登入'}), 401
    
    user_id = session['user_id']
    
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE users SET line_user_id = NULL WHERE user_id = %s",
        (user_id,)
    )
    db.commit()
    cursor.close()
    db.close()
    
    return jsonify({
        'success': True,
        'message': '已成功解除 LINE 綁定'
    })
 
 
# ─────────────────────────────────────────
# 測試推播 (開發用,上線後應移除或加權限檢查)
# ─────────────────────────────────────────
@app.route('/api/line/test-notification', methods=['POST'])
def test_line_notification():
    """測試推播通知給當前登入用戶"""
    if 'user_id' not in session:
        return jsonify({'error': '未登入'}), 401
    
    user_id = session['user_id']
    
    # 取得用戶的 line_user_id
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT line_user_id, username FROM users WHERE user_id = %s",
        (user_id,)
    )
    user = cursor.fetchone()
    cursor.close()
    db.close()
    
    if not user or not user['line_user_id']:
        return jsonify({'error': '未綁定 LINE 帳號'}), 400
    
    # 推播測試訊息
    from line_notifier import push_line_message
    
    message = f"""🔔 測試通知
 
親愛的 {user['username']} 您好!
 
這是一則測試通知,確認您已成功綁定 LINE 通知服務。
 
✅ 系統將在以下情況推送通知:
• 預約確認
• 看診提醒(開始前5分鐘)
• 預約取消
• 問題回報狀態更新
 
祝您使用愉快! 😊"""
    
    success = push_line_message(user['line_user_id'], message)
    
    if success:
        return jsonify({
            'success': True,
            'message': '測試通知已發送,請查看您的 LINE'
        })
    else:
        return jsonify({
            'success': False,
            'error': '推播失敗,請檢查設定'
        }), 500


# ═════════════════════════════════════════════════════════════════
# LINE BOT WEBHOOK - Email 綁定功能
# ═════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────
# Email 驗證格式
# ─────────────────────────────────────────
def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


# ─────────────────────────────────────────
# 檢查 LINE User ID 是否已綁定
# ─────────────────────────────────────────
def is_line_user_bound(line_user_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(                      # ← 加回 cursor.execute
        "SELECT user_id FROM users WHERE line_user_id = %s",
        (line_user_id,)
    )
    result = cursor.fetchone()
    cursor.close()
    db.close()
    return result is not None


# ─────────────────────────────────────────
# 透過 Email 綁定 LINE User ID
# ─────────────────────────────────────────
def bind_email_to_line(email, line_user_id):
    """
    根據 email 查找用戶,並綁定 line_user_id
    返回: (success: bool, message: str, user_info: dict)
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    # 查詢用戶是否存在
    cursor.execute(
        "SELECT user_id, username, email, role FROM users WHERE email = %s",
        (email,)
    )
    user = cursor.fetchone()
    
    if not user:
        cursor.close()
        db.close()
        return False, "❌ 找不到此 Email,請確認您輸入的 Email 是否正確", None
    
    # 檢查此帳號是否已被其他 LINE 帳號綁定
    if user.get('line_user_id') and user['line_user_id'] != line_user_id:
        cursor.close()
        db.close()
        return False, "❌ 此 Email 已被其他 LINE 帳號綁定", None
    
    # 綁定 LINE User ID
    cursor.execute(
        "UPDATE users SET line_user_id = %s WHERE user_id = %s",
        (line_user_id, user['user_id'])
    )
    db.commit()
    
    cursor.close()
    db.close()
    
    return True, "✅ 綁定成功!", user


# ─────────────────────────────────────────
# 取得用戶資訊 (透過 LINE User ID)
# ─────────────────────────────────────────
def get_user_by_line_id(line_user_id):
    """透過 LINE User ID 取得用戶資訊"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT user_id, username, email, role FROM users WHERE line_user_id = %s",
        (line_user_id,)
    )
    user = cursor.fetchone()
    cursor.close()
    db.close()
    return user


# ─────────────────────────────────────────
# Webhook 路由
# ─────────────────────────────────────────
@app.route("/line/webhook", methods=['POST'])
def line_webhook():
    """LINE Webhook 入口"""
    signature = request.headers.get('X-Line-Signature', '')
    body = request.get_data(as_text=True)
    print(f"🔔 收到 Webhook，簽章: {signature}")
    print(f"Body: {body}")

    # LINE Verify 會發送空 body，直接回 200 讓驗證通過
    if not body or body.strip() == '':
        return 'OK', 200

    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        print("❌ 簽章驗證失敗")
        return 'Invalid signature', 400
    except Exception as e:
        print(f"❌ 處理 Webhook 失敗: {e}")
        return 'Error', 500

    return 'OK', 200


# ─────────────────────────────────────────
# 事件處理：用戶加好友
# ─────────────────────────────────────────
@handler.add(FollowEvent)
def handle_follow(event):
    """當用戶加 Bot 為好友時"""
    line_user_id = event.source.user_id
    print(f"✅ 新用戶加入: {line_user_id}")
    
    welcome_message = """🎉 歡迎使用遠距醫療系統通知服務!

為了讓您能即時收到看診提醒、預約通知等訊息,請先完成帳號綁定。

📧 請輸入您在系統註冊的 Email 地址:
(例如: user@example.com)

💡 提示:
• Email 必須是您在遠距醫療系統註冊時使用的信箱
• 綁定後即可收到系統通知
• 如有問題請聯繫客服"""

    try:
        line_bot_api.reply_message(
            event.reply_token,
            TextSendMessage(text=welcome_message)
        )
        print(f"✅ 歡迎訊息已發送給 {line_user_id}")
    except Exception as e:
        print(f"❌ 發送歡迎訊息失敗: {e}")


# ─────────────────────────────────────────
# 事件處理:接收文字訊息
# ─────────────────────────────────────────
@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    """處理用戶發送的文字訊息"""
    line_user_id = event.source.user_id
    user_message = event.message.text.strip()

    print(f"📩 收到訊息 from {line_user_id}: {user_message}")

    # ── 已綁定用戶 ──────────────────────────────────────────
    if is_line_user_bound(line_user_id):
        user = get_user_by_line_id(line_user_id)
        nickname = user.get('username', '用戶')

        if user_message == "我的資料" or user_message.lower() == "info":
            reply_text = f"""📋 您的帳號資訊:

👤 用戶名稱: {user['username']}
📧 Email: {user['email']}
🏥 身份: {'病患' if user['role'] == 'patient' else '醫師' if user['role'] == 'doctor' else user['role']}
✅ LINE 綁定狀態: 已綁定

如需解除綁定,請輸入「解除綁定」"""

        elif user_message == "解除綁定":
            db = get_db()
            cursor = db.cursor()
            cursor.execute(
                "UPDATE users SET line_user_id = NULL WHERE line_user_id = %s",
                (line_user_id,)
            )
            db.commit()
            cursor.close()
            db.close()
            reply_text = """✅ 已成功解除 LINE 綁定

您將不再收到系統通知。
如需重新綁定,請輸入您的 Email 地址。"""
            print(f"✅ 用戶 {line_user_id} 已解除綁定")

        elif user_message == "幫助" or user_message.lower() == "help":
            reply_text = """📖 可用指令:

- 我的資料 - 查看帳號資訊
- 解除綁定 - 解除 LINE 綁定
- 幫助 - 顯示此說明

您也可以直接在系統中查看通知中心喔!"""

        else:
            # ── 已綁定：輸入其他內容 → 顯示兩段歡迎訊息 ──
            msg1 = (
                f"{nickname}您好！\n"
                f"🎉 歡迎使用醫隨行LINE通知服務！\n\n"
                "🔖 目前支援的指令:\n"
                "• 我的資料\n"
                "• 解除綁定\n"
                "• 幫助\n"
                "如需查看通知,請登入系統查看通知中心。"
            )
            try:
                line_bot_api.reply_message(
                    event.reply_token,
                    [TextSendMessage(text=msg1)]
                )
            except Exception as e:
                print(f"❌ 回覆訊息失敗: {e}")
            return

        try:
            line_bot_api.reply_message(
                event.reply_token,
                TextSendMessage(text=reply_text)
            )
        except Exception as e:
            print(f"❌ 回覆訊息失敗: {e}")
        return

    # ── 未綁定用戶 ──────────────────────────────────────────
    
    # 指令類（未綁定時也能識別）
    KNOWN_COMMANDS = {"我的資料", "解除綁定", "幫助", "info", "help"}

    if user_message in KNOWN_COMMANDS or user_message.lower() in KNOWN_COMMANDS:
        # 未綁定卻輸入指令 → 同樣顯示兩段引導訊息
        show_guide = True
    elif is_valid_email(user_message):
        # 嘗試 Email 綁定
        show_guide = False
        success, message, user_info = bind_email_to_line(user_message, line_user_id)

        if success:
            role_name = "病患" if user_info['role'] == 'patient' else "醫師" if user_info['role'] == 'doctor' else user_info['role']
            reply_text = f"""✅ 綁定成功!

👤 用戶名稱: {user_info['username']}
📧 Email: {user_info['email']}
🏥 身份: {role_name}

您現在可以透過 LINE 接收:
- 📅 預約確認通知
- ⏰ 看診提醒 (開始前 5 分鐘)
- 📝 預約取消通知
- 💬 問題回報狀態更新

💡 提示:
輸入「我的資料」可查看帳號資訊
輸入「幫助」查看更多功能"""
            print(f"✅ Email {user_message} 綁定成功: {user_info['username']}")
        else:
            reply_text = message
            print(f"❌ 綁定失敗: {message}")

        try:
            line_bot_api.reply_message(
                event.reply_token,
                TextSendMessage(text=reply_text)
            )
        except Exception as e:
            print(f"❌ 回覆訊息失敗: {e}")
        return
    else:
        # 不是 Email 也不是指令 → 顯示兩段引導訊息
        show_guide = True

    if show_guide:
        msg1 = (
            "您好！\n"
            "🎉 歡迎使用醫隨行LINE通知服務！\n\n"
            "為了讓您能即時收到看診提醒、預約通知等訊息,請先完成帳號綁定。\n\n"
            "📧 請直接於訊息中輸入您在系統註冊的 Email 地址:\n"
            "(例如: user@example.com)\n"
            "綁定成功後會收到系統通知回覆✅\n\n"
            "💡 提示:\n"
            "• Email 必須是您在遠距醫療系統註冊時使用的信箱\n"
            "• 綁定成功後即可收到系統通知\n"
            "• 如需解除綁定，請於訊息中輸入「解除綁定」"
        )
        msg2 = (
            "如需查看通知,請登入系統查看通知中心。"
        )
        try:
            line_bot_api.reply_message(
                event.reply_token,
                [TextSendMessage(text=msg1), TextSendMessage(text=msg2)]
            )
        except Exception as e:
            print(f"❌ 回覆訊息失敗: {e}")


# ═════════════════════════════════════════════════════════════════
# END OF LINE BOT WEBHOOK
# ═════════════════════════════════════════════════════════════════


# ═════════════════════════════════════════════════════════════════
# 內部 LINE 即時推播 API（供 Next.js route.js 呼叫）
# ═════════════════════════════════════════════════════════════════

@app.route("/api/internal/line/booking-success", methods=["POST"])
def internal_line_booking_success():
    """預約成功即時推播（由 Next.js appointments route.js 呼叫）"""
    try:
        data = request.get_json()
        from line_notifier import notify_booking_success
        notify_booking_success(
            patient_id   = data["patient_id"],
            patient_name = data["patient_name"],
            doctor_name  = data["doctor_name"],
            specialty    = data["specialty"],
            date_str     = data["date_str"],
            time_str     = data["time_str"],
        )
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"⚠️ 預約成功推播失敗: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/internal/line/booking-cancelled", methods=["POST"])
def internal_line_booking_cancelled():
    """預約取消即時推播（由 Next.js appointments route.js 呼叫）"""
    try:
        data = request.get_json()
        from line_notifier import notify_booking_cancelled
        notify_booking_cancelled(
            patient_id     = data["patient_id"],
            patient_name   = data["patient_name"],
            doctor_name    = data["doctor_name"],
            specialty      = data["specialty"],
            date_str       = data["date_str"],
            time_str       = data["time_str"],
            cancel_reason  = data["cancel_reason"],
            refund_message = data["refund_message"],
        )
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"⚠️ 預約取消推播失敗: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/internal/line/feedback-received", methods=["POST"])
def internal_line_feedback_received():
    """問題回報確認即時推播（由 Next.js feedback route.js 呼叫）"""
    try:
        data = request.get_json()
        from line_notifier import notify_feedback_received
        notify_feedback_received(
            patient_id     = data["patient_id"],
            patient_name   = data["patient_name"],
            categories_str = data["categories_str"],
            feedback_text  = data["feedback_text"],
        )
        return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"⚠️ 回報通知推播失敗: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


if __name__ == "__main__":
    from line_notifier import start_scheduler
    start_scheduler()
    start_background_tasks()
    app.run(debug=True, use_reloader=False)