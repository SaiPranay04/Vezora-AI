/**
 * Structured Memory Routes - PostgreSQL-based memory management
 * NOW WITH MULTI-USER SUPPORT
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  addMemory,
  getMemory,
  getMemoriesByType,
  deleteMemory,
  addProject,
  addDecision,
  addPreference,
  getProjects,
  getDecisions,
  getPreferences,
  getAllMemories,
  searchMemories,
  getMemoryStats,
  MEMORY_TYPES
} from '../services/memoryService.pg.js';
import { authenticate, optionalAuth, getUserIdFromRequest } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes (users must be logged in)
router.use(authenticate);

// Validation helper
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

// ==================== GENERIC MEMORY OPERATIONS ====================

/**
 * POST /api/structured-memory
 * Add or update a memory
 */
router.post('/',
  [
    body('type').isIn(Object.values(MEMORY_TYPES)).withMessage('Invalid memory type'),
    body('key').trim().notEmpty().withMessage('Key is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { type, key, content, category, importance } = req.body;
      
      const memory = await addMemory(userId, type, key, content, category, importance);
      
      res.status(201).json({
        success: true,
        memory
      });
    } catch (error) {
      console.error('❌ Add memory error:', error);
      res.status(500).json({ error: 'Failed to add memory' });
    }
  }
);

/**
 * GET /api/structured-memory
 * Get all memories (all types)
 */
router.get('/', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const memories = await getAllMemories(userId);
    
    res.json({
      success: true,
      count: memories.length,
      memories
    });
  } catch (error) {
    console.error('❌ Get all memories error:', error);
    res.status(500).json({ error: 'Failed to retrieve memories' });
  }
});

/**
 * GET /api/structured-memory/search
 * Search memories by keyword
 */
router.get('/search', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    
    const memories = await searchMemories(userId, q);
    
    res.json({
      success: true,
      count: memories.length,
      memories
    });
  } catch (error) {
    console.error('❌ Search memories error:', error);
    res.status(500).json({ error: 'Failed to search memories' });
  }
});

/**
 * GET /api/structured-memory/stats
 * Get memory statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const stats = await getMemoryStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get memory stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve memory statistics' });
  }
});

/**
 * GET /api/structured-memory/:type/:key
 * Get specific memory by type and key
 */
router.get('/:type/:key', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { type, key } = req.params;
    
    if (!Object.values(MEMORY_TYPES).includes(type)) {
      return res.status(400).json({ error: 'Invalid memory type' });
    }
    
    const memory = await getMemory(userId, type, key);
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.json({
      success: true,
      memory
    });
  } catch (error) {
    console.error('❌ Get memory error:', error);
    res.status(500).json({ error: 'Failed to retrieve memory' });
  }
});

/**
 * DELETE /api/structured-memory/:type/:key
 * Delete specific memory
 */
router.delete('/:type/:key', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { type, key } = req.params;
    
    if (!Object.values(MEMORY_TYPES).includes(type)) {
      return res.status(400).json({ error: 'Invalid memory type' });
    }
    
    const deleted = await deleteMemory(userId, type, key);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.json({
      success: true,
      message: 'Memory deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete memory error:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

// ==================== PROJECT ROUTES ====================

/**
 * POST /api/structured-memory/projects
 * Add or update a project memory
 */
router.post('/projects',
  [
    body('key').trim().notEmpty().withMessage('Project key is required'),
    body('content').notEmpty().withMessage('Project content is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { key, content, category } = req.body;
      
      const memory = await addProject(userId, key, content, category);
      
      res.status(201).json({
        success: true,
        project: memory
      });
    } catch (error) {
      console.error('❌ Add project error:', error);
      res.status(500).json({ error: 'Failed to add project' });
    }
  }
);

/**
 * GET /api/structured-memory/projects
 * Get all project memories
 */
router.get('/projects', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const projects = await getProjects(userId);
    
    res.json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('❌ Get projects error:', error);
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

// ==================== DECISION ROUTES ====================

/**
 * POST /api/structured-memory/decisions
 * Add a decision memory
 */
router.post('/decisions',
  [
    body('key').trim().notEmpty().withMessage('Decision key is required'),
    body('content').notEmpty().withMessage('Decision content is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { key, content, category } = req.body;
      
      const memory = await addDecision(userId, key, content, category);
      
      res.status(201).json({
        success: true,
        decision: memory
      });
    } catch (error) {
      console.error('❌ Add decision error:', error);
      res.status(500).json({ error: 'Failed to add decision' });
    }
  }
);

/**
 * GET /api/structured-memory/decisions
 * Get all decision memories
 */
router.get('/decisions', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const decisions = await getDecisions(userId);
    
    res.json({
      success: true,
      count: decisions.length,
      decisions
    });
  } catch (error) {
    console.error('❌ Get decisions error:', error);
    res.status(500).json({ error: 'Failed to retrieve decisions' });
  }
});

// ==================== PREFERENCE ROUTES ====================

/**
 * POST /api/structured-memory/preferences
 * Add a user preference
 */
router.post('/preferences',
  [
    body('key').trim().notEmpty().withMessage('Preference key is required'),
    body('content').notEmpty().withMessage('Preference content is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { key, content, category } = req.body;
      
      const memory = await addPreference(userId, key, content, category);
      
      res.status(201).json({
        success: true,
        preference: memory
      });
    } catch (error) {
      console.error('❌ Add preference error:', error);
      res.status(500).json({ error: 'Failed to add preference' });
    }
  }
);

/**
 * GET /api/structured-memory/preferences
 * Get all user preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const preferences = await getPreferences(userId);
    
    res.json({
      success: true,
      count: preferences.length,
      preferences
    });
  } catch (error) {
    console.error('❌ Get preferences error:', error);
    res.status(500).json({ error: 'Failed to retrieve preferences' });
  }
});

export default router;
