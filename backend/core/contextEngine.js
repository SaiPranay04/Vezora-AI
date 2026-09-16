/**
 * Context Awareness Engine (Fable Phase 5)
 * Compacts frontend context into ~150 tokens of prompt text.
 */

const MAX_CHARS = 600; // ~150 tokens

/**
 * @param {object} context
 * @param {string} [context.page]
 * @param {string} [context.selectedFile]
 * @param {string} [context.activeTask]
 * @param {string} [context.conversationId]
 * @param {string} [context.selectedText]
 * @param {string[]} [context.recentActions]
 */
export function compactContext(context = {}) {
  if (!context || typeof context !== 'object') return '';

  const signals = [];

  if (context.page) signals.push(`page=${context.page}`);
  if (context.selectedFile) signals.push(`file=${context.selectedFile}`);
  if (context.activeTask) signals.push(`task=${context.activeTask}`);
  if (context.conversationId) signals.push(`chat=${context.conversationId}`);
  if (context.selectedText) {
    const snip = String(context.selectedText).replace(/\s+/g, ' ').slice(0, 120);
    signals.push(`selection="${snip}"`);
  }
  if (Array.isArray(context.recentActions) && context.recentActions.length) {
    signals.push(`recent=${context.recentActions.slice(0, 5).join(' → ')}`);
  }

  // Prioritize top 3–5 signals
  const top = signals.slice(0, 5);
  let block = top.join(' | ');
  if (block.length > MAX_CHARS) {
    block = block.slice(0, MAX_CHARS - 3) + '…';
  }
  return block;
}

/**
 * Inject context into a messages array (system or prepend).
 */
export function injectContextIntoMessages(messages = [], context = {}) {
  const block = compactContext(context);
  if (!block) return { messages, contextBlock: '' };

  const contextBlock = `Active UI context: ${block}`;
  const next = [...messages];

  const sysIdx = next.findIndex((m) => m.role === 'system');
  if (sysIdx >= 0) {
    next[sysIdx] = {
      ...next[sysIdx],
      content: `${next[sysIdx].content}\n\n${contextBlock}`
    };
  }

  return { messages: next, contextBlock };
}

export function describeContextForUi(context = {}) {
  const parts = [];
  if (context.page) parts.push(context.page);
  if (context.selectedFile) parts.push(context.selectedFile.split(/[/\\]/).pop());
  if (context.activeTask) parts.push(context.activeTask);
  return parts.length ? parts.join(' · ') : 'None';
}
