import requests
import random
import string
import mysql.connector
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import os
from dotenv import load_dotenv

load_dotenv()

LINE_CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")

DB_CONFIG = {
    "host":     os.environ.get("DB_HOST",     "localhost"),
    "user":     os.environ.get("DB_USER",     "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": "telemedicine",
    "charset":  "utf8mb4",
}


def get_db():
    return mysql.connector.connect(**DB_CONFIG)


# ─────────────────────────────────────────
# 綁定碼：產生
# ─────────────────────────────────────────
def generate_bind_code(user_id: int) -> str:
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
    cursor.execute("UPDATE users SET line_user_id = %s WHERE user_id = %s",
                   (line_user_id, row["user_id"]))
    cursor.execute("DELETE FROM bind_codes WHERE code = %s", (code,))
    db.commit()
    cursor.close()
    db.close()
    return True


# ─────────────────────────────────────────
# LINE 推播（底層）
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
# 取得患者的 LINE user id
# ─────────────────────────────────────────
def get_patient_line_id(patient_id: int):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.line_user_id
            FROM users u
            JOIN patient p ON u.user_id = p.user_id
            WHERE p.patient_id = %s
        """, (patient_id,))
        row = cursor.fetchone()
        cursor.close()
        db.close()
        return row["line_user_id"] if row else None
    except Exception as e:
        print(f"[get_patient_line_id 錯誤] {e}")
        return None


# ═══════════════════════════════════════════
# 即時通知函式（在各 API route 結尾直接呼叫）
# ═══════════════════════════════════════════

# ─────────────────────────────────────────
# 即時通知一：預約成功
# 使用方式（在建立預約的 route 成功後呼叫）：
#   from line_notifier import notify_booking_success
#   notify_booking_success(patient_id, doctor_name, specialty, date_str, time_str)
# ─────────────────────────────────────────
def notify_booking_success(patient_id: int, patient_name: str, doctor_name: str,
                           specialty: str, date_str: str, time_str: str) -> bool:
    line_id = get_patient_line_id(patient_id)
    if not line_id:
        return False
    message = (
        f"📅 預約成功通知\n\n"
        f"您好，{patient_name}！\n"
        f"您的預約已建立。\n\n"
        f"👨‍⚕️ 醫師：{doctor_name}（{specialty}）\n"
        f"🗓 日期：{date_str}\n"
        f"⏰ 時間：{time_str}\n"
        f"📋 狀態：✅ 已確認\n\n"
        f"請準時登入系統進行視訊看診 🎥"
    )
    ok = push_line_message(line_id, message)
    if ok:
        print(f"[即時-預約成功] patient_id={patient_id}, {patient_name}")
    return ok


# ─────────────────────────────────────────
# 即時通知二：預約取消
# 使用方式（在 cancel_appointment route 成功後呼叫）：
#   from line_notifier import notify_booking_cancelled
#   notify_booking_cancelled(patient_id, patient_name, doctor_name, specialty,
#                            date_str, time_str, cancel_reason, refund_message)
# ─────────────────────────────────────────
def notify_booking_cancelled(patient_id: int, patient_name: str, doctor_name: str,
                              specialty: str, date_str: str, time_str: str,
                              cancel_reason: str, refund_message: str) -> bool:
    line_id = get_patient_line_id(patient_id)
    if not line_id:
        return False
    message = (
        f"🚫 預約取消通知\n\n"
        f"您好，{patient_name}！\n"
        f"您的預約已取消。\n\n"
        f"👨‍⚕️ 醫師：{doctor_name}（{specialty}）\n"
        f"🗓 原預約日期：{date_str}\n"
        f"⏰ 原預約時間：{time_str}\n"
        f"📝 取消原因：{cancel_reason or '未填寫'}\n"
        f"💰 退款說明：{refund_message}\n\n"
        f"如需重新預約，請登入平台操作。"
    )
    ok = push_line_message(line_id, message)
    if ok:
        print(f"[即時-預約取消] patient_id={patient_id}, {patient_name}")
    return ok


# ─────────────────────────────────────────
# 即時通知三：問題回報確認
# 使用方式（在 feedback 提交 route 成功後呼叫）：
#   from line_notifier import notify_feedback_received
#   notify_feedback_received(patient_id, patient_name, categories_str, feedback_text)
# ─────────────────────────────────────────
def notify_feedback_received(patient_id: int, patient_name: str,
                              categories_str: str, feedback_text: str) -> bool:
    line_id = get_patient_line_id(patient_id)
    if not line_id:
        return False
    preview = (feedback_text or '')[:50]
    if len(feedback_text or '') > 50:
        preview += '...'
    message = (
        f"📬 問題回報已收到\n\n"
        f"您好，{patient_name}！\n"
        f"感謝您的回報，我們已收到您的意見。\n\n"
        f"🏷 問題類別：{categories_str or '未分類'}\n"
        f"📝 內容摘要：{preview}\n\n"
        f"我們將盡快審閱並處理，感謝您幫助我們改善服務 🙏"
    )
    ok = push_line_message(line_id, message)
    if ok:
        print(f"[即時-問題回報] patient_id={patient_id}, {patient_name}")
    return ok


# ═══════════════════════════════════════════
# 排程通知（只保留看診提醒，5分鐘前無法即時）
# ═══════════════════════════════════════════

# ─────────────────────────────────────────
# 排程通知：看診提醒（開始前 5 分鐘）
# ─────────────────────────────────────────
def notify_upcoming_appointments():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        now          = datetime.now()
        window_start = now + timedelta(minutes=4)
        window_end   = now + timedelta(minutes=6)

        cursor.execute("""
            SELECT
                a.appointment_id,
                a.appointment_date,
                a.appointment_time,
                u.line_user_id,
                CONCAT(p.last_name, p.first_name) AS patient_name,
                CONCAT(d.first_name, d.last_name) AS doctor_name,
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

        for appt in rows:
            date_str = str(appt['appointment_date'])
            time_str = str(appt['appointment_time'])[:5]
            message = (
                f"⏰ 看診提醒\n\n"
                f"您好，{appt['patient_name']}！\n"
                f"您與 {appt['doctor_name']} 醫師（{appt['specialty']}）的視訊看診\n"
                f"將於 5 分鐘後（{date_str} {time_str}）開始。\n\n"
                f"請點選下方選單中的「視訊看診」準時上線 🎥"
            )
            success = push_line_message(appt["line_user_id"], message)
            if success:
                db2 = get_db()
                cur2 = db2.cursor()
                cur2.execute(
                    "UPDATE appointments SET notified_at = NOW() WHERE appointment_id = %s",
                    (appt["appointment_id"],)
                )
                db2.commit()
                cur2.close()
                db2.close()
                print(f"[看診提醒] appointment_id={appt['appointment_id']}, patient={appt['patient_name']}")

    except Exception as e:
        print(f"[看診提醒錯誤] {e}")


# ─────────────────────────────────────────
# 排程器：只跑看診提醒
# ─────────────────────────────────────────
def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Asia/Taipei")
    scheduler.add_job(notify_upcoming_appointments, "interval", minutes=1)
    scheduler.start()
    print("[排程器啟動] 每分鐘檢查看診提醒（開始前 5 分鐘）")
    return scheduler


if __name__ == "__main__":
    import time
    print(f"🔑 TOKEN: '{LINE_CHANNEL_ACCESS_TOKEN}'")
    start_scheduler()
    print("✅ 排程器運行中，按 Ctrl+C 停止...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🛑 排程器已停止")