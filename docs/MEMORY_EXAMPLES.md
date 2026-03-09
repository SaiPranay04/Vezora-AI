# Memory System - Practical Examples

## Real-World Usage Scenarios

### 🎯 Scenario 1: Software Development Project

#### **Day 1: Project Kickoff**

```javascript
// User: "I'm starting a new project called Vezora Mobile App. 
//        It will be built with React Native for iOS and Android."

// Behind the scenes, AI stores:
POST /api/structured-memory/projects
{
  "project_name": "Vezora Mobile App",
  "description": "Built with React Native for iOS and Android",
  "status": "active",
  "priority": "medium"
}

// User: "I decided to use Firebase for the backend because it's 
//        fast and has good React Native support."

// AI stores decision:
POST /api/structured-memory/decisions
{
  "decision_text": "Use Firebase for backend",
  "related_project": "Vezora Mobile App",
  "importance_score": 7,
  "context": "Fast and has good React Native support"
}
```

#### **Day 2: Adding Tasks**

```javascript
// User: "I need to set up the Firebase project by Friday and 
//        create the login screen by next week."

// AI automatically creates tasks:
POST /api/tasks
{
  "title": "set up the Firebase project",
  "deadline": "2026-02-14T00:00:00Z",
  "related_project": "Vezora Mobile App",
  "priority": "medium"
}

POST /api/tasks
{
  "title": "create the login screen",
  "deadline": "2026-02-19T00:00:00Z",
  "related_project": "Vezora Mobile App",
  "priority": "medium"
}
```

#### **Day 5: Context-Aware Check-In**

```javascript
// User: "How is the mobile app project going?"

// AI retrieves context:
// - Project: Vezora Mobile App
// - Decision: Firebase backend
// - Tasks: 2 pending (1 due in 2 days)

// AI Response:
"Your Vezora Mobile App project is progressing well. You decided to use 
Firebase for the backend. Currently, you have 2 pending tasks:

1. Set up Firebase project (due in 2 days) - Should be prioritized
2. Create login screen (due next week)

Would you like me to break down the Firebase setup into smaller steps?"
```

---

### 📝 Scenario 2: Content Creation Workflow

#### **Setting Preferences**

```javascript
// User: "I prefer to write blog posts in the morning and 
//        edit videos in the afternoon when I'm less creative."

// AI stores preferences:
POST /api/structured-memory/preferences
[
  {
    "preference": "Write blog posts in the morning",
    "category": "workflow",
    "confidence": 0.9
  },
  {
    "preference": "Edit videos in afternoon when less creative",
    "category": "workflow",
    "confidence": 0.9
  }
]

// User: "I always use Markdown for documentation and prefer 
//        code examples to be in JavaScript."

// More preferences stored:
POST /api/structured-memory/preferences
[
  {
    "preference": "Use Markdown for documentation",
    "category": "formatting",
    "confidence": 1.0
  },
  {
    "preference": "Code examples in JavaScript",
    "category": "formatting",
    "confidence": 0.9
  }
]
```

#### **Time-Aware Suggestions**

```javascript
// Morning - 9:00 AM
// User: "What should I work on?"

// AI retrieves preference: "Write blog posts in the morning"
// AI Response:
"Good morning! Based on your preferences, this is a great time for 
creative writing. You have a blog post about AI memory systems in 
your pending tasks. Would you like to start with that?"

// Afternoon - 2:00 PM
// User: "I'm feeling less creative now. What can I do?"

// AI retrieves preference: "Edit videos in afternoon"
// AI Response:
"Perfect timing! You mentioned you prefer editing videos in the 
afternoon. You have 3 recorded videos waiting to be edited. 
Shall I help you prioritize them?"
```

---

### 🎓 Scenario 3: Learning and Research

#### **Tracking Learning Goals**

```javascript
// User: "I'm learning machine learning. I decided to focus on 
//        PyTorch instead of TensorFlow because it's more pythonic."

// AI stores:
POST /api/structured-memory/projects
{
  "project_name": "Learning Machine Learning",
  "description": "Focus on PyTorch",
  "status": "active",
  "priority": "high"
}

POST /api/structured-memory/decisions
{
  "decision_text": "Focus on PyTorch instead of TensorFlow",
  "related_project": "Learning Machine Learning",
  "importance_score": 8,
  "context": "PyTorch is more pythonic"
}

// User: "I need to complete the neural networks course by end 
//        of month and build a simple image classifier."

// Tasks created:
POST /api/tasks
[
  {
    "title": "Complete neural networks course",
    "deadline": "2026-02-28T00:00:00Z",
    "related_project": "Learning Machine Learning",
    "priority": "high"
  },
  {
    "title": "Build simple image classifier",
    "related_project": "Learning Machine Learning",
    "priority": "medium"
  }
]
```

