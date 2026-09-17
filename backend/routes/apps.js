import express from 'express';
import { executeTool } from '../core/toolExecutor.js';
import { getInstalledApps } from '../controllers/appsController.js';
const router = express.Router();
router.get('/installed',async (_req,res) => res.json({ apps: await getInstalledApps() }));
router.post('/launch',async (req,res) => {
  if (req.body.args?.length) return res.status(400).json({ error: 'App arguments disabled' });
  const result = await executeTool('app.open',{ appName: req.body.appName });
  res.status(result.requiresConfirmation ? 202 : result.success ? 200 : 403).json(result);
});
export default router;
