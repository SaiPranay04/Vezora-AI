/**
 * Memory Service (PostgreSQL) - Structured memory storage for Vezora AI
 * Stores PROJECT_MEMORY, DECISION_MEMORY, and USER_PREFERENCE
 * NOW WITH VECTOR EMBEDDINGS for semantic search
 */

import { query } from '../config/database.js';
import { generateEmbedding } from '../utils/voyageClient.js';

// Memory types
export const MEMORY_TYPES = {
  PROJECT: 'PROJECT_MEMORY',
  DECISION: 'DECISION_MEMORY',
  PREFERENCE: 'USER_PREFERENCE'
};

// ==================== GENERIC MEMORY OPERATIONS ====================

/**
 * Add or update memory
 * @param {string} userId - User ID
 * @param {string} type - Memory type (PROJECT_MEMORY, DECISION_MEMORY, USER_PREFERENCE)
 * @param {string} key - Memory key (unique identifier)
 * @param {Object} content - Memory content (JSON)
 * @param {string} category - Optional category
 * @param {number} importance - Importance score (1-10)
 */
export async function addMemory(userId, type, key, content, category = null, importance = 5) {
  try {
    // Generate embedding for semantic search
    const textToEmbed = typeof content === 'string' 
      ? content 
      : JSON.stringify(content);
    
    const embedding = await generateEmbedding(textToEmbed);
    const embeddingStr = embedding ? `[${embedding.join(',')}]` : null;

    const result = await query(
      `INSERT INTO memories (user_id, type, key, content, category, importance_score, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
       ON CONFLICT (user_id, type, key) 
       DO UPDATE SET 
         content = EXCLUDED.content,
         category = EXCLUDED.category,
         importance_score = EXCLUDED.importance_score,
         embedding = EXCLUDED.embedding,
         updated_at = NOW()
       RETURNING *`,
      [userId, type, key, JSON.stringify(content), category, importance, embeddingStr]
    );

    console.log(`✅ Memory added/updated: ${type} - ${key} for user ${userId} ${embedding ? '(with embedding)' : ''}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Add memory error:', error.message);
    throw error;
  }
}

/**
 * Get memory by type and key
 */
export async function getMemory(userId, type, key) {
  try {
    const result = await query(
      `UPDATE memories 
       SET accessed_at = NOW(), access_count = access_count + 1
       WHERE user_id = $1 AND type = $2 AND key = $3
       RETURNING *`,
      [userId, type, key]
    );

    if (result.rows.length > 0) {
      const memory = result.rows[0];
      memory.content = typeof memory.content === 'string' ? JSON.parse(memory.content) : memory.content;
      return memory;
    }
    return null;
  } catch (error) {
    console.error('❌ Get memory error:', error.message);
    throw error;
  }
}

/**
 * Get all memories by type
 */
export async function getMemoriesByType(userId, type) {
  try {
    const result = await query(
      'SELECT * FROM memories WHERE user_id = $1 AND type = $2 ORDER BY importance_score DESC, updated_at DESC',
      [userId, type]
    );

    return result.rows.map(row => ({
      ...row,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content
    }));
  } catch (error) {
    console.error('❌ Get memories by type error:', error.message);
    throw error;
  }
}

/**
 * Delete memory
 */
export async function deleteMemory(userId, type, key) {
  try {
    const result = await query(
      'DELETE FROM memories WHERE user_id = $1 AND type = $2 AND key = $3 RETURNING id',
      [userId, type, key]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Delete memory error:', error.message);
    throw error;
  }
}

// ==================== HELPER FUNCTIONS FOR SPECIFIC MEMORY TYPES ====================

/**
 * Add project memory
 */
export async function addProject(userId, key, content, category = 'general') {
  return await addMemory(userId, MEMORY_TYPES.PROJECT, key, content, category, 7);
}

/**
 * Add decision memory
 */
export async function addDecision(userId, key, content, category = 'general') {
  return await addMemory(userId, MEMORY_TYPES.DECISION, key, content, category, 8);
}

/**
 * Add user preference
 */
export async function addPreference(userId, key, content, category = 'general') {
  return await addMemory(userId, MEMORY_TYPES.PREFERENCE, key, content, category, 6);
}

/**
 * Get all projects
 */
export async function getProjects(userId) {
  return await getMemoriesByType(userId, MEMORY_TYPES.PROJECT);
}

/**
 * Get all decisions
 */
export async function getDecisions(userId) {
  return await getMemoriesByType(userId, MEMORY_TYPES.DECISION);
}

/**
 * Get all preferences
 */
export async function getPreferences(userId) {
  return await getMemoriesByType(userId, MEMORY_TYPES.PREFERENCE);
}

/**
 * Get memory by type (backward compatibility)
 */
export async function getMemoryByType(userId, type, key = null) {
  if (key) {
    return await getMemory(userId, type, key);
  }
  return await getMemoriesByType(userId, type);
}

/**
 * Get all memories (all types)
 */
export async function getAllMemories(userId) {
  try {
    const result = await query(
      'SELECT * FROM memories WHERE user_id = $1 ORDER BY type, importance_score DESC, updated_at DESC',
      [userId]
    );

    return result.rows.map(row => ({
      ...row,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content
    }));
  } catch (error) {
    console.error('❌ Get all memories error:', error.message);
    throw error;
  }
}

/**
 * Search memories by keyword
 */
export async function searchMemories(userId, keyword) {
  try {
    const result = await query(
      `SELECT * FROM memories 
       WHERE user_id = $1 
       AND (
         key ILIKE $2 
         OR category ILIKE $2 
         OR content::text ILIKE $2
       )
       ORDER BY importance_score DESC, updated_at DESC`,
      [userId, `%${keyword}%`]
    );

    return result.rows.map(row => ({
      ...row,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content
    }));
  } catch (error) {
    console.error('❌ Search memories error:', error.message);
    throw error;
  }
}

/**
 * Get memory statistics
 */
export async function getMemoryStats(userId) {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type = 'PROJECT_MEMORY') as projects,
        COUNT(*) FILTER (WHERE type = 'DECISION_MEMORY') as decisions,
        COUNT(*) FILTER (WHERE type = 'USER_PREFERENCE') as preferences
       FROM memories 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];
    return {
      total: parseInt(stats.total),
      projects: parseInt(stats.projects),
      decisions: parseInt(stats.decisions),
      preferences: parseInt(stats.preferences)
    };
  } catch (error) {
    console.error('❌ Get memory stats error:', error.message);
    throw error;
  }
}

export default {
  MEMORY_TYPES,
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
  getMemoryByType,
  getAllMemories,
  searchMemories,
  getMemoryStats
};
