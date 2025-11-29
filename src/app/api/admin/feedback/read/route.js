// ============================================
// 文件 1: app/api/admin/feedback/read/route.js
// 這個文件可能不存在或有問題,需要創建/替換
// ============================================

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

async function getDbConnection() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "telemedicine",
  });
}

export async function PATCH(req) {
  let connection;
  
  console.log("\n" + "=".repeat(100));
  console.log("📢 [Next.js API] 收到標記回報請求");
  console.log("=".repeat(100));
  
  try {
    // 1. 解析請求 body
    const body = await req.json();
    const { feedback_id } = body;
    
    console.log("📋 請求參數:");
    console.log("   - feedback_id:", feedback_id, "Type:", typeof feedback_id);

    if (!feedback_id) {
      console.log("❌ 缺少 feedback_id");
      return NextResponse.json({ 
        success: false,
        message: "缺少 feedback_id" 
      }, { status: 400 });
    }

    // 2. 連接資料庫
    console.log("\n🔌 連接資料庫...");
    connection = await getDbConnection();
    console.log("✅ 資料庫連接成功");

    // 3. 查詢回報資料
    console.log("\n📖 查詢回報資料...");
    const [feedbackRows] = await connection.execute(
      `SELECT 
        f.feedback_id, 
        f.patient_id, 
        f.doctor_id, 
        f.feedback_text,
        f.user_role,
        f.status,
        p.first_name, 
        p.last_name
      FROM feedback f
      LEFT JOIN patient p ON f.patient_id = p.patient_id
      WHERE f.feedback_id = ?`,
      [feedback_id]
    );

    if (feedbackRows.length === 0) {
      console.log("❌ 找不到回報記錄");
      return NextResponse.json({ 
        success: false,
        message: "回報不存在" 
      }, { status: 404 });
    }

    const feedback = feedbackRows[0];
    console.log("✅ 找到回報:");
    console.log("   - feedback_id:", feedback.feedback_id);
    console.log("   - patient_id:", feedback.patient_id);
    console.log("   - 患者姓名:", feedback.first_name, feedback.last_name);
    console.log("   - 當前狀態:", feedback.status);

    // 4. 更新回報狀態
    console.log("\n📝 更新回報狀態為 'read'...");
    await connection.execute(
      "UPDATE feedback SET status = 'read', updated_at = NOW() WHERE feedback_id = ?",
      [feedback_id]
    );
    console.log("✅ 回報狀態已更新");

    // 5. 檢查 patient_id
    const patient_id = feedback.patient_id;
    console.log("\n👤 檢查患者 ID:");
    console.log("   - patient_id:", patient_id);
    console.log("   - 是否有效:", patient_id && patient_id > 0);

    if (!patient_id || patient_id <= 0) {
      console.log("⚠️ patient_id 無效,跳過創建通知");
      console.log("=".repeat(100) + "\n");
      return NextResponse.json({ 
        success: true,
        message: "已標記為已處理(無患者通知)",
        reason: "invalid_patient_id"
      });
    }

    // 6. 準備通知內容
    console.log("\n📬 準備通知內容...");
    const notification_title = "問題回報已處理";
    const feedback_preview = (feedback.feedback_text || '').substring(0, 100);
    const notification_message = `感謝您的回報!

您提交的問題已經被我們的團隊處理。

📋 原始問題:
${feedback_preview}${feedback.feedback_text.length > 100 ? '...' : ''}

✅ 處理狀態:已解決

如有其他問題,歡迎隨時向我們反映。感謝您幫助我們改進服務!`;

    console.log("   - 標題:", notification_title);
    console.log("   - 訊息長度:", notification_message.length);

    // 7. 插入通知記錄
    console.log("\n💾 插入通知記錄...");
    const [insertResult] = await connection.execute(
      `INSERT INTO notifications 
      (patient_id, type, title, message, related_id, is_read, created_at)
      VALUES (?, 'feedback_resolved', ?, ?, ?, FALSE, NOW())`,
      [patient_id, notification_title, notification_message, feedback_id]
    );

    const notification_id = insertResult.insertId;
    console.log("✅ 通知已創建, notification_id:", notification_id);

    // 8. 驗證插入
    console.log("\n🔍 驗證通知記錄...");
    const [verifyRows] = await connection.execute(
      "SELECT * FROM notifications WHERE notification_id = ?",
      [notification_id]
    );

    if (verifyRows.length > 0) {
      console.log("✅ 驗證成功,通知記錄存在");
      console.log("   - notification_id:", verifyRows[0].notification_id);
      console.log("   - patient_id:", verifyRows[0].patient_id);
      console.log("   - type:", verifyRows[0].type);
      console.log("   - is_read:", verifyRows[0].is_read);
    } else {
      console.log("❌ 驗證失敗,找不到通知記錄");
    }

    console.log("\n✅ 操作完成!");
    console.log("=".repeat(100) + "\n");

    return NextResponse.json({ 
      success: true,
      message: "已標記為已處理並通知用戶",
      notification_id: notification_id,
      patient_id: patient_id,
      feedback_id: feedback_id
    });

  } catch (error) {
    console.error("\n" + "=".repeat(100));
    console.error("❌ 發生錯誤!");
    console.error("=".repeat(100));
    console.error("錯誤類型:", error.constructor.name);
    console.error("錯誤訊息:", error.message);
    console.error("錯誤堆疊:", error.stack);
    console.error("=".repeat(100) + "\n");
    
    return NextResponse.json({ 
      success: false,
      message: `操作失敗: ${error.message}`,
      error_type: error.constructor.name
    }, { status: 500 });
    
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 資料庫連接已關閉\n");
    }
  }
}