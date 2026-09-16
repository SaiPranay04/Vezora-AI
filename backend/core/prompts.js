/**
 * Centralized Vezora system prompts (Fable Phase 2/5)
 */

export const VEZORA_PERSONALITY = {
  natural: true,
  conciseByDefault: true,
  memoryAware: true,
  explainsToolUse: true,
  gracefulErrors: true
};

/**
 * Build the main system prompt for chat / voice.
 * @param {Object} opts
 * @param {string} [opts.personality]
 * @param {string} [opts.contextBlock]
 * @param {string} [opts.memoryBlock]
 * @param {string} [opts.toolSchemas]
 */
export function buildSystemPrompt(opts = {}) {
  const {
    personality = 'friendly',
    contextBlock = '',
    memoryBlock = '',
    toolSchemas = ''
  } = opts;

  const tone =
    personality === 'professional'
      ? 'Be professional, clear, and efficient.'
      : personality === 'witty'
        ? 'Be witty and light, but still helpful.'
        : 'Be warm, natural, and concise by default.';

  return [
    'You are Vezora (also called Zara), a local-first personal AI assistant.',
    tone,
    'You are memory-aware: use relevant memories when helpful, never invent personal facts.',
    'When you use tools, briefly explain what you did in plain language.',
    'If something fails, recover gracefully and suggest a next step.',
    'Prefer short answers unless the user asks for depth.',
    contextBlock ? `\n## Current context\n${contextBlock}` : '',
    memoryBlock ? `\n## Relevant memories\n${memoryBlock}` : '',
    toolSchemas ? `\n## Available tools\n${toolSchemas}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildToolCallingHint(toolNames = []) {
  if (!toolNames.length) return '';
  return `You may request tools by name when needed: ${toolNames.join(', ')}.`;
}
