import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'telemedicine',
};

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

export async function PATCH(request) {
  let connection;

  try {
    const body = await request.json();
    const { feedback_id } = body;

    console.log(`📋 處理回報 ID: ${feedback_id}`);

    connection = await getConnection();

    // 獲取回報資料
    const [feedbackRows] = await connection.execute(
      `SELECT 
        feedback_id, 
        patient_id, 
        doctor_id, 
        user_role, 
        feedback_text
      FROM feedback
      WHERE feedback_id = ?`,
      [feedback_id]
    );

    if (feedbackRows.length === 0) {
      return NextResponse.json(
        { success: false, message: '回報不存在' },
        { status: 404 }
      );
    }

    const feedback = feedbackRows[0];

    console.log(`   user_role: ${feedback.user_role}`);
    console.log(`   doctor_id: ${feedback.doctor_id}`);

    // 更新回報狀態
    await connection.execute(
      `UPDATE feedback SET status = 'read' WHERE feedback_id = ?`,
      [feedback_id]
    );

    console.log(`✅ 回報狀態已更新為 'read'`);

    // 根據 user_role 發送通知
    if (feedback.user_role === 'doctor' && feedback.doctor_id) {
      const feedbackPreview = feedback.feedback_text.substring(0, 50);
      const doctorNotification = `問題回報已處理

感謝您的回報,我們已收到並處理您的問題。

📝 您的回報內容: ${feedbackPreview}${feedback.feedback_text.length > 50 ? '...' : ''}

如有其他問題,歡迎隨時回報。`;

      await connection.execute(
        `INSERT INTO doctor_notifications (doctor_id, type, title, message, related_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          feedback.doctor_id,
          'feedback_received',
          '問題回報已處理',
          doctorNotification,
          feedback_id,
        ]
      );

      console.log(`✅ 已發送處理通知給醫師 ${feedback.doctor_id}`);
    } else if (feedback.user_role === 'patient' && feedback.patient_id) {
      const feedbackPreview = feedback.feedback_text.substring(0, 50);
      const patientNotification = `問題回報已處理

感謝您的回報,我們已收到並處理您的問題。

📝 您的回報內容: ${feedbackPreview}${feedback.feedback_text.length > 50 ? '...' : ''}

如有其他問題,歡迎隨時回報。`;

      await connection.execute(
        `INSERT INTO notifications (patient_id, type, title, message, related_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          feedback.patient_id,
          'feedback_resolved',
          '問題回報已處理',
          patientNotification,
          feedback_id,
        ]
      );

      console.log(`✅ 已發送處理通知給患者 ${feedback.patient_id}`);
    }

    return NextResponse.json({
      success: true,
      message: '已標記為已處理並通知用戶',
    });
  } catch (error) {
    console.error('❌ 更新失敗:', error);
    return NextResponse.json(
      { success: false, message: `操作失敗: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}