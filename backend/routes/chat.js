/**
 * Chat Routes - Main conversation endpoint
 */

import express from 'express';
import axios from 'axios';
import { generateChatCompletion, parseIntent, isOllamaHealthy } from '../utils/ollamaClient.js';
import { generateGroqCompletion, isGroqAvailable } from '../utils/groqClient.js';
import { generateGeminiCompletion, parseIntentWithGemini, isGeminiAvailable } from '../utils/geminiClient.js';
import { getMemory } from '../controllers/memoryController.js';
import { addLog } from '../controllers/logsController.js';
import { getSettings } from '../controllers/settingsController.js';
import { executeAgent } from '../utils/langchainAgent.js';
import { isAuthenticated } from '../utils/googleAuth.js';
import { processWithContext } from '../services/coordinatorService.js';
import { cleanTextForTTS } from '../utils/textCleaner.js';
import { addTask } from '../services/taskService.js';
import { optionalAuth } from '../middleware/auth.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Tone presets for streaming
const TONE_PRESETS = {
  calm: "Speak slowly and reassuringly with minimal emotion. Use simple, clear language.",
  friendly: "Be warm, casual, and slightly playful. Use natural conversational tone.",
  professional: "Be concise, neutral, and task-focused. Avoid casual language.",
  sassy: "Be confident and witty. Keep replies very short and punchy."
};

// Format messages helper for streaming
function formatMessagesForOllama(messages, tone = 'friendly') {
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
  const recentMessages = messages.slice(-8);
  
  recentMessages.forEach(msg => {
    if (msg.role === 'system') prompt += `\n${msg.content}\n`;
    else if (msg.role === 'user') prompt += `\nUser: ${msg.content}\n`;
    else if (msg.role === 'assistant') prompt += `\nVezora: ${msg.content}\n`;
  });

  prompt += '\nVezora:';
  return prompt;
}

const router = express.Router();

