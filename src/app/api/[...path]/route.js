// 放到：src/app/api/[...path]/route.js

import { NextResponse } from "next/server";

const FLASK_BASE = process.env.FLASK_API_URL || "http://localhost:5000";

async function handler(request, { params }) {
  const path = (await params).path.join("/");

  const url = new URL(request.url);
  const targetUrl = `${FLASK_BASE}/api/${path}${url.search}`;

  // 直接從 request header 取 cookie（比 cookies() 更可靠）
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

    const flaskRes = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body,
    });

    const responseText = await flaskRes.text();
    console.log(`[proxy] 回應 status=${flaskRes.status}, body=${responseText.slice(0, 200)}`);

    const response = new NextResponse(responseText, {
      status: flaskRes.status,
      headers: {
        "Content-Type": flaskRes.headers.get("content-type") || "application/json",
      },
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