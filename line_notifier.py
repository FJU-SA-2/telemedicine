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
# def generate_bind_code(user_id: int) -> str:
#     code = ''.join(random.choices(string.digits, k=6))
#     expires_at = datetime.now() + timedelta(minutes=10)
#     db = get_db()
#     cursor = db.cursor()
#     cursor.execute("""
#         INSERT INTO bind_codes (user_id, code, expires_at)
#         VALUES (%s, %s, %s)
#         ON DUPLICATE KEY UPDATE code = %s, expires_at = %s
#     """, (user_id, code, expires_at, code, expires_at))
#     db.commit()
#     cursor.close()
#     db.close()
#     return code


# ─────────────────────────────────────────
# 綁定碼：驗證並完成綁定
# ─────────────────────────────────────────
# def verify_and_bind(line_user_id: str, code: str) -> bool:
#     db = get_db()
#     cursor = db.cursor(dictionary=True)
#     cursor.execute("""
#         SELECT user_id FROM bind_codes
#         WHERE code = %s AND expires_at > NOW()
#     """, (code,))
#     row = cursor.fetchone()
#     if not row:
#         cursor.close()
#         db.close()
#         return False
#     cursor.execute("UPDATE users SET line_user_id = %s WHERE user_id = %s",
#                    (line_user_id, row["user_id"]))
#     cursor.execute("DELETE FROM bind_codes WHERE code = %s", (code,))
#     db.commit()
#     cursor.close()
#     db.close()
#     return True


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
                CONCAT(p.first_name, p.last_name) AS patient_name,
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
    scheduler.add_job(notify_upcoming_appointments_for_doctor, "interval", minutes=1)
    scheduler.start()
    print("[排程器啟動] 每分鐘檢查看診提醒（病患 + 醫師，開始前 5 分鐘）")
    return scheduler

# ═══════════════════════════════════════════════════════════════════
# 新增：回診偏好詢問（加在 line_notifier.py 現有函式的最後面）
# ═══════════════════════════════════════════════════════════════════

