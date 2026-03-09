/**
 * Task Service - Task and deadline management for Vezora AI
 * Manages tasks with status, priority, and deadlines
 * NOW WITH VECTOR EMBEDDINGS for semantic task search
 */

import { query } from '../config/database.js';
import { generateEmbedding } from '../utils/voyageClient.js';

// Task status and priority enums
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

/**
 * Add new task
 * @param {string} userId - User ID (required for multi-user)
 * @param {Object} taskData - Task data
 */
export async function addTask(userId, taskData) {
  try {
    // Generate embedding for semantic task search
    const textToEmbed = `${taskData.title} ${taskData.description || ''}`.trim();
    const embedding = await generateEmbedding(textToEmbed);
    const embeddingStr = embedding ? `[${embedding.join(',')}]` : null;

    const result = await query(
      `INSERT INTO tasks (user_id, title, description, status, priority, category, subcategory, deadline, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)
       RETURNING *`,
      [
        userId,
        taskData.title,
        taskData.description || '',
        taskData.status || TASK_STATUS.PENDING,
        taskData.priority || TASK_PRIORITY.MEDIUM,
        taskData.category || null,
        taskData.subcategory || null,
        taskData.deadline || null,
        embeddingStr
      ]
    );

    const task = result.rows[0];
    console.log(`✅ Task added: "${task.title}" [${task.priority}] for user ${userId} ${embedding ? '(with embedding)' : ''}`);
    return task;
  } catch (error) {
    console.error('❌ Add task error:', error.message);
    throw error;
  }
}

/**
 * Get task by ID
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 */
export async function getTask(userId, taskId) {
  try {
    const result = await query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Get task error:', error.message);
    throw error;
  }
}

/**
 * Get all tasks (with optional filters)
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters
 */
