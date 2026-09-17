import express from 'express';
import { executeTool } from '../core/toolExecutor.js';
const router = express.Router();
for (const [route,tool] of Object.entries({read:'file.read',list:'file.search',open:'file.open',save:'file.write'})) {
  router.post('/'+route, async (req,res) => {
    const result = await executeTool(tool,req.body);
    if (!result.success) return res.status(result.requiresConfirmation ? 202 : 403).json(result);
    const value = result.result;
    res.json({ ...value, files: value.entries, count: value.entries?.length });
  });
}
export default router;
