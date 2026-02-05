/**
 * Logs Routes - System activity logs
 */

import express from 'express';
import { getLogs, clearLogs } from '../controllers/logsController.js';

const router = express.Router();

/**
 * GET /api/logs
 * Get system logs
 */
router.get('/', async (req, res) => {
  try {
    const {
      userId = 'default',
      type,
      limit = 100,
      offset = 0
    } = req.query;

    const logs = await getLogs(userId, {
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      logs,
      count: logs.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Get logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

/**
 * DELETE /api/logs
 * Clear logs
 */
router.delete('/', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    await clearLogs(userId);
    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    console.error('❌ Clear logs error:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

export default router;
