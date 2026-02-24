import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function getDbConnection() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "telemedicine",
  });
}


// ── GET：取得所有醫師 ────────────────────────────────────────────
export async function GET(request) {
  let conn;
  try {
    conn = await getDbConnection();

    const { searchParams } = new URL(request.url);
    const mechanismId = searchParams.get("mechanism_id");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    let query = `
      SELECT
        d.doctor_id,
        d.first_name,
        d.last_name,
        d.gender,
        d.specialty,
        d.practice_hospital,
        d.phone_number,
        d.approval_status,
        d.certificate_path,
        d.mechanism_id,
        u.email,
        COUNT(a.appointment_id) AS total_appointments,
        SUM(CASE WHEN DATE(a.appointment_date) = CURDATE() THEN 1 ELSE 0 END) AS today_appointments
      FROM doctor d
      LEFT JOIN users u ON d.user_id = u.user_id
      LEFT JOIN appointment a ON d.doctor_id = a.doctor_id
    `;
    const params = [];
    const conditions = [];

    if (mechanismId) {
      conditions.push("d.mechanism_id = ?");
      params.push(mechanismId);
    }
    if (search) {
      conditions.push("(CONCAT(d.last_name, d.first_name) LIKE ? OR d.specialty LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      conditions.push("d.approval_status = ?");
      params.push(status);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " GROUP BY d.doctor_id ORDER BY d.created_at DESC";

    const [rows] = await conn.execute(query, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/mechanism/doctors error:", err);
    return NextResponse.json({ error: err.message || "伺服器錯誤" }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// ── POST：新增醫師（同時建立 users 帳號） ────────────────────────
export async function POST(request) {
  let conn;
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      gender,
      specialty,
      practice_hospital,
      phone_number,
      certificate_path,
      approval_status,
      mechanism_id,
      email,
      password,
    } = body;

    // 必填欄位驗證
    if (!first_name || !last_name) {
      return NextResponse.json({ error: "姓名為必填" }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: "Email 與密碼為必填" }, { status: 400 });
    }

    conn = await getDbConnection();

    // 檢查 email 是否已存在
    const [existing] = await conn.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "此 Email 已被使用" }, { status: 409 });
    }

    // 開始交易，確保兩張表同時成功或同時回滾
    await conn.beginTransaction();

    // 1. 建立 users 帳號
    const passwordHash = await bcrypt.hash(password, 10);
    const username = `${last_name}${first_name}`; // 預設用姓名當 username
    const [userResult] = await conn.execute(
      `INSERT INTO users (username, email, password_hash, role, account_status)
       VALUES (?, ?, ?, 'doctor', 'active')`,
      [username, email, passwordHash]
    );
    const newUserId = userResult.insertId;

    // 2. 建立 doctor 資料
    const [doctorResult] = await conn.execute(
      `INSERT INTO doctor
        (user_id, first_name, last_name, gender, specialty, practice_hospital,
         phone_number, certificate_path, approval_status, mechanism_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newUserId,
        first_name,
        last_name,
        gender || "male",
        specialty || null,
        practice_hospital || null,
        phone_number || null,
        certificate_path || null,
        approval_status || "pending",
        mechanism_id || null,
      ]
    );

    await conn.commit();

    return NextResponse.json(
      { message: "醫師新增成功", doctor_id: doctorResult.insertId, user_id: newUserId },
      { status: 201 }
    );
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("POST /api/mechanism/doctors error:", err);
    return NextResponse.json({ error: err.message || "伺服器錯誤" }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// ── PUT：更新醫師資料 ─────────────────────────────────────────────
export async function PUT(request) {
  let conn;
  try {
    const body = await request.json();
    const { doctor_id, specialty, phone_number, practice_hospital } = body;

    if (!doctor_id) {
      return NextResponse.json({ error: "缺少 doctor_id" }, { status: 400 });
    }

    conn = await getDbConnection();
    await conn.execute(
      `UPDATE doctor SET specialty = ?, phone_number = ?, practice_hospital = ?
       WHERE doctor_id = ?`,
      [specialty || null, phone_number || null, practice_hospital || null, doctor_id]
    );

    return NextResponse.json({ message: "醫師資料已更新" });
  } catch (err) {
    console.error("PUT /api/mechanism/doctors error:", err);
    return NextResponse.json({ error: err.message || "伺服器錯誤" }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}

// ── DELETE：解除醫師關聯 ──────────────────────────────────────────
export async function DELETE(request) {
  let conn;
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctor_id");

    if (!doctorId) {
      return NextResponse.json({ error: "缺少 doctor_id" }, { status: 400 });
    }

    conn = await getDbConnection();
    // 只清除 mechanism_id，不刪除醫師帳號
    await conn.execute(
      "UPDATE doctor SET mechanism_id = NULL WHERE doctor_id = ?",
      [doctorId]
    );

    return NextResponse.json({ message: "已解除關聯" });
  } catch (err) {
    console.error("DELETE /api/mechanism/doctors error:", err);
    return NextResponse.json({ error: err.message || "伺服器錯誤" }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}