/**
 * Tasks Routes - API endpoints for task management
 * NOW WITH MULTI-USER SUPPORT
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  addTask,
  getTask,
  getTasks,
  updateTask,
  deleteTask,
  getPendingTasks,
  getInProgressTasks,
  getCompletedTasks,
  getUpcomingDeadlines,
  getOverdueTasks,
  getHighPriorityTasks,
  getTaskStats,
  completeTask,
  startTask,
  TASK_STATUS,
  TASK_PRIORITY
} from '../services/taskService.js';
import { authenticate, optionalAuth, getUserIdFromRequest } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes (users must be logged in)
router.use(authenticate);

// Validation middleware helper
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// ==================== CRUD OPERATIONS ====================

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(Object.values(TASK_STATUS)),
    body('priority').optional().isIn(Object.values(TASK_PRIORITY)),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const task = await addTask(userId, req.body);
      res.status(201).json({
        success: true,
        task
      });
    } catch (error) {
      console.error('❌ Add task error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

/**
 * GET /api/tasks
 * Get all tasks (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { status, priority, category } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    
    const tasks = await getTasks(userId, filters);
    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

/**
 * GET /api/tasks/:id
 * Get task by ID
 */
router.get('/:id',
  [param('id').isUUID().withMessage('Invalid task ID'), validateRequest],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const task = await getTask(userId, req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({
        success: true,
        task
      });
    } catch (error) {
      console.error('❌ Get task error:', error);
      res.status(500).json({ error: 'Failed to retrieve task' });
    }
  }
);

/**
 * PUT /api/tasks/:id
 * Update task
 */
router.put('/:id',
  [
    param('id').isUUID().withMessage('Invalid task ID'),
    body('status').optional().isIn(Object.values(TASK_STATUS)),
    body('priority').optional().isIn(Object.values(TASK_PRIORITY)),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const task = await updateTask(userId, req.params.id, req.body);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({
        success: true,
        task
      });
    } catch (error) {
      console.error('❌ Update task error:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
);

/**
 * DELETE /api/tasks/:id
 * Delete task
 */
router.delete('/:id',
  [param('id').isUUID().withMessage('Invalid task ID'), validateRequest],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const deleted = await deleteTask(userId, req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete task error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
);

// ==================== STATUS UPDATES ====================

/**
 * POST /api/tasks/:id/complete
 * Mark task as completed
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const task = await completeTask(userId, req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({
      success: true,
      message: 'Task completed',
      task
    });
  } catch (error) {
    console.error('❌ Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

/**
 * POST /api/tasks/:id/start
 * Mark task as in progress
 */
router.post('/:id/start', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const task = await startTask(userId, req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({
      success: true,
      message: 'Task started',
      task
    });
  } catch (error) {
    console.error('❌ Start task error:', error);
    res.status(500).json({ error: 'Failed to start task' });
  }
});

// ==================== SPECIALIZED QUERIES ====================

/**
 * GET /api/tasks/query/pending
 * Get pending tasks
 */
router.get('/query/pending', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const tasks = await getPendingTasks(userId);
    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('❌ Get pending tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve pending tasks' });
  }
});

/**
 * GET /api/tasks/query/in-progress
 * Get in-progress tasks
 */
router.get('/query/in-progress', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const tasks = await getInProgressTasks(userId);
    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('❌ Get in-progress tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve in-progress tasks' });
  }
});

/**
 * GET /api/tasks/query/completed
 * Get completed tasks
 */
router.get('/query/completed', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { limit } = req.query;
    const tasks = await getCompletedTasks(userId, limit ? parseInt(limit) : null);
    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('❌ Get completed tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve completed tasks' });
  }
});

/**
 * GET /api/tasks/query/upcoming
 * Get upcoming deadlines
 */
router.get('/query/upcoming', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { days = 3 } = req.query;
    const tasks = await getUpcomingDeadlines(userId, parseInt(days));
    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('❌ Get upcoming tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve upcoming tasks' });
  }
});

/**
 * GET /api/tasks/query/overdue
 * Get overdue tasks
 */
router.get('/query/overdue', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const tasks = await getOverdueTasks(userId);
    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('❌ Get overdue tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve overdue tasks' });
  }
});

/**
 * GET /api/tasks/query/high-priority
 * Get high priority tasks
 */
router.get('/query/high-priority', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const tasks = await getHighPriorityTasks(userId);
    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('❌ Get high priority tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve high priority tasks' });
  }
});

// ==================== STATISTICS ====================

/**
 * GET /api/tasks/stats
 * Get task statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const stats = await getTaskStats(userId);
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get task stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve task statistics' });
  }
});

/**
 * POST /api/tasks/ai-organize
 * AI-powered task organization (categorization, prioritization)
 */
router.post('/ai-organize', async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!tasks || tasks.length === 0) {
      return res.json({
        success: false,
        message: 'No tasks to organize'
      });
    }

    // Use AI to organize and categorize tasks
    const { generateGroqCompletion } = await import('../utils/groqClient.js');
    const { generateGeminiResponse } = await import('../utils/geminiClient.js');
    
    const prompt = `Analyze these tasks and add intelligent categories and subcategories. Return the same tasks array with added 'category' and 'subcategory' fields.

Tasks:
${JSON.stringify(tasks, null, 2)}

Rules:
- Add a main category (e.g., Work, Personal, Health, Finance, Learning)
- Add a subcategory that's more specific
- Keep existing fields intact
- Return ONLY a valid JSON array

Return format:
[{"id": "...", "title": "...", "category": "...", "subcategory": "...", ...}]`;

    let organizedTasks = null;
    
    // Try Groq first
    try {
      const response = await generateGroqCompletion([
        { role: 'system', content: 'You organize tasks intelligently. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ]);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        organizedTasks = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('Groq failed, trying Gemini...');
      // Fallback to Gemini
      try {
        const response = await generateGeminiResponse(prompt);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          organizedTasks = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiError) {
        console.error('Both AI providers failed:', geminiError);
      }
    }

    if (!organizedTasks) {
      return res.json({
        success: false,
        message: 'Could not organize tasks with AI',
        tasks // Return original tasks
      });
    }

    // Update tasks in database
    const userId = getUserIdFromRequest(req);
    for (const task of organizedTasks) {
      if (task.id) {
        await updateTask(userId, task.id, {
          category: task.category,
          subcategory: task.subcategory
        });
      }
    }

    res.json({
      success: true,
      tasks: organizedTasks,
      message: 'Tasks organized successfully'
    });
  } catch (error) {
    console.error('❌ AI organize error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to organize tasks',
      tasks: req.body.tasks // Return original tasks
    });
  }
});

export default router;
