const db = require('../config/db');
const leadService = require('../services/leadService');
const enrichmentService = require('../services/enrichmentService');
const logController = require('./logController');

const createLead = async (req, res) => {
  const { name, email, phone, source, notes } = req.body;
  const creatorId = req.user.id;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required to create a lead.' });
  }

  const enrichmentData = await enrichmentService.fetchEnrichmentData(name, email);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const agentId = await leadService.findLeastLoadedAgent(client);

    const insertSql = `
      INSERT INTO leads (name, email, phone, source, status, assigned_to, notes, enrichment_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const leadResult = await client.query(insertSql, [
      name,
      email,
      phone || null,
      source || 'web',
      'new',
      agentId,
      notes || null,
      JSON.stringify(enrichmentData)
    ]);

    const newLead = leadResult.rows[0];

    await logController.logActivity(
      newLead.id, 
      creatorId, 
      'created', 
      `Lead created via source: ${newLead.source}`, 
      client
    );

    if (agentId) {
      await logController.logActivity(
        newLead.id, 
        creatorId, 
        'assigned', 
        `Lead automatically assigned to agent ID ${agentId} (least-loaded)`, 
        client
      );
    } else {
      await logController.logActivity(
        newLead.id, 
        creatorId, 
        'assigned', 
        'Lead created but remains unassigned (no agents registered in system)', 
        client
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Lead created and assigned successfully.', lead: newLead });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create Lead Error:', error);
    res.status(500).json({ error: 'Internal server error occurred while creating lead.' });
  } finally {
    client.release();
  }
};

const updateLead = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const { name, email, phone, source, status, assigned_to, notes } = req.body;

  try {
    const currentRes = await db.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    const currentLead = currentRes.rows[0];

    if (user.role === 'agent') {
      if (currentLead.assigned_to !== user.id) {
        return res.status(403).json({ error: 'Access Denied. You are not authorized to update this lead.' });
      }
    }

    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    const addField = (column, newValue) => {
      updateFields.push(`${column} = $${paramIndex}`);
      queryParams.push(newValue);
      paramIndex++;
    };

    if (user.role === 'agent') {
      addField('status', status !== undefined ? status : currentLead.status);
      addField('notes', notes !== undefined ? notes : currentLead.notes);
    } else {
      addField('name', name !== undefined ? name : currentLead.name);
      addField('email', email !== undefined ? email : currentLead.email);
      addField('phone', phone !== undefined ? phone : currentLead.phone);
      addField('source', source !== undefined ? source : currentLead.source);
      addField('status', status !== undefined ? status : currentLead.status);
      addField('assigned_to', assigned_to !== undefined ? assigned_to : currentLead.assigned_to);
      addField('notes', notes !== undefined ? notes : currentLead.notes);
    }

    addField('updated_at', new Date());

    queryParams.push(id);
    const idPlaceholderIndex = paramIndex;

    const updateSql = `
      UPDATE leads
      SET ${updateFields.join(', ')}
      WHERE id = $${idPlaceholderIndex}
      RETURNING *;
    `;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(updateSql, queryParams);
      const updatedLead = result.rows[0];

      if (status !== undefined && status !== currentLead.status) {
        await logController.logActivity(
          id, 
          user.id, 
          'status_changed', 
          `Status changed from '${currentLead.status}' to '${status}'`, 
          client
        );
      }
      if (user.role !== 'agent' && assigned_to !== undefined && assigned_to !== currentLead.assigned_to) {
        await logController.logActivity(
          id, 
          user.id, 
          'assigned', 
          `Reassigned lead from agent ID ${currentLead.assigned_to || 'None'} to agent ID ${assigned_to || 'None'}`, 
          client
        );
      }

      let fieldsChanged = [];
      if (user.role !== 'agent') {
        if (name && name !== currentLead.name) fieldsChanged.push('name');
        if (email && email !== currentLead.email) fieldsChanged.push('email');
        if (phone !== undefined && phone !== currentLead.phone) fieldsChanged.push('phone');
        if (source && source !== currentLead.source) fieldsChanged.push('source');
      }
      if (notes !== undefined && notes !== currentLead.notes) fieldsChanged.push('notes');

      if (fieldsChanged.length > 0) {
        await logController.logActivity(
          id, 
          user.id, 
          'updated', 
          `Updated fields: ${fieldsChanged.join(', ')}`, 
          client
        );
      }

      await client.query('COMMIT');
      res.status(200).json({ message: 'Lead updated successfully.', lead: updatedLead });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update Lead Error:', error);
    res.status(500).json({ error: 'Internal server error occurred while updating lead.' });
  }
};

const deleteLead = async (req, res) => {
  const { id } = req.params;
  try {
    const checkLead = await db.query('SELECT name FROM leads WHERE id = $1', [id]);
    if (checkLead.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    await db.query('DELETE FROM leads WHERE id = $1', [id]);
    res.status(200).json({ message: `Lead '${checkLead.rows[0].name}' deleted successfully.` });
  } catch (error) {
    console.error('Delete Lead Error:', error);
    res.status(500).json({ error: 'Internal server error occurred while deleting lead.' });
  }
};

const getLeadById = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const sql = `
      SELECT l.*, u.name as assigned_to_name, u.email as assigned_to_email
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1;
    `;
    const result = await db.query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const lead = result.rows[0];

    if (user.role === 'agent' && lead.assigned_to !== user.id) {
      return res.status(403).json({ error: 'Access Denied. You are not authorized to view this lead.' });
    }

    res.status(200).json({ lead });
  } catch (error) {
    console.error('Get Lead ID Error:', error);
    res.status(500).json({ error: 'Internal server error fetching lead details.' });
  }
};

const listLeads = async (req, res) => {
  const user = req.user;
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    status, 
    source, 
    sortField = 'created_at', 
    sortOrder = 'DESC' 
  } = req.query;

  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.max(1, parseInt(limit));
  const offset = (parsedPage - 1) * parsedLimit;

  const allowedSortFields = ['created_at', 'name', 'email', 'status', 'source', 'updated_at'];
  const finalSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
  const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  try {
    let queryParams = [];
    let countParams = [];
    let whereClauses = [];
    let paramIndex = 1;

    if (user.role === 'agent') {
      whereClauses.push(`l.assigned_to = $${paramIndex}`);
      queryParams.push(user.id);
      countParams.push(user.id);
      paramIndex++;
    }

    if (search.trim() !== '') {
      whereClauses.push(`(l.name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.phone ILIKE $${paramIndex} OR l.notes ILIKE $${paramIndex})`);
      queryParams.push(`%${search.trim()}%`);
      countParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (status) {
      whereClauses.push(`l.status = $${paramIndex}`);
      queryParams.push(status);
      countParams.push(status);
      paramIndex++;
    }

    if (source) {
      whereClauses.push(`l.source = $${paramIndex}`);
      queryParams.push(source);
      countParams.push(source);
      paramIndex++;
    }

    const whereClauseStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM leads l ${whereClauseStr}`;
    const countResult = await db.query(countSql, countParams);
    const totalItems = parseInt(countResult.rows[0].count);

    queryParams.push(parsedLimit);
    const limitPlaceholder = `$${paramIndex}`;
    paramIndex++;

    queryParams.push(offset);
    const offsetPlaceholder = `$${paramIndex}`;

    const selectSql = `
      SELECT l.*, u.name as assigned_to_name, u.email as assigned_to_email
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      ${whereClauseStr}
      ORDER BY l.${finalSortField} ${finalSortOrder}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `;

    const leadsResult = await db.query(selectSql, queryParams);

    res.status(200).json({
      leads: leadsResult.rows,
      pagination: {
        totalItems,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(totalItems / parsedLimit),
      }
    });
  } catch (error) {
    console.error('List Leads Error:', error);
    res.status(500).json({ error: 'Internal server error occurred while retrieving leads.' });
  }
};

const getLeadStats = async (req, res) => {
  const user = req.user;
  try {
    let queryParams = [];
    let scopeClause = '';
    
    if (user.role === 'agent') {
      scopeClause = 'WHERE assigned_to = $1';
      queryParams.push(user.id);
    }
    
    const sql = `
      SELECT 
        COUNT(*)::integer as total,
        COUNT(CASE WHEN status = 'new' THEN 1 END)::integer as new,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END)::integer as contacted,
        COUNT(CASE WHEN status = 'qualified' OR status = 'in_progress' THEN 1 END)::integer as qualified,
        COUNT(CASE WHEN status = 'won' OR status = 'completed' THEN 1 END)::integer as won,
        COUNT(CASE WHEN status = 'lost' THEN 1 END)::integer as lost
      FROM leads
      ${scopeClause}
    `;
    
    const result = await db.query(sql, queryParams);
    res.status(200).json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({ error: 'Internal server error fetching lead stats.' });
  }
};

module.exports = {
  createLead,
  updateLead,
  deleteLead,
  getLeadById,
  listLeads,
  getLeadStats,
};
