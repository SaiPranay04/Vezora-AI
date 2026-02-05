/**
 * Gemini AI Client - Google Generative AI Integration
 * Alternative to Ollama for cloud-based AI processing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

/**
 * Initialize Gemini client (reads env variables dynamically)
 */
export function initializeGemini() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Read dynamically!
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';
  
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set. Gemini features disabled.');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    console.log('✅ Gemini AI initialized:', GEMINI_MODEL);
    return true;
  } catch (error) {
    console.error('❌ Gemini initialization failed:', error.message);
    return false;
  }
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable() {
  return !!process.env.GEMINI_API_KEY && !!model;
}

/**
 * Generate chat completion with Gemini
 */
export async function generateGeminiCompletion(messages, options = {}) {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API is not configured. Add GEMINI_API_KEY to .env');
  }

  try {
    const {
      temperature = 0.7,
      maxTokens = 1024,
      topP = 0.95,
      topK = 40
    } = options;

    // Format messages for Gemini
    const prompt = formatMessagesForGemini(messages);

    const generationConfig = {
      temperature,
      topP,
      topK,
      maxOutputTokens: maxTokens,
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();

    return {
      response: text.trim(),
      model: process.env.GEMINI_MODEL || 'gemini-pro',
      finishReason: response.candidates?.[0]?.finishReason || 'STOP',
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0
      }
    };
  } catch (error) {
    console.error('❌ Gemini generation error:', error.message);
    
    // Handle rate limits
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please check your usage or upgrade plan.');
    }
    
    throw new Error(`Failed to generate Gemini response: ${error.message}`);
  }
}

/**
 * Format conversation messages for Gemini prompt
 */
function formatMessagesForGemini(messages) {
  const systemPrompt = `You are Vezora, a highly capable AI personal assistant powered by Google Gemini. You can:

🎯 Core Capabilities:
- Answer questions with accurate, up-to-date information
- Have natural, engaging conversations
- Help with tasks, research, and problem-solving
- Understand context from previous messages in the conversation
- Provide detailed explanations when needed
- Generate creative content (code, writing, ideas)

🎨 Personality:
- Friendly, professional, and approachable
- Concise but thorough (expand when asked)
- Proactive in suggesting helpful actions
- Honest about limitations

📝 Response Guidelines:
- Keep initial responses under 3 paragraphs unless more detail is requested
- Use markdown formatting for clarity (code blocks, lists, emphasis)
- If uncertain, clearly state assumptions or limitations
- Suggest follow-up questions or actions when relevant
- For technical topics, provide examples and best practices

`;

  let prompt = systemPrompt;

  messages.forEach(msg => {
    if (msg.role === 'system') {
      prompt += `\n🔍 Additional Context:\n${msg.content}\n`;
    } else if (msg.role === 'user') {
      prompt += `\n👤 User: ${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      prompt += `\n🤖 Vezora: ${msg.content}\n`;
    }
  });

  prompt += '\n🤖 Vezora:';

  return prompt;
}

/**
 * Generate streaming response with Gemini
 * For real-time chat experience
 */
export async function generateGeminiStream(messages, options = {}) {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API is not configured');
  }

  try {
    const prompt = formatMessagesForGemini(messages);

    const generationConfig = {
      temperature: options.temperature || 0.7,
      topP: options.topP || 0.95,
      topK: options.topK || 40,
      maxOutputTokens: options.maxTokens || 1024,
    };

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    return result.stream;
  } catch (error) {
    console.error('❌ Gemini streaming error:', error.message);
    throw error;
  }
}

/**
 * Extract action intent using Gemini
 * More accurate than Ollama for intent classification
 */
export async function parseIntentWithGemini(userMessage) {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API is not configured');
  }

  try {
    const prompt = `Analyze this user message and extract the intent as JSON.

User message: "${userMessage}"

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "action": "chat|open_app|open_file|save_file|search|reminder|calendar|email|other",
  "target": "specific app name, file path, or search query if applicable (null if not applicable)",
  "confidence": 0.0 to 1.0,
  "parameters": {},
  "summary": "brief description of what user wants"
}

Examples:
Input: "open chrome"
Output: {"action":"open_app","target":"chrome","confidence":0.95,"parameters":{},"summary":"Launch Chrome browser"}

Input: "search for react tutorials"
Output: {"action":"search","target":"react tutorials","confidence":0.9,"parameters":{"query":"react tutorials"},"summary":"Search web for React tutorials"}

Input: "tell me a joke"
Output: {"action":"chat","target":null,"confidence":1.0,"parameters":{},"summary":"User wants casual conversation"}

Now analyze and respond with JSON only:`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent JSON
        maxOutputTokens: 200
      },
    });

    const text = result.response.text().trim();
    
    // Extract JSON from response
    let jsonText = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const intent = JSON.parse(jsonText);
    return intent;
  } catch (error) {
    console.error('❌ Gemini intent parsing error:', error.message);
    // Fallback to basic parsing
    return {
      action: 'chat',
      target: null,
      confidence: 0.5,
      parameters: {},
      summary: 'Unable to parse intent'
    };
  }
}

/**
 * Generate embeddings for memory/context (Gemini embedding model)
 */
export async function generateEmbedding(text) {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API is not configured');
  }

  try {
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('❌ Gemini embedding error:', error.message);
    throw error;
  }
}

/**
 * Count tokens in a message (useful for context management)
 */
export async function countTokens(text) {
  if (!isGeminiAvailable()) {
    return Math.ceil(text.length / 4); // Rough estimate
  }

  try {
    const result = await model.countTokens(text);
    return result.totalTokens;
  } catch (error) {
    console.error('❌ Token counting error:', error.message);
    return Math.ceil(text.length / 4); // Fallback estimate
  }
}

export default {
  initializeGemini,
  isGeminiAvailable,
  generateGeminiCompletion,
  generateGeminiStream,
  parseIntentWithGemini,
  generateEmbedding,
  countTokens
};
