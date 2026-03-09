/**
 * Retrieval Service - Vector-based semantic search
 * Uses Voyage AI embeddings for intelligent context retrieval
 */

import { generateQueryEmbedding, isVoyageAvailable } from '../utils/voyageClient.js';
import { query } from '../config/database.js';
import {
  getPendingTasks,
  getInProgressTasks,
  getUpcomingDeadlines,
  getOverdueTasks,
  getHighPriorityTasks
} from './taskService.js';

/**
 * Get relevant context using vector similarity search
 * This is the HYBRID approach: Vector search + LLM generation
 */
export async function getRelevantContext(userInput, options = {}) {
  const {
    userId = 'default',
    includeProjects = true,
    includeDecisions = true,
    includeTasks = true,
    includePreferences = true,
    maxProjects = 3,
    maxDecisions = 3,
    maxTasks = 5,
    maxPreferences = 3,
    useVectorSearch = true // NEW: Enable vector search by default
  } = options;

  const context = {
    projects: [],
    decisions: [],
    tasks: [],
    preferences: [],
    taskSummary: {},
    relevanceFound: false,
    searchMethod: 'keyword' // Track which method was used
  };

  try {
    // ==================== VECTOR SEARCH (NEW!) ====================
    if (useVectorSearch && isVoyageAvailable()) {
      console.log('🔍 [RETRIEVAL] Using vector similarity search');
      context.searchMethod = 'vector';

      // Generate query embedding
      const queryEmbedding = await generateQueryEmbedding(userInput);

      if (queryEmbedding) {
        // Convert embedding to PostgreSQL vector format
        const embeddingStr = `[${queryEmbedding.join(',')}]`;

        // ==================== RETRIEVE PROJECTS (VECTOR) ====================
        if (includeProjects) {
          try {
            const projectResults = await query(`
              SELECT 
                id, user_id, key, content, category, importance_score,
                created_at, updated_at,
                (embedding <=> $1::vector) as distance
              FROM memories
              WHERE user_id = $2 
                AND type = 'PROJECT_MEMORY'
                AND embedding IS NOT NULL
              ORDER BY distance ASC
              LIMIT $3
            `, [embeddingStr, userId, maxProjects]);

            context.projects = projectResults.rows.map(row => ({
              id: row.id,
              name: row.content?.name || row.key,
              ...row.content, // Spread JSONB content
              relevance_score: (1 - row.distance).toFixed(4),
              category: row.category,
              created_at: row.created_at
            }));

            console.log(`   ✅ Found ${context.projects.length} relevant projects (vector)`);
          } catch (error) {
            console.error('❌ Vector search error (projects):', error.message);
          }
        }

        // ==================== RETRIEVE DECISIONS (VECTOR) ====================
        if (includeDecisions) {
          try {
            const decisionResults = await query(`
              SELECT 
                id, user_id, key, content, category, importance_score,
                created_at, updated_at,
                (embedding <=> $1::vector) as distance
              FROM memories
              WHERE user_id = $2 
                AND type = 'DECISION_MEMORY'
                AND embedding IS NOT NULL
              ORDER BY distance ASC
              LIMIT $3
            `, [embeddingStr, userId, maxDecisions]);

            context.decisions = decisionResults.rows.map(row => ({
              id: row.id,
              decision: row.content?.decision || row.key,
              ...row.content, // Spread JSONB content
              relevance_score: (1 - row.distance).toFixed(4),
              category: row.category,
              created_at: row.created_at
            }));

            console.log(`   ✅ Found ${context.decisions.length} relevant decisions (vector)`);
          } catch (error) {
            console.error('❌ Vector search error (decisions):', error.message);
          }
        }

        // ==================== RETRIEVE PREFERENCES (VECTOR) ====================
        if (includePreferences) {
          try {
            const preferenceResults = await query(`
              SELECT 
                id, user_id, key, content, category, importance_score,
                created_at, updated_at,
                (embedding <=> $1::vector) as distance
              FROM memories
              WHERE user_id = $2 
                AND type = 'USER_PREFERENCE'
                AND embedding IS NOT NULL
              ORDER BY distance ASC
              LIMIT $3
            `, [embeddingStr, userId, maxPreferences]);

            context.preferences = preferenceResults.rows.map(row => ({
              id: row.id,
              type: row.content?.type || row.key,
              ...row.content, // Spread JSONB content
              relevance_score: (1 - row.distance).toFixed(4),
              category: row.category,
              created_at: row.created_at
            }));

            console.log(`   ✅ Found ${context.preferences.length} relevant preferences (vector)`);
          } catch (error) {
            console.error('❌ Vector search error (preferences):', error.message);
          }
        }

        // ==================== RETRIEVE TASKS (VECTOR) ====================
        if (includeTasks) {
          try {
            const taskResults = await query(`
              SELECT 
                id, user_id, title, description, status, priority,
                category, subcategory, deadline, created_at,
                (embedding <=> $1::vector) as distance
              FROM tasks
              WHERE user_id = $2
                AND status IN ('pending', 'in_progress')
                AND embedding IS NOT NULL
              ORDER BY 
                distance ASC,
                CASE priority 
                  WHEN 'high' THEN 1 
                  WHEN 'medium' THEN 2 
                  WHEN 'low' THEN 3 
                END
              LIMIT $3
            `, [embeddingStr, userId, maxTasks]);

            context.tasks = taskResults.rows.map(row => ({
              ...row,
              relevance_score: (1 - row.distance).toFixed(4)
            }));

            console.log(`   ✅ Found ${context.tasks.length} relevant tasks (vector)`);
          } catch (error) {
            console.error('❌ Vector search error (tasks):', error.message);
          }
        }

        // Check if we found anything relevant
        context.relevanceFound = 
          context.projects.length > 0 ||
          context.decisions.length > 0 ||
          context.tasks.length > 0 ||
          context.preferences.length > 0;

        if (context.relevanceFound) {
          console.log('✅ [RETRIEVAL] Vector search found relevant context');
          return context;
        }
      }
    }

    // ==================== FALLBACK: KEYWORD SEARCH ====================
    console.log('🔍 [RETRIEVAL] Vector search not available, using keyword fallback');
    context.searchMethod = 'keyword';

    // Get all memories and filter by keyword matching
    if (includeProjects) {
      const allProjects = await query(`
        SELECT * FROM memories 
        WHERE user_id = $1 AND type = 'PROJECT_MEMORY'
        ORDER BY created_at DESC
      `, [userId]);

      context.projects = allProjects.rows
        .map(p => {
          const contentStr = JSON.stringify(p.content);
          return {
            id: p.id,
            name: p.content?.name || p.key,
            ...p.content,
            category: p.category,
            created_at: p.created_at,
            _relevance: calculateRelevanceScore(contentStr, userInput)
          };
        })
        .filter(p => p._relevance > 0)
        .sort((a, b) => b._relevance - a._relevance)
        .slice(0, maxProjects);
    }

    if (includeDecisions) {
      const allDecisions = await query(`
        SELECT * FROM memories 
        WHERE user_id = $1 AND type = 'DECISION_MEMORY'
        ORDER BY created_at DESC
      `, [userId]);

      context.decisions = allDecisions.rows
        .map(d => {
          const contentStr = JSON.stringify(d.content);
          return {
            id: d.id,
            decision: d.content?.decision || d.key,
            ...d.content,
            category: d.category,
            created_at: d.created_at,
            _relevance: calculateRelevanceScore(contentStr, userInput)
          };
        })
        .filter(d => d._relevance > 0)
        .sort((a, b) => b._relevance - a._relevance)
        .slice(0, maxDecisions);
    }

    if (includePreferences) {
      const allPreferences = await query(`
        SELECT * FROM memories 
        WHERE user_id = $1 AND type = 'USER_PREFERENCE'
        ORDER BY created_at DESC
      `, [userId]);

      context.preferences = allPreferences.rows
        .map(p => {
          const contentStr = JSON.stringify(p.content);
          return {
            id: p.id,
            type: p.content?.type || p.key,
            ...p.content,
            category: p.category,
            created_at: p.created_at,
            _relevance: calculateRelevanceScore(contentStr, userInput)
          };
        })
        .filter(p => p._relevance > 0)
        .sort((a, b) => b._relevance - a._relevance)
        .slice(0, maxPreferences);
    }

    // ==================== TASK SUMMARY (ALWAYS INCLUDED) ====================
    if (includeTasks) {
      const [pending, inProgress, overdue, highPriority] = await Promise.all([
        getPendingTasks(userId),
        getInProgressTasks(userId),
        getOverdueTasks(userId),
        getHighPriorityTasks(userId)
      ]);

      context.taskSummary = {
        pending: pending.length,
        inProgress: inProgress.length,
        overdue: overdue.length,
        highPriority: highPriority.length
      };

      // Include most relevant tasks
      context.tasks = [...highPriority, ...inProgress, ...overdue, ...pending]
        .slice(0, maxTasks);
    }

    context.relevanceFound = 
      context.projects.length > 0 ||
      context.decisions.length > 0 ||
      context.tasks.length > 0 ||
      context.preferences.length > 0;

    return context;

  } catch (error) {
    console.error('❌ [RETRIEVAL] Context retrieval error:', error);
    return context;
  }
}

