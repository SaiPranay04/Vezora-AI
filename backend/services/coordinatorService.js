/**
 * Coordinator Service - Orchestrates memory retrieval, LLM call, and memory updates
 * This is the main entry point for context-aware AI responses
 * 
 * FLOW:
 * 1. User Input
 * 2. Retrieve Relevant Context (memories, tasks, decisions)
 * 3. Build Structured Prompt
 * 4. Call LLM
 * 5. Analyze Response for Memory Updates
 * 6. Store Important Information
 */

// Using vector-based retrieval for semantic search
import { getRelevantContext, formatContextForPrompt, getDailySummaryContext } from './retrievalService.vector.js';
import { addProject, addDecision, addPreference } from './memoryService.pg.js';
import { addTask, getTasks, updateTask } from './taskService.js';
import { generateGroqCompletion, isGroqAvailable } from '../utils/groqClient.js';
import { generateChatCompletion, isOllamaHealthy } from '../utils/ollamaClient.js';
import { generateGeminiCompletion, isGeminiAvailable } from '../utils/geminiClient.js';

/**
 * Detect if user input needs context retrieval
 * Skip retrieval for simple commands to improve performance
 */
function needsContextRetrieval(userInput) {
  const input = userInput.toLowerCase();
  
  // Skip context for simple greetings
  const simpleGreetings = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good night'];
  if (simpleGreetings.some(greeting => input === greeting || input === `${greeting} vezora`)) {
    return false;
  }
  
  // Skip context for simple task creation (context not needed to create a task)
  const taskCreationPatterns = [
    'add task', 'add to do', 'add todo', 'create task', 
    'new task', 'remind me to', 'i need to'
  ];
  if (taskCreationPatterns.some(pattern => input.includes(pattern))) {
    return false;
  }
  
  // Skip context for simple questions that don't need history
  const simpleQuestions = [
    'what time is it', 'what\'s the time', 'what date',
    'how are you', 'who are you', 'what can you do'
  ];
  if (simpleQuestions.some(q => input.includes(q))) {
    return false;
  }
  
  // All other queries need context for personalized responses
  return true;
}

/**
 * Main coordinator function - processes user input with context
 */
export async function processWithContext(userInput, options = {}) {
  const {
    userId,
    conversationHistory = [],
    useContext = true,
    aiProvider = 'ollama',
    model = null
  } = options;

  try {
    console.log('\n🧠 [COORDINATOR] Processing input with context');
    console.log(`📝 User: "${userInput.substring(0, 100)}${userInput.length > 100 ? '...' : ''}"`);

    let context = null;
    let contextText = '';

    // ==================== STEP 1: RETRIEVE CONTEXT (INTELLIGENT) ====================
    const shouldRetrieveContext = useContext && needsContextRetrieval(userInput);
    
    if (shouldRetrieveContext) {
      console.log('🔍 [COORDINATOR] Retrieving relevant context...');
      context = await getRelevantContext(userInput, { userId });
      
      if (context.relevanceFound) {
        contextText = formatContextForPrompt(context);
        console.log('✅ [COORDINATOR] Relevant context found');
        console.log(`   - Projects: ${context.projects.length}`);
        console.log(`   - Decisions: ${context.decisions.length}`);
        console.log(`   - Tasks: ${context.tasks.length}`);
        console.log(`   - Preferences: ${context.preferences.length}`);
      } else {
        console.log('ℹ️  [COORDINATOR] No highly relevant context found, using general context');
      }
    } else {
      console.log('⚡ [COORDINATOR] Skipping context retrieval (not needed for this query)');
    }

    // ==================== STEP 2: BUILD STRUCTURED PROMPT ====================
    const systemPrompt = buildSystemPrompt(contextText);
    
    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (limited to last 6 messages to avoid token limit)
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6);
      messages.push(...recentHistory);
    }

    // Add current user message
    messages.push({ role: 'user', content: userInput });

    console.log('📋 [COORDINATOR] Prompt built with context');

    // ==================== STEP 3: CALL LLM ====================
    console.log('🤖 [COORDINATOR] Calling LLM...');
    
    let response;
    try {
      // PRIMARY: Try Groq first (fastest and most reliable)
      if (isGroqAvailable()) {
        console.log('🤖 [COORDINATOR] Using Groq (llama-3.1-70b-versatile)');
        
        // Convert messages to prompt format for Groq
        const systemPrompt = messages[0]?.content || 'You are Vezora AI, a helpful and intelligent assistant.';
        const userMessages = messages.slice(1);
        const prompt = userMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
        
        response = await generateGroqCompletion(
          prompt,
          systemPrompt,
          2048,  // maxTokens
          0.7    // temperature
        );
      }
      // FALLBACK: Ollama (Gemini disabled)
      else if (await isOllamaHealthy()) {
        console.log('🤖 [COORDINATOR] Groq not available, using Ollama');
        const result = await generateChatCompletion(messages, {
          temperature: 0.7,
          maxTokens: 512
        });
        response = result.response || result;
      }
      // No fallback available
      else {
        throw new Error('Groq not available and no fallback AI configured');
      }
    } catch (llmError) {
      console.error('❌ [COORDINATOR] LLM error:', llmError.message);
      
      // CASCADE FALLBACK LOGIC
      try {
        // If Groq failed, try Ollama (Gemini disabled)
        console.log('🔄 [COORDINATOR] Falling back to Ollama...');
        const ollamaReady = await isOllamaHealthy();
        if (!ollamaReady) {
          throw new Error('Groq failed and Ollama is not available');
        }
        const result = await generateChatCompletion(messages, {
          temperature: 0.7,
          maxTokens: 512
        });
        response = result.response || result;
      } catch (fallbackError) {
        console.error('❌ [COORDINATOR] All fallbacks failed:', fallbackError.message);
        throw new Error('Groq is currently unavailable. Please try again later.');
      }
    }

    console.log('✅ [COORDINATOR] LLM response received');

    // ==================== STEP 4: ANALYZE AND UPDATE MEMORY ====================
    if (useContext) {
      console.log('💾 [COORDINATOR] Analyzing response for memory updates...');
      await analyzeAndUpdateMemory(userInput, response, userId);
    }

    return {
      response,
      context: context || {},
      contextUsed: useContext && context?.relevanceFound
    };

  } catch (error) {
    console.error('❌ [COORDINATOR] Error:', error);
    throw error;
  }
}

