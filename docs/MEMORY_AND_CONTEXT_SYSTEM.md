# Memory and Context System - Vezora AI

## Overview

Vezora AI now features a **persistent memory and task context layer** that enables the assistant to remember long-term information and retrieve relevant context before responding. This upgrade makes the AI more intelligent and context-aware without converting it into an autonomous multi-agent system.

## Architecture

```
User Input
    ↓
Coordinator Layer
    ↓
Memory Retrieval + Task Retrieval
    ↓
LLM Response Generation
    ↓
Memory Update (store important info)
```

### Key Principle
**LLM is NEVER called before context retrieval.** This ensures the AI always has access to relevant information before formulating a response.

---

## Components

### 1. Memory Service (`backend/services/memoryService.js`)

Stores structured summaries (NOT full conversations) in three categories:

#### **PROJECT_MEMORY**
```javascript
{
  id: "uuid",
  project_name: "Vezora AI Enhancement",
  description: "Adding memory and context system",
  status: "active", // active, paused, completed
  priority: "high", // low, medium, high
  last_updated: "2026-02-12T...",
  created_at: "2026-02-10T..."
}
```

#### **DECISION_MEMORY**
```javascript
{
  id: "uuid",
  decision_text: "Using SQLite for local storage",
  related_project: "project_id",
  timestamp: "2026-02-12T...",
  importance_score: 8, // 1-10 scale
  context: "Decided after evaluating JSON vs SQLite"
}
```

#### **USER_PREFERENCE**
```javascript
{
  id: "uuid",
  preference: "Prefer concise responses in morning",
  category: "communication", // general, workflow, communication, formatting
  confidence: 0.8, // 0-1 confidence score
  last_updated: "2026-02-12T..."
}
```

**Storage:** JSON file at `backend/data/structured-memory.json`

---

### 2. Task Service (`backend/services/taskService.js`)

Manages tasks with full CRUD operations and specialized queries.

#### **Task Schema**
```javascript
{
  id: "uuid",
  title: "Complete memory system documentation",
  description: "Write comprehensive docs",
  status: "in_progress", // pending, in_progress, completed
  priority: "high", // low, medium, high
  deadline: "2026-02-15T00:00:00Z", // ISO string or null
  created_at: "2026-02-12T...",
  last_updated: "2026-02-12T...",
  related_project: "project_id",
  tags: ["documentation", "feature"]
}
```

#### **Key Features**
- ✅ Add, update, delete tasks
- ✅ Query by status, priority, project
- ✅ Get upcoming deadlines (next N days)
- ✅ Get overdue tasks
- ✅ Get high priority tasks
- ✅ Task statistics

**Storage:** JSON file at `backend/data/tasks.json`

---

### 3. Retrieval Service (`backend/services/retrievalService.js`)

Retrieves relevant context before LLM call using keyword-based matching (upgradeable to vector embeddings).

#### **Main Function: `getRelevantContext(userInput)`**

Returns:
```javascript
{
  projects: [...],        // Relevant active projects
  decisions: [...],       // Recent important decisions
  tasks: [...],           // Relevant tasks (prioritized)
  preferences: [...],     // User preferences
  taskSummary: {
    overdue: 2,
    upcoming: 5,
    inProgress: 3,
    highPriority: 4
  },
  relevanceFound: true    // Whether relevant context was found
}
```

#### **Retrieval Strategy**
1. Calculate relevance score for each item based on keyword matching
2. Sort by relevance and importance
3. Return top N most relevant items
4. If no highly relevant items found, return high-priority items

---

### 4. Coordinator Service (`backend/services/coordinatorService.js`)

**Main orchestrator** that coordinates all components.

#### **Flow:**
```javascript
async function processWithContext(userInput, options) {
  // 1. Retrieve relevant context
  const context = await getRelevantContext(userInput);
  
  // 2. Format context for LLM
  const contextText = formatContextForPrompt(context);
  
  // 3. Build structured prompt
  const systemPrompt = buildSystemPrompt(contextText);
  
  // 4. Call LLM with context
  const response = await generateChatResponse(messages);
  
  // 5. Analyze response and update memory
  await analyzeAndUpdateMemory(userInput, response);
  
  return { response, context };
}
```

#### **Memory Update Logic**

Automatically detects and stores:

| Detection Pattern | Storage Type | Example |
|------------------|--------------|---------|
| "task", "need to", "should" | Task | "I need to finish the report by Friday" |
| "project", "working on", "building" | Project | "Working on the AI memory system" |
| "decided", "will", "going to" | Decision | "Decided to use SQLite for storage" |
| "prefer", "always", "usually" | Preference | "I prefer concise responses" |

