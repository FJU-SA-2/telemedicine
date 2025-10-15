// pages/api/appointments/index.js
import mysql from 'mysql2/promise';

// 資料庫連接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 建立資料庫連接池
let pool;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getAppointments(req, res);
    case 'POST':
      return createAppointment(req, res);
    case 'PUT':
      return updateAppointment(req, res);
    case 'DELETE':
      return deleteAppointment(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

// GET - 獲取預約列表
async function getAppointments(req, res) {
  const { patient_id, status, doctor_id } = req.query;

  try {
    const pool = getPool();
    
    let query = `
      SELECT 
        a.appointment_id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.created_at,
        a.updated_at,
        d.first_name,
        d.last_name,
        d.specialty,
        d.practice_hospital,
        d.phone_number
      FROM appointments a
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      WHERE 1=1
    `;

    const params = [];

    // 根據病患ID篩選
    if (patient_id) {
      query += ' AND a.patient_id = ?';
      params.push(patient_id);
    }

    // 根據狀態篩選
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    // 根據醫師ID篩選
    if (doctor_id) {
      query += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const [rows] = await pool.execute(query, params);

    // 格式化回傳資料
    const appointments = rows.map(row => ({
      appointment_id: row.appointment_id,
      patient_id: row.patient_id,
      doctor_id: row.doctor_id,
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      doctor: {
        first_name: row.first_name,
        last_name: row.last_name,
        specialty: row.specialty,
        practice_hospital: row.practice_hospital,
        phone_number: row.phone_number
      }
    }));

    return res.status(200).json({
      success: true,
      data: appointments,
      count: appointments.length
    });

  } catch (error) {
    console.error('獲取預約列表失敗:', error);
    return res.status(500).json({
      success: false,
      error: '伺服器錯誤',
      message: error.message
    });
  }
}

// POST - 建立新預約
async function createAppointment(req, res) {
  const { patient_id, doctor_id, appointment_date, appointment_time } = req.body;

  // 驗證必填欄位
  if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({
      success: false,
      error: '缺少必填欄位',
      required: ['patient_id', 'doctor_id', 'appointment_date', 'appointment_time']
    });
  }

  try {
    const pool = getPool();

    // 檢查時間衝突
    const [existingAppointments] = await pool.execute(
      `SELECT appointment_id FROM appointments 
       WHERE doctor_id = ? 
       AND appointment_date = ? 
       AND appointment_time = ? 
       AND status IN ('待確認', '已確認')`,
      [doctor_id, appointment_date, appointment_time]
    );

    if (existingAppointments.length > 0) {
      return res.status(409).json({
        success: false,
        error: '此時段已被預約'
      });
    }

    // 建立新預約
    const [result] = await pool.execute(
      `INSERT INTO appointments 
       (patient_id, doctor_id, appointment_date, appointment_time, status) 
       VALUES (?, ?, ?, ?, '待確認')`,
      [patient_id, doctor_id, appointment_date, appointment_time]
    );

    // 獲取完整的預約資料
    const [newAppointment] = await pool.execute(
      `SELECT 
        a.appointment_id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.created_at,
        d.first_name,
        d.last_name,
        d.specialty,
        d.practice_hospital
      FROM appointments a
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      WHERE a.appointment_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: '預約建立成功',
      data: {
        appointment_id: newAppointment[0].appointment_id,
        patient_id: newAppointment[0].patient_id,
        doctor_id: newAppointment[0].doctor_id,
        appointment_date: newAppointment[0].appointment_date,
        appointment_time: newAppointment[0].appointment_time,
        status: newAppointment[0].status,
        created_at: newAppointment[0].created_at,
        doctor: {
          first_name: newAppointment[0].first_name,
          last_name: newAppointment[0].last_name,
          specialty: newAppointment[0].specialty,
          practice_hospital: newAppointment[0].practice_hospital
        }
      }
    });

  } catch (error) {
    console.error('建立預約失敗:', error);
    return res.status(500).json({
      success: false,
      error: '伺服器錯誤',
      message: error.message
    });
  }
}

// PUT - 更新預約狀態
async function updateAppointment(req, res) {
  const { appointment_id, status, appointment_date, appointment_time } = req.body;

  if (!appointment_id) {
    return res.status(400).json({
      success: false,
      error: '缺少 appointment_id'
    });
  }

  try {
    const pool = getPool();

    // 檢查預約是否存在
    const [existing] = await pool.execute(
      'SELECT * FROM appointments WHERE appointment_id = ?',
      [appointment_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '找不到此預約'
      });
    }

    // 建立更新語句
    let updateFields = [];
    let params = [];

    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (appointment_date) {
      updateFields.push('appointment_date = ?');
      params.push(appointment_date);
    }

    if (appointment_time) {
      updateFields.push('appointment_time = ?');
      params.push(appointment_time);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: '沒有要更新的欄位'
      });
    }

    params.push(appointment_id);

    await pool.execute(
      `UPDATE appointments SET ${updateFields.join(', ')} WHERE appointment_id = ?`,
      params
    );

    // 獲取更新後的資料
    const [updated] = await pool.execute(
      `SELECT 
        a.*,
        d.first_name,
        d.last_name,
        d.specialty
      FROM appointments a
      INNER JOIN doctor d ON a.doctor_id = d.doctor_id
      WHERE a.appointment_id = ?`,
      [appointment_id]
    );

    return res.status(200).json({
      success: true,
      message: '預約更新成功',
      data: updated[0]
    });

  } catch (error) {
    console.error('更新預約失敗:', error);
    return res.status(500).json({
      success: false,
      error: '伺服器錯誤',
      message: error.message
    });
  }
}

// DELETE - 刪除(取消)預約
async function deleteAppointment(req, res) {
  const { appointment_id } = req.query;

  if (!appointment_id) {
    return res.status(400).json({
      success: false,
      error: '缺少 appointment_id'
    });
  }

  try {
    const pool = getPool();

    // 軟刪除：將狀態改為「已取消」
    const [result] = await pool.execute(
      'UPDATE appointments SET status = ? WHERE appointment_id = ?',
      ['已取消', appointment_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '找不到此預約'
      });
    }

    return res.status(200).json({
      success: true,
      message: '預約已取消'
    });

  } catch (error) {
    console.error('取消預約失敗:', error);
    return res.status(500).json({
      success: false,
      error: '伺服器錯誤',
      message: error.message
    });
  }
}