def notify_followup_request(patient_id: int, patient_name: str,
                             doctor_name: str, specialty: str,
                             suggested_weeks: int, appointment_type: str,
                             note: str,
                             followup_request_id: int) -> bool:
    """
    醫師按下「建議回診」後，透過 LINE Flex Message
    詢問患者偏好時段（早 / 午 / 晚），患者點選後
    app.py 的 webhook 會收到 postback data 並存入 DB。
    """
    line_id = get_patient_line_id(patient_id)
    if not line_id:
        print(f"[notify_followup_request] patient_id={patient_id} 無 LINE 綁定")
        return False

    note_section = f"\n📝 醫師備註：{note}" if note else ""

    type_label = "線上診 🖥️" if appointment_type == "online" else "實體診 🏥"
    flex_message = {
        "type": "flex",
        "altText": f"【回診通知】{doctor_name} 醫師建議您約 {suggested_weeks} 週後回診（{type_label}），請選擇偏好時段",
        "contents": {
            "type": "bubble",
            "size": "mega",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "🗓 回診預約邀請",
                        "weight": "bold",
                        "size": "xl",
                        "color": "#FFFFFF"
                    },
                    {
                        "type": "text",
                        "text": f"{doctor_name} 醫師（{specialty}）",
                        "size": "sm",
                        "color": "#FFE0C0",
                        "margin": "sm"
                    },
                    {
                        "type": "text",
                        "text": f"{type_label}｜約 {suggested_weeks} 週後回診",
                        "size": "xs",
                        "color": "#FED7AA",
                        "margin": "xs"
                    }
                ],
                "backgroundColor": "#F97316",
                "paddingAll": "20px"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "spacing": "md",
                "contents": [
                    {
                        "type": "text",
                        "text": f"您好，{patient_name}！",
                        "weight": "bold",
                        "size": "md",
                        "color": "#1F2937"
                    },
                    {
                        "type": "text",
                        "text": f"{doctor_name} 醫師建議您約 {suggested_weeks} 週後回診。{note_section}",
                        "size": "sm",
                        "color": "#4B5563",
                        "wrap": True
                    },
                    {
                        "type": "separator",
                        "margin": "md"
                    },
                    {
                        "type": "text",
                        "text": "請選擇您方便的時段：",
                        "weight": "bold",
                        "size": "sm",
                        "color": "#374151",
                        "margin": "md"
                    },
                    # 早診
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {
                                "type": "text",
                                "text": "🌅  早診",
                                "size": "sm",
                                "color": "#92400E",
                                "flex": 1,
                                "gravity": "center"
                            },
                            {
                                "type": "text",
                                "text": "09:00 – 11:30",
                                "size": "xs",
                                "color": "#78350F",
                                "flex": 1,
                                "gravity": "center",
                                "align": "end"
                            }
                        ],
                        "backgroundColor": "#FEF3C7",
                        "paddingAll": "12px",
                        "cornerRadius": "8px",
                        "action": {
                            "type": "postback",
                            "label": "早診",
                            "data": f"action=followup_pref&request_id={followup_request_id}&pref=morning&patient_id={patient_id}&appt_type={appointment_type}",
                            "displayText": "我偏好早診時段"
                        }
                    },
                    # 午診
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {
                                "type": "text",
                                "text": "☀️  午診",
                                "size": "sm",
                                "color": "#7C3AED",
                                "flex": 1,
                                "gravity": "center"
                            },
                            {
                                "type": "text",
                                "text": "14:00 – 17:00",
                                "size": "xs",
                                "color": "#6D28D9",
                                "flex": 1,
                                "gravity": "center",
                                "align": "end"
                            }
                        ],
                        "backgroundColor": "#EDE9FE",
                        "paddingAll": "12px",
                        "cornerRadius": "8px",
                        "action": {
                            "type": "postback",
                            "label": "午診",
                            "data": f"action=followup_pref&request_id={followup_request_id}&pref=afternoon&patient_id={patient_id}&appt_type={appointment_type}",
                            "displayText": "我偏好午診時段"
                        }
                    },
                    # 晚診
                    {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                            {
                                "type": "text",
                                "text": "🌙  晚診",
                                "size": "sm",
                                "color": "#1E40AF",
                                "flex": 1,
                                "gravity": "center"
                            },
                            {
                                "type": "text",
                                "text": "18:00 – 21:00",
                                "size": "xs",
                                "color": "#1D4ED8",
                                "flex": 1,
                                "gravity": "center",
                                "align": "end"
                            }
                        ],
                        "backgroundColor": "#DBEAFE",
                        "paddingAll": "12px",
                        "cornerRadius": "8px",
                        "action": {
                            "type": "postback",
                            "label": "晚診",
                            "data": f"action=followup_pref&request_id={followup_request_id}&pref=evening&patient_id={patient_id}&appt_type={appointment_type}",
                            "displayText": "我偏好晚診時段"
                        }
                    },
                    # 不限
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "🕐  皆可（不限時段）",
                                "size": "sm",
                                "color": "#374151",
                                "gravity": "center",
                                "align": "center"
                            }
                        ],
                        "backgroundColor": "#F3F4F6",
                        "paddingAll": "12px",
                        "cornerRadius": "8px",
                        "action": {
                            "type": "postback",
                            "label": "皆可",
                            "data": f"action=followup_pref&request_id={followup_request_id}&pref=any&patient_id={patient_id}&appt_type={appointment_type}",
                            "displayText": "我任何時段皆可"
                        }
                    }
                ],
                "paddingAll": "20px"
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "點選時段後，機構將為您安排回診預約 📋",
                        "size": "xs",
                        "color": "#9CA3AF",
                        "align": "center",
                        "wrap": True
                    }
                ],
                "paddingAll": "12px"
            }
        }
    }

    url = "https://api.line.me/v2/bot/message/push"
    headers = {
        "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "to": line_id,
        "messages": [flex_message],
    }
    import requests as _req
    resp = _req.post(url, headers=headers, json=payload)
    if resp.status_code != 200:
        print(f"[回診通知推播失敗] status={resp.status_code}, body={resp.text}")
        return False

    print(f"[回診通知] patient_id={patient_id}, request_id={followup_request_id}")
    return True

