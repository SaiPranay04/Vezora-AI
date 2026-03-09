/**
 * Memory Service - Structured memory storage for Vezora AI
 * Stores PROJECT_MEMORY, DECISION_MEMORY, and USER_PREFERENCE
 * Does NOT store full conversations, only structured summaries
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = process.env.DATA_DIR || './data';
const MEMORY_DB_FILE = path.join(DATA_DIR, 'structured-memory.json');

// Memory types
export const MEMORY_TYPES = {
  PROJECT: 'PROJECT_MEMORY',
  DECISION: 'DECISION_MEMORY',
  PREFERENCE: 'USER_PREFERENCE'
};

// In-memory cache
let memoryDatabase = {
  projects: [],
  decisions: [],
  preferences: []
};

/**
 * Load memory database from file
 */
async function loadMemoryDB() {
  try {
    const data = await fs.readFile(MEMORY_DB_FILE, 'utf8');
    memoryDatabase = JSON.parse(data);
    console.log('✅ Memory database loaded');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Initialize empty database
      memoryDatabase = {
        projects: [],
        decisions: [],
        preferences: []
      };
      await saveMemoryDB();
      console.log('✅ Memory database initialized');
    } else {
      console.error('❌ Failed to load memory database:', error);
    }
  }
}

/**
 * Save memory database to file
 */
async function saveMemoryDB() {
  try {
    await fs.writeFile(
      MEMORY_DB_FILE,
      JSON.stringify(memoryDatabase, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('❌ Failed to save memory database:', error);
    throw error;
  }
}

// ==================== PROJECT MEMORY ====================

/**
 * Add or update project memory
 */
export async function addProject(projectData) {
  const project = {
    id: projectData.id || uuidv4(),
    project_name: projectData.project_name,
    description: projectData.description,
    status: projectData.status || 'active', // active, paused, completed
    priority: projectData.priority || 'medium', // low, medium, high
    last_updated: new Date().toISOString(),
    created_at: projectData.created_at || new Date().toISOString()
  };

  // Check if project already exists
  const existingIndex = memoryDatabase.projects.findIndex(
    p => p.project_name.toLowerCase() === project.project_name.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Update existing
    memoryDatabase.projects[existingIndex] = {
      ...memoryDatabase.projects[existingIndex],
      ...project
    };
  } else {
    // Add new
    memoryDatabase.projects.push(project);
  }

  await saveMemoryDB();
  return project;
}

/**
 * Get all projects (optionally filtered by status)
 */
export async function getProjects(status = null) {
  if (status) {
    return memoryDatabase.projects.filter(p => p.status === status);
  }
  return memoryDatabase.projects;
}

/**
 * Get project by name or ID
 */
export async function getProject(identifier) {
  return memoryDatabase.projects.find(
    p => p.id === identifier || 
         p.project_name.toLowerCase() === identifier.toLowerCase()
  );
}

/**
 * Update project status
 */
export async function updateProjectStatus(projectId, status) {
  const project = memoryDatabase.projects.find(p => p.id === projectId);
  if (project) {
    project.status = status;
    project.last_updated = new Date().toISOString();
    await saveMemoryDB();
    return project;
  }
  return null;
}

/**
 * Delete project
 */
export async function deleteProject(projectId) {
  const initialLength = memoryDatabase.projects.length;
  memoryDatabase.projects = memoryDatabase.projects.filter(p => p.id !== projectId);
  
  if (memoryDatabase.projects.length < initialLength) {
    await saveMemoryDB();
    return true;
  }
  return false;
}

// ==================== DECISION MEMORY ====================

/**
 * Add decision memory
 */
export async function addDecision(decisionData) {
  const decision = {
    id: decisionData.id || uuidv4(),
    decision_text: decisionData.decision_text,
    related_project: decisionData.related_project || null,
    timestamp: new Date().toISOString(),
    importance_score: decisionData.importance_score || 5, // 1-10 scale
    context: decisionData.context || ''
  };

  memoryDatabase.decisions.push(decision);

  // Keep only last 50 decisions to avoid bloat
  if (memoryDatabase.decisions.length > 50) {
    memoryDatabase.decisions = memoryDatabase.decisions.slice(-50);
  }

  await saveMemoryDB();
  return decision;
}

/**
 * Get decisions (optionally by project or importance threshold)
 */
export async function getDecisions(options = {}) {
  let decisions = memoryDatabase.decisions;

  if (options.project) {
    decisions = decisions.filter(d => d.related_project === options.project);
  }

  if (options.minImportance) {
    decisions = decisions.filter(d => d.importance_score >= options.minImportance);
  }

  // Sort by timestamp (most recent first)
  decisions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (options.limit) {
    decisions = decisions.slice(0, options.limit);
  }

  return decisions;
}

/**
 * Get recent important decisions (last 7 days, importance >= 7)
 */
export async function getRecentImportantDecisions() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return memoryDatabase.decisions.filter(d => {
    const decisionDate = new Date(d.timestamp);
    return decisionDate >= sevenDaysAgo && d.importance_score >= 7;
  });
}

// ==================== USER PREFERENCES ====================

/**
 * Add or update user preference
 */
export async function addPreference(preferenceData) {
  const preference = {
    id: preferenceData.id || uuidv4(),
    preference: preferenceData.preference,
    category: preferenceData.category || 'general', // general, workflow, communication, etc.
    confidence: preferenceData.confidence || 0.8, // 0-1 confidence score
    last_updated: new Date().toISOString(),
    created_at: preferenceData.created_at || new Date().toISOString()
  };

  // Check if similar preference exists
  const existingIndex = memoryDatabase.preferences.findIndex(
    p => p.category === preference.category && 
         p.preference.toLowerCase().includes(preference.preference.toLowerCase().slice(0, 20))
  );

  if (existingIndex >= 0) {
    // Update existing
    memoryDatabase.preferences[existingIndex] = {
      ...memoryDatabase.preferences[existingIndex],
      ...preference
    };
  } else {
    // Add new
    memoryDatabase.preferences.push(preference);
  }

  await saveMemoryDB();
  return preference;
}

/**
 * Get preferences by category
 */
export async function getPreferences(category = null) {
  if (category) {
    return memoryDatabase.preferences.filter(p => p.category === category);
  }
  return memoryDatabase.preferences;
}

/**
 * Delete preference
 */
export async function deletePreference(preferenceId) {
  const initialLength = memoryDatabase.preferences.length;
  memoryDatabase.preferences = memoryDatabase.preferences.filter(p => p.id !== preferenceId);
  
  if (memoryDatabase.preferences.length < initialLength) {
    await saveMemoryDB();
    return true;
  }
  return false;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get memory statistics
 */
export async function getMemoryStats() {
  return {
    total_projects: memoryDatabase.projects.length,
    active_projects: memoryDatabase.projects.filter(p => p.status === 'active').length,
    total_decisions: memoryDatabase.decisions.length,
    total_preferences: memoryDatabase.preferences.length,
    high_priority_projects: memoryDatabase.projects.filter(p => p.priority === 'high').length
  };
}

/**
 * Clear all memory (use with caution)
 */
export async function clearAllMemory() {
  memoryDatabase = {
    projects: [],
    decisions: [],
    preferences: []
  };
  await saveMemoryDB();
}

// Initialize on module load
loadMemoryDB();