**Important:** Only stores meaningful information, NOT casual conversation.

---

## API Endpoints

### **Structured Memory**

```bash
# Projects
POST   /api/structured-memory/projects          # Add/update project
GET    /api/structured-memory/projects          # Get all projects
GET    /api/structured-memory/projects/:id      # Get project by ID
PATCH  /api/structured-memory/projects/:id/status  # Update status
DELETE /api/structured-memory/projects/:id      # Delete project

# Decisions
POST   /api/structured-memory/decisions         # Add decision
GET    /api/structured-memory/decisions         # Get decisions (with filters)
GET    /api/structured-memory/decisions/recent-important  # Get recent important

# Preferences
POST   /api/structured-memory/preferences       # Add/update preference
GET    /api/structured-memory/preferences       # Get preferences
DELETE /api/structured-memory/preferences/:id   # Delete preference

# Stats
GET    /api/structured-memory/stats             # Get memory statistics
DELETE /api/structured-memory/clear-all         # Clear all memory (requires confirmation)
```

### **Tasks**

```bash
# CRUD
POST   /api/tasks                   # Create task
GET    /api/tasks                   # Get all tasks (with filters)
GET    /api/tasks/:id               # Get task by ID
PUT    /api/tasks/:id               # Update task
DELETE /api/tasks/:id               # Delete task

# Status Updates
POST   /api/tasks/:id/complete      # Mark as completed
POST   /api/tasks/:id/start         # Mark as in progress

# Specialized Queries
GET    /api/tasks/query/pending          # Get pending tasks
GET    /api/tasks/query/in-progress      # Get in-progress tasks
GET    /api/tasks/query/completed        # Get completed tasks
GET    /api/tasks/query/upcoming         # Get upcoming deadlines
GET    /api/tasks/query/overdue          # Get overdue tasks
GET    /api/tasks/query/high-priority    # Get high priority tasks

# Stats
GET    /api/tasks/stats             # Get task statistics
```

### **Coordinator**

```bash
GET    /api/coordinator/daily-summary      # Generate daily summary
POST   /api/coordinator/preview-context    # Preview context for input
```

---

## Usage Examples

### **Example 1: Chat with Context**

```javascript
// Frontend request
fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What should I work on today?",
    useContext: true  // Enable context-aware mode
  })
});

// Response includes context summary
{
  content: "Based on your tasks, you should prioritize...",
  contextUsed: true,
  contextSummary: {
    projects: 2,
    tasks: 5,
    decisions: 1,
    preferences: 0
  }
}
```

### **Example 2: Add Task via Chat**

```javascript
// User says: "I need to finish the report by Friday"
// AI automatically stores:
{
  title: "finish the report",
  deadline: "2026-02-14T00:00:00Z",
  priority: "medium",
  status: "pending"
}
```

### **Example 3: Daily Summary**

```bash
curl http://localhost:5000/api/coordinator/daily-summary
```

```json
{
  "success": true,
  "summary": "Good morning! Here's your day:\n\n⚠️ You have 2 overdue tasks that need attention...\n\n📅 3 upcoming deadlines in the next 3 days...\n\n📁 Active Projects:\n- Vezora Memory System [high]\n- Documentation Update [medium]",
  "generated_at": "2026-02-12T08:00:00Z"
}
```

### **Example 4: Manually Add Project**

```bash
curl -X POST http://localhost:5000/api/structured-memory/projects \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Vezora Mobile App",
    "description": "Building mobile version of Vezora",
    "status": "active",
    "priority": "high"
  }'
```

### **Example 5: Get Overdue Tasks**

```bash
curl http://localhost:5000/api/tasks/query/overdue
```

```json
{
  "success": true,
  "count": 2,
  "tasks": [
    {
      "id": "task-123",
      "title": "Submit quarterly report",
      "deadline": "2026-02-10T00:00:00Z",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

---

## Configuration

### **Environment Variables**

```bash
# Enable/disable context-aware mode (default: enabled)
ENABLE_CONTEXT_MODE=true