#### **Progress Tracking**

```javascript
// Week later
// User: "Remind me about my ML learning progress"

// AI retrieves all related context
// AI Response:
"You're learning Machine Learning with a focus on PyTorch (chosen 
for its pythonic nature). Here's your progress:

📚 Pending Tasks:
- Complete neural networks course (Due: Feb 28, 6 days left)
- Build simple image classifier

You're on track! The course is due in 6 days. Once completed, 
you can practice by building the image classifier."
```

---

### 💼 Scenario 4: Business & Client Management

#### **Client Projects**

```javascript
// User: "I'm working on a website for a client called Acme Corp. 
//        They want e-commerce functionality with Stripe payments."

POST /api/structured-memory/projects
{
  "project_name": "Acme Corp Website",
  "description": "E-commerce with Stripe payments",
  "status": "active",
  "priority": "high"
}

POST /api/structured-memory/decisions
{
  "decision_text": "Use Stripe for payments",
  "related_project": "Acme Corp Website",
  "importance_score": 7,
  "context": "Client requirement"
}

// User: "The client prefers weekly progress updates via email 
//        rather than video calls."

POST /api/structured-memory/preferences
{
  "preference": "Acme Corp prefers weekly email updates over video calls",
  "category": "communication",
  "confidence": 1.0
}
```

#### **Context-Aware Client Communication**

```javascript
// Friday afternoon
// User: "Should I send an update to the client?"

// AI retrieves:
// - Project: Acme Corp Website
// - Preference: Weekly email updates
// - Last update: 7 days ago

// AI Response:
"Yes! You typically send weekly email updates to Acme Corp (they 
prefer emails over calls). It's been a week since the last update. 

Based on your completed tasks this week, I can help draft an update:
✅ Set up Stripe integration
✅ Created product catalog
🔄 In progress: Shopping cart functionality

Would you like me to draft the email?"
```

---

### 🏃 Scenario 5: Daily Productivity System

#### **Morning Routine**

```bash
# 8:00 AM - Get daily summary
curl http://localhost:5000/api/coordinator/daily-summary
```

```json
{
  "summary": "Good morning! Here's what's on your plate today:

⚠️ URGENT - 2 Overdue Tasks:
  - Quarterly report (Due: Feb 10)
  - Client feedback response (Due: Feb 11)

📅 UPCOMING TODAY:
  - Team standup at 10 AM
  - Finish blog post draft
  
📁 ACTIVE PROJECTS:
  - Vezora Mobile App [high]
  - Acme Corp Website [high]
  - Blog Content Series [medium]

💡 RECOMMENDATION: 
Start with the overdue quarterly report (high priority). 
Block 2-3 hours this morning to complete it."
}
```

#### **Throughout the Day**

```javascript
// 10:00 AM - Before standup
// User: "What should I mention in the standup?"

// AI retrieves:
// - In-progress tasks
// - Recent decisions
// - Related projects

// AI Response:
"For the standup, here's your update:

YESTERDAY:
✅ Completed Firebase setup for mobile app
✅ Drafted client email for Acme Corp

TODAY:
🔄 Working on overdue quarterly report (priority)
🔄 Planning to start shopping cart for Acme Corp

BLOCKERS:
None currently.

Would you like me to format this for Slack?"

// 3:00 PM - After lunch
// User: "I completed the quarterly report"

POST /api/tasks/{task-id}/complete

// AI Response:
"Excellent! Quarterly report marked as completed. 🎉

You've cleared your overdue items. Next priority:
- Client feedback response (also overdue)

This should take about 30 minutes. Want to tackle it now?"
```

#### **Evening Wrap-up**

