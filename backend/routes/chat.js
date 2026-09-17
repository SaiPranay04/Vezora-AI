/**
 * Chat Routes - Main conversation endpoint
 */

import express from 'express';
import axios from 'axios';
import { generateChatCompletion, parseIntent, isOllamaHealthy, formatMessagesForOllama } from '../utils/ollamaClient.js';
import { generateGroqCompletion, isGroqAvailable, streamGroqChatCompletion } from '../utils/groqClient.js';
import { generateGeminiCompletion, parseIntentWithGemini, isGeminiAvailable } from '../utils/geminiClient.js';
import { getMemory } from '../controllers/memoryController.js';
import { addLog } from '../controllers/logsController.js';
import { executeRoutedQuery, determineStreamProvider } from '../core/llmRouter.js';
import { getSettings } from '../controllers/settingsController.js';


import { processWithContext } from '../services/coordinatorService.js';
import { cleanTextForTTS } from '../utils/textCleaner.js';
import { addTask } from '../services/taskService.js';
import { optionalAuth } from '../middleware/auth.js';
import { executeTool, inferToolCall } from '../core/toolExecutor.js';
import { compactContext } from '../core/contextEngine.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';



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
      useContext = true,
      personality = 'friendly',
      context = null,
      confirmTool: confirmToolPayload = null
    } = req.body;

    // Get userId from authenticated user
    const userId = req.userId;

    // Confirm a previously gated risky tool
    if (confirmToolPayload?.pendingId) {
      const { confirmTool } = await import('../core/toolExecutor.js');
      const toolResult = await confirmTool(confirmToolPayload.pendingId, {
        approve: confirmToolPayload.approve,
        userId
      });
      if (toolResult.cancelled) {
        return res.json({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Okay — cancelled that action.',
          provider: 'system',
          model: 'permissions',
          tools: [{ name: 'cancelled', status: 'cancelled' }]
        });
      }
      if (toolResult.success) {
        return res.json({
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Done: \`${toolResult.toolName}\`\n\n\`\`\`json\n${JSON.stringify(toolResult.result, null, 2).slice(0, 2000)}\n\`\`\``,
          provider: 'tools',
          model: 'tool-executor',
          tools: [{ name: toolResult.toolName, status: 'ok', preview: toolResult.preview, result: toolResult.result }]
        });
      }
      return res.json({
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ ${toolResult.error || 'Tool confirmation failed.'}`,
        provider: 'tools',
        model: 'tool-executor',
        tools: [{ name: toolResult.toolName || 'unknown', status: 'error', error: toolResult.error }]
      });
    }

    const contextBlock = compactContext(context || {});

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

    // Get user settings
    const settings = await getSettings(userId);
    const voiceCallMode = process.env.VOICE_CALL_MODE === 'true' && settings.voiceCallEnabled;

    // Get last user message — preserve original casing for LLM, lowercase for detection
    const lastUserMessageOriginal = message || messages[messages.length - 1]?.content || '';
    const lastUserMessage = lastUserMessageOriginal.toLowerCase();
    
    // ==================== Fable tool registry (local tools) ====================
    const inferred = inferToolCall(lastUserMessageOriginal);
    if (inferred?.toolName) {
      console.log('🔧 [TOOLS] Inferred tool:', inferred.toolName);
      const toolResult = await executeTool(inferred.toolName, inferred.args, { userId });

      if (toolResult.requiresConfirmation) {
        return res.json({
          id: Date.now().toString(),
          role: 'assistant',
          content: `⚠️ This action needs your confirmation:\n\n\`${toolResult.preview}\``,
          provider: 'tools',
          model: 'permissions',
          requiresConfirmation: true,
          pendingId: toolResult.pendingId,
          tools: [{
            name: toolResult.toolName,
            status: 'pending_confirmation',
            preview: toolResult.preview,
            pendingId: toolResult.pendingId,
            args: toolResult.args
          }]
        });
      }

      if (toolResult.success) {
        const summary =
          inferred.toolName === 'todo.list' && toolResult.result?.stats
            ? `Here's your task summary:\n\`\`\`json\n${JSON.stringify(toolResult.result.stats, null, 2)}\n\`\`\``
            : inferred.toolName === 'todo.add'
              ? `✅ Added task: **${inferred.args.title}**`
              : inferred.toolName === 'file.read'
                ? `📄 Contents of \`${inferred.args.path}\`:\n\n\`\`\`\n${String(toolResult.result?.content || '').slice(0, 3000)}\n\`\`\``
                : `✅ Ran \`${toolResult.toolName}\`.\n\n\`\`\`json\n${JSON.stringify(toolResult.result, null, 2).slice(0, 2000)}\n\`\`\``;

        return res.json({
          id: Date.now().toString(),
          role: 'assistant',
          content: summary,
          provider: 'tools',
          model: 'tool-executor',
          contextUsed: contextBlock || undefined,
          tools: [{ name: toolResult.toolName, status: 'ok', preview: toolResult.preview, result: toolResult.result }]
        });
      }

      if (toolResult.malformed) {
        return res.json({
          id: Date.now().toString(),
          role: 'assistant',
          content: `I couldn't run that tool with those parameters: ${toolResult.error}`,
          provider: 'tools',
          model: 'tool-executor',
          tools: [{ name: inferred.toolName, status: 'error', error: toolResult.error }]
        });
      }
      return res.status(403).json({ error: toolResult.error || 'Tool denied' });
    }

    // Check provider availability
    if (useOllama && !isGroqAvailable()) {
      const ollamaHealthy = await isOllamaHealthy();
      if (!ollamaHealthy && !useGemini) {
        return res.status(503).json({
          error: 'No AI provider available. Start Ollama (ollama serve) or add GEMINI_API_KEY to .env'
        });
      }
    }

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

    if (isToolQuery) return res.status(403).json({ error: 'Google agent actions are disabled pending per-user authorization and confirmed writes.' });

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
        
        const coordinatorResult = await processWithContext(lastUserMessageOriginal, {
          userId,
          conversationHistory: conversationHistory || [],
          useContext: true,
          aiProvider,
          personality
        });

        const responseTime = 0;
        
        return res.json({
          id: Date.now().toString(),
          role: 'assistant',
          content: coordinatorResult.response,
          timestamp: new Date().toISOString(),
          model: isGroqAvailable() 
            ? process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
            : useOllama ? 'mistral' : 'gemini',
          provider: isGroqAvailable() ? 'groq' : (useOllama ? 'ollama' : 'gemini'),
          intent: { action: coordinatorResult.taskAction || 'chat', category: coordinatorResult.taskAction ? 'task' : 'general' },
          responseTime,
          contextUsed: coordinatorResult.contextUsed,
          taskAction: coordinatorResult.taskAction || null,
          actionConfirmations: coordinatorResult.actionConfirmations || [],
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

    // Generate response from selected AI provider via new Router
    let aiResponse;
    try {
      const options = { temperature: settings.temperature || 0.7 };
      aiResponse = await executeRoutedQuery(messages, options);
    } catch (error) {
      console.error('❌ Router execution failed:', error);
      throw new Error('All AI providers are currently unavailable');
    }
    
    const responseTime = aiResponse.responseTime;
    const usedProvider = aiResponse.provider;
    aiResponse.response = aiResponse.content; // Normalization for intent code below



    // Parse intent for potential actions
    let intent;
    const messageForParsing = lastUserMessageOriginal || '';
    try {
      intent = useGemini ? await parseIntentWithGemini(messageForParsing) : await parseIntent(messageForParsing);
    } catch {
      // Fallback intent parsing
      intent = await parseIntent(messageForParsing);
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
    const { message, messages: conversationHistory, includeMemory = false } = req.body;
    const userId = req.userId;

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

    if (isToolQuery) return res.status(403).json({ error: 'Legacy Google actions disabled' });

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
    // Determine provider for streaming
    const streamProvider = await determineStreamProvider(messages);
    console.log(`🤖 Using ${streamProvider.toUpperCase()} (streaming)`);

    if (streamProvider === 'groq') {
      try {
        const groqStream = streamGroqChatCompletion(messages, 'You are Zara, a helpful and intelligent local AI assistant.', 2048, 0.7);
        let buffer = '';
        let fullResponse = '';

        for await (const chunk of groqStream) {
          buffer += chunk;
          fullResponse += chunk;

          // Send sentence chunks immediately (ends with . ! ?)
          const sentenceMatch = buffer.match(/^(.*?[.!?\n])\s*/);
          if (sentenceMatch) {
            const sentence = sentenceMatch[1].trim();
            if (sentence) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: sentence })}\n\n`);
              buffer = buffer.slice(sentenceMatch[0].length);
            }
          }
        }

        // Send any remaining text
        if (buffer.trim()) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: buffer.trim() })}\n\n`);
        }
        // Send done signal
        res.write(`data: ${JSON.stringify({ type: 'done', fullResponse: fullResponse.trim() })}\n\n`);
        res.end();
      } catch (error) {
        console.error('❌ Groq stream error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      }
    } else {
      // Use Ollama with streaming
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
    }

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
