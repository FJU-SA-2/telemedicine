const FLASK = "${process.env.BACKEND_URL || 'http://127.0.0.1:5000'}";

// 轉發 cookie（讓 Flask 能讀到 session）
function forwardHeaders(request) {
  const headers = { "Content-Type": "application/json" };
  const cookie = request.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;
  return headers;
}

// 把 Flask 回應的 Set-Cookie 轉發回瀏覽器
function buildResponse(data, status, flaskRes) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const setCookie = flaskRes.headers.get("set-cookie");
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return new Response(JSON.stringify(data), { status, headers });
}

// ── GET：取得所屬機構的醫師（Flask 根據 session 自動過濾） ──────────
export async function GET(request) {
  try {
    // 保留 search / status 等 query string 一併轉發
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const url = `${FLASK}/api/mechanism/doctors${qs ? `?${qs}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: forwardHeaders(request),
    });

    const data = await res.json();
    return buildResponse(data, res.status, res);
  } catch (err) {
    console.error("GET /api/mechanism/doctors proxy error:", err);
    return new Response(JSON.stringify({ error: "連接 Flask 失敗" }), { status: 500 });
  }
}

// ── POST：新增醫師 ────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${FLASK}/api/mechanism/doctors`, {
      method: "POST",
      headers: forwardHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return buildResponse(data, res.status, res);
  } catch (err) {
    console.error("POST /api/mechanism/doctors proxy error:", err);
    return new Response(JSON.stringify({ error: "連接 Flask 失敗" }), { status: 500 });
  }
}

// ── PUT：更新醫師資料 ─────────────────────────────────────────────────
export async function PUT(request) {
  try {
    const body = await request.json();
    const { doctor_id } = body;
    const res = await fetch(`${FLASK}/api/mechanism/doctors/${doctor_id}`, {
      method: "PUT",
      headers: forwardHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return buildResponse(data, res.status, res);
  } catch (err) {
    console.error("PUT /api/mechanism/doctors proxy error:", err);
    return new Response(JSON.stringify({ error: "連接 Flask 失敗" }), { status: 500 });
  }
}

// ── DELETE：解除醫師關聯 ──────────────────────────────────────────────
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctor_id");
    const res = await fetch(
      `${FLASK}/api/mechanism/doctors/${doctorId}/remove`,
      {
        method: "PATCH",
        headers: forwardHeaders(request),
      }
    );

    const data = await res.json();
    return buildResponse(data, res.status, res);
  } catch (err) {
    console.error("DELETE /api/mechanism/doctors proxy error:", err);
    return new Response(JSON.stringify({ error: "連接 Flask 失敗" }), { status: 500 });
  }
}