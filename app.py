from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import bcrypt
import jwt
import datetime
from functools import wraps
import os

app = Flask(__name__)
CORS(app)  # 允許跨域請求

# 配置
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'  # 請修改為安全的密鑰

# 資料庫配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',  # 請修改為您的資料庫使用者名稱
    'password': 'your_password',  # 請修改為您的資料庫密碼
    'database': 'telemedicine'  # 請修改為您的資料庫名稱
}

# 獲取資料庫連接
def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"資料庫連接錯誤: {e}")
        return None

# JWT Token 驗證裝飾器
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': '缺少驗證 token'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token 已過期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': '無效的 token'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

# 註冊 API
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # 驗證必填欄位
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'缺少必填欄位: {field}'}), 400
        
        username = data['username']
        email = data['email']
        password = data['password']
        role = data['role']
        
        # 驗證角色
        if role not in ['doctor', 'patient']:
            return jsonify({'message': '無效的角色'}), 400
        
        # 連接資料庫
        connection = get_db_connection()
        if not connection:
            return jsonify({'message': '資料庫連接失敗'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # 檢查 email 是否已存在
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'message': '此電子信箱已被註冊'}), 400
        
        # 檢查 username 是否已存在
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'message': '此使用者名稱已被使用'}), 400
        
        # 密碼加密
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # 插入新使用者
        query = """
            INSERT INTO users (username, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (username, email, password_hash, role))
        connection.commit()
        
        user_id = cursor.lastrowid
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'message': '註冊成功',
            'user_id': user_id
        }), 201
        
    except Error as e:
        print(f"資料庫錯誤: {e}")
        return jsonify({'message': '註冊失敗，請稍後再試'}), 500
    except Exception as e:
        print(f"錯誤: {e}")
        return jsonify({'message': '伺服器錯誤'}), 500

# 登入 API
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # 驗證必填欄位
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': '請提供電子信箱和密碼'}), 400
        
        email = data['email']
        password = data['password']
        role = data.get('role')
        
        # 連接資料庫
        connection = get_db_connection()
        if not connection:
            return jsonify({'message': '資料庫連接失敗'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # 查詢使用者
        query = "SELECT * FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        # 驗證使用者
        if not user:
            return jsonify({'message': '電子信箱或密碼錯誤'}), 401
        
        # 驗證密碼
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'message': '電子信箱或密碼錯誤'}), 401
        
        # 驗證角色
        if role and user['role'] != role:
            return jsonify({'message': f'此帳號不是{role}身份'}), 401
        
        # 生成 JWT token
        token = jwt.encode({
            'user_id': user['user_id'],
            'email': user['email'],
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)  # Token 7天後過期
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'message': '登入成功',
            'token': token,
            'user': {
                'user_id': user['user_id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
        
    except Error as e:
        print(f"資料庫錯誤: {e}")
        return jsonify({'message': '登入失敗，請稍後再試'}), 500
    except Exception as e:
        print(f"錯誤: {e}")
        return jsonify({'message': '伺服器錯誤'}), 500

# 取得使用者資訊 API (需要驗證)
@app.route('/api/user', methods=['GET'])
@token_required
def get_user_info(current_user):
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'message': '資料庫連接失敗'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT user_id, username, email, role, created_at FROM users WHERE user_id = %s"
        cursor.execute(query, (current_user['user_id'],))
        user = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if not user:
            return jsonify({'message': '找不到使用者'}), 404
        
        return jsonify({'user': user}), 200
        
    except Error as e:
        print(f"資料庫錯誤: {e}")
        return jsonify({'message': '取得使用者資訊失敗'}), 500

# 健康檢查 API
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': '伺服器運行中'
    }), 200

# 錯誤處理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': '找不到該 API 端點'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': '伺服器內部錯誤'}), 500

if __name__ == '__main__':
    # 開發模式運行，正式環境請使用 WSGI 伺服器如 Gunicorn
    app.run(debug=True, host='0.0.0.0', port=5000)