/**
 * POST /api/chat
 * Main chat endpoint - receives message, returns AI response
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { 
      message, 
      messages: conversationHistory, 
      includeMemory = false, 
      useContext = true // NEW: Enable context-aware responses by default
    } = req.body;

    // Get userId from authenticated user
    const userId = req.userId || req.body.userId;

    // Support both formats:
    // 1. NEW: messages array (with conversation history)
    // 2. OLD: single message string (backward compatible)
    let messages = [];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      // NEW FORMAT: Use conversation history directly
      messages = conversationHistory;
    } else if (message && typeof message === 'string') {
      // OLD FORMAT: Single message
      messages = [{ role: 'user', content: message }];
    } else {
      return res.status(400).json({ error: 'Message or messages array is required' });
    }

    // Determine AI provider (Gemini preferred, Ollama fallback)
    const useGemini = isGeminiAvailable();
    const useOllama = !useGemini || process.env.AI_PROVIDER === 'ollama';

    // Check provider availability
    if (useOllama) {
      const ollamaHealthy = await isOllamaHealthy();
      if (!ollamaHealthy && !useGemini) {
        return res.status(503).json({
          error: 'No AI provider available. Start Ollama (ollama serve) or add GEMINI_API_KEY to .env'
        });
      }
    }

    // Get user settings
    const settings = await getSettings(userId);
    const voiceCallMode = process.env.VOICE_CALL_MODE === 'true' && settings.voiceCallEnabled;

    // Get last user message
    const lastUserMessage = (message || messages[messages.length - 1]?.content || '').toLowerCase();
    
    // ==================== REMOVED: Regex-based task detection ====================
    // Now handled intelligently by coordinator with Groq

    // Check if this is a tool-related query (Gmail, Calendar, etc.)
    const isToolQuery = 
      lastUserMessage.includes('email') || 
      lastUserMessage.includes('gmail') || 
      lastUserMessage.includes('inbox') ||
      lastUserMessage.includes('mail') ||
      lastUserMessage.includes('calendar') ||
      lastUserMessage.includes('schedule') ||
      lastUserMessage.includes('meeting') ||
      lastUserMessage.includes('event');

    // If tool query and user is authenticated, use LangChain agent
    if (isToolQuery) {
      const authenticated = await isAuthenticated();
      console.log('🔍 Tool query detected:', lastUserMessage, '| Authenticated:', authenticated);
      
      if (authenticated) {
        console.log('🔧 Using LangChain agent for tool execution');
        const startTime = Date.now();
        
        try {
          const agentResponse = await executeAgent(lastUserMessage);
          console.log('✅ Agent response:', agentResponse.substring(0, 200));
          const responseTime = Date.now() - startTime;
          
          return res.json({
            id: Date.now().toString(),
            role: 'assistant',
            content: agentResponse,
            timestamp: new Date().toISOString(),
            model: 'langchain-agent',
            provider: 'agent',
            intent: { action: 'tool_use', category: 'integration' },
            responseTime,
            voiceEnabled: voiceCallMode,
            voiceText: agentResponse
          });
        } catch (agentError) {
          console.error('❌ Agent error:', agentError);
          console.error('❌ Agent error stack:', agentError.stack);
          // Fall through to normal AI conversation if agent fails
        }
      } else if (isToolQuery) {
        // User asking about Gmail/Calendar but not authenticated
        return res.json({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I can help with that, but you need to authenticate with Google first. Please visit http://localhost:5000/auth-test.html to connect your Google account.',
          timestamp: new Date().toISOString(),
          model: 'system',
          provider: 'system',
          intent: { action: 'auth_required', category: 'system' },
          responseTime: 0
        });
      }
    }

    // ==================== NEW: CONTEXT-AWARE MODE ====================
    // Use coordinator for intelligent context retrieval and memory updates
    if (useContext && !isToolQuery) {
      console.log('🧠 Using context-aware mode with coordinator');
      
      try {
        // Determine AI provider: Groq > Gemini > Ollama
        let aiProvider = 'groq';  // Default to Groq (primary)
        if (!isGroqAvailable()) {
          aiProvider = useOllama ? 'ollama' : 'gemini';
        }
        
        const coordinatorResult = await processWithContext(lastUserMessage, {
          userId,
          conversationHistory: conversationHistory || [],
          useContext: true,
          aiProvider
        });

        const responseTime = 0; // Calculated internally by coordinator
        
        return res.json({
          id: Date.now().toString(),
          role: 'assistant',
          content: coordinatorResult.response,
          timestamp: new Date().toISOString(),
          model: isGroqAvailable() 
            ? process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
            : useOllama ? 'mistral' : 'gemini',
          provider: isGroqAvailable() ? 'groq' : (useOllama ? 'ollama' : 'gemini'),
          intent: { action: 'chat', category: 'general' },
          responseTime,
          contextUsed: coordinatorResult.contextUsed,
          contextSummary: {
            projects: coordinatorResult.context.projects?.length || 0,
            decisions: coordinatorResult.context.decisions?.length || 0,
            tasks: coordinatorResult.context.tasks?.length || 0,
            preferences: coordinatorResult.context.preferences?.length || 0
          }
        });
      } catch (coordinatorError) {
        console.error('❌ Coordinator error:', coordinatorError);
        console.log('⚠️ Falling back to standard chat mode');
        // Fall through to standard mode
      }
    }

    // Optionally add memory context (usually disabled for speed when using conversation history)
    if (includeMemory) {
      const memory = await getMemory(userId);
      if (memory.length > 0) {
        const memoryContext = memory.slice(0, 3).map(m => m.content).join('\n');
        messages.unshift({
          role: 'system',
          content: `Context: ${memoryContext}`
        });
      }
    }

    // Generate response from selected AI provider
    const startTime = Date.now();
    let aiResponse;
    let usedProvider;

    try {
      // PRIMARY: Try Groq first (fastest and best for voice)
      if (isGroqAvailable()) {
        console.log('🤖 Using Groq AI');
        
        // Convert messages to prompt format
        const systemPrompt = messages[0]?.role === 'system' ? messages[0].content : 'You are Vezora AI, a helpful and intelligent assistant.';
        const userMessages = messages.filter(m => m.role !== 'system');
        const prompt = userMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
        
        const groqResponse = await generateGroqCompletion(
          prompt,
          systemPrompt,
          isVoice ? 200 : 2048,  // Shorter for voice, longer for chat
          0.7
        );
        
        aiResponse = { response: groqResponse };
        usedProvider = 'groq';
      }
      // FALLBACK 1: Gemini
      else if (useGemini || isGeminiAvailable()) {
        console.log('🤖 Using Gemini AI');
        aiResponse = await generateGeminiCompletion(messages, {
          temperature: settings.temperature || 0.7,
          maxTokens: settings.maxTokens || 1024
        });
        usedProvider = 'gemini';
      }
      // FALLBACK 2: Ollama
      else {
        console.log('🤖 Using Ollama');
        aiResponse = await generateChatCompletion(messages, {
          temperature: 0.6,
          maxTokens: 100,
          tone: settings.voiceTone || 'friendly'
        });
        usedProvider = 'ollama';
      }
    } catch (error) {
      // CASCADE FALLBACK
      console.error(`❌ ${usedProvider} failed, trying fallback...`);
      
      try {
        // Try Gemini fallback
        if (isGeminiAvailable() && usedProvider !== 'gemini') {
          console.log('🔄 Falling back to Gemini');
          aiResponse = await generateGeminiCompletion(messages, {
            temperature: settings.temperature || 0.7,
            maxTokens: settings.maxTokens || 1024
          });
          usedProvider = 'gemini (fallback)';
        }
        // Try Ollama fallback
        else if (await isOllamaHealthy() && usedProvider !== 'ollama') {
          console.log('🔄 Falling back to Ollama');
          aiResponse = await generateChatCompletion(messages, {
            temperature: settings.temperature || 0.7,
            maxTokens: settings.maxTokens || 512
          });
          usedProvider = 'ollama (fallback)';
        } else {
          throw error;
        }
      } catch (fallbackError) {
        throw new Error('All AI providers are currently unavailable');
      }
    }

    const responseTime = Date.now() - startTime;

    // Parse intent for potential actions
    let intent;
    try {
      intent = useGemini ? await parseIntentWithGemini(message) : await parseIntent(message);
    } catch {
      // Fallback intent parsing
      intent = await parseIntent(message);
    }

    // Log interaction
    await addLog({
      type: 'chat',
      userId,
      message,
      response: aiResponse.response,
      intent: intent.action,
      responseTime,
      timestamp: new Date().toISOString()
    });

    // Prepare response
    const responseData = {
      id: Date.now().toString(),
      role: 'assistant',
      content: aiResponse.response,
      timestamp: new Date().toISOString(),
      model: usedProvider === 'groq' || usedProvider === 'groq (fallback)' 
        ? process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
        : aiResponse.model || usedProvider,
      provider: usedProvider,
      intent,
      responseTime,
      tokenUsage: aiResponse.usage || null
    };

    // Add voice data if voice call mode is enabled
    if (voiceCallMode) {
      responseData.voiceEnabled = true;
      // Clean markdown formatting for voice output
      responseData.voiceText = cleanTextForTTS(aiResponse.response);
      // Frontend will call /api/voice/speak to get audio
    }

    res.json(responseData);
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

/**
 * POST /api/chat/stream
 * Streaming chat endpoint - returns AI response in real-time chunks
 * OPTIMIZED FOR VOICE: Sends sentence-level chunks for immediate TTS playback
 */