```javascript
// 6:00 PM
// User: "What did I accomplish today?"

// AI retrieves completed tasks from today

// AI Response:
"Great day! Here's what you completed:

✅ Quarterly report (was overdue - great job!)
✅ Client feedback response
✅ Blog post draft
✅ Team standup presentation

PENDING FOR TOMORROW:
- Shopping cart for Acme Corp (high priority)
- Continue neural networks course

You cleared 2 overdue items and completed 4 tasks total. 
Well done! 🎉"
```

---

### 🔄 Scenario 6: Recurring Workflows

#### **Weekly Planning**

```javascript
// Every Monday morning
// User: "Help me plan this week"

// AI retrieves:
// - All upcoming deadlines (next 7 days)
// - High priority tasks
// - Active projects

// AI Response:
"Let's plan your week:

CRITICAL DEADLINES:
📅 Feb 14 (Friday) - Firebase setup for mobile app
📅 Feb 15 (Saturday) - Blog post publication

HIGH PRIORITY TASKS (no deadline):
- Shopping cart for Acme Corp
- Neural networks course module 3

ACTIVE PROJECTS STATUS:
🔵 Vezora Mobile App - On track
🔵 Acme Corp Website - Needs attention
🟢 Blog Series - Ahead of schedule

SUGGESTED SCHEDULE:
Mon-Wed: Focus on shopping cart (Acme Corp)
Thu-Fri: Complete Firebase setup (mobile app)
Weekend: Finish and publish blog post

Would you like me to break these down further?"
```

---

## 🛠️ Advanced Integration Examples

### **Example 1: Automated Task Creation from Email**

```javascript
// Gmail integration + Memory system
async function processIncomingEmail(email) {
  // Extract task from email
  if (email.subject.includes('ACTION REQUIRED')) {
    await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: email.subject.replace('ACTION REQUIRED: ', ''),
        description: email.snippet,
        priority: 'high',
        deadline: extractDeadlineFromEmail(email.body)
      })
    });
  }
}
```

### **Example 2: Voice Assistant Integration**

```javascript
// Voice command: "What are my top priorities?"
async function handleVoiceCommand(transcript) {
  const response = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: transcript,
      useContext: true
    })
  });
  
  const data = await response.json();
  
  // Convert to speech
  speakResponse(data.content);
  
  // Show context on screen
  if (data.contextUsed) {
    showContextOverlay(data.contextSummary);
  }
}
```

### **Example 3: Slack Bot Integration**

```javascript
// Slack bot with memory awareness
app.command('/tasks', async ({ command, ack, respond }) => {
  await ack();
  
  const tasks = await fetch('http://localhost:5000/api/tasks/query/pending');
  const data = await tasks.json();
  
  const message = formatTasksForSlack(data.tasks);
  
  await respond({
    text: message,
    response_type: 'ephemeral'
  });
});

app.command('/summary', async ({ command, ack, respond }) => {
  await ack();
  
  const summary = await fetch('http://localhost:5000/api/coordinator/daily-summary');
  const data = await summary.json();
  
  await respond({
    text: data.summary,
    response_type: 'in_channel'
  });
});
```

---

## 📊 Analytics & Insights

### **Productivity Metrics**

```javascript
// Custom analytics endpoint
async function getProductivityMetrics() {
  const [tasks, projects, decisions] = await Promise.all([
    fetch('http://localhost:5000/api/tasks/stats').then(r => r.json()),
    fetch('http://localhost:5000/api/structured-memory/stats').then(r => r.json()),
    fetch('http://localhost:5000/api/structured-memory/decisions').then(r => r.json())
  ]);
  
  return {
    taskCompletionRate: (tasks.stats.completed / tasks.stats.total * 100).toFixed(1),
    activeProjects: projects.stats.active_projects,
    overdueTasksCount: tasks.stats.overdue,
    decisionsThisWeek: decisions.decisions.filter(d => 
      new Date(d.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  };
}
```

---

## 🎯 Best Practices from Examples

1. **Natural Language First:** Let users communicate naturally; AI extracts structure
2. **Context is King:** Always retrieve context before making suggestions
3. **Time-Aware:** Use time of day and deadlines for intelligent prioritization
4. **Preference Learning:** Store and apply user preferences consistently
5. **Progress Tracking:** Regularly check in on projects and tasks
6. **Celebrate Wins:** Acknowledge completed tasks and achievements
7. **Proactive Guidance:** Suggest next actions based on context

---

**For more examples, check the full documentation at `docs/MEMORY_AND_CONTEXT_SYSTEM.md`**
