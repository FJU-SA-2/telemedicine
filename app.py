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
from werkzeug.utils import secure_filename
import os
from datetime import date, datetime, time


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



# 檔案上傳設定
UPLOAD_FOLDER = 'uploads/certificates'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# 確保上傳資料夾存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS




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

#新增郵件發送函數 
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

def send_approval_email(recipient_email, doctor_name):
    """醫師審核通過後發送郵件"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = Header('醫隨行 MOG - 審核通過通知', 'utf-8')
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">🎉 恭喜!您的資料已審核通過</h2>
            <p>親愛的 {doctor_name} 醫師,您好:</p>
            <p>您的註冊資料已通過審核,現在您可以:</p>
            <ul>
                <li>✓ 登入系統開始使用</li>
                <li>✓ 設定您的看診時段</li>
                <li>✓ 接受病患預約</li>
                <li>✓ 進行線上問診服務</li>
            </ul>
            <p>立即登入開始您的醫隨行之旅!</p>
            <a href="http://localhost:3000/auth" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">立即登入</a>
            <hr>
            <p style="color: #666; font-size: 12px;">© 醫隨行 MOG · 保障您的健康與隱私</p>
        </body>
        </html>
        """
        
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


@app.route("/api/appointments", methods=["GET"])
def get_appointments():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    query = """
        SELECT 
            a.appointment_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            d.first_name,
            d.last_name,
            d.specialty as doctor_specialty
        FROM appointments a
        INNER JOIN doctor d ON a.doctor_id = d.doctor_id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    """
    cursor.execute(query)
    appointments = cursor.fetchall()
    
    cursor.close()
    db.close()
    
    for a in appointments:
        a["appointment_date"] = serialize_datetime(a["appointment_date"])
        a["appointment_time"] = serialize_datetime(a["appointment_time"])

    return jsonify(appointments)


   

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
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        file.save(filepath)
        
        # 將檔案路徑暫存到 session
        if 'pending_registration' not in session:
            session['pending_registration'] = {}
        session['pending_registration']['certificate'] = filepath
        
        return jsonify({
            'success': True,
            'message': '檔案上傳成功',
            'filename': unique_filename
        }), 200
    
    return jsonify({'message': '不支援的檔案格式 (僅支援 PDF, PNG, JPG)'}), 400

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

        session['admin_id'] = admin["admin_id"]
        session['admin_email'] = email
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

@app.route("/api/admin/certificate/<path:filename>", methods=["GET"])
def get_certificate(filename):
    """取得證照圖片"""
    if not session.get('is_admin'):
        return jsonify({"message": "無權限"}), 403
    
    from flask import send_from_directory
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == "__main__":
    app.run(debug=True)