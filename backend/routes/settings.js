/**
 * Settings Routes - User preferences and configuration
 */

import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

/**
 * GET /api/settings
 * Get user settings
 */
router.get('/', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const settings = await getSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error('❌ Get settings error:', error);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

/**
 * PUT /api/settings
 * Update user settings
 */
router.put('/', async (req, res) => {
  try {
    const { userId = 'default', ...newSettings } = req.body;
    const updated = await updateSettings(userId, newSettings);
    res.json(updated);
  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
