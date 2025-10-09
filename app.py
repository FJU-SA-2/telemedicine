from flask import Flask, jsonify, request, session
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
app.secret_key = "change-me"  # 建議改成更安全的密鑰

# CORS 設定
CORS(app, supports_credentials=True, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

app.url_map.strict_slashes = False

# Session 設定
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,  # 本地開發用 False
    SESSION_COOKIE_NAME="telemedicine_session"
)

# 連接 MySQL
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="telemedicine"
    )

@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, name, specialty FROM doctors")
    doctors = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(doctors)

@app.route("/api/register", methods=["POST"])
def register_user():
    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")
    phone_number = data.get("phone_number")
    gender = data.get("gender")
    date_of_birth = data.get("date_of_birth")
    specialty = data.get("specialty")
    practice_hospital = data.get("practice_hospital")
    address = data.get("address")

    # 檢查必填欄位
    if not all([first_name, last_name, email, password, role]):
        return jsonify({'message': '請填寫完整資料'}), 400
    if role == "patient" and not date_of_birth:
        return jsonify({'message': '病患請填寫出生日期'}), 400
    if role == "doctor" and not all([specialty, practice_hospital]):
        return jsonify({'message': '醫生請填寫專科及服務醫院'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # 檢查 email 是否已存在
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'message': '此 Email 已被註冊'}), 400

        username = first_name + last_name

        # 插入 users 表
        sql_user = """
            INSERT INTO users (username, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql_user, (username, email, password, role))
        db.commit()

        user_id = cursor.lastrowid

        # 插入 Patient 或 Doctor 表
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
        return jsonify({'message': '註冊成功'}), 200

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