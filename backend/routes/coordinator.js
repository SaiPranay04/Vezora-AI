/**
 * Coordinator Routes - Daily summary and context-aware operations
 */

import express from 'express';
import { generateDailySummary } from '../services/coordinatorService.js';
import { getRelevantContext, formatContextForPrompt } from '../services/retrievalService.js';

const router = express.Router();

/**
 * GET /api/coordinator/daily-summary
 * Generate daily summary with current tasks, projects, and priorities
 */
router.get('/daily-summary', async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId || 'default';
    console.log('📊 Generating daily summary...');
    const summary = await generateDailySummary(userId);
    
    res.json({
      success: true,
      summary,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Daily summary error:', error);
    res.status(500).json({ error: 'Failed to generate daily summary' });
  }
});

/**
 * POST /api/coordinator/preview-context
 * Preview what context would be retrieved for a given input
 */
router.post('/preview-context', async (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }
    
    const context = await getRelevantContext(input);
    const formattedContext = formatContextForPrompt(context);
    
    res.json({
      success: true,
      context,
      formatted: formattedContext,
      relevance_found: context.relevanceFound
    });
  } catch (error) {
    console.error('❌ Preview context error:', error);
    res.status(500).json({ error: 'Failed to preview context' });
  }
});

export default router;
