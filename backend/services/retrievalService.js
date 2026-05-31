/**
 * Retrieval Service - In-Memory Vector-based semantic search
 * Uses Voyage AI embeddings for intelligent context retrieval via JS Cosine Similarity fallback
 */

import { generateQueryEmbedding, isVoyageAvailable } from '../utils/voyageClient.js';
import { getDatabase } from '../utils/database.js';
import {
  getPendingTasks,
  getInProgressTasks,
  getUpcomingDeadlines,
  getOverdueTasks,
  getHighPriorityTasks
} from './taskService.js';

/**
 * High-performance pure-JS Cosine Similarity function
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get relevant context using in-memory vector similarity search
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
    useVectorSearch = true 
  } = options;

  const context = {
    projects: [],
    decisions: [],
    tasks: [],
    preferences: [],
    taskSummary: {},
    relevanceFound: false,
    searchMethod: 'keyword' 
  };

  try {
    const db = getDatabase();

    // ==================== VECTOR SEARCH (NEW NATIVE JS FALLBACK!) ====================
    if (useVectorSearch && isVoyageAvailable()) {
      console.log('🔍 [RETRIEVAL] Using Local JS vector similarity search');
      context.searchMethod = 'vector';

      const queryEmbedding = await generateQueryEmbedding(userInput);

      if (queryEmbedding) {
        
        // Helper to fetch and rank SQLite tables locally
        const fetchAndRank = (table, typeCondition, limit) => {
          let sql = `SELECT * FROM ${table} WHERE user_id = ? AND embedding IS NOT NULL`;
          const params = [userId];
          
          if (typeCondition) {
            sql += ` AND type = ?`;
            params.push(typeCondition);
          } else if (table === 'tasks') {
             sql += ` AND status IN ('pending', 'in_progress')`;
          }

          const records = db.prepare(sql).all(...params);

          // Calculate similarity
          const ranked = records.map(row => {
            const rowEmbedding = JSON.parse(row.embedding);
            const score = cosineSimilarity(queryEmbedding, rowEmbedding);
            return { ...row, relevance_score: score };
          });

          // Sort by highest similarity first and apply limit
          return ranked
            .sort((a, b) => b.relevance_score - a.relevance_score)
            .slice(0, limit);
        };

        // ==================== RETRIEVE PROJECTS ====================
        if (includeProjects) {
          const ranked = fetchAndRank('memory', 'PROJECT_MEMORY', maxProjects);
          context.projects = ranked.map(row => {
            const content = JSON.parse(row.content);
            return {
              id: row.id,
              name: content.name || JSON.parse(row.metadata).key,
              ...content,
              relevance_score: row.relevance_score.toFixed(4),
              category: row.category,
              created_at: row.created_at
            };
          });
        }

        // ==================== RETRIEVE DECISIONS ====================
        if (includeDecisions) {
          const ranked = fetchAndRank('memory', 'DECISION_MEMORY', maxDecisions);
          context.decisions = ranked.map(row => {
            const content = JSON.parse(row.content);
            return {
              id: row.id,
              decision: content.decision || JSON.parse(row.metadata).key,
              ...content,
              relevance_score: row.relevance_score.toFixed(4),
              category: row.category,
              created_at: row.created_at
            };
          });
        }

        // ==================== RETRIEVE PREFERENCES ====================
        if (includePreferences) {
          const ranked = fetchAndRank('memory', 'USER_PREFERENCE', maxPreferences);
          context.preferences = ranked.map(row => {
            const content = JSON.parse(row.content);
            return {
              id: row.id,
              type: content.type || JSON.parse(row.metadata).key,
              ...content,
              relevance_score: row.relevance_score.toFixed(4),
              category: row.category,
              created_at: row.created_at
            };
          });
        }

        // ==================== RETRIEVE TASKS ====================
        if (includeTasks) {
          const ranked = fetchAndRank('tasks', null, maxTasks);
          context.tasks = ranked.map(row => ({
            ...row,
            relevance_score: row.relevance_score.toFixed(4)
          }));
        }

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
      const allProjects = db.prepare(`SELECT * FROM memory WHERE user_id = ? AND type = 'PROJECT_MEMORY' ORDER BY created_at DESC`).all(userId);

      context.projects = allProjects
        .map(p => {
          const content = JSON.parse(p.content);
          return {
            id: p.id,
            name: content?.name || JSON.parse(p.metadata).key,
            ...content,
            category: p.category,
            created_at: p.created_at,
            _relevance: calculateRelevanceScore(p.content, userInput)
          };
        })
        .filter(p => p._relevance > 0)
        .sort((a, b) => b._relevance - a._relevance)
        .slice(0, maxProjects);
    }

    if (includeDecisions) {
      const allDecisions = db.prepare(`SELECT * FROM memory WHERE user_id = ? AND type = 'DECISION_MEMORY' ORDER BY created_at DESC`).all(userId);

      context.decisions = allDecisions
        .map(d => {
          const content = JSON.parse(d.content);
          return {
            id: d.id,
            decision: content?.decision || JSON.parse(d.metadata).key,
            ...content,
            category: d.category,
            created_at: d.created_at,
            _relevance: calculateRelevanceScore(d.content, userInput)
          };
        })
        .filter(d => d._relevance > 0)
        .sort((a, b) => b._relevance - a._relevance)
        .slice(0, maxDecisions);
    }

    if (includePreferences) {
      const allPreferences = db.prepare(`SELECT * FROM memory WHERE user_id = ? AND type = 'USER_PREFERENCE' ORDER BY created_at DESC`).all(userId);

      context.preferences = allPreferences
        .map(p => {
          const content = JSON.parse(p.content);
          return {
            id: p.id,
            type: content?.type || JSON.parse(p.metadata).key,
            ...content,
            category: p.category,
            created_at: p.created_at,
            _relevance: calculateRelevanceScore(p.content, userInput)
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
      contextText += `- ${project.name} (${project.status || 'Active'}, ${project.priority || 'Medium'}): ${project.description || ''}\n`;
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
      contextText += `- ${pref.type}: ${pref.value || pref.preference_value || ''}\n`;
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
