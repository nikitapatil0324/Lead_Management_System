const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, authorizeRoles('admin', 'manager'), logController.getAllLogs);
router.get('/lead/:id', authenticateToken, logController.getLogsByLead);

module.exports = router;
