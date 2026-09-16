/**
 * Safety / Permission Layer (Fable Phase 3)
 * Gates risky tools and blocks destructive shell patterns.
 */

import { randomUUID } from 'crypto';

/** Tools that require explicit user confirmation before running */
export const RISKY_TOOLS = new Set([
  'todo.delete',
  'file.write',
  'file.rename',
  'file.move',
  'file.delete',
  'app.open',
  'settings.update',
  'shell.run'
]);

/** Patterns that are never allowed, even if confirmed */
const DENY_PATTERNS = [
  /rm\s+-rf\s+[\/\\]/i,
  /del\s+\/[sf]/i,
  /format\s+[a-z]:/i,
  /reg\s+delete/i,
  /Remove-Item\s+-Recurse\s+-Force\s+[A-Z]:\\/i,
  /shutdown/i,
  /mkfs/i
];

/** In-memory pending confirmations (TTL 5 min) */
const pending = new Map();
const PENDING_TTL_MS = 5 * 60 * 1000;

export function isRiskyTool(name) {
  return RISKY_TOOLS.has(name);
}

export function isDeniedCommand(command = '') {
  return DENY_PATTERNS.some((re) => re.test(String(command)));
}

/**
 * Create a pending confirmation ticket.
 * @returns {{ pendingId: string, expiresAt: number }}
 */
export function createPendingConfirmation({ toolName, args, preview, userId }) {
  const pendingId = randomUUID();
  const expiresAt = Date.now() + PENDING_TTL_MS;
  pending.set(pendingId, { toolName, args, preview, userId, expiresAt });
  return { pendingId, expiresAt };
}

export function getPendingConfirmation(pendingId) {
  const entry = pending.get(pendingId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pending.delete(pendingId);
    return null;
  }
  return entry;
}

export function consumePendingConfirmation(pendingId) {
  const entry = getPendingConfirmation(pendingId);
  if (entry) pending.delete(pendingId);
  return entry;
}

export function cancelPendingConfirmation(pendingId) {
  return pending.delete(pendingId);
}

/**
 * Check whether a tool may run now.
 * @returns {{ allowed: boolean, requiresConfirmation?: boolean, denied?: boolean, reason?: string, pendingId?: string, preview?: string }}
 */
export function checkPermission(toolName, args = {}, options = {}) {
  const { confirmed = false, pendingId = null, userId = null, preview } = options;

  if (toolName === 'shell.run' && isDeniedCommand(args.command)) {
    return {
      allowed: false,
      denied: true,
      reason: 'This command is on the deny-list and cannot be executed.'
    };
  }

  if (!isRiskyTool(toolName)) {
    return { allowed: true };
  }

  if (confirmed && pendingId) {
    const entry = getPendingConfirmation(pendingId);
    if (!entry) {
      return { allowed: false, reason: 'Confirmation expired or invalid. Please try again.' };
    }
    if (userId && entry.userId && entry.userId !== userId) {
      return { allowed: false, reason: 'Confirmation does not belong to this user.' };
    }
    if (entry.toolName !== toolName) {
      return { allowed: false, reason: 'Confirmation tool mismatch.' };
    }
    return { allowed: true };
  }

  const builtPreview =
    preview ||
    `${toolName}(${Object.entries(args)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(', ')})`;

  const ticket = createPendingConfirmation({
    toolName,
    args,
    preview: builtPreview,
    userId
  });

  return {
    allowed: false,
    requiresConfirmation: true,
    pendingId: ticket.pendingId,
    preview: builtPreview,
    expiresAt: ticket.expiresAt
  };
}
