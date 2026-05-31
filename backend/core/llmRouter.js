/**
 * Core LLM Router
 * Decides whether a prompt should go to Groq (Fast/Conversational)
 * or Ollama (Deep Reasoning/Coding)
 */

import { generateGroqChatCompletion, isGroqAvailable } from '../utils/groqClient.js';
import { generateChatCompletion, isOllamaHealthy } from '../utils/ollamaClient.js';

/**
 * Heuristic to check if a prompt requires deep reasoning or coding
 */
function requiresDeepReasoning(prompt) {
  if (!prompt) return false;
  
  const deepKeywords = [
    'code', 'script', 'function', 'debug', 'analyze', 
    'architecture', 'refactor', 'regex'
  ];
  
  const p = prompt.toLowerCase();
  
  // If prompt is very long, it implies deep reading
  if (p.length > 1000) return true;
  
  // Check for coding/deep reasoning keywords
  if (deepKeywords.some(kw => p.includes(kw))) return true;
  
  return false;
}

/**
 * Routes and executes the query using the best available LLM provider
 * @param {Array} messages - Conversation history messages
 * @param {Object} options - Options including temperature and forced routing
 */
export async function executeRoutedQuery(messages, options = {}) {
  const { 
    forceProvider = null, // 'groq' | 'ollama' | 'gemini'
    temperature = 0.7 
  } = options;

  const ollamaAvailable = await isOllamaHealthy();
  const groqAvailable = isGroqAvailable();
  
  if (!groqAvailable && !ollamaAvailable) {
    throw new Error('No local AI providers available. Ensure Groq API Key is set or Ollama is running.');
  }

  // Determine last prompt
  const lastPrompt = messages[messages.length - 1]?.content || '';
  let selectedProvider = 'groq';

  // 1. Check if user explicitly forced a provider
  if (forceProvider === 'groq' && groqAvailable) {
    selectedProvider = 'groq';
  } else if (forceProvider === 'ollama' && ollamaAvailable) {
    selectedProvider = 'ollama';
  } else {
    // 2. 100% Groq Routing (unless unavailable)
    if (groqAvailable) {
      console.log('⚡ [ROUTER] Using Primary API -> Routing to Groq');
      selectedProvider = 'groq';
    } else if (ollamaAvailable) {
      console.log('🔌 [ROUTER] Groq Offline! Emergency Fallback -> Routing to local Ollama');
      selectedProvider = 'ollama';
    }
  }

  // 3. Execution
  const startTime = Date.now();
  let aiResponse = null;

  try {
    if (selectedProvider === 'groq') {
      const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      const responseText = await generateGroqChatCompletion(
        messages, 
        'You are Zara, a helpful and intelligent local AI assistant.', 
        2048, 
        temperature, 
        groqModel
      );
      
      aiResponse = {
        content: responseText,
        provider: 'groq',
        model: groqModel
      };
    } else if (selectedProvider === 'ollama') {
      const response = await generateChatCompletion(messages, { temperature });
      aiResponse = {
        content: response.response,
        provider: 'ollama',
        model: response.model || process.env.OLLAMA_MODEL_NAME || 'mistral:latest'
      };
    }
  } catch (error) {
    console.error(`❌ [ROUTER] ${selectedProvider} failed:`, error.message);
    
    // Aggressive Fallback
    if (selectedProvider === 'groq' && ollamaAvailable) {
      console.log('🔄 [ROUTER] Falling back to Ollama...');
      const fallback = await generateChatCompletion(messages, { temperature });
      aiResponse = { content: fallback.response, provider: 'ollama (fallback)', model: fallback.model };
    } else if (selectedProvider === 'ollama' && groqAvailable) {
      console.log('🔄 [ROUTER] Falling back to Groq...');
      const fallbackText = await generateGroqChatCompletion(messages, 'You are Zara, a helpful and intelligent local AI assistant.', 2048, temperature);
      aiResponse = { content: fallbackText, provider: 'groq (fallback)', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' };
    } else {
      throw error;
    }
  }

  return {
    ...aiResponse,
    responseTime: Date.now() - startTime
  };
}

/**
 * Simple routing decision function for streaming endpoints
 * returns 'groq' | 'ollama'
 */
export async function determineStreamProvider(messages, forceProvider = null) {
  if (forceProvider) return forceProvider;
  
  const groqAvailable = isGroqAvailable();
  return groqAvailable ? 'groq' : 'ollama';
}
