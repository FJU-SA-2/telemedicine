from flask import Flask, jsonify
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

@app.route("/doctors", methods=["GET"])
def get_doctors():
    cursor.execute("SELECT id, name, specialty FROM doctors")
    doctors = cursor.fetchall()
    return jsonify(doctors)

if __name__ == "__main__":
    app.run()
