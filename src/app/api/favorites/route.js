import mysql from "mysql2/promise";

export default async function handler(req, res) {
  // ✅ 連線設定（請依你的環境修改）
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // ← 改成你的密碼
    database: "telemedicine", // ← 改成你的資料庫名稱
  });

  // 🟢 查詢收藏
  if (req.method === "GET") {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: "缺少 user_id" });
    }

    try {
      const [rows] = await db.execute(
        "SELECT doctor_id FROM favorites WHERE user_id = ?",
        [user_id]
      );
      const ids = rows.map((r) => r.doctor_id);
      return res.status(200).json(ids);
    } catch (err) {
      console.error("❌ 無法查詢收藏:", err);
      return res.status(500).json({ error: "伺服器錯誤" });
    }
  }

  // 🟠 收藏 / 取消收藏
  if (req.method === "POST") {
    try {
      const { user_id, doctor_id } = req.body;
      if (!user_id || !doctor_id) {
        return res.status(400).json({ error: "缺少必要參數" });
      }

      // 先檢查是否已收藏
      const [exists] = await db.execute(
        "SELECT * FROM favorites WHERE user_id = ? AND doctor_id = ?",
        [user_id, doctor_id]
      );

      let isFavorite;

      if (exists.length > 0) {
        // 已存在 → 取消收藏
        await db.execute(
          "DELETE FROM favorites WHERE user_id = ? AND doctor_id = ?",
          [user_id, doctor_id]
        );
        isFavorite = false;
      } else {
        // 不存在 → 加入收藏
        await db.execute(
          "INSERT INTO favorites (user_id, doctor_id) VALUES (?, ?)",
          [user_id, doctor_id]
        );
        isFavorite = true;
      }

      return res.status(200).json({ isFavorite });
    } catch (err) {
      console.error("❌ 收藏操作失敗:", err);
      return res.status(500).json({ error: "伺服器錯誤" });
    }
  }

  // 🔴 其他 HTTP 方法
  return res.status(405).json({ error: "Method not allowed" });
}
