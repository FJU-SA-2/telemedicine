// 放在: app/api/mechanism/followup-requests/route.js

import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    const res = await fetch(
      `http://127.0.0.1:5000/api/mechanism/followup-requests?status=${status}`,
      {
        method: "GET",
        headers: { Cookie: cookie },
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("followup-requests proxy 錯誤:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}