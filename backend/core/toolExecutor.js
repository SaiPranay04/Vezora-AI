/**
 * Tool Executor — validate → permission → run → format (Fable Phase 3)
 */

import { getTool } from './toolRegistry.js';
import { checkPermission, confirmations } from './permissions.js';
import { identity } from '../security/identity.js';
import { config } from '../config.js';

/**
 * Execute a registered tool.
 * @param {string} toolName
 * @param {object} args
 * @param {object} options
 * @param {string} options.userId
 * @param {boolean} [options.confirmed]
 * @param {string} [options.pendingId]
 */
export async function executeTool(toolName, args = {}, options = {}) {
  let owner;
  try { owner = identity(); } catch { return { success: false, denied: true, error: 'Authentication required' }; }
  const { userId, sessionId } = owner;
  const { confirmed = false, pendingId = null } = options;
  const tool = getTool(toolName);

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`
    };
  }

  if ((toolName.startsWith('file.') && !config().files) || (toolName === 'app.open' && !config().apps)) return { success: false, denied: true, error: 'Feature disabled' };
  if (['file.write','file.open'].includes(toolName)) return { success: false, denied: true, error: 'File writes and OS file opening are disabled pending race-safe Windows handles' };
  if (typeof tool.risky !== 'boolean' || !tool.schema) return { success: false, denied: true, error: 'Incomplete tool policy' };
  // Validate args
  let parsed = args;
  try {
    if (tool.schema) {
      parsed = tool.schema.parse(args ?? {});
    }
  } catch (err) {
    return {
      success: false,
      error: `Invalid parameters for ${toolName}: ${err.message}`,
      malformed: true
    };
  }

  const preview = buildPreview(toolName, parsed);
  const permission = checkPermission(toolName, parsed, {
    confirmed,
    pendingId,
    userId,
    preview, sessionId, risky: tool.risky
  });

  if (permission.denied) {
    return {
      success: false,
      denied: true,
      error: permission.reason
    };
  }

  if (permission.requiresConfirmation) {
    return {
      success: false,
      requiresConfirmation: true,
      pendingId: permission.pendingId,
      toolName,
      args: parsed,
      preview: permission.preview,
      expiresAt: permission.expiresAt
    };
  }

  if (permission.allowed !== true) return { success: false, denied: true, error: permission.reason || 'Permission denied' };
  try {

    const result = await tool.handler(parsed, { userId });
    return {
      success: true,
      toolName,
      result,
      preview
    };
  } catch (err) {
    console.error(`❌ Tool ${toolName} failed:`, err.message);
    return {
      success: false,
      toolName,
      error: err.message,
      preview
    };
  }
}

/**
 * Confirm or cancel a pending risky tool.
 */
export async function confirmTool(pendingId, { approve }) {
  let owner;
  try { owner = identity(); } catch { return { success: false, denied: true, error: 'Authentication required' }; }
  if (typeof approve !== 'boolean') return { success: false, error: 'Explicit boolean approval required' };
  if (!approve) { const cancelled = confirmations.cancel(pendingId, owner); return { success: cancelled, cancelled }; }
  const entry = confirmations.get(pendingId, owner);
  if (!entry) return { success: false, denied: true, error: 'Confirmation invalid or expired' };
  return executeTool(entry.toolName, entry.args, { confirmed: true, pendingId });
}

function buildPreview(toolName, args) {
  const compact = Object.entries(args || {})
    .map(([k, v]) => {
      const val = typeof v === 'string' && v.length > 80 ? `${v.slice(0, 80)}…` : v;
      return `${k}=${JSON.stringify(val)}`;
    })
    .join(', ');
  return `${toolName}(${compact})`;
}

/**
 * Heuristic: map a natural-language user message to a tool call.
 * Used until full LLM function-calling is wired everywhere.
 */
export function inferToolCall(message = '') {
  const text = message.trim();
  const lower = text.toLowerCase();

  // Memory search
  if (/\b(search|find|look up)\b.*\bmemory\b/i.test(text) || /\bremember(ed)?\b.*\babout\b/i.test(lower)) {
    const q = text.replace(/.*(?:memory for|memory about|about)\s+/i, '').trim() || text;
    return { toolName: 'memory.search', args: { query: q } };
  }

  // Forget memory
  if (/\bforget\b/i.test(lower) && /\b(said|about|that)\b/i.test(lower)) {
    return null; // needs structured type/key — leave to LLM path
  }

  // Todo add
  if (/\b(add|create|new)\b.+\b(task|todo|reminder)\b/i.test(lower) || /\bremind me to\b/i.test(lower)) {
    let title = text
      .replace(/^(hey\s+)?(zara|vezora)[,!]?\s*/i, '')
      .replace(/^(please\s+)?(add|create|new)\s+(a\s+)?(task|todo|reminder)\s*(to|for|:)?\s*/i, '')
      .replace(/^remind me to\s+/i, '')
      .trim();
    if (title.length > 2) {
      return { toolName: 'todo.add', args: { title } };
    }
  }

  // Todo complete
  if (/\b(mark|set)\b.+\b(done|complete|completed)\b/i.test(lower)) {
    return null; // needs id
  }

  // App open
  if (/\b(open|launch|start)\b\s+(chrome|code|vscode|notepad|calculator|explorer|terminal)/i.test(lower)) {
    const match = lower.match(/\b(open|launch|start)\b\s+(chrome|code|vscode|notepad|calculator|explorer|terminal)/i);
    const appName = match[2] === 'vscode' ? 'code' : match[2];
    return { toolName: 'app.open', args: { appName } };
  }

  // File read
  if (/\b(read|open)\b.+\bfile\b/i.test(lower) || /\bread\s+["'].+["']/i.test(text)) {
    const pathMatch = text.match(/["']([^"']+)["']/);
    if (pathMatch) {
      const isOpen = /\bopen\b/i.test(lower) && !/\bread\b/i.test(lower);
      return {
        toolName: isOpen ? 'file.open' : 'file.read',
        args: { path: pathMatch[1] }
      };
    }
  }

  // What should I do today / task summary
  if (/\b(what should i do|tasks? (for )?today|daily summary|my tasks)\b/i.test(lower)) {
    return { toolName: 'todo.list', args: { summary: true } };
  }

  return null;
}