export async function getTasks(userId, filters = {}) {
  try {
    let sql = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    let paramCount = 2;

    // Filter by status
    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    // Filter by priority
    if (filters.priority) {
      sql += ` AND priority = $${paramCount}`;
      params.push(filters.priority);
      paramCount++;
    }

    // Filter by category
    if (filters.category) {
      sql += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    // Sort by priority (high > medium > low) then by deadline
    sql += ` ORDER BY 
      CASE priority 
        WHEN 'high' THEN 3 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 1 
      END DESC,
      deadline ASC NULLS LAST,
      created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Get tasks error:', error.message);
    throw error;
  }
}

/**
 * Update task
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 * @param {Object} updates - Fields to update
 */
export async function updateTask(userId, taskId, updates) {
  try {
    const allowedFields = ['title', 'description', 'status', 'priority', 'category', 'subcategory', 'deadline'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Regenerate embedding if title or description changed
    if (updates.title || updates.description) {
      // Get current task to build full text
      const currentTask = await getTask(userId, taskId);
      if (currentTask) {
        const newTitle = updates.title || currentTask.title;
        const newDescription = updates.description !== undefined ? updates.description : currentTask.description;
        const textToEmbed = `${newTitle} ${newDescription || ''}`.trim();
        
        const embedding = await generateEmbedding(textToEmbed);
        if (embedding) {
          const embeddingStr = `[${embedding.join(',')}]`;
          fields.push(`embedding = $${paramCount}::vector`);
          values.push(embeddingStr);
          paramCount++;
        }
      }
    }

    // Add completed_at if status is completed
    if (updates.status === TASK_STATUS.COMPLETED) {
      fields.push(`completed_at = NOW()`);
    }

    values.push(taskId);
    values.push(userId);

    const result = await query(
      `UPDATE tasks 
       SET ${fields.join(', ')}
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    console.log(`✅ Task updated: "${result.rows[0].title}"`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Update task error:', error.message);
    throw error;
  }
}

/**
 * Delete task
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 */
export async function deleteTask(userId, taskId) {
  try {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [taskId, userId]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Task deleted: ${taskId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Delete task error:', error.message);
    throw error;
  }
}

// ==================== SPECIALIZED QUERIES ====================

/**
 * Get pending tasks
 * @param {string} userId - User ID
 */
export async function getPendingTasks(userId) {
  try {
    const result = await query(
      'SELECT * FROM tasks WHERE user_id = $1 AND status = $2 ORDER BY priority DESC, deadline ASC',
      [userId, TASK_STATUS.PENDING]
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Get pending tasks error:', error.message);
    throw error;
  }
}

/**
 * Get in-progress tasks
 * @param {string} userId - User ID
 */
export async function getInProgressTasks(userId) {
  try {
    const result = await query(
      'SELECT * FROM tasks WHERE user_id = $1 AND status = $2 ORDER BY priority DESC, deadline ASC',
      [userId, TASK_STATUS.IN_PROGRESS]
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Get in-progress tasks error:', error.message);
    throw error;
  }
}

/**
 * Get completed tasks
 * @param {string} userId - User ID
 * @param {number} limit - Optional limit
 */
export async function getCompletedTasks(userId, limit = null) {
  try {
    let sql = 'SELECT * FROM tasks WHERE user_id = $1 AND status = $2 ORDER BY completed_at DESC';
    
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }

    const result = await query(sql, [userId, TASK_STATUS.COMPLETED]);
    return result.rows;
  } catch (error) {
    console.error('❌ Get completed tasks error:', error.message);
    throw error;
  }
}

/**
 * Get upcoming deadlines (next N days)
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look ahead
 */
export async function getUpcomingDeadlines(userId, days = 3) {
  try {
    const result = await query(
      `SELECT * FROM tasks 
       WHERE user_id = $1 
       AND status != $2 
       AND deadline IS NOT NULL 
       AND deadline >= NOW() 
       AND deadline <= NOW() + INTERVAL '${parseInt(days)} days'
       ORDER BY deadline ASC`,
      [userId, TASK_STATUS.COMPLETED]
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Get upcoming deadlines error:', error.message);
    throw error;
  }
}

/**
 * Get overdue tasks
 * @param {string} userId - User ID
 */
export async function getOverdueTasks(userId) {
  try {
    const result = await query(
      `SELECT * FROM tasks 
       WHERE user_id = $1 
       AND status != $2 
       AND deadline IS NOT NULL 
       AND deadline < NOW()
       ORDER BY deadline ASC`,
      [userId, TASK_STATUS.COMPLETED]
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Get overdue tasks error:', error.message);
    throw error;
  }
}

/**
 * Get high priority tasks
 * @param {string} userId - User ID
 */
export async function getHighPriorityTasks(userId) {
  try {
    const result = await query(
      'SELECT * FROM tasks WHERE user_id = $1 AND priority = $2 AND status != $3 ORDER BY deadline ASC',
      [userId, TASK_PRIORITY.HIGH, TASK_STATUS.COMPLETED]
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Get high priority tasks error:', error.message);
    throw error;
  }
}

// ==================== STATISTICS ====================

/**
 * Get task statistics
 * @param {string} userId - User ID
 */
export async function getTaskStats(userId) {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE status != 'completed' AND deadline < NOW()) as overdue,
        COUNT(*) FILTER (WHERE status != 'completed' AND deadline >= NOW() AND deadline <= NOW() + INTERVAL '7 days') as upcoming
       FROM tasks 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];
    return {
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      in_progress: parseInt(stats.in_progress),
      completed: parseInt(stats.completed),
      high_priority: parseInt(stats.high_priority),
      overdue: parseInt(stats.overdue),
      upcoming: parseInt(stats.upcoming)
    };
  } catch (error) {
    console.error('❌ Get task stats error:', error.message);
    throw error;
  }
}

/**
 * Complete task (helper function)
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 */
export async function completeTask(userId, taskId) {
  return await updateTask(userId, taskId, { status: TASK_STATUS.COMPLETED });
}

/**
 * Start task (helper function)
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 */
export async function startTask(userId, taskId) {
  return await updateTask(userId, taskId, { status: TASK_STATUS.IN_PROGRESS });
}
