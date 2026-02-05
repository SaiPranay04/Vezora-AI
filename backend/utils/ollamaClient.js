/**
 * Ollama Client - Local LLM Integration
 * Supports Phi-2, TinyLLaMA, Mistral 7B
 */

import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

/**
 * Check if Ollama is running
 */
export async function isOllamaHealthy() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    console.error('❌ Ollama health check failed:', error.message);
    return false;
  }
}

/**
 * Generate chat completion with Ollama (OPTIMIZED FOR VOICE)
 */
export async function generateChatCompletion(messages, options = {}) {
  try {
    const {
      temperature = 0.6,        // Optimized for faster, focused responses
      maxTokens = 100,          // Strict limit for voice-friendly replies
      stream = false,
      tone = 'friendly'         // Tone preset
    } = options;

    // Format messages for Ollama with voice-optimized system prompt
    const prompt = formatMessagesForOllama(messages, tone);
    const modelName = process.env.OLLAMA_MODEL_NAME || 'mistral:latest';

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: modelName,
        prompt: prompt,
        stream: stream,
        options: {
          temperature: temperature,
          top_p: 0.9,             // Focused sampling
          num_predict: maxTokens, // Hard limit on response length
          stop: ['User:', 'Human:', '\n\nUser:', '\n\nHuman:']
        }
      },
      {
        timeout: 30000, // Reduced to 30s for faster failures
        responseType: stream ? 'stream' : 'json'
      }
    );

    if (stream) {
      return response.data; // Return stream for chunked processing
    }

    return {
      response: response.data.response.trim(),
      model: modelName,
      done: response.data.done
    };
  } catch (error) {
    console.error('❌ Ollama generation error:', error.message);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

/**
 * Tone presets for personality control (prompt injection only)
 */
const TONE_PRESETS = {
  calm: "Speak slowly and reassuringly with minimal emotion. Use simple, clear language.",
  friendly: "Be warm, casual, and slightly playful. Use natural conversational tone.",
  professional: "Be concise, neutral, and task-focused. Avoid casual language.",
  sassy: "Be confident and witty. Keep replies very short and punchy."
};

/**
 * Format conversation messages for Ollama prompt (VOICE-OPTIMIZED)
 */
function formatMessagesForOllama(messages, tone = 'friendly') {
  // STRICT voice-friendly system prompt
  const systemPrompt = `You are Vezora, a real-time voice assistant.

CRITICAL RULES:
- Default replies MUST be 1-3 short sentences ONLY.
- Use spoken language, not written explanations.
- NO long paragraphs or lists unless explicitly requested.
- Be calm, confident, and natural.
- Answer directly without preambles.

${TONE_PRESETS[tone] || TONE_PRESETS.friendly}

`;

  let prompt = systemPrompt;

  // Add conversation history (keep only last 4 exchanges for speed)
  const recentMessages = messages.slice(-8);
  
  recentMessages.forEach(msg => {
    if (msg.role === 'system') {
      prompt += `\n${msg.content}\n`;
    } else if (msg.role === 'user') {
      prompt += `\nUser: ${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      prompt += `\nVezora: ${msg.content}\n`;
    }
  });

  prompt += '\nVezora:';

  return prompt;
}

/**
 * Extract action intent from user message
 * Returns structured intent: { action, target, confidence }
 */
export async function parseIntent(userMessage) {
  try {
    const prompt = `Analyze this user message and extract the intent as JSON.

User message: "${userMessage}"

Return ONLY valid JSON with this structure:
{
  "action": "chat|open_app|open_file|save_file|search|reminder|other",
  "target": "specific app name, file path, or search query if applicable",
  "confidence": 0.0 to 1.0,
  "parameters": {}
}

Examples:
"open chrome" -> {"action":"open_app","target":"chrome","confidence":0.95}
"search for react tutorials" -> {"action":"search","target":"react tutorials","confidence":0.9}
"tell me a joke" -> {"action":"chat","target":null,"confidence":1.0}

JSON:`;

    const modelName = process.env.OLLAMA_MODEL_NAME || 'mistral:latest';
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent JSON
          num_predict: 150
        }
      },
      { timeout: 10000 }
    );

    const text = response.data.response.trim();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const intent = JSON.parse(jsonText);
    return intent;
  } catch (error) {
    console.error('❌ Intent parsing error:', error.message);
    // Fallback: regex-based intent detection
    return fallbackIntentParser(userMessage);
  }
}

/**
 * Fallback intent parser using regex
 */
function fallbackIntentParser(message) {
  const lower = message.toLowerCase();

  // App launch patterns
  if (lower.match(/open|launch|start/)) {
    const apps = ['chrome', 'firefox', 'code', 'vscode', 'notepad', 'explorer', 'calculator'];
    for (const app of apps) {
      if (lower.includes(app)) {
        return {
          action: 'open_app',
          target: app,
          confidence: 0.8,
          parameters: {}
        };
      }
    }
  }

  // File operations
  if (lower.match(/open.*file|show.*file/)) {
    return {
      action: 'open_file',
      target: null,
      confidence: 0.7,
      parameters: {}
    };
  }

  if (lower.match(/save|create.*file|write.*file/)) {
    return {
      action: 'save_file',
      target: null,
      confidence: 0.7,
      parameters: {}
    };
  }

  // Search
  if (lower.match(/search|google|find|look up/)) {
    const searchQuery = message.replace(/search|google|find|look up|for|about/gi, '').trim();
    return {
      action: 'search',
      target: searchQuery,
      confidence: 0.75,
      parameters: { query: searchQuery }
    };
  }

  // Default: chat
  return {
    action: 'chat',
    target: null,
    confidence: 1.0,
    parameters: {}
  };
}

/**
 * List available Ollama models
 */
export async function listModels() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    return response.data.models || [];
  } catch (error) {
    console.error('❌ Failed to list models:', error.message);
    return [];
  }
}