/**
 * Build system prompt with context
 */
function buildSystemPrompt(contextText) {
  let prompt = `You are Vezora AI, an intelligent personal assistant that helps users manage their projects, tasks, and daily activities.

You have access to the user's memory, including their active projects, important decisions, pending tasks, and preferences.

IMPORTANT GUIDELINES:
- Be concise and actionable
- Reference relevant context when appropriate
- Guide the user rather than making autonomous decisions
- If user mentions new tasks, projects, or decisions, acknowledge them clearly
- Always be helpful and proactive`;

  if (contextText && contextText.length > 0) {
    prompt += `\n\n========== CONTEXT ==========\n${contextText}\n============================`;
  }

  return prompt;
}

/**
 * Analyze user input and AI response using Groq to intelligently detect and extract information
 */
async function analyzeAndUpdateMemory(userInput, aiResponse, userId) {
  // Skip memory updates if no userId
  if (!userId) {
    console.log('⚠️  [MEMORY] Skipping memory updates - no userId');
    return;
  }

  try {
    // ==================== USE GROQ FOR INTELLIGENT CLASSIFICATION ====================
    const classificationPrompt = `Analyze this user message and determine what actions to take:

User Message: "${userInput}"
AI Response: "${aiResponse}"

Classify the user's intent and extract structured data. Return ONLY valid JSON:

{
  "intent": "task_create" | "task_update" | "project" | "decision" | "preference" | "query" | "greeting",
  "task": { "title": "clean task title", "priority": "low|medium|high", "description": "optional" } | null,
  "task_update": { "task_name": "name of existing task to find", "new_status": "completed|in_progress|pending" } | null,
  "project": { "name": "project name", "description": "what it's about" } | null,
  "decision": { "text": "what was decided", "context": "why" } | null,
  "preference": { "text": "user preference", "category": "type" } | null
}

RULES:
- If the user says "mark/update/set [task name] as completed/done/finished" → intent is "task_update", fill task_update field
- If the user says "add/create/new task [name]" OR "remind me to [name]" → intent is "task_create", fill task field
- Extract ONLY the core action for task titles, remove command words like "add task", "remind me to", "to my to do"
- For task_create: Extract clean, actionable title (e.g., "compare master universities" NOT "to my to do compare master universities")
- For task_update: task_name should be the partial name of the task to match (e.g., "check files" from "mark check files as done")
- new_status values: "completed" (done/finished/completed), "in_progress" (started/working on), "pending" (reset/undo)
- If no structured data to extract, set all fields to null
- Return ONLY the JSON object, no other text`;

    const groqResponse = await generateGroqCompletion(
      classificationPrompt,
      'You are a data extraction expert. Return ONLY valid JSON.',
      300,
      0.2
    );

    // Parse Groq's classification
    const jsonMatch = groqResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('⚠️  [MEMORY] No structured data extracted');
      return;
    }

    const extracted = JSON.parse(jsonMatch[0]);
    console.log('🧠 [MEMORY] Groq classification:', extracted.intent);

    // ==================== STORE BASED ON INTENT ====================

    // Handle task STATUS UPDATE (find existing task by name, update its status)
    if (extracted.task_update && extracted.task_update.task_name && extracted.task_update.new_status) {
      try {
        const allTasks = await getTasks(userId, {});
        const searchName = extracted.task_update.task_name.toLowerCase();
        
        // Fuzzy match: find task whose title contains the search term
        const matchedTask = allTasks.find(t => 
          t.title.toLowerCase().includes(searchName) || 
          searchName.includes(t.title.toLowerCase())
        );

        if (matchedTask) {
          await updateTask(userId, matchedTask.id, { status: extracted.task_update.new_status });
          console.log(`✅ [MEMORY] Task "${matchedTask.title}" updated to status: ${extracted.task_update.new_status}`);
        } else {
          console.log(`⚠️  [MEMORY] No task found matching: "${extracted.task_update.task_name}"`);
        }
      } catch (updateErr) {
        console.error('❌ [MEMORY] Task update error:', updateErr.message);
      }
    }

    // Handle task CREATION (only when intent is explicitly task_create)
    if (extracted.intent === 'task_create' && extracted.task && extracted.task.title) {
      await addTask(userId, {
        title: extracted.task.title,
        description: extracted.task.description || userInput,
        priority: extracted.task.priority || 'medium',
        status: 'pending'
      });
      console.log(`✅ [MEMORY] Task stored: "${extracted.task.title}"`);
    }

    if (extracted.project && extracted.project.name) {
      await addProject(userId, extracted.project.name, {
        project_name: extracted.project.name,
        description: extracted.project.description || '',
        status: 'active'
      });
      console.log(`✅ [MEMORY] Project stored: "${extracted.project.name}"`);
    }

    if (extracted.decision && extracted.decision.text) {
      await addDecision(userId, extracted.decision.text, {
        decision_text: extracted.decision.text,
        context: extracted.decision.context || '',
        confidence: 8
      });
      console.log(`✅ [MEMORY] Decision stored: "${extracted.decision.text}"`);
    }

    if (extracted.preference && extracted.preference.text) {
      await addPreference(userId, extracted.preference.text, {
        preference: extracted.preference.text,
        category: extracted.preference.category || 'general'
      });
      console.log(`✅ [MEMORY] Preference stored: "${extracted.preference.text}"`);
    }

  } catch (error) {
    console.error('❌ [MEMORY] Update error:', error.message);
    // Don't fail the whole request if memory update fails
  }
}

