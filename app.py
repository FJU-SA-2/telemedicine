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

@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, name, specialty FROM doctors")
    doctors = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(doctors)


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
        # 查 users
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "帳號不存在"}), 401

        # 密碼比對（建議後續改成 hash）
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
        
        elif role == "doctor":  # ⭐ 修改這裡
            cursor.execute("SELECT * FROM doctor WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if profile:
                doctor_id = profile.get("doctor_id")  # ⭐ 取得 doctor_id
                first_name = profile.get("first_name", "")
                last_name = profile.get("last_name", "")

        # 儲存到 session
        session['user_id'] = user_id
        session['email'] = email
        session['role'] = role
        session['username'] = user["username"]
        session['patient_id'] = patient_id
        session['doctor_id'] = doctor_id  # ⭐ 新增
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
                "doctor_id": doctor_id,  # ⭐ 新增
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
    if 'user_id' not in session:
        return jsonify({"authenticated": False}), 401
    user_id = session.get('user_id')
    role = session.get('role')
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        user_data = {
            "user_id": user_id,
            "username": session.get('username'),
            "email": session.get('email'),
            "role": role,
            "patient_id": session.get('patient_id'),
            "doctor_id": session.get('doctor_id'), 
            "first_name": session.get('first_name'), 
            "last_name": session.get('last_name')

        } 
    
    

  
        # 如果是病患,取得完整健康資料
        if role == "patient":
            cursor.execute("""
                SELECT patient_id, first_name, last_name, gender, phone_number, 
                       date_of_birth, address, id_number, smoking_status, 
                       drug_allergies, medical_history, emergency_contact_name, 
                       emergency_contact_phone
                FROM patient 
                WHERE user_id = %s
            """, (user_id,))
            patient_data = cursor.fetchone()
            
            if patient_data:
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
                }
    # 新增：如果是醫師，取得完整專業資料
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
                emergency_contact_name = %s,
                emergency_contact_phone = %s
            WHERE user_id = %s
        """
        cursor.execute(sql, (
            id_number, smoking_status, drug_allergies, medical_history,
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
   
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    user_id = session['user_id']
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
            a.cancellation_reason,
            d.first_name,
            d.last_name,
            d.specialty as doctor_specialty
        FROM appointments a
        INNER JOIN doctor d ON a.doctor_id = d.doctor_id
        INNER JOIN patient p ON a.patient_id = p.patient_id
        WHERE a.patient_id = %s
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    """

            cursor.execute(query, (patient_id,))
            appointments = cursor.fetchall()

      
            for a in appointments:
              a["appointment_date"] = serialize_datetime(a["appointment_date"])
              a["appointment_time"] = serialize_datetime(a["appointment_time"])


        
        return jsonify(appointments), 200
        
    except Exception as e:
        print(f"❌ 獲取歷史記錄失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"獲取歷史記錄失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

@app.route("/api/cancel_appointment", methods=["POST"])
def cancel_appointment():
    try:
        data = request.get_json()
        appointment_id = data.get("appointment_id")
        cancel_reason = data.get("cancellation_reason", "")  # 新增：取得取消原因

        db = get_db()
        cursor = db.cursor(dictionary=True)

        # 取得預約狀態與時間
        cursor.execute("""
            SELECT appointment_date, appointment_time, status 
            FROM appointments 
            WHERE appointment_id = %s
        """, (appointment_id,))
        appt = cursor.fetchone()

        if not appt:
            return jsonify({"success": False, "message": "找不到此預約"}), 404

        appointment_date = appt["appointment_date"]
        appointment_time = appt["appointment_time"]
        status = appt["status"]

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

        # 計算退款比例
        diff = appointment_datetime - now
        diff_days = diff.total_seconds() / (24 * 3600)
        
        # 判斷是否為當天
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

        # 更新狀態並儲存取消原因
        cursor.execute("""
            UPDATE appointments 
            SET status = '已取消', cancellation_reason = %s 
            WHERE appointment_id = %s
        """, (cancel_reason, appointment_id))
        db.commit()

        return jsonify({
            "success": True, 
            "message": refund_message,
            "refund_percentage": refund_percentage
        })

    except Exception as e:
        print("Cancel error:", e)
        return jsonify({"success": False, "message": "伺服器錯誤"}), 500

    finally:
        cursor.close()
        db.close()
        
@app.route("/api/recordoc", methods=["GET"])
def get_recordoc():
   
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    user_id = session['user_id']
    role = session.get('role')
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        if role == 'doctor':
            doctor_id = session.get('doctor_id')
            query = """
        SELECT 
            a.appointment_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            p.first_name,
            p.last_name
        FROM appointments a
        INNER JOIN patient p ON a.patient_id = p.patient_id
        INNER JOIN doctor d ON a.doctor_id = d.doctor_id
        WHERE a.doctor_id = %s
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    """

            cursor.execute(query, (doctor_id,))
            appointments = cursor.fetchall()

      
            for a in appointments:
              a["appointment_date"] = serialize_datetime(a["appointment_date"])
              a["appointment_time"] = serialize_datetime(a["appointment_time"])


        
        return jsonify(appointments), 200
        
    except Exception as e:
        print(f"❌ 獲取歷史記錄失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"獲取歷史記錄失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()


   

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
    
    db = get_db()
    cursor = db.cursor(dictionary=True)

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
                ORDER BY u.created_at DESC
            """
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
                ORDER BY u.created_at DESC
            """
        
        cursor.execute(sql)
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
def get_schedules(doctor_id):
    """取得醫師排班資料 - 只返回可預約的時段,並自動刪除過期排班"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    print("=" * 60)
    print(f"📥 收到排班查詢請求")
    print(f"   doctor_id: {doctor_id}")
    print(f"   start_date: {start_date}")
    print(f"   end_date: {end_date}")
    
    if not start_date or not end_date: 
        return jsonify({'error': '需要提供 start_date 和 end_date'}), 400
    
    connection = get_db()
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # 檢查醫師是否存在
        cursor.execute("SELECT doctor_id, first_name, last_name FROM doctor WHERE doctor_id = %s", (doctor_id,))
        doctor = cursor.fetchone()
        if not doctor:
            print(f"❌ doctor_id={doctor_id} 不存在")
            return jsonify({'error': '醫師不存在'}), 404
        
        print(f"✅ 醫師存在: {doctor['first_name']}{doctor['last_name']}")
        
        # 刪除過期排班
        today = datetime.now().date()
        delete_query = """
            DELETE FROM schedules 
            WHERE doctor_id = %s AND schedule_date < %s
        """
        cursor.execute(delete_query, (doctor_id, today))
        deleted_count = cursor.rowcount
        connection.commit()
        if deleted_count > 0:
            print(f"🗑️  刪除了 {deleted_count} 筆過期排班")
        
        # 查詢排班
        query = """
            SELECT schedule_id, doctor_id, schedule_date, time_slot, is_available
            FROM schedules
            WHERE doctor_id = %s 
            AND schedule_date BETWEEN %s AND %s
            ORDER BY schedule_date, time_slot
        """
        cursor.execute(query, (doctor_id, start_date, end_date))
        schedules = cursor.fetchall()
        
        print(f"📊 查詢到 {len(schedules)} 筆排班資料")
        
        # 格式化資料
        formatted_schedules = []
        for s in schedules:
            date_str = s['schedule_date'].strftime('%Y-%m-%d') if hasattr(s['schedule_date'], 'strftime') else str(s['schedule_date'])
            time_str = str(s['time_slot'])
            if len(time_str) > 5:
                time_str = time_str[:5]
            
            formatted_schedules.append({
                'schedule_id': s['schedule_id'],
                'doctor_id': s['doctor_id'],
                'schedule_date': date_str,
                'time_slot': time_str,
                'is_available': s['is_available']  # ✅ 加回來
            })
            print(f"   - {date_str} {time_str} (schedule_id={s['schedule_id']}, available={s['is_available']})")
        
        print(f"✅ 返回 {len(formatted_schedules)} 筆排班資料")
        print("=" * 60)
        return jsonify(formatted_schedules)
    
    except Error as e:
        print(f"❌ 查詢錯誤: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'查詢失敗: {str(e)}'}), 500
    
    finally:
        cursor.close()
        connection.close()



# 3. 儲存排班
@app.route('/api/schedules', methods=['POST'])
def save_schedules():
    """儲存醫師排班資料 - 只儲存可預約時段,刪除不可預約時段,防止排過去的班"""
    data = request.get_json()
    doctor_id = data.get('doctor_id')
    schedules = data.get('schedules')
    
    print("=" * 60)
    print(f"💾 收到排班儲存請求")
    print(f"   doctor_id: {doctor_id}")
    print(f"   schedules 數量: {len(schedules) if schedules else 0}")
    
    if not doctor_id or not schedules:
        return jsonify({'error': '缺少必要參數'}), 400
    
    connection = get_db()
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # 檢查醫師是否存在
        cursor.execute("SELECT doctor_id, first_name, last_name FROM doctor WHERE doctor_id = %s", (doctor_id,))
        doctor = cursor.fetchone()
        if not doctor:
            print(f"❌ doctor_id={doctor_id} 不存在")
            return jsonify({'error': '醫師不存在'}), 404
        
        print(f"✅ 醫師: {doctor['first_name']}{doctor['last_name']}")
        
        # 獲取今天的日期
        today = datetime.now().date()
        
        # 分離可預約和不可預約的時段
        available_schedules = []
        unavailable_schedules = []
        past_dates_count = 0
        
        for s in schedules:
            date_str = s['date']
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # 檢查是否為過去的日期
            if date_obj < today:
                past_dates_count += 1
                continue  # 跳過過去的日期
            
            time_slot = s['time_slot']
            # 如果前端傳 "HH:MM",加上秒數
            if len(time_slot) == 5:
                time_slot += ":00"
            
            if s['is_available']:
                available_schedules.append((doctor_id, date_str, time_slot))
                print(f"   ✅ 可預約: {date_str} {time_slot}")
            else:
                unavailable_schedules.append((doctor_id, date_str, time_slot))
                print(f"   ❌ 刪除: {date_str} {time_slot}")
        
        # 1. 插入或更新可預約的時段
        inserted_count = 0
        if available_schedules:
            insert_query = """
                INSERT INTO schedules (doctor_id, schedule_date, time_slot, is_available)
                VALUES (%s, %s, %s, 1)
                ON DUPLICATE KEY UPDATE is_available = 1, updated_at = NOW()
            """
            cursor.executemany(insert_query, available_schedules)
            inserted_count = cursor.rowcount
        
        # 2. 刪除不可預約的時段
        deleted_count = 0
        if unavailable_schedules:
            delete_query = """
                DELETE FROM schedules 
                WHERE doctor_id = %s AND schedule_date = %s AND time_slot = %s
            """
            cursor.executemany(delete_query, unavailable_schedules)
            deleted_count = cursor.rowcount
        
        connection.commit()
        
        message = '排班儲存成功'
        if past_dates_count > 0:
            message += f' (已忽略 {past_dates_count} 個過去的時段)'
        
        result = {
            'success': True,
            'message': message,
            'inserted': inserted_count,
            'deleted': deleted_count,
            'ignored_past': past_dates_count
        }
        
        print(f"✅ 儲存成功")
        print(f"   - 新增/更新: {inserted_count} 筆")
        print(f"   - 刪除: {deleted_count} 筆")
        print(f"   - 忽略過期: {past_dates_count} 筆")
        print("=" * 60)
        
        return jsonify(result), 200
    
    except Error as e:
        connection.rollback()
        print(f"❌ 儲存錯誤: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'儲存失敗: {str(e)}'}), 500
    
    finally:
        cursor.close()
        connection.close()

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
    """獲取錄影檔案（僅限相關醫師和患者）"""
    if 'user_id' not in session:
        return jsonify({"message": "請先登入"}), 401
    
    # 驗證權限
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
        
        # 檢查是否為該預約的醫師或患者
        user_role = session.get('role')
        if user_role == 'doctor':
            if appointment['doctor_id'] != session.get('doctor_id'):
                return jsonify({"message": "無權限查看"}), 403
        elif user_role == 'patient':
            if appointment['patient_id'] != session.get('patient_id'):
                return jsonify({"message": "無權限查看"}), 403
        else:
            return jsonify({"message": "無效的用戶角色"}), 403
        
        # 返回檔案
        return send_from_directory(app.config['RECORDING_FOLDER'], filename)
        
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

if __name__ == "__main__":
    app.run(debug=True)