/**
 * Apps Routes - Launch desktop applications
 */

import express from 'express';
import { launchApplication, getInstalledApps } from '../controllers/appsController.js';

const router = express.Router();

/**
 * POST /api/apps/launch
 * Launch a desktop application
 */
router.post('/launch', async (req, res) => {
  try {
    // Check if app launch is enabled
    if (process.env.ENABLE_APP_LAUNCH !== 'true') {
      return res.status(403).json({
        error: 'App launch is disabled',
        message: 'Set ENABLE_APP_LAUNCH=true in .env to enable this feature'
      });
    }

    const { appName, args = [] } = req.body;

    if (!appName) {
      return res.status(400).json({ error: 'App name is required' });
    }

    const result = await launchApplication(appName, args);

    res.json({
      success: true,
      app: appName,
      pid: result.pid,
      message: `Successfully launched ${appName}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ App launch error:', error);
    res.status(500).json({
      error: 'Failed to launch application',
      details: error.message
    });
  }
});

/**
 * GET /api/apps/installed
 * Get list of commonly installed applications
 */
router.get('/installed', async (req, res) => {
  try {
    const apps = await getInstalledApps();
    res.json({ apps });
  } catch (error) {
    console.error('❌ Get apps error:', error);
    res.status(500).json({ error: 'Failed to get installed apps' });
  }
});

export default router;
