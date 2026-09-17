/**
 * Tools API — list tools + confirm/cancel risky executions
 */

import express from 'express';
import { listTools } from '../core/toolRegistry.js';
import { executeTool, confirmTool, inferToolCall } from '../core/toolExecutor.js';
import { optionalAuth, getUserIdFromRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, (_req, res) => {
  res.json({ tools: listTools() });
});

/**
 * POST /api/tools/execute
 * Body: { toolName, args, confirmed?, pendingId? }
 */
router.post('/execute', optionalAuth, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { toolName, args = {}, confirmed = false, pendingId = null } = req.body;

    if (!toolName) {
      return res.status(400).json({ error: 'toolName is required' });
    }

    if (confirmed || pendingId) return res.status(400).json({ error: 'Use /confirm with the issued ticket' });
    const result = await executeTool(toolName, args, { userId });
    const status = result.requiresConfirmation ? 202 : result.success ? 200 : 400;
    res.status(status).json(result);
  } catch (error) {
    console.error('❌ Tool execute error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tools/confirm
 * Body: { pendingId, approve: boolean }
 */
router.post('/confirm', optionalAuth, async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { pendingId, approve } = req.body;

    if (!pendingId) {
      return res.status(400).json({ error: 'pendingId is required' });
    }

    const result = await confirmTool(pendingId, { approve, userId });
    res.status(result.success || result.cancelled ? 200 : 400).json(result);
  } catch (error) {
    console.error('❌ Tool confirm error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tools/infer
 * Body: { message } — heuristic tool inference for debugging / chat assist
 */
router.post('/infer', optionalAuth, (req, res) => {
  const inferred = inferToolCall(req.body?.message || '');
  res.json({ inferred });
});

export default router;
