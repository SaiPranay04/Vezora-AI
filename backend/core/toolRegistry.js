/**
 * Tool Registry — declarative tool definitions (Fable Phase 3)
 */

import { z } from 'zod';
import {
  addTask,
  updateTask,
  deleteTask,
  getTasks,
  getTaskStats,
  completeTask
} from '../services/taskService.js';
import {
  addMemory,
  searchMemories,
  deleteMemory,
  getAllMemories
} from '../services/memoryService.js';
import { launchApplication } from '../controllers/appsController.js';
import { openFile, saveFile, readFile, listDirectory } from '../controllers/filesController.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { addLog } from '../controllers/logsController.js';

/**
 * @typedef {Object} ToolDef
 * @property {string} name
 * @property {string} description
 * @property {import('zod').ZodTypeAny} schema
 * @property {boolean} risky
 * @property {(args: any, ctx: { userId: string }) => Promise<any>} handler
 */

/** @type {Map<string, ToolDef>} */
const registry = new Map();

function register(def) {
  registry.set(def.name, def);
}

register({
  name: 'todo.add',
  description: 'Create a new task/todo item',
  risky: false,
  schema: z.object({
    title: z.string().min(1),
    notes: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    category: z.string().optional(),
    due_date: z.string().optional()
  }),
  handler: async (args, { userId }) => {
    const task = await addTask(userId, {
      title: args.title,
      description: args.notes || '',
      priority: args.priority || 'medium',
      category: args.category || 'general',
      deadline: args.due_date || null
    });
    await addLog({ userId, type: 'tool', action: 'todo.add', detail: args.title, status: 'ok' });
    return { ok: true, task };
  }
});

register({
  name: 'todo.update',
  description: 'Update an existing task by id (status, priority, title, etc.)',
  risky: false,
  schema: z.object({
    id: z.string().min(1),
    title: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'open', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    notes: z.string().optional()
  }),
  handler: async (args, { userId }) => {
    const statusMap = { open: 'pending', done: 'completed' };
    const updates = { ...args };
    delete updates.id;
    if (updates.status && statusMap[updates.status]) {
      updates.status = statusMap[updates.status];
    }
    if (updates.notes !== undefined) {
      updates.description = updates.notes;
      delete updates.notes;
    }
    const task = updates.status === 'completed'
      ? await completeTask(userId, args.id)
      : await updateTask(userId, args.id, updates);
    await addLog({ userId, type: 'tool', action: 'todo.update', detail: args.id, status: 'ok' });
    return { ok: true, task };
  }
});

register({
  name: 'todo.delete',
  description: 'Permanently delete a task by id',
  risky: true,
  schema: z.object({ id: z.string().min(1) }),
  handler: async (args, { userId }) => {
    await deleteTask(userId, args.id);
    await addLog({ userId, type: 'tool', action: 'todo.delete', detail: args.id, status: 'ok' });
    return { ok: true, deleted: args.id };
  }
});

register({
  name: 'todo.list',
  description: 'List tasks, optionally filtered; or get a daily summary',
  risky: false,
  schema: z.object({
    status: z.string().optional(),
    summary: z.boolean().optional()
  }),
  handler: async (args, { userId }) => {
    if (args.summary) {
      const stats = await getTaskStats(userId);
      return { ok: true, stats };
    }
    const tasks = await getTasks(userId, { status: args.status });
    return { ok: true, tasks };
  }
});

register({
  name: 'file.read',
  description: 'Read a text file within allowed directories',
  risky: false,
  schema: z.object({ path: z.string().min(1) }),
  handler: async (args, { userId }) => {
    const content = await readFile(args.path);
    await addLog({ userId, type: 'file', action: 'read', detail: args.path, status: 'ok' });
    const truncated = String(content).slice(0, 8000);
    return { ok: true, path: args.path, content: truncated, truncated: content.length > 8000 };
  }
});

register({
  name: 'file.search',
  description: 'List files in a directory (name listing)',
  risky: false,
  schema: z.object({ path: z.string().min(1) }),
  handler: async (args, { userId }) => {
    const entries = await listDirectory(args.path);
    await addLog({ userId, type: 'file', action: 'list', detail: args.path, status: 'ok' });
    return { ok: true, path: args.path, entries };
  }
});

