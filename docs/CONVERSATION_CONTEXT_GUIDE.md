# Vezora Conversation Context - Complete Guide

## 🧠 Overview

Vezora now maintains **full conversation context** across messages, making interactions feel natural and continuous. The assistant remembers what you've talked about!

---

## ✅ What Was Implemented

### 1. **Conversation History Tracking**

**How It Works:**
- **Frontend** maintains a `messages` array with full conversation history
- **Last 10 messages** (5 exchanges) sent to AI for context
- **Conversation-aware responses** - Vezora references previous messages

**Example:**
```
User: "My name is Alex"
Vezora: "Nice to meet you, Alex!"

User: "What's my name?"
Vezora: "Your name is Alex!" ✅ (remembers from context)
```

---

### 2. **Persistent Storage (LocalStorage)**

**Feature:** Conversations survive page refreshes!

**How It Works:**
- After each message, conversation saved to `localStorage`
- **Last 20 messages** kept in storage (saves memory)
- Auto-loads on page refresh

**Try It:**
1. Chat with Vezora
2. Refresh the page (F5)
3. **Conversation is still there!** 🎉

**Storage Key:** `vezora_chat_history`

---

### 3. **Clear Chat Function**

**Feature:** Start fresh conversations

**UI Location:** Top-right of chat interface

**What It Does:**
- Clears all messages except welcome message
- Resets localStorage
- Shows: *"💬 Chat cleared! Starting fresh conversation."*

**When to Use:**
- Switching topics
- Conversation got too long
- Want to test context without old messages

---

## 🔧 Technical Architecture

### Frontend (ChatPage.tsx)

```typescript
// Build conversation history (last 10 messages)
const conversationHistory = [...messages, newUserMsg]
    .filter(msg => msg.role !== 'system')
    .slice(-10) // Keep last 10 for context
    .map(msg => ({
        role: msg.role,
        content: msg.content
    }));

// Send to backend
fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
        messages: conversationHistory, // Full conversation
        includeMemory: false, // Context is enough
        userId: 'default'
    })
});

// Save to localStorage
localStorage.setItem('vezora_chat_history', 
    JSON.stringify([...messages].slice(-20)));
```

### Backend (routes/chat.js)

**Supports Two Formats:**

1. **NEW (with context):**
```json
{
  "messages": [
    {"role": "user", "content": "My name is Alex"},
    {"role": "assistant", "content": "Nice to meet you, Alex!"},
    {"role": "user", "content": "What's my name?"}
  ],
  "userId": "default"
}
```

2. **OLD (single message - backward compatible):**
```json
{
  "message": "Hello!",
  "userId": "default"
}
```

**Backend Logic:**
```javascript
// Accept both formats
const { message, messages: conversationHistory } = req.body;

let messages = [];
if (conversationHistory && Array.isArray(conversationHistory)) {
    messages = conversationHistory; // Use conversation
} else if (message) {
    messages = [{ role: 'user', content: message }]; // Single message
}

// Pass to Ollama (keeps last 8 messages in prompt)
const prompt = formatMessagesForOllama(messages, tone);
```

---

## 📊 Context Limits (Performance Optimized)

| Component | Limit | Reason |
|-----------|-------|--------|
| **Frontend → Backend** | Last 10 messages | Balance context vs API size |
| **Backend → Ollama** | Last 8 messages | Faster prompt processing |
| **LocalStorage** | Last 20 messages | Persist recent history only |

**Why Limits?**
- ✅ **Faster responses** (less text to process)
- ✅ **Lower memory usage**
- ✅ **Focused context** (recent messages more relevant)

---

## 🎯 Context in Different Modes

### 1. **Regular Chat Mode**

**Behavior:**
- Full conversation history sent
- Vezora references previous messages
- Context persists across page refreshes

**Example:**
```
User: "I'm planning a trip to Japan"
Vezora: "That sounds exciting! What cities are you visiting?"

User: "Tokyo and Kyoto"
Vezora: "Great choices! Tokyo is modern, Kyoto is traditional."

User: "What should I pack?" 
Vezora: "For Tokyo and Kyoto, pack comfortable shoes for walking..." 
       ✅ (remembers Japan context)
```

### 2. **Voice Call Mode**

**Current Behavior:**
- **Context disabled** for speed (streaming prioritized)
- Each voice interaction is independent
- Optimized for real-time performance

