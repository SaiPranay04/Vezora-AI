/**
 * Coordinator Service - Orchestrates memory retrieval, LLM call, and memory updates
 * This is the main entry point for context-aware AI responses
 * 
 * FLOW:
 * 1. User Input
 * 2. Classify Intent (fast Groq call)
 * 3. Execute Task Actions (add/delete/update/list) BEFORE LLM response
 * 4. Retrieve Relevant Context (memories, tasks, decisions)
 * 5. Build Structured Prompt (with action confirmation context)
 * 6. Call LLM
 * 7. Analyze Response for Memory Updates (post-response, non-blocking)
 */

// Using vector-based retrieval for semantic search
import { getRelevantContext, formatContextForPrompt, getDailySummaryContext } from './retrievalService.vector.js';
import { addProject, addDecision, addPreference } from './memoryService.pg.js';
import { addTask, getTasks, updateTask, deleteTask } from './taskService.js';
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

  // Skip context for task deletion/listing (we handle these directly)
  const taskActionPatterns = [
    'delete task', 'remove task', 'delete the', 'remove the',
    'show my tasks', 'list my tasks', 'list tasks', 'what are my tasks',
    'show my to-do', 'show my todos', 'what\'s on my to-do',
    'mark', 'complete', 'finish', 'done with'
  ];
  if (taskActionPatterns.some(pattern => input.includes(pattern))) {
    return false;
  }
  
  // All other queries need context for personalized responses
  return true;
}

// ==================== INTENT CLASSIFICATION (PRE-RESPONSE) ====================

/**
 * Classify user intent using Groq BEFORE generating the main LLM response.
 * This allows us to execute task actions and inject confirmation context.
 * Returns structured intent data.
 */
async function classifyIntent(userInput, userId) {
  try {
    if (!isGroqAvailable()) {
      console.log('⚠️  [INTENT] Groq not available, skipping intent classification');
      return { intent: 'general_chat' };
    }

    const classificationPrompt = `Analyze this user message and determine the intent. Return ONLY valid JSON.

User Message: "${userInput}"

Classify the intent into exactly ONE of these categories:

{
  "intent": "task_create" | "task_delete" | "task_update" | "task_list" | "general_chat" | "project" | "decision" | "preference" | "greeting",
  "task_create": { "title": "clean task title", "priority": "low|medium|high", "description": "optional description", "deadline": "ISO date string or null" } | null,
  "task_delete": { "task_name": "partial name to search for" } | null,
  "task_update": { "task_name": "partial name to search for", "updates": { "status": "completed|in_progress|pending", "title": "new title or null", "priority": "low|medium|high or null", "deadline": "ISO date or null" } } | null,
  "task_list": { "filter": "all|pending|in_progress|completed|high_priority|overdue" } | null
}

RULES:
- "add task buy groceries" / "remind me to buy milk" / "add buy groceries to my to-do" → intent: "task_create"
- "delete the grocery task" / "remove buy milk from my to-do" → intent: "task_delete"
- "mark groceries as done" / "complete the report task" / "update meeting to 6pm" → intent: "task_update"
- "show my tasks" / "what's on my to-do list" / "list pending tasks" → intent: "task_list"
- For task_create: Extract ONLY the core task title. Remove command words like "add task", "remind me to", "to my to do"
- For task_delete/task_update: task_name should be a partial name to fuzzy-match against existing tasks
- For task_update status: "done"/"finished"/"completed" → "completed", "start"/"working on" → "in_progress", "reset"/"undo" → "pending"
- If the message is a general question, conversation, or anything non-task → intent: "general_chat"
- Return ONLY the JSON object, no other text`;

    const groqResponse = await generateGroqCompletion(
      classificationPrompt,
      'You are a precise intent classifier. Return ONLY valid JSON, no explanation.',
      400,
      0.1 // Very low temperature for consistent classification
    );

    // Parse JSON from response
    const jsonMatch = groqResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('⚠️  [INTENT] No JSON found in classification response');
      return { intent: 'general_chat' };
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log(`🎯 [INTENT] Classified as: ${result.intent}`);
    return result;

  } catch (error) {
    console.error('❌ [INTENT] Classification error:', error.message);
    return { intent: 'general_chat' };
  }
}