def notify_available_slots(line_id: str, patient_name: str,
                            doctor_name: str, specialty: str,
                            slots: list, request_id: int) -> bool:
    """
    推播醫師可用時段給患者選擇。
    slots: [{"date": "2026-05-20", "time": "09:00", "schedule_id": 12}, ...]
    最多顯示 5 個時段（LINE Flex bubble 限制）
    """
    if not slots:
        return False
 
    WEEKDAY_MAP = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"]
 
    def slot_label(s):
        try:
            d = datetime.strptime(s["date"], "%Y-%m-%d")
            wd = WEEKDAY_MAP[d.weekday() + 1] if d.weekday() < 6 else "週日"
            # weekday() 0=Mon, 6=Sun；轉成中文
            wd = WEEKDAY_MAP[d.isoweekday() % 7]
            return f"{s['date']} ({wd}) {s['time'][:5]}"
        except Exception:
            return f"{s['date']} {s['time'][:5]}"
 
    # 最多 5 個時段
    display_slots = slots[:5]
 
    # 每個時段做一個可點選的 box
    slot_boxes = []
    for i, s in enumerate(display_slots):
        label = slot_label(s)
        slot_boxes.append({
            "type": "box",
            "layout": "horizontal",
            "contents": [
                {
                    "type": "text",
                    "text": f"🕐  {label}",
                    "size": "sm",
                    "color": "#1E40AF",
                    "flex": 1,
                    "gravity": "center"
                }
            ],
            "backgroundColor": "#EFF6FF",
            "paddingAll": "12px",
            "cornerRadius": "8px",
            "margin": "sm",
            "action": {
                "type": "postback",
                "label": label,
                "data": (
                    f"action=followup_slot"
                    f"&request_id={request_id}"
                    f"&schedule_id={s['schedule_id']}"
                    f"&date={s['date']}"
                    f"&time={s['time'][:5]}"
                ),
                "displayText": f"我選擇 {label}"
            }
        })
 
    flex_message = {
        "type": "flex",
        "altText": f"【回診時段】請選擇您的回診時段",
        "contents": {
            "type": "bubble",
            "size": "mega",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "📅 請選擇回診時段",
                        "weight": "bold",
                        "size": "xl",
                        "color": "#FFFFFF"
                    },
                    {
                        "type": "text",
                        "text": f"{doctor_name} 醫師（{specialty}）",
                        "size": "sm",
                        "color": "#BFDBFE",
                        "margin": "sm"
                    }
                ],
                "backgroundColor": "#2563EB",
                "paddingAll": "20px"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "spacing": "sm",
                "contents": [
                    {
                        "type": "text",
                        "text": f"{patient_name}，以下是符合您偏好的可預約時段：",
                        "size": "sm",
                        "color": "#374151",
                        "wrap": True
                    },
                    {
                        "type": "separator",
                        "margin": "md"
                    },
                    *slot_boxes
                ],
                "paddingAll": "16px"
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "點選時段後將送交機構審核，確認後通知您 ✅",
                        "size": "xs",
                        "color": "#9CA3AF",
                        "align": "center",
                        "wrap": True
                    }
                ],
                "paddingAll": "12px"
            }
        }
    }
 
    url = "https://api.line.me/v2/bot/message/push"
    headers = {
        "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {"to": line_id, "messages": [flex_message]}
 
    import requests as _req
    resp = _req.post(url, headers=headers, json=payload)
    if resp.status_code != 200:
        print(f"[notify_available_slots 失敗] status={resp.status_code}, {resp.text}")
        return False
    print(f"[可選時段推播] request_id={request_id}, slots={len(display_slots)}")
    return True
 
 
def notify_followup_pending_review(line_id: str, patient_name: str,
                                    doctor_name: str, specialty: str,
                                    date_str: str, time_str: str) -> bool:
    """患者選完時段後，通知患者等待機構審核"""
    message = (
        f"✅ 已收到您的回診預約申請！\n\n"
        f"👨‍⚕️ 醫師：{doctor_name}（{specialty}）\n"
        f"🗓 預約時段：{date_str} {time_str}\n\n"
        f"目前狀態：⏳ 等待機構確認\n"
        f"確認後將再通知您，請耐心等候 🙏"
    )
    url = "https://api.line.me/v2/bot/message/push"
    headers = {
        "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {"to": line_id, "messages": [{"type": "text", "text": message}]}
    import requests as _req
    resp = _req.post(url, headers=headers, json=payload)
    return resp.status_code == 200

# ═══════════════════════════════════════════════════════════════════
# 醫師端 LINE 通知
# ═══════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────
# 取得醫師的 LINE user id
# ─────────────────────────────────────────
def get_doctor_line_id(doctor_id: int):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.line_user_id
            FROM users u
            JOIN doctor d ON u.user_id = d.user_id
            WHERE d.doctor_id = %s
        """, (doctor_id,))
        row = cursor.fetchone()
        cursor.close()
        db.close()
        return row["line_user_id"] if row else None
    except Exception as e:
        print(f"[get_doctor_line_id 錯誤] {e}")
        return None


# ─────────────────────────────────────────
# 醫師通知一：有新預約
# ─────────────────────────────────────────
def notify_doctor_new_booking(doctor_id: int, doctor_name: str,
                               patient_name: str, specialty: str,
                               date_str: str, time_str: str,
                               symptoms: str = "") -> bool:
    line_id = get_doctor_line_id(doctor_id)
    if not line_id:
        return False
    symptoms_line = f"📋 主訴：{symptoms}\n" if symptoms else ""
    message = (
        f"📅 新預約通知\n\n"
        f"醫師 {doctor_name} 您好！\n"
        f"您有一筆新的預約。\n\n"
        f"👤 患者：{patient_name}\n"
        f"🏥 科別：{specialty}\n"
        f"🗓 日期：{date_str}\n"
        f"⏰ 時間：{time_str}\n"
        f"{symptoms_line}"
        f"\n請登入系統查看詳情 📋"
    )
    ok = push_line_message(line_id, message)
    if ok:
        print(f"[醫師-新預約] doctor_id={doctor_id}, patient={patient_name}")
    return ok


# ─────────────────────────────────────────
# 醫師通知二：預約取消通知
# ─────────────────────────────────────────
def notify_doctor_booking_cancelled(doctor_id: int, doctor_name: str,
                                     patient_name: str, specialty: str,
                                     date_str: str, time_str: str,
                                     cancel_reason: str = "") -> bool:
    line_id = get_doctor_line_id(doctor_id)
    if not line_id:
        return False
    reason_line = f"📝 取消原因：{cancel_reason}\n" if cancel_reason else ""
    message = (
        f"🚫 預約取消通知\n\n"
        f"醫師 {doctor_name} 您好！\n"
        f"患者已取消一筆預約。\n\n"
        f"👤 患者：{patient_name}\n"
        f"🏥 科別：{specialty}\n"
        f"🗓 原預約日期：{date_str}\n"
        f"⏰ 原預約時間：{time_str}\n"
        f"{reason_line}"
        f"\n該時段已自動釋放，可供其他患者預約 📋"
    )
    ok = push_line_message(line_id, message)
    if ok:
        print(f"[醫師-預約取消] doctor_id={doctor_id}, patient={patient_name}")
    return ok


# ─────────────────────────────────────────
# 醫師通知三：問題回報通知
# ─────────────────────────────────────────
def notify_doctor_feedback_received(doctor_id: int, doctor_name: str,
                                     patient_name: str,
                                     categories_str: str,
                                     feedback_text: str) -> bool:
    line_id = get_doctor_line_id(doctor_id)
    if not line_id:
        return False
    preview = (feedback_text or "")[:50]
    if len(feedback_text or "") > 50:
        preview += "..."
    message = (
        f"📬 患者問題回報\n\n"
        f"醫師 {doctor_name} 您好！\n"
        f"患者 {patient_name} 提交了一筆問題回報。\n\n"
        f"🏷 問題類別：{categories_str or '未分類'}\n"
        f"📝 內容摘要：{preview}\n\n"
        f"請登入系統查看完整內容並處理 🙏"
    )
    ok = push_line_message(line_id, message)
    if ok:
        print(f"[醫師-問題回報] doctor_id={doctor_id}, patient={patient_name}")
    return ok


# ─────────────────────────────────────────
# 醫師通知四：醫囑填寫提醒
# ─────────────────────────────────────────
def notify_doctor_consultation_reminder(doctor_id: int, doctor_name: str,
                                         patient_name: str,
                                         appointment_id: int,
                                         ended_time_str: str) -> bool:
    line_id = get_doctor_line_id(doctor_id)
    if not line_id:
        return False
    message = (
        f"📝 醫囑填寫提醒\n\n"
        f"醫師 {doctor_name} 您好！\n"
        f"您與患者 {patient_name} 的看診（{ended_time_str} 結束）\n"
        f"尚未填寫醫囑建議。\n\n"
        f"請盡快登入系統填寫診療建議和處方，\n"
        f"以便患者及時查看 🙏\n\n"
        f"預約 ID：#{appointment_id}"
    )
    ok = push_line_message(line_id, message)
    if ok:
        print(f"[醫師-醫囑提醒] doctor_id={doctor_id}, appt_id={appointment_id}")
    return ok


# ─────────────────────────────────────────
# 排程：醫師看診提醒（開始前 5 分鐘）
# ─────────────────────────────────────────
def notify_upcoming_appointments_for_doctor():
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
                CONCAT(d.first_name, d.last_name) AS doctor_name,
                CONCAT(p.first_name, p.last_name) AS patient_name,
                d.doctor_id
            FROM appointments a
            JOIN doctor  d ON a.doctor_id  = d.doctor_id
            JOIN users   u ON d.user_id    = u.user_id
            JOIN patient p ON a.patient_id = p.patient_id
            WHERE a.status = '已確認'
              AND a.doctor_notified_at IS NULL
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
            ok = push_line_message(
                appt["line_user_id"],
                (
                    f"⏰ 看診提醒\n\n"
                    f"醫師 {appt['doctor_name']} 您好！\n"
                    f"您即將在 5 分鐘後開始看診。\n\n"
                    f"👤 患者：{appt['patient_name']}\n"
                    f"🗓 日期：{date_str}\n"
                    f"⏰ 時間：{time_str}\n\n"
                    f"請準備進入視訊會議室 🎥"
                )
            )
            if ok:
                db2 = get_db()
                cur2 = db2.cursor()
                cur2.execute(
                    "UPDATE appointments SET doctor_notified_at = NOW() WHERE appointment_id = %s",
                    (appt["appointment_id"],)
                )
                db2.commit()
                cur2.close()
                db2.close()
                print(f"[醫師看診提醒] appt_id={appt['appointment_id']}, doctor={appt['doctor_name']}")

    except Exception as e:
        print(f"[醫師看診提醒錯誤] {e}")


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