/**
 * Task Service (SQLite implementation) - Task management with vector embeddings mapped locally
 */

import { getDatabase } from '../utils/database.js';
import { generateEmbedding } from '../utils/voyageClient.js';
import { v4 as uuidv4 } from 'uuid';

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// ==================== CRUD OPERATIONS ====================

export async function addTask(userId, taskData) {
  const db = getDatabase();
  const id = uuidv4();
  
  const textToEmbed = `${taskData.title} ${taskData.description || ''}`.trim();
  const embedding = await generateEmbedding(textToEmbed);
  const embeddingStr = embedding ? JSON.stringify(embedding) : null;

  db.prepare(`
    INSERT INTO tasks (id, user_id, title, description, status, priority, category, subcategory, deadline, embedding, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, taskData.title, taskData.description || '', 
    taskData.status || TASK_STATUS.PENDING, taskData.priority || TASK_PRIORITY.MEDIUM,
    taskData.category || null, taskData.subcategory || null, taskData.deadline || null,
    embeddingStr, new Date().toISOString(), new Date().toISOString()
  );

  return await getTask(userId, id);
}

export async function getTask(userId, taskId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId) || null;
}

export async function getTasks(userId, filters = {}) {
  const db = getDatabase();
  let sql = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (filters.status) {
    sql += ` AND status = ?`;
    params.push(filters.status);
  }
  if (filters.priority) {
    sql += ` AND priority = ?`;
    params.push(filters.priority);
  }
  if (filters.category) {
    sql += ` AND category = ?`;
    params.push(filters.category);
  }

  sql += ` ORDER BY 
    CASE priority 
      WHEN 'high' THEN 3 
      WHEN 'medium' THEN 2 
      WHEN 'low' THEN 1 
    END DESC,
    deadline ASC,
    created_at DESC`;

  return db.prepare(sql).all(...params);
}

export async function updateTask(userId, taskId, updates) {
  const db = getDatabase();
  const allowedFields = ['title', 'description', 'status', 'priority', 'category', 'subcategory', 'deadline'];
  const fields = [];
  const values = [];

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (fields.length === 0) return null;

  if (updates.title || updates.description) {
    const currentTask = await getTask(userId, taskId);
    if (currentTask) {
      const newTitle = updates.title || currentTask.title;
      const newDescription = updates.description !== undefined ? updates.description : currentTask.description;
      const textToEmbed = `${newTitle} ${newDescription || ''}`.trim();
      
      const embedding = await generateEmbedding(textToEmbed);
      if (embedding) {
        fields.push(`embedding = ?`);
        values.push(JSON.stringify(embedding));
      }
    }
  }

  if (updates.status === TASK_STATUS.COMPLETED) {
    fields.push(`completed_at = ?`);
    values.push(new Date().toISOString());
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  values.push(taskId);
  values.push(userId);

  const result = db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  
  if (result.changes === 0) return null;
  return await getTask(userId, taskId);
}

export async function deleteTask(userId, taskId) {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, userId);
  return result.changes > 0;
}

// ==================== SPECIALIZED QUERIES ====================

export async function getPendingTasks(userId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY priority DESC, deadline ASC').all(userId, TASK_STATUS.PENDING);
}

export async function getInProgressTasks(userId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY priority DESC, deadline ASC').all(userId, TASK_STATUS.IN_PROGRESS);
}

export async function getCompletedTasks(userId, limit = null) {
  const db = getDatabase();
  let sql = 'SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY completed_at DESC';
  if (limit) sql += ` LIMIT ${parseInt(limit)}`;
  return db.prepare(sql).all(userId, TASK_STATUS.COMPLETED);
}

export async function getUpcomingDeadlines(userId, days = 3) {
  const db = getDatabase();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));
  const isoFuture = futureDate.toISOString();
  const isoNow = new Date().toISOString();

  return db.prepare(`
    SELECT * FROM tasks 
    WHERE user_id = ? 
    AND status != ? 
    AND deadline IS NOT NULL 
    AND deadline >= ? 
    AND deadline <= ?
    ORDER BY deadline ASC
  `).all(userId, TASK_STATUS.COMPLETED, isoNow, isoFuture);
}

export async function getOverdueTasks(userId) {
  const db = getDatabase();
  const isoNow = new Date().toISOString();
  return db.prepare(`
    SELECT * FROM tasks 
    WHERE user_id = ? 
    AND status != ? 
    AND deadline IS NOT NULL 
    AND deadline < ?
    ORDER BY deadline ASC
  `).all(userId, TASK_STATUS.COMPLETED, isoNow);
}

export async function getHighPriorityTasks(userId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM tasks WHERE user_id = ? AND priority = ? AND status != ? ORDER BY deadline ASC').all(userId, TASK_PRIORITY.HIGH, TASK_STATUS.COMPLETED);
}

// ==================== STATISTICS ====================

export async function getTaskStats(userId) {
  const db = getDatabase();
  const isoNow = new Date().toISOString();
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const isoFuture = futureDate.toISOString();

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
      SUM(CASE WHEN status != 'completed' AND deadline < ? THEN 1 ELSE 0 END) as overdue,
      SUM(CASE WHEN status != 'completed' AND deadline >= ? AND deadline <= ? THEN 1 ELSE 0 END) as upcoming
    FROM tasks 
    WHERE user_id = ?
  `).get(isoNow, isoNow, isoFuture, userId);

  return {
    total: stats.total || 0,
    pending: stats.pending || 0,
    in_progress: stats.in_progress || 0,
    completed: stats.completed || 0,
    high_priority: stats.high_priority || 0,
    overdue: stats.overdue || 0,
    upcoming: stats.upcoming || 0
  };
}

export async function completeTask(userId, taskId) {
  return await updateTask(userId, taskId, { status: TASK_STATUS.COMPLETED });
}

export async function startTask(userId, taskId) {
  return await updateTask(userId, taskId, { status: TASK_STATUS.IN_PROGRESS });
}
