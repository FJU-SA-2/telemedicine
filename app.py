from flask import Flask, jsonify , request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)  # 允許跨域，Next.js 可以呼叫

# 連接 MySQL
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="telemedicine"
)
cursor = db.cursor(dictionary=True)

@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    cursor.execute("SELECT id, name, specialty FROM doctors")
    doctors = cursor.fetchall()
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

    try:
        # 將 first_name + last_name 當作 username
        username = first_name + last_name

        # 先插入 users 表
        sql_user = """
            INSERT INTO users (username, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql_user, (username, email, password, role))
        db.commit()

        user_id = cursor.lastrowid  # 取得剛插入的 user_id

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
        return jsonify({'message': str(e)}), 500



if __name__ == "__main__":
    app.run()