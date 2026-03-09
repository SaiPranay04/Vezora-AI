/**
 * User Profile Routes - PostgreSQL-based
 * NOW WITH MULTI-USER SUPPORT
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { getPreferences, getProjects } from '../services/memoryService.pg.js';
import { authenticate, getUserIdFromRequest } from '../middleware/auth.js';

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

/**
 * GET /api/profile
 * Fetch user profile information
 */
router.get('/', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    
    // Get profile from database
    const result = await query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    
    let profile;
    
    if (result.rows.length === 0) {
      // Create default profile if it doesn't exist
      const createResult = await query(
        `INSERT INTO user_profiles (user_id, name, bio, preferences)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, 'User', 'Vezora AI User', JSON.stringify({ theme: 'dark', voice_speed: 1.0 })]
      );
      profile = createResult.rows[0];
    } else {
      profile = result.rows[0];
    }
    
    // Parse JSON fields
    if (typeof profile.preferences === 'string') {
      profile.preferences = JSON.parse(profile.preferences);
    }
    
    // Get memory stats
    const memoryPreferences = await getPreferences(userId);
    const memoryProjects = await getProjects(userId);
    
    // Add enriched data
    profile.stats = {
      total_memories: memoryPreferences.length + memoryProjects.length,
      total_preferences: memoryPreferences.length,
      total_projects: memoryProjects.length
    };

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('❌ Fetch profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * PUT /api/profile
 * Update user profile
 */
router.put('/',
  [
    body('name').optional().trim(),
    body('bio').optional().trim(),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('occupation').optional().trim(),
    body('location').optional().trim(),
    body('timezone').optional().trim(),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const { name, bio, email, occupation, location, timezone, interests, preferences } = req.body;
      
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      if (name !== undefined) {
        fields.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      if (bio !== undefined) {
        fields.push(`bio = $${paramCount}`);
        values.push(bio);
        paramCount++;
      }
      if (email !== undefined) {
        fields.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
      }
      if (occupation !== undefined) {
        fields.push(`occupation = $${paramCount}`);
        values.push(occupation);
        paramCount++;
      }
      if (location !== undefined) {
        fields.push(`location = $${paramCount}`);
        values.push(location);
        paramCount++;
      }
      if (timezone !== undefined) {
        fields.push(`timezone = $${paramCount}`);
        values.push(timezone);
        paramCount++;
      }
      if (interests !== undefined) {
        fields.push(`interests = $${paramCount}`);
        values.push(Array.isArray(interests) ? interests : [interests]);
        paramCount++;
      }
      if (preferences !== undefined) {
        fields.push(`preferences = $${paramCount}`);
        values.push(JSON.stringify(preferences));
        paramCount++;
      }
      
      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      values.push(userId);
      
      const result = await query(
        `UPDATE user_profiles 
         SET ${fields.join(', ')}
         WHERE user_id = $${paramCount}
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        // Profile doesn't exist, create it
        const createResult = await query(
          `INSERT INTO user_profiles (user_id, name, bio, email, occupation, location, timezone, interests, preferences)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [userId, name || 'User', bio || '', email || '', occupation || '', location || '', timezone || '', interests || [], JSON.stringify(preferences || {})]
        );
        
        const profile = createResult.rows[0];
        if (typeof profile.preferences === 'string') {
          profile.preferences = JSON.parse(profile.preferences);
        }
        
        return res.json({
          success: true,
          profile,
          message: 'Profile created successfully'
        });
      }
      
      const profile = result.rows[0];
      if (typeof profile.preferences === 'string') {
        profile.preferences = JSON.parse(profile.preferences);
      }

      res.json({
        success: true,
        profile,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('❌ Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
);

/**
 * POST /api/profile/extract-from-chat
 * Extract profile info from chat history using AI
 */
router.post('/extract-from-chat', async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    
    // Get recent chat history from database
    const chatResult = await query(
      `SELECT role, content FROM chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );
    
    if (chatResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'No chat history available for extraction'
      });
    }
    
    const chatHistory = chatResult.rows.reverse(); // Oldest first

    // Use AI to extract user information from chat
    const { generateGroqCompletion } = await import('../utils/groqClient.js');
    const { generateGeminiResponse } = await import('../utils/geminiClient.js');
    
    const prompt = `Analyze the following chat history and extract user profile information. Return ONLY a JSON object with these fields (leave empty if not found):
{
  "name": "",
  "occupation": "",
  "location": "",
  "interests": [],
  "bio": ""
}

Chat history:
${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Return ONLY the JSON object, no other text.`;

    let extractedInfo = null;
    
    // Try Groq first
    try {
      const response = await generateGroqCompletion([
        { role: 'system', content: 'You extract user profile information from chat. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ]);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedInfo = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('Groq failed, trying Gemini...');
      // Fallback to Gemini
      try {
        const response = await generateGeminiResponse(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedInfo = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiError) {
        console.error('Both AI providers failed:', geminiError);
      }
    }

    if (!extractedInfo) {
      return res.json({
        success: false,
        message: 'Could not extract profile information'
      });
    }

    // Update profile with extracted info
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (extractedInfo.name && extractedInfo.name !== '') {
      fields.push(`name = $${paramCount}`);
      values.push(extractedInfo.name);
      paramCount++;
    }
    if (extractedInfo.occupation && extractedInfo.occupation !== '') {
      fields.push(`occupation = $${paramCount}`);
      values.push(extractedInfo.occupation);
      paramCount++;
    }
    if (extractedInfo.location && extractedInfo.location !== '') {
      fields.push(`location = $${paramCount}`);
      values.push(extractedInfo.location);
      paramCount++;
    }
    if (extractedInfo.bio && extractedInfo.bio !== '') {
      fields.push(`bio = $${paramCount}`);
      values.push(extractedInfo.bio);
      paramCount++;
    }
    if (extractedInfo.interests && extractedInfo.interests.length > 0) {
      fields.push(`interests = $${paramCount}`);
      values.push(extractedInfo.interests);
      paramCount++;
    }
    
    if (fields.length === 0) {
      return res.json({
        success: false,
        message: 'No information could be extracted',
        extracted: extractedInfo
      });
    }
    
    values.push(userId);
    
    const result = await query(
      `UPDATE user_profiles 
       SET ${fields.join(', ')}
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );
    
    let profile;
    if (result.rows.length === 0) {
      // Create new profile
      const createResult = await query(
        `INSERT INTO user_profiles (user_id, name, bio, occupation, location, interests)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userId,
          extractedInfo.name || 'User',
          extractedInfo.bio || '',
          extractedInfo.occupation || '',
          extractedInfo.location || '',
          extractedInfo.interests || []
        ]
      );
      profile = createResult.rows[0];
    } else {
      profile = result.rows[0];
    }
    
    if (typeof profile.preferences === 'string') {
      profile.preferences = JSON.parse(profile.preferences);
    }

    res.json({
      success: true,
      profile,
      extracted: extractedInfo,
      message: 'Profile updated from chat history'
    });
  } catch (error) {
    console.error('❌ Extract from chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract profile info'
    });
  }
});

export default router;
