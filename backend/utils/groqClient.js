import Groq from 'groq-sdk';

let groqClient = null;

/**
 * Initialize Groq client
 */
function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY not found in environment variables');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Generate chat completion using Groq
 * @param {string} prompt - User prompt
 * @param {string} systemPrompt - System prompt
 * @param {number} maxTokens - Max tokens to generate
 * @param {number} temperature - Temperature (0-2)
 * @param {string} model - Model to use
 * @returns {Promise<string>} - Generated response
 */
export async function generateGroqCompletion(
  prompt,
  systemPrompt = 'You are Vezora AI, a helpful and intelligent assistant.',
  maxTokens = 2048,
  temperature = 0.7,
  model = null
) {
  try {
    const groq = getGroqClient();
    // Updated model - llama-3.1-70b-versatile was decommissioned
    const selectedModel = model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    console.log(`🤖 [GROQ] Using model: ${selectedModel}`);
    console.log(`💬 [GROQ] Prompt length: ${prompt.length} chars`);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const startTime = Date.now();
    
    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages,
      max_tokens: maxTokens,
      temperature,
      top_p: 1,
      stream: false
    });

    const responseTime = Date.now() - startTime;
    const response = completion.choices[0]?.message?.content || '';

    console.log(`✅ [GROQ] Response generated in ${responseTime}ms`);
    console.log(`📝 [GROQ] Response length: ${response.length} chars`);
    console.log(`🔢 [GROQ] Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);

    return response;
  } catch (error) {
    console.error('❌ [GROQ] Error:', error.message);
    
    // Handle rate limiting
    if (error.status === 429) {
      throw new Error('Groq rate limit exceeded. Please try again in a moment.');
    }
    
    // Handle API errors
    if (error.status === 401) {
      throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY in .env');
    }
    
    throw new Error(`Failed to generate Groq response: ${error.message}`);
  }
}

/**
 * Generate chat completion with conversation history
 * @param {Array} messages - Array of message objects [{role: 'user'|'assistant', content: string}]
 * @param {string} systemPrompt - System prompt
 * @param {number} maxTokens - Max tokens to generate
 * @param {number} temperature - Temperature
 * @param {string} model - Model to use
 * @returns {Promise<string>} - Generated response
 */
export async function generateGroqChatCompletion(
  messages,
  systemPrompt = 'You are Vezora AI, a helpful and intelligent assistant.',
  maxTokens = 2048,
  temperature = 0.7,
  model = null
) {
  try {
    const groq = getGroqClient();
    // Updated model - llama-3.1-70b-versatile was decommissioned
    const selectedModel = model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    console.log(`🤖 [GROQ] Using model: ${selectedModel}`);
    console.log(`💬 [GROQ] Messages count: ${messages.length}`);

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const startTime = Date.now();
    
    const completion = await groq.chat.completions.create({
      model: selectedModel,
      messages: formattedMessages,
      max_tokens: maxTokens,
      temperature,
      top_p: 1,
      stream: false
    });

    const responseTime = Date.now() - startTime;
    const response = completion.choices[0]?.message?.content || '';

    console.log(`✅ [GROQ] Response generated in ${responseTime}ms`);
    console.log(`📝 [GROQ] Response length: ${response.length} chars`);
    console.log(`🔢 [GROQ] Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);

    return response;
  } catch (error) {
    console.error('❌ [GROQ] Error:', error.message);
    
    if (error.status === 429) {
      throw new Error('Groq rate limit exceeded. Please try again in a moment.');
    }
    
    if (error.status === 401) {
      throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY in .env');
    }
    
    throw new Error(`Failed to generate Groq response: ${error.message}`);
  }
}

/**
 * Check if Groq is available
 * @returns {boolean}
 */
export function isGroqAvailable() {
  return !!process.env.GROQ_API_KEY;
}

/**
 * Test Groq connection
 */
export async function testGroqConnection() {
  try {
    const response = await generateGroqCompletion(
      'Say "Hello from Groq!" if you can hear me.',
      'You are a test assistant.',
      50,
      0.5
    );
    console.log('✅ Groq connection test successful:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Groq connection test failed:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  generateGroqCompletion,
  generateGroqChatCompletion,
  isGroqAvailable,
  testGroqConnection
};
