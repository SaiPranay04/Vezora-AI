/**
 * User Profile Routes - SQLite-based
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../utils/database.js';
import { getPreferences, getProjects } from '../services/memoryService.js';
import { authenticate, getUserIdFromRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

router.get('/', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const db = getDatabase();
    
    let profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    
    if (!profile) {
      db.prepare(`
        INSERT INTO user_profiles (user_id, name, bio, preferences)
        VALUES (?, ?, ?, ?)
      `).run(userId, 'User', 'Vezora AI User', JSON.stringify({ theme: 'dark', voice_speed: 1.0 }));
      
      profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    }
    
    if (typeof profile.preferences === 'string') {
      try { profile.preferences = JSON.parse(profile.preferences); } catch (e) {}
    }
    if (typeof profile.interests === 'string') {
      try { profile.interests = JSON.parse(profile.interests); } catch (e) {}
    }
    
    const memoryPreferences = await getPreferences(userId);
    const memoryProjects = await getProjects(userId);
    
    profile.stats = {
      total_memories: memoryPreferences.length + memoryProjects.length,
      total_preferences: memoryPreferences.length,
      total_projects: memoryProjects.length
    };

    res.json({ success: true, profile });
  } catch (error) {
    console.error('❌ Fetch profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

router.put('/',
  [
    body('name').optional().trim(),
    body('bio').optional().trim(),
    body('email').optional().isEmail(),
    body('occupation').optional().trim(),
    body('location').optional().trim(),
    body('timezone').optional().trim(),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { name, bio, email, occupation, location, timezone, interests, preferences } = req.body;
      const db = getDatabase();
      
      const fields = [];
      const values = [];
      
      if (name !== undefined) { fields.push(`name = ?`); values.push(name); }
      if (bio !== undefined) { fields.push(`bio = ?`); values.push(bio); }
      if (email !== undefined) { fields.push(`email = ?`); values.push(email); }
      if (occupation !== undefined) { fields.push(`occupation = ?`); values.push(occupation); }
      if (location !== undefined) { fields.push(`location = ?`); values.push(location); }
      if (timezone !== undefined) { fields.push(`timezone = ?`); values.push(timezone); }
      if (interests !== undefined) { fields.push(`interests = ?`); values.push(JSON.stringify(interests)); }
      if (preferences !== undefined) { fields.push(`preferences = ?`); values.push(JSON.stringify(preferences)); }
      
      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      values.push(userId);
      
      let result = db.prepare(`UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
      
      if (result.changes === 0) {
        db.prepare(`
          INSERT INTO user_profiles (user_id, name, bio, email, occupation, location, timezone, interests, preferences)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, name || 'User', bio || '', email || '', occupation || '', location || '', timezone || '', JSON.stringify(interests || []), JSON.stringify(preferences || {}));
      }
      
      const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
      if (typeof profile.preferences === 'string') {
        try { profile.preferences = JSON.parse(profile.preferences); } catch (e) {}
      }
      if (typeof profile.interests === 'string') {
        try { profile.interests = JSON.parse(profile.interests); } catch (e) {}
      }

      res.json({ success: true, profile, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('❌ Update profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }
);

router.post('/extract-from-chat', async (req, res) => {
  return res.json({ success: false, message: 'Chat extraction is currently disabled in Local Mode.' });
});

export default router;
