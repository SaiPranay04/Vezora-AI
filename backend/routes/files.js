/**
 * Files Routes - File system operations
 */

import express from 'express';
import {
  openFile,
  saveFile,
  readFile,
  listDirectory
} from '../controllers/filesController.js';

const router = express.Router();

/**
 * POST /api/files/open
 * Open a file with default application
 */
router.post('/open', async (req, res) => {
  try {
    if (process.env.ENABLE_FILE_SYSTEM !== 'true') {
      return res.status(403).json({
        error: 'File system access is disabled'
      });
    }

    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    await openFile(path);

    res.json({
      success: true,
      message: `Opened file: ${path}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Open file error:', error);
    res.status(500).json({
      error: 'Failed to open file',
      details: error.message
    });
  }
});

/**
 * POST /api/files/save
 * Save content to a file
 */
router.post('/save', async (req, res) => {
  try {
    if (process.env.ENABLE_FILE_SYSTEM !== 'true') {
      return res.status(403).json({
        error: 'File system access is disabled'
      });
    }

    const { path, content, encoding = 'utf8' } = req.body;

    if (!path || content === undefined) {
      return res.status(400).json({ error: 'Path and content are required' });
    }

    await saveFile(path, content, encoding);

    res.json({
      success: true,
      path,
      message: 'File saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Save file error:', error);
    res.status(500).json({
      error: 'Failed to save file',
      details: error.message
    });
  }
});

/**
 * POST /api/files/read
 * Read file contents
 */
router.post('/read', async (req, res) => {
  try {
    if (process.env.ENABLE_FILE_SYSTEM !== 'true') {
      return res.status(403).json({
        error: 'File system access is disabled'
      });
    }

    const { path, encoding = 'utf8' } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const content = await readFile(path, encoding);

    res.json({
      path,
      content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Read file error:', error);
    res.status(500).json({
      error: 'Failed to read file',
      details: error.message
    });
  }
});

/**
 * POST /api/files/list
 * List directory contents
 */
router.post('/list', async (req, res) => {
  try {
    if (process.env.ENABLE_FILE_SYSTEM !== 'true') {
      return res.status(403).json({
        error: 'File system access is disabled'
      });
    }

    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Directory path is required' });
    }

    const files = await listDirectory(path);

    res.json({
      path,
      files,
      count: files.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ List directory error:', error);
    res.status(500).json({
      error: 'Failed to list directory',
      details: error.message
    });
  }
});

export default router;
