import mysql.connector

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="telemedicine"
)

cursor = db.cursor(dictionary=True)

# 檢查 patient_id=1 的所有預約
cursor.execute("""
    SELECT 
        appointment_id,
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        appointment_type,
        status,
        created_at
    FROM appointments
    WHERE patient_id = 1
    ORDER BY created_at DESC
    LIMIT 10
""")

appointments = cursor.fetchall()

print("=" * 60)
print("🔍 patient_id=1 的最近預約記錄:")
print("=" * 60)

if not appointments:
    print("沒有找到任何預約記錄")
else:
    for apt in appointments:
        print(f"\n預約 ID: {apt['appointment_id']}")
        print(f"  醫師 ID: {apt['doctor_id']}")
        print(f"  日期: {apt['appointment_date']}")
        print(f"  時間: {apt['appointment_time']}")
        print(f"  類型: {apt['appointment_type']}")
        print(f"  狀態: {apt['status']}")
        print(f"  創建時間: {apt['created_at']}")

print("\n" + "=" * 60)

cursor.close()
db.close()