/**
 * Keyword-based relevance scoring (fallback)
 */
function calculateRelevanceScore(text, query) {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  const keywords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  let score = 0;
  keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      score += 1;
    }
  });
  
  if (textLower.includes(queryLower)) {
    score += 3;
  }
  
  return score;
}

/**
 * Format context for LLM prompt
 */
export function formatContextForPrompt(context) {
  let contextText = '';

  if (context.projects && context.projects.length > 0) {
    contextText += '\n## Current Projects:\n';
    context.projects.forEach(project => {
      contextText += `- ${project.project_name} (${project.status}, ${project.priority}): ${project.description}\n`;
      if (project.relevance_score) {
        contextText += `  Relevance: ${(project.relevance_score * 100).toFixed(0)}%\n`;
      }
    });
  }

  if (context.decisions && context.decisions.length > 0) {
    contextText += '\n## Recent Decisions:\n';
    context.decisions.forEach(decision => {
      contextText += `- ${decision.decision}\n`;
      if (decision.context) contextText += `  Context: ${decision.context}\n`;
      if (decision.relevance_score) {
        contextText += `  Relevance: ${(decision.relevance_score * 100).toFixed(0)}%\n`;
      }
    });
  }

  if (context.tasks && context.tasks.length > 0) {
    contextText += '\n## Active Tasks:\n';
    context.tasks.forEach(task => {
      contextText += `- [${task.status}] ${task.title} (${task.priority})`;
      if (task.deadline) contextText += ` - Due: ${task.deadline}`;
      if (task.relevance_score) {
        contextText += ` | Relevance: ${(task.relevance_score * 100).toFixed(0)}%`;
      }
      contextText += '\n';
    });
  }

  if (context.preferences && context.preferences.length > 0) {
    contextText += '\n## User Preferences:\n';
    context.preferences.forEach(pref => {
      contextText += `- ${pref.preference_type}: ${pref.preference_value}\n`;
    });
  }

  if (context.taskSummary) {
    contextText += '\n## Task Summary:\n';
    contextText += `- Pending: ${context.taskSummary.pending}\n`;
    contextText += `- In Progress: ${context.taskSummary.inProgress}\n`;
    contextText += `- Overdue: ${context.taskSummary.overdue}\n`;
    contextText += `- High Priority: ${context.taskSummary.highPriority}\n`;
  }

  return contextText;
}

/**
 * Get daily summary context (for coordinator)
 */
export async function getDailySummaryContext(userId) {
  return await getRelevantContext('daily summary overview tasks projects', {
    userId,
    includeProjects: true,
    includeDecisions: true,
    includeTasks: true,
    includePreferences: true,
    maxProjects: 5,
    maxDecisions: 5,
    maxTasks: 10,
    maxPreferences: 5,
    useVectorSearch: true
  });
}

export default {
  getRelevantContext,
  formatContextForPrompt,
  getDailySummaryContext
};