**Why?**
- Voice needs sub-second latency
- Conversation history adds processing time
- Voice is often command-based (doesn't need history)

**Future Enhancement (Optional):**
- Add toggle: "Remember conversation in voice mode"
- Trade-off: Context vs Speed

---

## 🧪 Testing Conversation Context

### **Test 1: Basic Context Memory**

```
1. "My favorite color is blue"
   → Vezora acknowledges

2. "What's my favorite color?"
   → Vezora: "Your favorite color is blue!" ✅
```

### **Test 2: Multi-Turn Context**

```
1. "I'm a software developer"
   → Vezora: "Cool! What languages do you work with?"

2. "Mostly Python and JavaScript"
   → Vezora: "Great choices for web development!"

3. "Recommend a framework for me"
   → Vezora: "For Python, try Django. For JavaScript, React is excellent."
   ✅ (remembers both languages)
```

### **Test 3: Persistence Across Refresh**

```
1. Chat with Vezora (any messages)
2. Press F5 (refresh page)
3. Conversation still visible ✅
4. Continue conversation
   → Vezora still has context ✅
```

### **Test 4: Clear Chat**

```
1. Have a conversation about topic A
2. Click "🗑️ Clear Chat"
3. Ask about topic A
   → Vezora doesn't remember ✅ (fresh start)
```

---

## 🔍 Debugging Context Issues

### Issue: Vezora doesn't remember previous messages

**Check:**
1. **Browser Console** - Any errors?
2. **Network Tab** - Is `messages` array being sent?
3. **Backend Logs** - Is it receiving the array?

**Debug in Browser Console:**
```javascript
// Check localStorage
console.log(JSON.parse(localStorage.getItem('vezora_chat_history')));

// Should show array of messages
```

### Issue: Context too old (remembering from hours ago)

**Solution:** Click "Clear Chat" button

**Or manually clear:**
```javascript
// In browser console
localStorage.removeItem('vezora_chat_history');
// Refresh page
```

### Issue: Conversation too long (slow responses)

**Why:** More context = slower processing

**Solution:**
- Click "Clear Chat" to reset
- Backend automatically limits to last 8 messages

---

## 🎛️ Configuration

### Adjust Context Window Size

**Frontend** (`src/pages/ChatPage.tsx`):
```typescript
// Change this line:
.slice(-10) // Keep last 10 messages

// To:
.slice(-5)  // Shorter context (faster, less memory)
.slice(-20) // Longer context (more coherent, slower)
```

**Backend** (`backend/routes/chat.js`):
```javascript
// Change this line:
const recentMessages = messages.slice(-8);

// To:
const recentMessages = messages.slice(-5);  // Less context
const recentMessages = messages.slice(-15); // More context
```

**Recommendations:**
| Use Case | Frontend | Backend |
|----------|----------|---------|
| **Speed Priority** | 5 | 4 |
| **Balanced** (current) | 10 | 8 |
| **Context Priority** | 20 | 15 |

---

## 💡 Advanced Features (Future)

### 1. **Named Conversations**

```typescript
// Save multiple conversations
localStorage.setItem('vezora_chat_work', JSON.stringify(workMessages));
localStorage.setItem('vezora_chat_personal', JSON.stringify(personalMessages));

// Switch between them
<button onClick={() => loadConversation('work')}>Work Chat</button>
<button onClick={() => loadConversation('personal')}>Personal Chat</button>
```

### 2. **Export/Import Conversations**

```typescript
// Export
const exportChat = () => {
    const data = JSON.stringify(messages, null, 2);
    downloadFile(data, 'vezora-chat.json');
};

// Import
const importChat = (file) => {
    const messages = JSON.parse(file);
    setMessages(messages);
};
```

### 3. **Conversation Summarization**

```typescript
// When context gets too long:
if (messages.length > 50) {
    // Summarize first 30 messages
    const summary = await fetch('/api/chat/summarize', {
        body: JSON.stringify({ messages: messages.slice(0, 30) })
    });
    
    // Replace with summary + recent messages
    messages = [
        { role: 'system', content: summary },
        ...messages.slice(-20)
    ];
}
```

---

## 📝 API Reference

### POST /api/chat

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "First message" },
    { "role": "assistant", "content": "First response" },
    { "role": "user", "content": "Second message" }
  ],
  "includeMemory": false,
  "userId": "default"
}
```

**Response:**
```json
{
  "id": "1234567890",
  "role": "assistant",
  "content": "Response with context awareness",
  "timestamp": "2026-02-05T10:30:00.000Z",
  "model": "mistral:latest",
  "provider": "ollama"
}
```

### POST /api/chat/stream

**Same format as `/api/chat`** but returns Server-Sent Events (SSE)

---

## ✅ Summary

**What You Get:**

✅ **Conversation memory** - Vezora remembers what you said  
✅ **Page refresh persistence** - Context survives refreshes  
✅ **Clear chat** - Start fresh anytime  
✅ **Optimized limits** - Fast performance with relevant context  
✅ **Backward compatible** - Old single-message format still works  

**Files Modified:**

```
src/pages/ChatPage.tsx     → Context tracking, persistence, clear button
backend/routes/chat.js     → Accept messages array, context support
```

---

## 🚀 Next: Test It!

1. **Open Chat** (http://localhost:5173)
2. **Have a conversation:**
   ```
   "My name is [your name]"
   "I like [something]"
   "What's my name?" ← Should remember!
   "What do I like?" ← Should remember!
   ```
3. **Refresh page** (F5)
4. **Continue conversation** - Context is still there!
5. **Click "Clear Chat"** - Fresh start

---

**Vezora now has a memory! 🧠✨**
