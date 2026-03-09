# Memory System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Start the Backend

```bash
cd backend
node index.js
```

You should see:
```
✅ Memory database initialized
✅ Task database initialized
🚀 Server running on http://localhost:5000
```

### Step 2: Verify Memory System is Active

```bash
curl http://localhost:5000/api/structured-memory/stats
```

Expected response:
```json
{
  "success": true,
  "stats": {
    "total_projects": 0,
    "active_projects": 0,
    "total_decisions": 0,
    "total_preferences": 0,
    "high_priority_projects": 0
  }
}
```

---

## 📝 Basic Usage

### **1. Chat with Context (Automatic Memory)**

The easiest way - just chat naturally and the AI will remember important information:

```javascript
// Frontend: Send a message about a project
fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "I'm working on a project called Vezora AI to build an intelligent assistant",
    useContext: true
  })
});

// AI automatically stores:
// - Project: "Vezora AI"
// - Description: "build an intelligent assistant"
// - Status: "active"
```

### **2. Add a Task**

```javascript
fetch('http://localhost:5000/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Complete memory system documentation",
    description: "Write comprehensive documentation for the new memory features",
    priority: "high",
    deadline: "2026-02-15T00:00:00Z"
  })
});
```

### **3. Get Daily Summary**

```bash
curl http://localhost:5000/api/coordinator/daily-summary
```

---

## 🎯 Common Use Cases

### **Use Case 1: Morning Routine**

```javascript
// Get daily summary
const summary = await fetch('http://localhost:5000/api/coordinator/daily-summary');

// Ask "What should I work on today?"
const response = await fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: "What should I work on today?",
    useContext: true
  })
});

// AI responds with context-aware answer:
// "Based on your tasks, you have 2 overdue items and 3 high-priority tasks.
//  I recommend starting with the quarterly report which was due yesterday..."
```

### **Use Case 2: Track Project Progress**

```javascript
// 1. Create project via API
await fetch('http://localhost:5000/api/structured-memory/projects', {
  method: 'POST',
  body: JSON.stringify({
    project_name: "Website Redesign",
    description: "Redesigning company website with modern UI",
    priority: "high",
    status: "active"
  })
});

// 2. Add related tasks
await fetch('http://localhost:5000/api/tasks', {
  method: 'POST',
  body: JSON.stringify({
    title: "Create wireframes",
    related_project: "Website Redesign",
    priority: "high",
    deadline: "2026-02-20T00:00:00Z"
  })
});

// 3. Later, ask AI about project
const response = await fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: "How is the website redesign project going?",
    useContext: true
  })
});

// AI responds with full context:
// "Your Website Redesign project is active with high priority.
//  You have 1 pending task: Create wireframes (due Feb 20).
//  Would you like me to help break this down into smaller steps?"
```

### **Use Case 3: Learn User Preferences**

```javascript
// User says: "I prefer short responses in the morning"
// AI automatically stores as USER_PREFERENCE

// Next morning, AI will respond more concisely:
fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: "Give me a summary of my tasks",
    useContext: true
  })
});

// AI remembers preference and gives concise response
```

---

## 🔍 Testing the System

### **Test 1: Memory Storage**

```bash
# 1. Send a message about a project
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I decided to use React for the frontend", "useContext": true}'

# 2. Verify decision was stored
curl http://localhost:5000/api/structured-memory/decisions

# Expected: Decision about React should be listed
```

### **Test 2: Context Retrieval**

```bash
# 1. Add a project manually
curl -X POST http://localhost:5000/api/structured-memory/projects \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Mobile App",
    "description": "Building iOS and Android app",
    "priority": "high",
    "status": "active"
  }'

# 2. Preview context for related query
curl -X POST http://localhost:5000/api/coordinator/preview-context \
  -H "Content-Type: application/json" \
  -d '{"input": "What mobile features should I prioritize?"}'

# Expected: Should retrieve Mobile App project in context
```

### **Test 3: Task Management**

```bash
# 1. Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test the memory system",
    "priority": "high",
    "deadline": "2026-02-13T00:00:00Z"
  }'

# 2. Get upcoming deadlines
curl http://localhost:5000/api/tasks/query/upcoming?days=3

# 3. Mark task as completed
curl -X POST http://localhost:5000/api/tasks/{task-id}/complete

# 4. Verify task stats
curl http://localhost:5000/api/tasks/stats
```

---

## 🎨 Frontend Integration

### **React Example**

```jsx
import { useState } from 'react';

function ChatWithContext() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);

  const sendMessage = async () => {
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        useContext: true  // Enable context-aware mode
      })
    });
    
    const data = await res.json();
    setResponse(data);
  };

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
      />
      <button onClick={sendMessage}>Send</button>
      
      {response && (
        <div>
          <p>{response.content}</p>
          
          {/* Show context usage */}
          {response.contextUsed && (
            <div className="context-info">
              ℹ️ Using context: 
              {response.contextSummary.projects} projects, 
              {response.contextSummary.tasks} tasks
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### **Daily Summary Widget**

```jsx
function DailySummary() {
  const [summary, setSummary] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/coordinator/daily-summary')
      .then(res => res.json())
      .then(data => setSummary(data.summary));
  }, []);

  return (
    <div className="daily-summary">
      <h3>📊 Daily Summary</h3>
      <pre>{summary}</pre>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### **"Context not found" or empty responses**

**Solution:** Add some data first:

```bash
# Add a project
curl -X POST http://localhost:5000/api/structured-memory/projects \
  -H "Content-Type: application/json" \
  -d '{"project_name": "Test Project", "description": "Testing memory", "priority": "high", "status": "active"}'

# Add a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task", "priority": "medium"}'

# Now try chatting
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What projects am I working on?", "useContext": true}'
```

### **Backend not starting**

**Check logs for:**
```
❌ Failed to load memory database
❌ Failed to load task database
```

**Solution:** Ensure `backend/data/` directory exists:
```bash
mkdir -p backend/data
```

### **Memory not being saved**

**Enable debug logging in coordinatorService.js:**
```javascript
// Look for these logs:
💾 [COORDINATOR] Analyzing response for memory updates...
✅ [MEMORY] Task stored: "..."
✅ [MEMORY] Project stored: "..."
```

**Common issue:** Input doesn't match detection patterns.

**Fix:** Use keywords like:
- Tasks: "I need to", "should", "task"
- Projects: "working on", "project", "building"
- Decisions: "decided", "will", "going to"
- Preferences: "prefer", "always", "usually"

---

## 📚 Next Steps

1. ✅ **Read full documentation:** `docs/MEMORY_AND_CONTEXT_SYSTEM.md`
2. ✅ **Explore API endpoints:** Test all routes listed in docs
3. ✅ **Integrate with frontend:** Add context-aware chat to your UI
4. ✅ **Customize retrieval:** Adjust relevance scoring in `retrievalService.js`
5. ✅ **Add vector embeddings:** Upgrade to semantic search

---

## 💡 Tips

- **Start simple:** Let the AI automatically store information from natural conversation
- **Use daily summaries:** Great for morning routine
- **Review memory periodically:** Check stats and clean up old data
- **Disable context for casual chat:** Save processing time for quick questions
- **Combine with tools:** Context works great with Gmail/Calendar integrations

---

**Happy coding! 🎉**

For issues or questions, check: `docs/MEMORY_AND_CONTEXT_SYSTEM.md`
