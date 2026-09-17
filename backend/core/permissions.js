import { randomUUID, createHash } from 'node:crypto';
export const RISKY_TOOLS = new Set(['todo.delete','file.write','file.open','memory.forget','app.open','settings.update']);
export const isRiskyTool = name => RISKY_TOOLS.has(name);
export const isDeniedCommand = () => true; // General shell execution is never supported.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k,canonical(value[k])]));
  return value;
}
const hash = args => createHash('sha256').update(JSON.stringify(canonical(args))).digest('hex');
export function createConfirmationStore({ now = Date.now, ttl = 300000 } = {}) {
  const pending = new Map();
  const prune = () => { for (const [id, entry] of pending) if (entry.expiresAt <= now()) pending.delete(id); };
  return {
    create({ toolName, args, preview, userId, sessionId }) {
      prune();
      if (!userId || !sessionId) throw new Error('Authenticated session required');
      if (pending.size >= 256) throw new Error('Too many pending confirmations');
      const pendingId = randomUUID();
      const entry = { toolName, args: structuredClone(args), hash: hash(args), preview, userId, sessionId, expiresAt: now() + ttl };
      pending.set(pendingId, entry);
      return { pendingId, expiresAt: entry.expiresAt };
    },
    get(id, owner) {
      prune(); const e = pending.get(id);
      return e && e.userId === owner.userId && e.sessionId === owner.sessionId ? structuredClone(e) : null;
    },
    consume(id, toolName, args, owner) {
      const e = this.get(id, owner);
      if (!e || e.toolName !== toolName || e.hash !== hash(args)) return false;
      pending.delete(id); // Synchronous consumption before any handler await prevents concurrent replay.
      return true;
    },
    cancel(id, owner) { if (!this.get(id, owner)) return false; return pending.delete(id); }
  };
}
export const confirmations = createConfirmationStore();
export function checkPermission(toolName, args, options = {}) {
  const { userId, sessionId, confirmed = false, pendingId, risky = isRiskyTool(toolName), preview } = options;
  const owner = { userId, sessionId };
  if (!userId || !sessionId || toolName === 'shell.run') return { allowed: false, denied: true, reason: 'Unauthorized operation' };
  if (confirmed) return confirmations.consume(pendingId, toolName, args, owner)
    ? { allowed: true } : { allowed: false, denied: true, reason: 'Invalid, expired, modified or already used confirmation' };
  if (!risky) return { allowed: true };
  return { allowed: false, requiresConfirmation: true, preview, ...confirmations.create({ toolName, args, preview, ...owner }) };
}
