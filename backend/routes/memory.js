/**
 * Memory Routes - Persistent user memory storage
 */

import express from 'express';
import {
  getMemory,
  addMemory,
  updateMemory,
  deleteMemory,
  clearMemory
} from '../controllers/memoryController.js';

const router = express.Router();

/**
 * GET /api/memory
 * Get all memory items for a user
 */
router.get('/', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const memory = await getMemory(userId);
    
    res.json({
      userId,
      memory,
      count: memory.length
    });
  } catch (error) {
    console.error('❌ Get memory error:', error);
    res.status(500).json({ error: 'Failed to retrieve memory' });
  }
});

/**
 * POST /api/memory
 * Add new memory item
 */
router.post('/', async (req, res) => {
  try {
    const { userId = 'default', content, type = 'fact', metadata = {} } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const newMemory = await addMemory(userId, {
      content,
      type,
      metadata,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newMemory);
  } catch (error) {
    console.error('❌ Add memory error:', error);
    res.status(500).json({ error: 'Failed to add memory' });
  }
});

/**
 * PUT /api/memory/:id
 * Update existing memory item
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = 'default', content, type, metadata } = req.body;

    const updated = await updateMemory(userId, id, {
      content,
      type,
      metadata,
      updatedAt: new Date().toISOString()
    });

    if (!updated) {
      return res.status(404).json({ error: 'Memory item not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('❌ Update memory error:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

/**
 * DELETE /api/memory/:id
 * Delete memory item
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = 'default' } = req.query;

    const deleted = await deleteMemory(userId, id);

    if (!deleted) {
      return res.status(404).json({ error: 'Memory item not found' });
    }

    res.json({ message: 'Memory deleted successfully', id });
  } catch (error) {
    console.error('❌ Delete memory error:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

/**
 * DELETE /api/memory
 * Clear all memory for a user
 */
router.delete('/', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    await clearMemory(userId);
    res.json({ message: 'All memory cleared successfully' });
  } catch (error) {
    console.error('❌ Clear memory error:', error);
    res.status(500).json({ error: 'Failed to clear memory' });
  }
});

export default router;
