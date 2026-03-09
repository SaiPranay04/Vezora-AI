/**
 * Retrieval Service - Context retrieval using embeddings
 * Retrieves relevant memories, tasks, and decisions before LLM call
 */

import {
  getProjects,
  getDecisions,
  getPreferences
} from './memoryService.pg.js';

import {
  getPendingTasks,
  getInProgressTasks,
  getUpcomingDeadlines,
  getOverdueTasks,
  getHighPriorityTasks
} from './taskService.js';

// Simple keyword-based matching for now
// Can be upgraded to vector embeddings later (using Ollama embeddings)
function calculateRelevanceScore(text, query) {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Split query into keywords
  const keywords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  let score = 0;
  
  keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      score += 1;
    }
  });
  
  // Bonus for exact phrase match
  if (textLower.includes(queryLower)) {
    score += 3;
  }
  
  return score;
}

/**
 * Get relevant context for user input
 * Returns structured context to be passed to LLM
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
    maxPreferences = 3
  } = options;

  const context = {
    projects: [],
    decisions: [],
    tasks: [],
    preferences: [],
    taskSummary: {},
    relevanceFound: false
  };

  try {
    // ==================== RETRIEVE PROJECTS ====================
    if (includeProjects) {
      const allProjects = await getProjects(userId);
      
      // Score and rank projects by relevance
      const scoredProjects = allProjects.map(project => ({
        ...project,
        _relevance: calculateRelevanceScore(
          `${project.project_name} ${project.description}`,
          userInput
        )
      }));

      // Sort by relevance and priority
      scoredProjects.sort((a, b) => {
        if (b._relevance !== a._relevance) {
          return b._relevance - a._relevance;
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Take top N relevant projects
      context.projects = scoredProjects
        .slice(0, maxProjects)
        .filter(p => p._relevance > 0)
        .map(({ _relevance, ...project }) => project);
      
      // If no relevant projects found, include high priority ones
      if (context.projects.length === 0) {
        context.projects = scoredProjects
          .filter(p => p.priority === 'high')
          .slice(0, 2)
          .map(({ _relevance, ...project }) => project);
      }
    }

    // ==================== RETRIEVE DECISIONS ====================
    if (includeDecisions) {
      // Get all decisions and filter by importance
      const allDecisions = await getDecisions(userId);
      const recentDecisions = allDecisions
        .filter(d => d.importance_score >= 7)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 10);
      
      // Score decisions by relevance
      const scoredDecisions = recentDecisions.map(decision => ({
        ...decision,
        _relevance: calculateRelevanceScore(
          `${decision.decision_text} ${decision.context || ''}`,
          userInput
        )
      }));

      scoredDecisions.sort((a, b) => {
        if (b._relevance !== a._relevance) {
          return b._relevance - a._relevance;
        }
        return b.importance_score - a.importance_score;
      });

      context.decisions = scoredDecisions
        .slice(0, maxDecisions)
        .filter(d => d._relevance > 0)
        .map(({ _relevance, ...decision }) => decision);
    }

    // ==================== RETRIEVE TASKS ====================
    if (includeTasks) {
      const [pending, inProgress, upcoming, overdue, highPriority] = await Promise.all([
        getPendingTasks(userId),
        getInProgressTasks(userId),
        getUpcomingDeadlines(userId, 3),
        getOverdueTasks(userId),
        getHighPriorityTasks(userId)
      ]);

      // Combine and deduplicate
      const allRelevantTasks = [...new Map(
        [...overdue, ...highPriority, ...inProgress, ...upcoming, ...pending]
          .map(task => [task.id, task])
      ).values()];

      // Score tasks by relevance
      const scoredTasks = allRelevantTasks.map(task => ({
        ...task,
        _relevance: calculateRelevanceScore(
          `${task.title} ${task.description}`,
          userInput
        )
      }));

      scoredTasks.sort((a, b) => {
        // Prioritize overdue and high priority
        if (overdue.some(t => t.id === a.id) && !overdue.some(t => t.id === b.id)) return -1;
        if (!overdue.some(t => t.id === a.id) && overdue.some(t => t.id === b.id)) return 1;
        
        if (b._relevance !== a._relevance) {
          return b._relevance - a._relevance;
        }
        
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      context.tasks = scoredTasks
        .slice(0, maxTasks)
        .map(({ _relevance, ...task }) => task);

      // Task summary
      context.taskSummary = {
        overdue: overdue.length,
        upcoming: upcoming.length,
        inProgress: inProgress.length,
        highPriority: highPriority.length,
        pending: pending.length
      };
    }

    // ==================== RETRIEVE PREFERENCES ====================
    if (includePreferences) {
      const allPreferences = await getPreferences(userId);
      
      // Score preferences by relevance
      const scoredPreferences = allPreferences.map(pref => ({
        ...pref,
        _relevance: calculateRelevanceScore(pref.preference, userInput)
      }));

      scoredPreferences.sort((a, b) => {
        if (b._relevance !== a._relevance) {
          return b._relevance - a._relevance;
        }
        return b.confidence - a.confidence;
      });

      context.preferences = scoredPreferences
        .slice(0, maxPreferences)
        .filter(p => p._relevance > 0)
        .map(({ _relevance, ...pref }) => pref);
    }

    // Mark if any relevant context was found
    context.relevanceFound = 
      context.projects.length > 0 ||
      context.decisions.length > 0 ||
      (context.tasks.length > 0 && context.tasks.some(t => t._relevance > 0)) ||
      context.preferences.length > 0;

  } catch (error) {
    console.error('❌ Context retrieval error:', error);
  }

  return context;
}

/**
 * Get daily summary context (all important items)
 */
