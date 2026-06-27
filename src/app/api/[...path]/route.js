// 放到：src/app/api/[...path]/route.js

import { NextResponse } from "next/server";

const FLASK_BASE = process.env.FLASK_API_URL || "http://localhost:5000";

async function handler(request, { params }) {
  const path = (await params).path.join("/");

  // ── PATCH /api/doctors/:id ──────────────────────────────────
  // 原本在 src/app/api/doctors/[doctor_id]/route.js
  if (request.method === "PATCH" && /^doctors\/\d+$/.test(path)) {
    const mysql = (await import("mysql2/promise")).default;
    const dbConfig = { host: "localhost", user: "root", password: "", database: "telemedicine" };
    const doctorId = path.split("/")[1];

    try {
      const body = await request.json();
      const { first_name, last_name, specialty, phone_number, gender } = body;
      const connection = await mysql.createConnection(dbConfig);
      await connection.execute(
        `UPDATE doctor SET first_name=?, last_name=?, specialty=?, phone_number=?, gender=?, updated_at=NOW() WHERE doctor_id=?`,
        [first_name, last_name, specialty, phone_number, gender, doctorId]
      );
      await connection.end();
      return NextResponse.json({ message: "更新成功" });
    } catch (err) {
      console.error("更新醫師資料失敗:", err);
      return NextResponse.json({ error: "更新失敗", details: err.message }, { status: 500 });
    }
  }

  // ── GET /api/doctors/patients（含 ?id= 詳情）─────────────────
  if (request.method === "GET" && (path === "doctors/patients" || path.startsWith("doctors/patients/"))) {
    const mysql = (await import("mysql2/promise")).default;
    const dbConfig = {
      host: "localhost", user: "root", password: "", database: "telemedicine",
      dateStrings: true,
    };

    const cookie = request.headers.get("cookie") || "";
    const meRes = await fetch("http://127.0.0.1:5000/api/me", { headers: { Cookie: cookie } });
    if (!meRes.ok) return NextResponse.json({ error: "未登入" }, { status: 401 });
    const meData = await meRes.json();
    if (!meData.authenticated || meData.user?.role !== "doctor") {
      return NextResponse.json({ error: "未授權" }, { status: 403 });
    }
    const doctorId = meData.user.doctor_id;
    if (!doctorId) return NextResponse.json({ error: "找不到醫師資料" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("id");
    const today = new Date().toISOString().substring(0, 10);

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);

      if (patientId) {
        const [check] = await connection.execute(
          `SELECT 1 FROM appointments WHERE patient_id=? AND doctor_id=? LIMIT 1`,
          [patientId, doctorId]
        );
        if (check.length === 0) return NextResponse.json({ error: "無權限" }, { status: 403 });

        const [rows] = await connection.execute(
          `SELECT p.*,
            (SELECT COUNT(*) FROM appointments WHERE patient_id=p.patient_id AND doctor_id=? AND status='已完成') AS total_appointments,
            (SELECT MAX(appointment_date) FROM appointments WHERE patient_id=p.patient_id AND doctor_id=? AND status='已完成' AND appointment_date<=?) AS last_appointment_date
           FROM patient p WHERE p.patient_id=?`,
          [doctorId, doctorId, today, patientId]
        );
        if (rows.length === 0) return NextResponse.json({ error: "患者不存在" }, { status: 404 });
        const pt = rows[0];
        pt.total_appointments = Number(pt.total_appointments) || 0;
        return NextResponse.json({ patient: pt, history: [] });
      }

      const [patients] = await connection.execute(
        `SELECT DISTINCT p.patient_id, p.first_name, p.last_name, p.gender, p.date_of_birth,
          p.phone_number, p.address, p.id_number, p.smoking_status,
          p.drug_allergies, p.medical_history, p.emergency_contact_name, p.emergency_contact_phone,
          (SELECT COUNT(*) FROM appointments WHERE patient_id=p.patient_id AND doctor_id=? AND status='已完成') AS total_appointments,
          (SELECT MAX(appointment_date) FROM appointments WHERE patient_id=p.patient_id AND doctor_id=? AND status='已完成' AND appointment_date<=?) AS last_appointment_date
         FROM patient p
         INNER JOIN appointments a ON p.patient_id=a.patient_id
         WHERE a.doctor_id=? AND a.status='已完成'
         ORDER BY last_appointment_date DESC`,
        [doctorId, doctorId, today, doctorId]
      );

      return NextResponse.json(patients.map(p => ({
        ...p,
        total_appointments: Number(p.total_appointments) || 0,
      })));

    } catch (err) {
      console.error("doctors/patients 錯誤:", err);
      return NextResponse.json({ error: "伺服器錯誤", details: err.message }, { status: 500 });
    } finally {
      if (connection) await connection.end();
    }
  }

  // ── 其他所有路徑轉發給 Flask ──────────────────────────────────
  const url = new URL(request.url);
  const targetUrl = `${FLASK_BASE}/api/${path}${url.search}`;
  const cookieHeader = request.headers.get("cookie") || "";
  const forwardHeaders = {
    "Content-Type": request.headers.get("content-type") || "application/json",
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };

  let body = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try { body = await request.text(); } catch (_) {}
  }

  try {
    console.log(`[proxy] ${request.method} /api/${path} → ${targetUrl}`);
    const flaskRes = await fetch(targetUrl, { method: request.method, headers: forwardHeaders, body });
    const responseText = await flaskRes.text();
    console.log(`[proxy] 回應 status=${flaskRes.status}, body=${responseText.slice(0, 200)}`);
    const response = new NextResponse(responseText, {
      status: flaskRes.status,
      headers: { "Content-Type": flaskRes.headers.get("content-type") || "application/json" },
    });
    const setCookie = flaskRes.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    return response;
  } catch (err) {
    console.error(`[proxy] ${request.method} /api/${path} 失敗:`, err.message);
    return NextResponse.json({ error: "後端連線失敗" }, { status: 502 });
  }
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;