register({
  name: 'file.write',
  description: 'Write content to a file (creates directories as needed)',
  risky: true,
  schema: z.object({
    path: z.string().min(1),
    content: z.string()
  }),
  handler: async (args, { userId }) => {
    const result = await saveFile(args.path, args.content);
    await addLog({ userId, type: 'file', action: 'write', detail: args.path, status: 'ok' });
    return { ok: true, ...result };
  }
});

register({
  name: 'file.open',
  description: 'Open a file with the OS default application',
  risky: true,
  schema: z.object({ path: z.string().min(1) }),
  handler: async (args, { userId }) => {
    const result = await openFile(args.path);
    await addLog({ userId, type: 'file', action: 'open', detail: args.path, status: 'ok' });
    return { ok: true, ...result };
  }
});

register({
  name: 'memory.add',
  description: 'Store a long-term memory / preference / fact',
  risky: false,
  schema: z.object({
    content: z.string().min(1),
    type: z.string().optional(),
    key: z.string().optional(),
    importance: z.number().min(1).max(10).optional()
  }),
  handler: async (args, { userId }) => {
    const key = args.key || `mem_${Date.now()}`;
    const type = args.type || 'USER_PREFERENCE';
    const memory = await addMemory(userId, type, key, args.content, null, args.importance || 5);
    await addLog({ userId, type: 'memory', action: 'add', detail: key, status: 'ok' });
    return { ok: true, memory };
  }
});

register({
  name: 'memory.search',
  description: 'Search stored memories by keyword',
  risky: false,
  schema: z.object({ query: z.string().min(1) }),
  handler: async (args, { userId }) => {
    const results = await searchMemories(userId, args.query);
    return { ok: true, results: results.slice(0, 20) };
  }
});

register({
  name: 'memory.forget',
  description: 'Delete a memory by type and key',
  risky: true,
  schema: z.object({
    type: z.string().min(1),
    key: z.string().min(1)
  }),
  handler: async (args, { userId }) => {
    await deleteMemory(userId, args.type, args.key);
    await addLog({ userId, type: 'memory', action: 'forget', detail: args.key, status: 'ok' });
    return { ok: true, forgotten: args };
  }
});

register({
  name: 'memory.list',
  description: 'List all memories for the user',
  risky: false,
  schema: z.object({}),
  handler: async (_args, { userId }) => {
    const memories = await getAllMemories(userId);
    return { ok: true, memories };
  }
});

register({
  name: 'app.open',
  description: 'Launch a desktop application (chrome, code, notepad, etc.)',
  risky: true,
  schema: z.object({ appName: z.string().min(1) }),
  handler: async (args, { userId }) => {
    const result = await launchApplication(args.appName);
    await addLog({ userId, type: 'app', action: 'open', detail: args.appName, status: result?.success ? 'ok' : 'error' });
    return result;
  }
});

register({
  name: 'settings.update',
  description: 'Update a user setting key/value',
  risky: true,
  schema: z.object({
    key: z.string().min(1),
    value: z.any()
  }),
  handler: async (args, { userId }) => {
    const current = await getSettings(userId);
    const next = { ...current, [args.key]: args.value };
    const saved = await updateSettings(userId, next);
    await addLog({ userId, type: 'settings', action: 'update', detail: args.key, status: 'ok' });
    return { ok: true, settings: saved };
  }
});

export function getTool(name) {
  return registry.get(name) || null;
}

export function listTools() {
  return Array.from(registry.values()).map(({ name, description, risky, schema }) => ({
    name,
    description,
    risky,
    parameters: schemaToJsonHint(schema)
  }));
}

export function getToolSchemasForPrompt() {
  return listTools()
    .map((t) => `- ${t.name}${t.risky ? ' [risky]' : ''}: ${t.description}`)
    .join('\n');
}

function schemaToJsonHint(schema) {
  try {
    // Zod doesn't expose JSON schema without zod-to-json-schema; keep a light hint
    return schema?._def?.shape ? Object.keys(schema._def.shape()).join(', ') : '';
  } catch {
    return '';
  }
}

export { registry };
