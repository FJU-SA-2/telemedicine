from flask import Flask, jsonify, request, session
from flask_cors import CORS
import mysql.connector
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
from datetime import datetime, timedelta
from email.header import Header

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
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=10)  # Session 10分鐘過期
)

# 連接 MySQL
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="telemedicine"
    )

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
    
    # 將驗證碼和過期時間存入 session
    session['verification_code'] = verification_code
    session['verification_email'] = email
    session['verification_expiry'] = (datetime.now() + timedelta(minutes=10)).isoformat()
    
    # 暫存註冊資料
    session['pending_registration'] = data
    
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
    
    # 驗證成功，執行註冊
    registration_data = session.get('pending_registration')
    if not registration_data:
        return jsonify({'message': '註冊資料遺失，請重新註冊'}), 400
    
    # 執行註冊邏輯（複製原本的註冊代碼）
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
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        username = first_name + last_name
        
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
            sql_doctor = """
                INSERT INTO doctor (user_id, first_name, last_name, gender, phone_number, specialty, practice_hospital)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql_doctor, (user_id, first_name, last_name, gender, phone_number, specialty, practice_hospital))
        
        db.commit()
        
        # 清除 session 中的驗證資料
        session.pop('verification_code', None)
        session.pop('verification_email', None)
        session.pop('verification_expiry', None)
        session.pop('pending_registration', None)
        
        return jsonify({
            'success': True,
            'message': '註冊成功'
        }), 200
        
    except Exception as e:
        db.rollback()
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
        # 查詢 users 表
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "帳號不存在"}), 401

        # 密碼比對
        if user["password_hash"] != password:
            return jsonify({"message": "密碼錯誤"}), 401

        # 根據 role 取得詳細資料
        role = user["role"]
        user_id = user["user_id"]
        
        if role == "patient":
            cursor.execute("SELECT * FROM patient WHERE user_id = %s", (user_id,))
        elif role == "doctor":
            cursor.execute("SELECT * FROM doctor WHERE user_id = %s", (user_id,))
        
        profile = cursor.fetchone()

        # 儲存到 session
        session['user_id'] = user_id
        session['email'] = email
        session['role'] = role
        session['username'] = user["username"]
        if profile:
            session['first_name'] = profile.get("first_name", "")
            session['last_name'] = profile.get("last_name", "")

        return jsonify({
            "success": True,
            "message": "登入成功",
            "user": {
                "user_id": user_id,
                "username": user["username"],
                "role": role,
                "email": email,
                "firstName": profile.get("first_name", "") if profile else "",
                "lastName": profile.get("last_name", "") if profile else ""
            }
        }), 200

    except Exception as e:
        return jsonify({"message": f"登入失敗: {str(e)}"}), 500
    finally:
        cursor.close()
        db.close()

@app.route("/api/me", methods=["GET"])
def get_current_user():
    """取得當前登入使用者資訊"""
    if 'user_id' not in session:
        return jsonify({"authenticated": False}), 401

    return jsonify({
        "authenticated": True,
        "user": {
            "user_id": session.get('user_id'),
            "username": session.get('username'),
            "email": session.get('email'),
            "role": session.get('role'),
            "firstName": session.get('first_name', ''),
            "lastName": session.get('last_name', '')
        }
    }), 200

@app.route("/api/logout", methods=["POST"])
def logout_user():
    """登出"""
    session.clear()
    return jsonify({"message": "登出成功"}), 200

    from flask import Flask, jsonify
app = Flask(__name__)

@app.route("/api/appointments")
def get_appointments():
    # 從資料庫抓資料
    data = [
        {
            "appointment_id": 1,
            "appointment_date": "2025-10-12",
            "appointment_time": "09:30:00",
            "status": "已確認",
            "doctor_name": "林美玲",
            "doctor_specialty": "小兒科"
        }
    ]
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True)