const db = require('../config/db');

const findLeastLoadedAgent = async (client) => {
  const dbClient = client || db;
  
  const queryText = `
    SELECT u.id, COUNT(l.id) AS active_count
    FROM users u
    LEFT JOIN leads l ON u.id = l.assigned_to AND l.status IN ('new', 'contacted', 'qualified', 'in_progress')
    WHERE u.role = 'agent'
    GROUP BY u.id
    ORDER BY active_count ASC, u.id ASC
    LIMIT 1;
  `;
  
  const res = await dbClient.query(queryText);
  if (res.rows.length === 0) {
    return null;
  }
  return parseInt(res.rows[0].id);
};

module.exports = {
  findLeastLoadedAgent,
};
