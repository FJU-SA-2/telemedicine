import mysql from "mysql2/promise";

export default async function handler(req, res) {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "telemedicine",
  });

  try {
    // 🟢 GET 收藏
    if (req.method === "GET") {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: "缺少 user_id" });
      }

      const [rows] = await db.execute(
        "SELECT doctor_id FROM favorites WHERE user_id = ?",
        [user_id]
      );
      return res.status(200).json(rows.map(r => r.doctor_id));
    }

    // 🟠 POST 收藏 / 取消收藏
    if (req.method === "POST") {
      const { user_id, doctor_id } = await req.json(); // ✅ App Router
      if (!user_id || !doctor_id) {
        return res.status(400).json({ error: "缺少必要參數" });
      }

      const [exists] = await db.execute(
        "SELECT * FROM favorites WHERE user_id = ? AND doctor_id = ?",
        [user_id, doctor_id]
      );

      let isFavorite;
      if (exists.length > 0) {
        await db.execute(
          "DELETE FROM favorites WHERE user_id = ? AND doctor_id = ?",
          [user_id, doctor_id]
        );
        isFavorite = false;
      } else {
        await db.execute(
          "INSERT INTO favorites (user_id, doctor_id) VALUES (?, ?)",
          [user_id, doctor_id]
        );
        isFavorite = true;
      }

      return res.status(200).json({ isFavorite });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "伺服器錯誤" });
  } finally {
    await db.end();
  }
}
