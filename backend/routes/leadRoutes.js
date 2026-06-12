const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, leadController.listLeads);
router.get('/stats', authenticateToken, leadController.getLeadStats);
router.get('/:id', authenticateToken, leadController.getLeadById);
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), leadController.createLead);
router.put('/:id', authenticateToken, leadController.updateLead);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'manager'), leadController.deleteLead);

module.exports = router;