router.post('/stream', async (req, res) => {
  try {
    const { message, messages: conversationHistory, includeMemory = false, userId = 'default' } = req.body;

    // Support both formats (same as regular /chat endpoint)
    let messages = [];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      // NEW FORMAT: Use conversation history
      messages = conversationHistory;
    } else if (message && typeof message === 'string') {
      // OLD FORMAT: Single message
      messages = [{ role: 'user', content: message }];
    } else {
      return res.status(400).json({ error: 'Message or messages array is required' });
    }

    // Check if this is a tool-related query (Gmail, Calendar, etc.)
    const lastUserMessage = (message || messages[messages.length - 1]?.content || '').toLowerCase();
    const isToolQuery = 
      lastUserMessage.includes('email') || 
      lastUserMessage.includes('gmail') || 
      lastUserMessage.includes('inbox') ||
      lastUserMessage.includes('mail') ||
      lastUserMessage.includes('calendar') ||
      lastUserMessage.includes('schedule') ||
      lastUserMessage.includes('meeting') ||
      lastUserMessage.includes('event');

    // If tool query and user is authenticated, use LangChain agent (non-streaming)
    if (isToolQuery) {
      const authenticated = await isAuthenticated();
      console.log('🔍 [STREAM] Tool query detected:', lastUserMessage, '| Authenticated:', authenticated);
      
      if (authenticated) {
        console.log('🔧 [STREAM] Using LangChain agent for tool execution');
        
        try {
          // Set up SSE headers first
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const agentResponse = await executeAgent(lastUserMessage);
          console.log('✅ [STREAM] Agent response:', agentResponse.substring(0, 200));
          
          // Send as single chunk for tool responses
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: agentResponse })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'done', fullResponse: agentResponse })}\n\n`);
          res.end();
          return;
        } catch (agentError) {
          console.error('❌ [STREAM] Agent error:', agentError);
          // Fall through to normal streaming if agent fails
        }
      } else if (isToolQuery) {
        // User asking about Gmail/Calendar but not authenticated
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const authMessage = 'I can help with that, but you need to authenticate with Google first. Please visit the authentication page to connect your Google account.';
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: authMessage })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'done', fullResponse: authMessage })}\n\n`);
        res.end();
        return;
      }
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get user settings
    const settings = await getSettings(userId);

    // Optionally add memory context (usually disabled for speed)
    if (includeMemory) {
      const memory = await getMemory(userId);
      if (memory.length > 0) {
        const memoryContext = memory.slice(0, 2).map(m => m.content).join('\n');
        messages.unshift({
          role: 'system',
          content: `Context: ${memoryContext}`
        });
      }
    }

    // Use Ollama with streaming
    console.log('🤖 Using Ollama (streaming)');
    
    const modelName = process.env.OLLAMA_MODEL_NAME || 'mistral:latest';
    const prompt = formatMessagesForOllama(messages, settings.voiceTone || 'friendly');

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: modelName,
        prompt: prompt,
        stream: true,
        options: {
          temperature: 0.6,
          top_p: 0.9,
          num_predict: 100
        }
      },
      { responseType: 'stream' }
    );

    let buffer = '';
    let fullResponse = '';

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            buffer += json.response;
            fullResponse += json.response;

            // Send sentence chunks immediately (ends with . ! ?)
            const sentenceMatch = buffer.match(/^(.*?[.!?])\s*/);
            if (sentenceMatch) {
              const sentence = sentenceMatch[1].trim();
              if (sentence) {
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: sentence })}\n\n`);
                buffer = buffer.slice(sentenceMatch[0].length);
              }
            }
          }

          if (json.done) {
            // Send any remaining text
            if (buffer.trim()) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: buffer.trim() })}\n\n`);
            }
            // Send done signal
            res.write(`data: ${JSON.stringify({ type: 'done', fullResponse: fullResponse.trim() })}\n\n`);
            res.end();
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    response.data.on('error', (error) => {
      console.error('❌ Stream error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('❌ Streaming error:', error);
    res.status(500).json({ error: 'Failed to stream response' });
  }
});

/**
 * POST /api/chat/intent
 * Parse user intent without generating full response
 */
router.post('/intent', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const intent = await parseIntent(message);
    res.json(intent);
  } catch (error) {
    console.error('❌ Intent parsing error:', error);
    res.status(500).json({ error: 'Failed to parse intent' });
  }
});

/**
 * GET /api/chat/health
 * Check AI provider status
 */
router.get('/health', async (req, res) => {
  const ollamaHealthy = await isOllamaHealthy();
  const geminiAvailable = isGeminiAvailable();
  
  const activeProvider = process.env.AI_PROVIDER === 'ollama' ? 'ollama' : 
                        (geminiAvailable ? 'gemini' : 
                        (ollamaHealthy ? 'ollama' : 'none'));

  res.json({
    providers: {
      gemini: {
        status: geminiAvailable ? 'available' : 'not configured',
        model: process.env.GEMINI_MODEL || 'gemini-pro'
      },
      ollama: {
        status: ollamaHealthy ? 'connected' : 'disconnected',
        model: process.env.OLLAMA_MODEL_NAME || 'phi',
        endpoint: process.env.OLLAMA_BASE_URL
      }
    },
    activeProvider,
    fallbackEnabled: true
  });
});

export default router;
