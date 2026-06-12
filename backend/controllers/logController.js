const db = require('../config/db');

const logActivity = async (leadId, userId, activityType, details, client = null) => {
  const dbClient = client || db;
  const sql = `
    INSERT INTO activity_logs (lead_id, user_id, activity_type, details)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  try {
    const res = await dbClient.query(sql, [leadId, userId, activityType, details]);
    return res.rows[0];
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    return null;
  }
};

const getLogsByLead = async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `
      SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.lead_id = $1
      ORDER BY al.created_at DESC;
    `;
    const result = await db.query(sql, [id]);
    res.status(200).json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching logs for lead:', error);
    res.status(500).json({ error: 'Internal server error fetching activity logs for this lead.' });
  }
};

const getAllLogs = async (req, res) => {
  try {
    const sql = `
      SELECT al.*, u.name as user_name, u.role as user_role, l.name as lead_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN leads l ON al.lead_id = l.id
      ORDER BY al.created_at DESC
      LIMIT 200;
    `;
    const result = await db.query(sql);
    res.status(200).json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching all logs:', error);
    res.status(500).json({ error: 'Internal server error fetching activity logs.' });
  }
};

module.exports = {
  logActivity,
  getLogsByLead,
  getAllLogs,
};
