/**
 * Workflow Automation Routes
 * Manage and execute automated workflows
 */

import express from 'express';
import {
  executeWorkflow,
  scheduleWorkflow,
  unscheduleWorkflow,
  createWorkflow,
  getAllWorkflows,
  deleteWorkflow
} from '../services/workflowEngine.js';

const router = express.Router();

/**
 * GET /api/workflows
 * Get all workflows
 */
router.get('/', async (req, res) => {
  try {
    const workflows = await getAllWorkflows();
    res.json({ workflows });
  } catch (error) {
    console.error('❌ Get workflows error:', error.message);
    res.status(500).json({ error: 'Failed to fetch workflows', details: error.message });
  }
});

/**
 * POST /api/workflows
 * Create new workflow
 */
router.post('/', async (req, res) => {
  try {
    const result = await createWorkflow(req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ Create workflow error:', error.message);
    res.status(500).json({ error: 'Failed to create workflow', details: error.message });
  }
});

/**
 * POST /api/workflows/:id/execute
 * Execute workflow immediately
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeWorkflow(id);
    res.json(result);
  } catch (error) {
    console.error('❌ Execute workflow error:', error.message);
    res.status(500).json({ error: 'Failed to execute workflow', details: error.message });
  }
});

/**
 * POST /api/workflows/:id/schedule
 * Schedule workflow with cron
 */
router.post('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { cronExpression } = req.body;
    
    if (!cronExpression) {
      return res.status(400).json({ error: 'cronExpression is required' });
    }
    
    const result = await scheduleWorkflow(id, cronExpression);
    res.json(result);
  } catch (error) {
    console.error('❌ Schedule workflow error:', error.message);
    res.status(500).json({ error: 'Failed to schedule workflow', details: error.message });
  }
});

/**
 * POST /api/workflows/:id/unschedule
 * Unschedule workflow
 */
router.post('/:id/unschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await unscheduleWorkflow(id);
    res.json(result);
  } catch (error) {
    console.error('❌ Unschedule workflow error:', error.message);
    res.status(500).json({ error: 'Failed to unschedule workflow', details: error.message });
  }
});

/**
 * DELETE /api/workflows/:id
 * Delete workflow
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteWorkflow(id);
    res.json(result);
  } catch (error) {
    console.error('❌ Delete workflow error:', error.message);
    res.status(500).json({ error: 'Failed to delete workflow', details: error.message });
  }
});

export default router;
