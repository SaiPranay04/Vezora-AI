import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../utils/database.js';

// Memory types
export const MEMORY_TYPES = {
  PROJECT: 'PROJECT_MEMORY',
  DECISION: 'DECISION_MEMORY',
  PREFERENCE: 'USER_PREFERENCE'
};

// ==================== GENERIC MEMORY OPERATIONS ====================

export async function addMemory(userId, type, key, content, category = null, importance = 5) {
  const db = getDatabase();
  const id = uuidv4();
  
  // Generate embedding for semantic search
  const { generateEmbedding } = await import('../utils/voyageClient.js');
  const textToEmbed = typeof content === 'string' ? content : JSON.stringify(content);
  const embeddingArray = await generateEmbedding(textToEmbed);
  const embeddingStr = embeddingArray ? JSON.stringify(embeddingArray) : null;
  
  // Upsert pattern (SQLite REPLACE INTO)
  // Check if exists
  const existing = db.prepare('SELECT id FROM memory WHERE user_id = ? AND type = ? AND content LIKE ?').get(userId, type, `%"name":"${key}"%`);
  
  if (existing) {
    db.prepare(`
      UPDATE memory SET 
      content = ?, category = ?, importance_score = ?, updated_at = ?, embedding = ?
      WHERE id = ?
    `).run(JSON.stringify(content), category, importance, new Date().toISOString(), embeddingStr, existing.id);
    return { id: existing.id, key, content, category, importance };
  } else {
    db.prepare(`
      INSERT INTO memory (id, user_id, content, type, category, importance_score, metadata, embedding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, JSON.stringify(content), type, category, importance, 
      JSON.stringify({ key }), embeddingStr, new Date().toISOString(), new Date().toISOString()
    );
    return { id, key, content, category, importance };
  }
}

export async function getMemory(userId, type, key) {
  const db = getDatabase();
  const memory = db.prepare(`SELECT * FROM memory WHERE user_id = ? AND type = ? AND metadata LIKE ?`).get(userId, type, `%"key":"${key}"%`);
  if (memory) {
    memory.content = JSON.parse(memory.content);
    return memory;
  }
  return null;
}

export async function getMemoriesByType(userId, type) {
  const db = getDatabase();
  const records = db.prepare(`SELECT * FROM memory WHERE user_id = ? AND type = ? ORDER BY importance_score DESC, updated_at DESC`).all(userId, type);
  return records.map(r => ({ ...r, content: JSON.parse(r.content) }));
}

export async function deleteMemory(userId, type, key) {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM memory WHERE user_id = ? AND type = ? AND metadata LIKE ?`).run(userId, type, `%"key":"${key}"%`);
  return result.changes > 0;
}

// ==================== HELPER FUNCTIONS FOR SPECIFIC MEMORY TYPES ====================

export async function addProject(userId, key, content, category = 'general') {
  return await addMemory(userId, MEMORY_TYPES.PROJECT, key, content, category, 7);
}

export async function addDecision(userId, key, content, category = 'general') {
  return await addMemory(userId, MEMORY_TYPES.DECISION, key, content, category, 8);
}

export async function addPreference(userId, key, content, category = 'general') {
  return await addMemory(userId, MEMORY_TYPES.PREFERENCE, key, content, category, 6);
}

export async function getProjects(userId) {
  return await getMemoriesByType(userId, MEMORY_TYPES.PROJECT);
}

export async function getDecisions(userId) {
  return await getMemoriesByType(userId, MEMORY_TYPES.DECISION);
}

export async function getPreferences(userId) {
  return await getMemoriesByType(userId, MEMORY_TYPES.PREFERENCE);
}

export async function getMemoryByType(userId, type, key = null) {
  if (key) {
    return await getMemory(userId, type, key);
  }
  return await getMemoriesByType(userId, type);
}

export async function getAllMemories(userId) {
  const db = getDatabase();
  const records = db.prepare(`SELECT * FROM memory WHERE user_id = ? ORDER BY type, importance_score DESC, updated_at DESC`).all(userId);
  return records.map(r => ({ ...r, content: JSON.parse(r.content) }));
}

export async function searchMemories(userId, keyword) {
  const db = getDatabase();
  const records = db.prepare(`
    SELECT * FROM memory 
    WHERE user_id = ? 
    AND (
      category LIKE ? OR 
      content LIKE ? OR
      metadata LIKE ?
    )
    ORDER BY importance_score DESC, updated_at DESC
  `).all(userId, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  return records.map(r => ({ ...r, content: JSON.parse(r.content) }));
}

export async function getMemoryStats(userId) {
  const db = getDatabase();
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN type = 'PROJECT_MEMORY' THEN 1 ELSE 0 END) as projects,
      SUM(CASE WHEN type = 'DECISION_MEMORY' THEN 1 ELSE 0 END) as decisions,
      SUM(CASE WHEN type = 'USER_PREFERENCE' THEN 1 ELSE 0 END) as preferences
    FROM memory 
    WHERE user_id = ?
  `).get(userId);

  return {
    total: stats.total || 0,
    projects: stats.projects || 0,
    decisions: stats.decisions || 0,
    preferences: stats.preferences || 0
  };
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