/**
 * Execute task actions based on classified intent.
 * Returns a confirmation message to inject into the LLM prompt.
 */
async function executeTaskAction(intent, userId) {
  const confirmations = [];

  try {
    switch (intent.intent) {
      case 'task_create': {
        if (!intent.task_create?.title) break;

        // Duplicate detection: check if a similar task already exists
        const existingTasks = await getTasks(userId, {});
        const normalizedTitle = intent.task_create.title.toLowerCase().trim();
        const duplicate = existingTasks.find(t => 
          t.title.toLowerCase().trim() === normalizedTitle ||
          t.title.toLowerCase().includes(normalizedTitle) && normalizedTitle.length > 5
        );

        if (duplicate && duplicate.status !== 'completed') {
          confirmations.push(`⚠️ A similar task already exists: "${duplicate.title}" (status: ${duplicate.status}). No duplicate was created.`);
          break;
        }

        const newTask = await addTask(userId, {
          title: intent.task_create.title,
          description: intent.task_create.description || '',
          priority: intent.task_create.priority || 'medium',
          deadline: intent.task_create.deadline || null,
          status: 'pending'
        });
        confirmations.push(`✅ Task created: "${newTask.title}" [${newTask.priority} priority]${newTask.deadline ? ` — due ${new Date(newTask.deadline).toLocaleDateString()}` : ''}`);
        console.log(`✅ [ACTION] Task created: "${newTask.title}"`);
        break;
      }

      case 'task_delete': {
        if (!intent.task_delete?.task_name) break;

        const allTasks = await getTasks(userId, {});
        const matchedTask = fuzzyMatchTask(allTasks, intent.task_delete.task_name);

        if (matchedTask) {
          await deleteTask(userId, matchedTask.id);
          confirmations.push(`✅ Task deleted: "${matchedTask.title}"`);
          console.log(`✅ [ACTION] Task deleted: "${matchedTask.title}"`);
        } else {
          confirmations.push(`⚠️ No task found matching "${intent.task_delete.task_name}". Available tasks: ${allTasks.filter(t => t.status !== 'completed').map(t => `"${t.title}"`).slice(0, 5).join(', ')}`);
          console.log(`⚠️ [ACTION] No task found matching: "${intent.task_delete.task_name}"`);
        }
        break;
      }

      case 'task_update': {
        if (!intent.task_update?.task_name) break;

        const allTasks = await getTasks(userId, {});
        const matchedTask = fuzzyMatchTask(allTasks, intent.task_update.task_name);

        if (matchedTask) {
          const updates = {};
          if (intent.task_update.updates?.status) updates.status = intent.task_update.updates.status;
          if (intent.task_update.updates?.title) updates.title = intent.task_update.updates.title;
          if (intent.task_update.updates?.priority) updates.priority = intent.task_update.updates.priority;
          if (intent.task_update.updates?.deadline) updates.deadline = intent.task_update.updates.deadline;

          if (Object.keys(updates).length > 0) {
            await updateTask(userId, matchedTask.id, updates);
            const changeDescriptions = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(', ');
            confirmations.push(`✅ Task updated: "${matchedTask.title}" → ${changeDescriptions}`);
            console.log(`✅ [ACTION] Task updated: "${matchedTask.title}" → ${changeDescriptions}`);
          }
        } else {
          confirmations.push(`⚠️ No task found matching "${intent.task_update.task_name}". Available tasks: ${allTasks.filter(t => t.status !== 'completed').map(t => `"${t.title}"`).slice(0, 5).join(', ')}`);
        }
        break;
      }

      case 'task_list': {
        const filter = intent.task_list?.filter || 'all';
        let tasks;

        switch (filter) {
          case 'pending':
            tasks = await getTasks(userId, { status: 'pending' });
            break;
          case 'in_progress':
            tasks = await getTasks(userId, { status: 'in_progress' });
            break;
          case 'completed':
            tasks = await getTasks(userId, { status: 'completed' });
            break;
          case 'high_priority':
            tasks = await getTasks(userId, { priority: 'high' });
            break;
          default:
            tasks = await getTasks(userId, {});
        }

        if (tasks.length === 0) {
          confirmations.push(`📋 No ${filter !== 'all' ? filter.replace('_', ' ') + ' ' : ''}tasks found.`);
        } else {
          const taskList = tasks.map((t, i) => {
            const statusIcon = t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '🔄' : '⬜';
            const priorityTag = t.priority === 'high' ? ' 🔴' : t.priority === 'medium' ? ' 🟡' : '';
            const deadline = t.deadline ? ` (due ${new Date(t.deadline).toLocaleDateString()})` : '';
            return `${i + 1}. ${statusIcon} ${t.title}${priorityTag}${deadline}`;
          }).join('\n');
          confirmations.push(`📋 **Your ${filter !== 'all' ? filter.replace('_', ' ') + ' ' : ''}tasks (${tasks.length}):**\n${taskList}`);
        }
        console.log(`📋 [ACTION] Listed ${tasks.length} tasks (filter: ${filter})`);
        break;
      }
    }
  } catch (error) {
    console.error('❌ [ACTION] Task action error:', error.message);
    confirmations.push(`❌ Failed to execute task action: ${error.message}`);
  }

  return confirmations;
}

