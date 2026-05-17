// 放在: app/api/mechanism/followup-review/route.js

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const body = await request.json();

    const res = await fetch("http://127.0.0.1:5000/api/mechanism/followup-review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("followup-review proxy 錯誤:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}