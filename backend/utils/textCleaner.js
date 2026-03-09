/**
 * Text Cleaner - Remove markdown and formatting for voice output
 */

/**
 * Strip markdown formatting from text for TTS
 * Removes: bold, italic, links, code blocks, headers, lists, etc.
 * @param {string} text - Text with markdown formatting
 * @returns {string} - Clean text for voice output
 */
export function stripMarkdownForVoice(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleanText = text;

  // Remove code blocks (```code```)
  cleanText = cleanText.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code (`code`)
  cleanText = cleanText.replace(/`([^`]+)`/g, '$1');
  
  // Remove bold (**text** or __text__)
  cleanText = cleanText.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleanText = cleanText.replace(/__([^_]+)__/g, '$1');
  
  // Remove italic (*text* or _text_)
  cleanText = cleanText.replace(/\*([^*]+)\*/g, '$1');
  cleanText = cleanText.replace(/_([^_]+)_/g, '$1');
  
  // Remove strikethrough (~~text~~)
  cleanText = cleanText.replace(/~~([^~]+)~~/g, '$1');
  
  // Remove links [text](url) -> keep text only
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove images ![alt](url)
  cleanText = cleanText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  
  // Remove headers (# ## ### etc)
  cleanText = cleanText.replace(/^#{1,6}\s+/gm, '');
  
  // Remove horizontal rules (---, ***, ___)
  cleanText = cleanText.replace(/^[\-*_]{3,}$/gm, '');
  
  // Remove blockquotes (> text)
  cleanText = cleanText.replace(/^>\s+/gm, '');
  
  // Remove unordered list markers (- * +)
  cleanText = cleanText.replace(/^[\-*+]\s+/gm, '');
  
  // Remove ordered list markers (1. 2. etc)
  cleanText = cleanText.replace(/^\d+\.\s+/gm, '');
  
  // Remove HTML tags
  cleanText = cleanText.replace(/<[^>]+>/g, '');
  
  // Remove extra whitespace
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  // Remove multiple newlines
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n');

  return cleanText;
}

/**
 * Convert technical terms to voice-friendly alternatives
 * @param {string} text - Text to convert
 * @returns {string} - Voice-friendly text
 */
export function makeVoiceFriendly(text) {
  let voiceText = text;
  
  // Replace common technical symbols with words
  const replacements = {
    '&': ' and ',
    '@': ' at ',
    '#': ' number ',
    '%': ' percent ',
    '€': ' euros ',
    '£': ' pounds ',
    '$': ' dollars ',
    '+': ' plus ',
    '=': ' equals ',
    '<': ' less than ',
    '>': ' greater than ',
    '/': ' slash ',
    '\\': ' backslash ',
    '|': ' or ',
    '~': ' tilde ',
    '^': ' caret ',
  };

  for (const [symbol, word] of Object.entries(replacements)) {
    voiceText = voiceText.split(symbol).join(word);
  }

  return voiceText;
}

/**
 * Full text cleaning pipeline for TTS
 * @param {string} text - Raw text (possibly with markdown)
 * @returns {string} - Clean, voice-ready text
 */
export function cleanTextForTTS(text) {
  let cleaned = stripMarkdownForVoice(text);
  cleaned = makeVoiceFriendly(cleaned);
  return cleaned.trim();
}

export default {
  stripMarkdownForVoice,
  makeVoiceFriendly,
  cleanTextForTTS
};