/**
 * Fuzzy match a task by name with scoring.
 * Returns the best matching task or null.
 */
function fuzzyMatchTask(tasks, searchName) {
  if (!searchName || !tasks.length) return null;

  const search = searchName.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;

  for (const task of tasks) {
    const title = task.title.toLowerCase();
    let score = 0;

    // Exact match
    if (title === search) {
      return task; // Perfect match, return immediately
    }

    // Title contains search term
    if (title.includes(search)) {
      score = search.length / title.length; // Prefer shorter titles that match
      score += 0.5; // Bonus for containing
    }

    // Search term contains title
    if (search.includes(title)) {
      score = title.length / search.length;
      score += 0.3;
    }

    // Word overlap scoring
    const searchWords = search.split(/\s+/);
    const titleWords = title.split(/\s+/);
    const commonWords = searchWords.filter(w => titleWords.some(tw => tw.includes(w) || w.includes(tw)));
    if (commonWords.length > 0) {
      score += (commonWords.length / Math.max(searchWords.length, titleWords.length)) * 0.4;
    }

    if (score > bestScore && score >= 0.3) { // Minimum threshold
      bestScore = score;
      bestMatch = task;
    }
  }

  return bestMatch;
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

    // ==================== STEP 1: CLASSIFY INTENT (PRE-RESPONSE) ====================
    const intent = await classifyIntent(userInput, userId);
    
    // ==================== STEP 2: EXECUTE TASK ACTIONS ====================
    let actionConfirmations = [];
    const isTaskAction = ['task_create', 'task_delete', 'task_update', 'task_list'].includes(intent.intent);

    if (isTaskAction && userId) {
      console.log(`⚡ [COORDINATOR] Executing task action: ${intent.intent}`);
      actionConfirmations = await executeTaskAction(intent, userId);
    }

    // ==================== STEP 3: RETRIEVE CONTEXT (INTELLIGENT) ====================
    let context = null;
    let contextText = '';
    const shouldRetrieveContext = useContext && needsContextRetrieval(userInput);
    
    if (shouldRetrieveContext) {
      console.log('🔍 [COORDINATOR] Retrieving relevant context...');
      try {
        context = await getRelevantContext(userInput, { userId });
        
        if (context.relevanceFound) {
          contextText = formatContextForPrompt(context);
          console.log('✅ [COORDINATOR] Relevant context found');
        }
      } catch (ctxError) {
        console.log('⚠️  [COORDINATOR] Context retrieval failed, continuing without:', ctxError.message);
      }
    } else {
      console.log('⚡ [COORDINATOR] Skipping context retrieval (not needed for this query)');
    }

    // ==================== STEP 4: BUILD STRUCTURED PROMPT ====================
    const systemPrompt = buildSystemPrompt(contextText, actionConfirmations);
    
    // For pure task_list responses, we can return the list directly
    // without an LLM call to save latency and cost
    if (intent.intent === 'task_list' && actionConfirmations.length > 0) {
      console.log('⚡ [COORDINATOR] Returning task list directly (no LLM call needed)');
      return {
        response: actionConfirmations.join('\n\n'),
        context: context || {},
        contextUsed: false,
        taskAction: intent.intent,
        actionConfirmations
      };
    }

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

    console.log('📋 [COORDINATOR] Prompt built');

    // ==================== STEP 5: CALL LLM ====================
    console.log('🤖 [COORDINATOR] Calling LLM...');
    
    let response;
    try {
      // PRIMARY: Try Groq first (fastest and most reliable)
      if (isGroqAvailable()) {
        console.log('🤖 [COORDINATOR] Using Groq');
        
        // Convert messages to prompt format for Groq
        const sysPrompt = messages[0]?.content || 'You are Vezora AI, a helpful and intelligent assistant.';
        const userMessages = messages.slice(1);
        const prompt = userMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
        
        response = await generateGroqCompletion(
          prompt,
          sysPrompt,
          2048,
          0.7
        );
      }
      // FALLBACK: Ollama
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
        throw new Error('No AI provider available');
      }
    } catch (llmError) {
      console.error('❌ [COORDINATOR] LLM error:', llmError.message);
      
      // If we have task action confirmations, return those even if LLM fails
      if (actionConfirmations.length > 0) {
        return {
          response: actionConfirmations.join('\n\n'),
          context: context || {},
          contextUsed: false,
          taskAction: intent.intent,
          actionConfirmations
        };
      }
      
      // CASCADE FALLBACK
      try {
        console.log('🔄 [COORDINATOR] Falling back to Ollama...');
        const ollamaReady = await isOllamaHealthy();
        if (!ollamaReady) {
          throw new Error('All AI providers unavailable');
        }
        const result = await generateChatCompletion(messages, {
          temperature: 0.7,
          maxTokens: 512
        });
        response = result.response || result;
      } catch (fallbackError) {
        console.error('❌ [COORDINATOR] All fallbacks failed:', fallbackError.message);
        throw new Error('AI is currently unavailable. Please try again later.');
      }
    }

    console.log('✅ [COORDINATOR] LLM response received');

    // ==================== STEP 6: POST-RESPONSE MEMORY ANALYSIS (NON-BLOCKING) ====================
    // Only for non-task intents (task actions are already handled in Step 2)
    if (useContext && !isTaskAction && userId) {
      // Fire and forget — don't block response
      analyzeAndUpdateMemory(userInput, response, userId).catch(err => {
        console.error('⚠️  [MEMORY] Background update failed:', err.message);
      });
    }

    return {
      response,
      context: context || {},
      contextUsed: useContext && context?.relevanceFound,
      taskAction: isTaskAction ? intent.intent : null,
      actionConfirmations
    };

  } catch (error) {
    console.error('❌ [COORDINATOR] Error:', error);
    throw error;
  }
}