// ==================== OLD REGEX EXTRACTION FUNCTIONS REMOVED ====================
// Now using Groq for intelligent semantic extraction in analyzeAndUpdateMemory()

/**
 * Generate daily summary
 */
export async function generateDailySummary(userId = 'default') {
  try {
    console.log('📊 [COORDINATOR] Generating daily summary...');
    
    const summaryContext = await getDailySummaryContext(userId);
    
    if (!summaryContext) {
      return 'No summary data available.';
    }

    const contextText = formatDailySummary(summaryContext);
    
    const prompt = `Based on the following user data, generate a concise daily summary with actionable insights:

${contextText}

Provide a brief, friendly summary highlighting:
1. Most important tasks/deadlines
2. Active projects status
3. Any urgent items requiring attention
4. Positive progress or achievements`;

    const messages = [
      { role: 'system', content: 'You are Vezora AI, providing a helpful daily summary.' },
      { role: 'user', content: prompt }
    ];

    const result = await generateChatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 512
    });
    const summary = result.response || result;
    console.log('✅ [COORDINATOR] Daily summary generated');
    
    return summary;
    
  } catch (error) {
    console.error('❌ [COORDINATOR] Daily summary error:', error);
    return 'Unable to generate daily summary at this time.';
  }
}

/**
 * Format daily summary context
 */
function formatDailySummary(summaryContext) {
  let text = '';

  // Summary stats
  text += `📊 OVERVIEW:\n`;
  text += `  - Active Projects: ${summaryContext.summary.total_active_projects}\n`;
  text += `  - Overdue Tasks: ${summaryContext.summary.total_overdue_tasks}\n`;
  text += `  - Upcoming Deadlines: ${summaryContext.summary.total_upcoming_deadlines}\n`;
  text += `  - In Progress: ${summaryContext.summary.total_in_progress}\n`;
  text += `  - High Priority: ${summaryContext.summary.total_high_priority}\n\n`;

  // Overdue tasks
  if (summaryContext.tasks.overdue.length > 0) {
    text += `⚠️ OVERDUE TASKS:\n`;
    summaryContext.tasks.overdue.forEach(task => {
      text += `  - ${task.title} (Due: ${new Date(task.deadline).toLocaleDateString()})\n`;
    });
    text += '\n';
  }

  // Upcoming deadlines
  if (summaryContext.tasks.upcoming.length > 0) {
    text += `📅 UPCOMING DEADLINES (Next 3 Days):\n`;
    summaryContext.tasks.upcoming.forEach(task => {
      text += `  - ${task.title} (Due: ${new Date(task.deadline).toLocaleDateString()})\n`;
    });
    text += '\n';
  }

  // Active projects
  if (summaryContext.projects.length > 0) {
    text += `📁 ACTIVE PROJECTS:\n`;
    summaryContext.projects.forEach(project => {
      text += `  - ${project.project_name} [${project.priority}]\n`;
    });
    text += '\n';
  }

  return text;
}

export default {
  processWithContext,
  generateDailySummary
};
