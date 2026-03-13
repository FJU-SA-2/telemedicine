import requests
import random
import string
import mysql.connector
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import os

# ─────────────────────────────────────────
# 設定區
# ─────────────────────────────────────────
LINE_CHANNEL_ACCESS_TOKEN = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "你的_Channel_Access_Token")

DB_CONFIG = {
    "host":     os.environ.get("DB_HOST",     "localhost"),
    "user":     os.environ.get("DB_USER",     "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME",     "your_database"),
    "charset":  "utf8mb4",
}


# ─────────────────────────────────────────
# 資料庫連線
# ─────────────────────────────────────────
def get_db():
    return mysql.connector.connect(**DB_CONFIG)


# ─────────────────────────────────────────
# 綁定碼：產生
# ─────────────────────────────────────────
def generate_bind_code(user_id: int) -> str:
    """
    為指定的系統帳號產生一組 6 位數綁定碼，有效期 10 分鐘。
    同一個 user_id 重複產生會覆蓋舊的碼。
    """
    code = ''.join(random.choices(string.digits, k=6))
    expires_at = datetime.now() + timedelta(minutes=10)

    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO bind_codes (user_id, code, expires_at)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE code = %s, expires_at = %s
    """, (user_id, code, expires_at, code, expires_at))
    db.commit()
    cursor.close()
    db.close()
    return code


# ─────────────────────────────────────────
# 綁定碼：驗證並完成綁定
# ─────────────────────────────────────────
def verify_and_bind(line_user_id: str, code: str) -> bool:
    """
    用戶在 Line Bot 傳入綁定碼時呼叫。
    驗證成功則把 line_user_id 寫入 users 表，並刪除綁定碼。
    回傳 True 表示綁定成功，False 表示碼無效或已過期。
    """
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT user_id FROM bind_codes
        WHERE code = %s AND expires_at > NOW()
    """, (code,))
    row = cursor.fetchone()

    if not row:
        cursor.close()
        db.close()
        return False

    # 寫入 line_user_id
    cursor.execute(
        "UPDATE users SET line_user_id = %s WHERE user_id = %s",
        (line_user_id, row["user_id"])
    )
    # 刪除已使用的綁定碼
    cursor.execute("DELETE FROM bind_codes WHERE code = %s", (code,))
    db.commit()
    cursor.close()
    db.close()
    return True


# ─────────────────────────────────────────
# Line 推播
# ─────────────────────────────────────────
def push_line_message(line_user_id: str, message: str) -> bool:
    url = "https://api.line.me/v2/bot/message/push"
    headers = {
        "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "to": line_user_id,
        "messages": [{"type": "text", "text": message}],
    }
    resp = requests.post(url, headers=headers, json=payload)
    if resp.status_code != 200:
        print(f"[推播失敗] user={line_user_id}, status={resp.status_code}, body={resp.text}")
    return resp.status_code == 200


# ─────────────────────────────────────────
# 排程：查詢 5 分鐘內即將開始的預約
# ─────────────────────────────────────────
def get_upcoming_appointments():
    db = get_db()
    cursor = db.cursor(dictionary=True)

    now = datetime.now()
    window_start = now + timedelta(minutes=5)
    window_end   = now + timedelta(minutes=6)  # 每分鐘跑一次，取 1 分鐘視窗

    cursor.execute("""
        SELECT
            a.appointment_id,
            a.appointment_date,
            a.appointment_time,
            u.line_user_id,
            CONCAT(p.last_name, p.first_name) AS patient_name,
            CONCAT(d.last_name, d.first_name) AS doctor_name,
            d.specialty
        FROM appointments a
        JOIN patient p ON a.patient_id = p.patient_id
        JOIN users   u ON p.user_id    = u.user_id
        JOIN doctor  d ON a.doctor_id  = d.doctor_id
        WHERE a.status = '已確認'
          AND a.notified_at IS NULL
          AND u.line_user_id IS NOT NULL
          AND TIMESTAMP(a.appointment_date, a.appointment_time)
              BETWEEN %s AND %s
    """, (window_start, window_end))

    rows = cursor.fetchall()
    cursor.close()
    db.close()
    return rows


def mark_as_notified(appointment_id: int):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE appointments SET notified_at = NOW() WHERE appointment_id = %s",
        (appointment_id,)
    )
    db.commit()
    cursor.close()
    db.close()


def notify_upcoming_appointments():
    """排程任務主體，每分鐘執行一次。"""
    appointments = get_upcoming_appointments()
    for appt in appointments:
        appt_time = f"{appt['appointment_date']} {str(appt['appointment_time'])[:5]}"
        message = (
            f"⏰ 看診提醒\n\n"
            f"您好，{appt['patient_name']}！\n"
            f"您與 {appt['doctor_name']} 醫師（{appt['specialty']}）的視訊看診\n"
            f"將於 5 分鐘後（{appt_time}）開始。\n\n"
            f"請點選下方選單中的「視訊看診」準時上線 🎥"
        )
        success = push_line_message(appt["line_user_id"], message)
        if success:
            mark_as_notified(appt["appointment_id"])
            print(f"[通知成功] appointment_id={appt['appointment_id']}, patient={appt['patient_name']}")


# ─────────────────────────────────────────
# 啟動排程器（在 Flask app 啟動時呼叫）
# ─────────────────────────────────────────
def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Asia/Taipei")
    scheduler.add_job(notify_upcoming_appointments, "interval", minutes=1)
    scheduler.start()
    print("[排程器啟動] 每分鐘檢查一次即將到來的預約")
    return scheduler