export async function getDailySummaryContext(userId = 'default') {
  try {
    const allDecisions = await getDecisions(userId);
    const recentDecisions = allDecisions
      .filter(d => d.importance_score >= 7)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 10);
    
    const [
      activeProjects,
      pending,
      inProgress,
      upcoming,
      overdue,
      highPriority
    ] = await Promise.all([
      getProjects(userId),
      getPendingTasks(userId),
      getInProgressTasks(userId),
      getUpcomingDeadlines(userId, 3),
      getOverdueTasks(userId),
      getHighPriorityTasks(userId)
    ]);

    return {
      projects: activeProjects.slice(0, 5),
      decisions: recentDecisions.slice(0, 5),
      tasks: {
        overdue,
        upcoming,
        inProgress,
        highPriority: highPriority.slice(0, 5)
      },
      summary: {
        total_active_projects: activeProjects.length,
        total_overdue_tasks: overdue.length,
        total_upcoming_deadlines: upcoming.length,
        total_in_progress: inProgress.length,
        total_high_priority: highPriority.length
      }
    };
  } catch (error) {
    console.error('❌ Daily summary error:', error);
    return null;
  }
}

/**
 * Format context for LLM prompt
 */
export function formatContextForPrompt(context) {
  let contextText = '';

  // Projects
  if (context.projects && context.projects.length > 0) {
    contextText += '\n📁 ACTIVE PROJECTS:\n';
    context.projects.forEach(project => {
      contextText += `  - ${project.project_name} [${project.priority}]: ${project.description}\n`;
    });
  }

  // Important Decisions
  if (context.decisions && context.decisions.length > 0) {
    contextText += '\n💡 RECENT IMPORTANT DECISIONS:\n';
    context.decisions.forEach(decision => {
      contextText += `  - ${decision.decision_text}\n`;
    });
  }

  // Tasks
  if (context.tasks && context.tasks.length > 0) {
    contextText += '\n✅ RELEVANT TASKS:\n';
    context.tasks.forEach(task => {
      const deadlineInfo = task.deadline ? ` (Due: ${new Date(task.deadline).toLocaleDateString()})` : '';
      contextText += `  - [${task.status}] ${task.title}${deadlineInfo}\n`;
    });
  }

  // Task Summary
  if (context.taskSummary) {
    const summary = context.taskSummary;
    if (summary.overdue > 0 || summary.upcoming > 0 || summary.highPriority > 0) {
      contextText += '\n📊 TASK SUMMARY:\n';
      if (summary.overdue > 0) contextText += `  ⚠️ ${summary.overdue} overdue tasks\n`;
      if (summary.upcoming > 0) contextText += `  📅 ${summary.upcoming} upcoming deadlines (next 3 days)\n`;
      if (summary.highPriority > 0) contextText += `  🔴 ${summary.highPriority} high priority tasks\n`;
    }
  }

  // Preferences
  if (context.preferences && context.preferences.length > 0) {
    contextText += '\n⚙️ USER PREFERENCES:\n';
    context.preferences.forEach(pref => {
      contextText += `  - ${pref.preference}\n`;
    });
  }

  return contextText.trim();
}

export default {
  getRelevantContext,
  getDailySummaryContext,
  formatContextForPrompt
};