/**
 * Build system prompt with context and action confirmations
 */
function buildSystemPrompt(contextText, actionConfirmations = []) {
  let prompt = `You are Vezora AI, an intelligent personal assistant that helps users manage their projects, tasks, and daily activities.

You have access to the user's memory, including their active projects, important decisions, pending tasks, and preferences.

IMPORTANT GUIDELINES:
- Be concise and actionable
- Reference relevant context when appropriate
- Guide the user rather than making autonomous decisions
- If a task action was just performed, confirm it naturally and briefly
- Always be helpful and proactive`;

  // Inject action confirmations so the LLM knows what just happened
  if (actionConfirmations.length > 0) {
    prompt += `\n\n========== ACTION JUST PERFORMED ==========\n`;
    prompt += actionConfirmations.join('\n');
    prompt += `\n============================================`;
    prompt += `\nAcknowledge the above action naturally in your response. Be brief — the user already sees the action result.`;
  }

  if (contextText && contextText.length > 0) {
    prompt += `\n\n========== CONTEXT ==========\n${contextText}\n============================`;
  }

  return prompt;
}

/**
 * Post-response memory analysis for non-task intents (projects, decisions, preferences)
 * This runs in the background to avoid blocking the response
 */
async function analyzeAndUpdateMemory(userInput, aiResponse, userId) {
  if (!userId) return;

  try {
    if (!isGroqAvailable()) return;

    const classificationPrompt = `Analyze this conversation exchange and extract structured data if present:

User: "${userInput}"
AI: "${typeof aiResponse === 'string' ? aiResponse.substring(0, 300) : ''}"

Return ONLY valid JSON:
{
  "project": { "name": "project name", "description": "what it's about" } | null,
  "decision": { "text": "what was decided", "context": "why" } | null,
  "preference": { "text": "user preference", "category": "type" } | null
}

RULES:
- Extract ONLY if the user clearly mentions a project, decision, or preference
- Do NOT extract task-related data (tasks are handled separately)
- If nothing to extract, return all null values
- Return ONLY the JSON object`;

    const groqResponse = await generateGroqCompletion(
      classificationPrompt,
      'You are a data extraction expert. Return ONLY valid JSON.',
      200,
      0.2
    );

    const jsonMatch = groqResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const extracted = JSON.parse(jsonMatch[0]);

    if (extracted.project?.name) {
      await addProject(userId, extracted.project.name, {
        project_name: extracted.project.name,
        description: extracted.project.description || '',
        status: 'active'
      });
      console.log(`✅ [MEMORY] Project stored: "${extracted.project.name}"`);
    }

    if (extracted.decision?.text) {
      await addDecision(userId, extracted.decision.text, {
        decision_text: extracted.decision.text,
        context: extracted.decision.context || '',
        confidence: 8
      });
      console.log(`✅ [MEMORY] Decision stored: "${extracted.decision.text}"`);
    }

    if (extracted.preference?.text) {
      await addPreference(userId, extracted.preference.text, {
        preference: extracted.preference.text,
        category: extracted.preference.category || 'general'
      });
      console.log(`✅ [MEMORY] Preference stored: "${extracted.preference.text}"`);
    }

  } catch (error) {
    console.error('❌ [MEMORY] Update error:', error.message);
  }
}

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

    let summary;
    if (isGroqAvailable()) {
      summary = await generateGroqCompletion(
        prompt,
        'You are Vezora AI, providing a helpful daily summary.',
        512,
        0.7
      );
    } else {
      const result = await generateChatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 512
      });
      summary = result.response || result;
    }
    
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

  text += `📊 OVERVIEW:\n`;
  text += `  - Active Projects: ${summaryContext.summary.total_active_projects}\n`;
  text += `  - Overdue Tasks: ${summaryContext.summary.total_overdue_tasks}\n`;
  text += `  - Upcoming Deadlines: ${summaryContext.summary.total_upcoming_deadlines}\n`;
  text += `  - In Progress: ${summaryContext.summary.total_in_progress}\n`;
  text += `  - High Priority: ${summaryContext.summary.total_high_priority}\n\n`;

  if (summaryContext.tasks.overdue.length > 0) {
    text += `⚠️ OVERDUE TASKS:\n`;
    summaryContext.tasks.overdue.forEach(task => {
      text += `  - ${task.title} (Due: ${new Date(task.deadline).toLocaleDateString()})\n`;
    });
    text += '\n';
  }

  if (summaryContext.tasks.upcoming.length > 0) {
    text += `📅 UPCOMING DEADLINES (Next 3 Days):\n`;
    summaryContext.tasks.upcoming.forEach(task => {
      text += `  - ${task.title} (Due: ${new Date(task.deadline).toLocaleDateString()})\n`;
    });
    text += '\n';
  }

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
