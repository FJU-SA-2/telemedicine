import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// 創建資料庫連接
async function getDbConnection() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "telemedicine",
  });
}

// 🟢 GET - 獲取用戶的收藏列表
export async function GET(request) {
  let db;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "缺少 user_id 參數" },
        { status: 400 }
      );
    }

    db = await getDbConnection();
    
    const [rows] = await db.execute(
      "SELECT doctor_id FROM favorites WHERE user_id = ?",
      [userId]
    );

    const favoriteIds = rows.map(r => r.doctor_id);
    
    return NextResponse.json(favoriteIds, { status: 200 });
  } catch (error) {
    console.error("GET /api/favorites 錯誤:", error);
    return NextResponse.json(
      { error: "無法獲取收藏資料", details: error.message },
      { status: 500 }
    );
  } finally {
    if (db) await db.end();
  }
}

// 🟠 POST - 切換收藏狀態
export async function POST(request) {
  let db;
  try {
    const body = await request.json();
    const { user_id, doctor_id } = body;

    if (!user_id || !doctor_id) {
      return NextResponse.json(
        { error: "缺少 user_id 或 doctor_id" },
        { status: 400 }
      );
    }

    db = await getDbConnection();

    // 檢查是否已收藏
    const [exists] = await db.execute(
      "SELECT * FROM favorites WHERE user_id = ? AND doctor_id = ?",
      [user_id, doctor_id]
    );

    let isFavorite;
    
    if (exists.length > 0) {
      // 已收藏，執行取消收藏
      await db.execute(
        "DELETE FROM favorites WHERE user_id = ? AND doctor_id = ?",
        [user_id, doctor_id]
      );
      isFavorite = false;
    } else {
      // 未收藏，執行收藏
      await db.execute(
        "INSERT INTO favorites (user_id, doctor_id) VALUES (?, ?)",
        [user_id, doctor_id]
      );
      isFavorite = true;
    }

    return NextResponse.json({ 
      isFavorite,
      message: isFavorite ? "收藏成功" : "取消收藏成功"
    }, { status: 200 });
    
  } catch (error) {
    console.error("POST /api/favorites 錯誤:", error);
    return NextResponse.json(
      { error: "無法更新收藏狀態", details: error.message },
      { status: 500 }
    );
  } finally {
    if (db) await db.end();
  }
}