# Maximum context items to retrieve
MAX_CONTEXT_PROJECTS=3
MAX_CONTEXT_DECISIONS=3
MAX_CONTEXT_TASKS=5
MAX_CONTEXT_PREFERENCES=3
```

### **Chat Request Options**

```javascript
{
  message: "Your message",
  useContext: true,           // Enable context retrieval
  includeMemory: false,       // Use old memory system (deprecated)
  userId: "default"           // User identifier
}
```

---

## Technical Details

### **Keyword-Based Relevance Scoring**

Currently uses simple keyword matching:
- Extracts keywords from user input (words > 2 chars)
- Scores each memory item based on keyword presence
- Bonus points for exact phrase match

### **Upgrade Path to Vector Embeddings**

The retrieval service is designed to be easily upgraded to vector embeddings:

```javascript
// Future enhancement
import { embed } from '../utils/ollamaClient.js';

async function calculateEmbeddingScore(text, query) {
  const textEmbedding = await embed(text);
  const queryEmbedding = await embed(query);
  return cosineSimilarity(textEmbedding, queryEmbedding);
}
```

### **Memory Limits**

To prevent database bloat:
- **Decisions:** Stores last 50 decisions
- **Projects:** No limit (user can manually archive)
- **Preferences:** No limit
- **Tasks:** No limit (user can delete completed tasks)

---

## Best Practices

### **What to Store**

✅ **Store:**
- Important decisions
- Project information
- Task deadlines
- User preferences
- Long-term goals

❌ **Don't Store:**
- Casual conversation
- Greetings
- Questions without actionable information
- Temporary queries

### **Memory Hygiene**

Periodically review and clean up:
```bash
# Get memory statistics
curl http://localhost:5000/api/structured-memory/stats

# Delete old completed projects
curl -X DELETE http://localhost:5000/api/structured-memory/projects/:id

# Archive completed tasks
curl http://localhost:5000/api/tasks/query/completed?limit=50
```

---

## Troubleshooting

### **Context not being retrieved**

1. Check if context mode is enabled:
   ```javascript
   { message: "...", useContext: true }
   ```

2. Verify memory data exists:
   ```bash
   curl http://localhost:5000/api/structured-memory/stats
   ```

3. Check retrieval logs in backend console:
   ```
   🧠 [COORDINATOR] Processing input with context
   🔍 [COORDINATOR] Retrieving relevant context...
   ✅ [COORDINATOR] Relevant context found
   ```

### **Memory not being saved**

1. Check coordinator logs:
   ```
   💾 [COORDINATOR] Analyzing response for memory updates...
   ✅ [MEMORY] Task stored: "..."
   ```

2. Verify detection keywords are present in user input

3. Ensure input is meaningful (not just "hello" or "thanks")

### **Performance issues**

1. Limit context retrieval size in retrieval service
2. Disable context mode for casual chat:
   ```javascript
   { message: "hi", useContext: false }
   ```

---

## Future Enhancements

### **Planned Features**

1. ✨ **Vector Embeddings:** Replace keyword matching with semantic embeddings
2. ✨ **SQLite Migration:** Move from JSON to SQLite for better performance
3. ✨ **Auto-categorization:** Use AI to automatically categorize decisions and preferences
4. ✨ **Memory Compression:** Automatically summarize old memories to save space
5. ✨ **User Memory Insights:** Dashboard showing memory utilization and patterns

### **Advanced Features**

1. 🔮 **Multi-user Support:** Separate memory spaces for different users
2. 🔮 **Memory Sharing:** Share projects/tasks between users
3. 🔮 **Time-based Context:** Retrieve context based on time of day/week
4. 🔮 **Proactive Suggestions:** AI suggests tasks based on context

---

## File Structure

```
backend/
├── services/
│   ├── memoryService.js       # Structured memory storage
│   ├── taskService.js          # Task management
│   ├── retrievalService.js     # Context retrieval
│   └── coordinatorService.js   # Main orchestrator
├── routes/
│   ├── structuredMemory.js     # Memory API routes
│   ├── tasks.js                # Task API routes
│   └── coordinator.js          # Coordinator API routes
└── data/
    ├── structured-memory.json  # Memory database
    └── tasks.json              # Task database
```

---

## Summary

The Memory and Context System transforms Vezora AI from a stateless chatbot into an **intelligent assistant with persistent memory**. It:

✅ Remembers projects, decisions, and preferences
✅ Retrieves relevant context before responding
✅ Automatically stores important information
✅ Provides daily summaries and task management
✅ Maintains low latency and works locally

**Key Advantage:** The assistant guides the user with full context awareness, without becoming an autonomous multi-agent system.

---

**For questions or improvements, see: [GitHub Issues](https://github.com/vezora-ai/vezora/issues)**
