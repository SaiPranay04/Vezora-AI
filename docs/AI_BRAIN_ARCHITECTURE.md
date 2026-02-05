# 🧠 Vezora AI Brain Architecture

Complete guide to Vezora's AI system, database, and memory management.

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    VEZORA AI SYSTEM                     │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
    ┌──────▼──────┐                 ┌──────▼──────┐
    │  AI BRAIN   │                 │  MEMORY DB  │
    │  (LLM)      │◄────Context─────│  (Storage)  │
    └──────┬──────┘                 └─────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────┐   ┌───▼────┐
│ Gemini │   │ Ollama │
│  API   │   │ Local  │
└────────┘   └────────┘
```

---

## 🤖 AI Brain Components

### **1. Large Language Model (LLM)**

The "thinking" part of Vezora. Generates responses, understands context, and processes requests.

**Location:** `backend/utils/`

#### **Option A: Gemini AI (Cloud-based)** ⭐ RECOMMENDED

**File:** `backend/utils/geminiClient.js`

**Features:**
- 🧠 Google's advanced AI model
- 📚 Large context window (32K tokens)
- 💬 Better conversation quality
- 🚀 Fast responses (cloud-based)
- 🆓 Free tier: 60 req/min

**Configuration:**
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
AI_PROVIDER=auto  # or 'gemini'
```

**API Key:** [Get it here](https://makersuite.google.com/app/apikey)

---

#### **Option B: Ollama (Local)**

**File:** `backend/utils/ollamaClient.js`

**Features:**
- 🔒 100% Local (offline capability)
- 🆓 Completely free
- 🔐 Privacy-focused (data stays on device)
- 💻 Requires 4GB+ RAM

**Configuration:**
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=phi
AI_PROVIDER=ollama
```

**Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull phi

# Start server
ollama serve
```

---

### **2. Intelligent Routing (Auto-Fallback)**

**Location:** `backend/routes/chat.js`

Vezora automatically chooses the best AI provider:

```javascript
Priority Order:
1. Gemini (if API key is set)
2. Ollama (if running locally)
3. Fallback to other provider if primary fails
```

**Flow:**
```
User Message
     │
     ▼
Is GEMINI_API_KEY set?
     │
     ├─Yes─► Use Gemini
     │           │
     │           ├─Success─► Response
     │           │
     │           └─Fail─► Fallback to Ollama
     │
     └─No──► Use Ollama
                 │
                 ├─Success─► Response
                 │
                 └─Fail─► Error
```

---

## 💾 Database & Memory System

### **Architecture:**

```
backend/data/
├── memory.json        ← AI's long-term memory
├── settings.json      ← User preferences
└── logs.json          ← Chat history & actions
```

---

### **1. Memory Database (`memory.json`)**

**Purpose:** Store facts, preferences, and context for the AI to "remember"

**File:** `backend/data/memory.json`

**Structure:**
```json
{
  "default": [
    {
      "id": "mem_1234567890",
      "userId": "default",
      "type": "fact",
      "content": "User prefers React over Vue",
      "confidence": 0.95,
      "metadata": {
        "source": "conversation",
        "category": "preference"
      },
      "createdAt": "2026-02-05T10:30:00.000Z",
      "updatedAt": "2026-02-05T10:30:00.000Z"
    }
  ]
}
```

**Fields:**
- `id` - Unique identifier
- `userId` - User ID (default: "default")
- `type` - fact | preference | note | reminder
- `content` - The actual memory text
- `confidence` - How sure the AI is (0.0 - 1.0)
- `metadata` - Additional context
- `createdAt` - When memory was created
- `updatedAt` - When memory was last updated

**API Endpoints:**
- `GET /api/memory` - Fetch all memories
- `POST /api/memory` - Add new memory
- `PUT /api/memory/:id` - Update memory
- `DELETE /api/memory/:id` - Delete memory

**How It's Used:**
1. User chats with AI
2. AI identifies important facts
3. Facts stored in memory.json
4. On next conversation, AI reads memory
5. AI has context from previous chats

**Example:**
```javascript
// User says: "My name is Alex"
// Memory stored:
{
  "type": "fact",
  "content": "User's name is Alex",
  "confidence": 1.0
}

// Later, user asks: "What's my name?"
// AI reads memory and responds: "Your name is Alex!"
```

---

### **2. Settings Database (`settings.json`)**

**Purpose:** Store user preferences and AI configuration

**File:** `backend/data/settings.json`

**Structure:**
```json
{
  "default": {
    "userId": "default",
    "theme": "dark-glow",
    "personality": "friendly",
    "language": "en-US",
    "voiceCallEnabled": true,
    "temperature": 0.7,
    "maxTokens": 1024,
    "voiceSpeed": 1.0,
    "voiceName": "Microsoft Zira",
    "updatedAt": "2026-02-05T10:30:00.000Z"
  }
}
```

**Fields:**
- `theme` - UI theme
- `personality` - AI response style (friendly/professional/sassy/concise)
- `language` - Interface language
- `temperature` - AI creativity (0.0-1.0)
- `maxTokens` - Max response length
- `voiceSpeed` - TTS speed
- `voiceName` - Selected TTS voice

**API Endpoints:**
- `GET /api/settings` - Fetch settings
- `PUT /api/settings` - Update settings

---

### **3. Logs Database (`logs.json`)**

**Purpose:** Track chat history and user actions

**File:** `backend/data/logs.json`

**Structure:**
```json
{
  "default": [
    {
      "id": "log_1234567890",
      "userId": "default",
      "type": "chat",
      "message": "What's the weather?",
      "response": "I don't have access to weather data...",
      "intent": "chat",
      "responseTime": 1250,
      "provider": "gemini",
      "timestamp": "2026-02-05T10:30:00.000Z"
    },
    {
      "id": "log_1234567891",
      "userId": "default",
      "type": "action",
      "action": "open_app",
      "target": "chrome",
      "success": true,
      "timestamp": "2026-02-05T10:31:00.000Z"
    }
  ]
}
```

**Log Types:**
- `chat` - Conversation messages
- `action` - App launches, file operations
- `voice` - Voice interactions
- `error` - System errors

**API Endpoints:**
- `GET /api/logs` - Fetch logs (filtered by type/date)
- `POST /api/logs` - Add log entry
- `DELETE /api/logs` - Clear logs

---

## 🔄 How It All Works Together

### **Conversation Flow:**

```
1. USER SENDS MESSAGE
   │
   ▼
2. BACKEND RECEIVES MESSAGE
   │
   ├─► Load user settings (settings.json)
   ├─► Load AI memory (memory.json)
   └─► Build context
   │
   ▼
3. SEND TO AI BRAIN
   │
   ├─► Gemini API (if available)
   └─► or Ollama (fallback)
   │
   ▼
4. AI GENERATES RESPONSE
   │
   ├─► Parse intent (action detection)
   ├─► Generate reply
   └─► Return response
   │
   ▼
5. POST-PROCESSING
   │
   ├─► Store in logs (logs.json)
   ├─► Extract new memories (memory.json)
   └─► Execute actions (if any)
   │
   ▼
6. SEND RESPONSE TO FRONTEND
   │
   ├─► Display message
   ├─► Speak response (TTS)
   └─► Update UI
```

---

### **Memory Context Injection:**

When you chat with Vezora, it loads relevant memories:

```javascript
// Example: User asks "What's my favorite color?"

// Step 1: Load memories
const memories = await getMemory('default');
// Returns: [{ content: "User's favorite color is blue" }]

// Step 2: Build context
const messages = [
  {
    role: 'system',
    content: 'Context from memory:\nUser\'s favorite color is blue'
  },
  {
    role: 'user',
    content: 'What\'s my favorite color?'
  }
];

// Step 3: AI sees the context and responds accurately
// Response: "Your favorite color is blue!"
```

---

## 🔧 Advanced Features

### **1. Intent Parsing**

**What:** Detect if user wants to perform an action

**Example:**
```
User: "open chrome"
Intent: { action: "open_app", target: "chrome", confidence: 0.95 }

User: "search for react tutorials"
Intent: { action: "search", target: "react tutorials", confidence: 0.9 }

User: "tell me a joke"
Intent: { action: "chat", target: null, confidence: 1.0 }
```

**Used For:**
- App launching
- File operations
- Web searches
- Reminders

---

### **2. Context Window Management**

**Problem:** AI has limited context (can't remember everything)

**Solution:**
- Store important facts in `memory.json`
- Load relevant memories for each conversation
- Keep token count under model limits

**Gemini:** 32K tokens (~24K words)  
**Ollama (Phi-2):** 2K tokens (~1.5K words)

---

### **3. Embeddings (Future Enhancement)**

**What:** Convert text to vectors for semantic search

**Use Case:**
```
User: "What did I say about React?"

# Instead of exact keyword match:
# Search memory using semantic similarity
# Finds: "User prefers React" even if exact phrase wasn't used
```

**Implementation:**
```javascript
// Already available in geminiClient.js
import { generateEmbedding } from '../utils/geminiClient.js';

const embedding = await generateEmbedding("User prefers React");
// Returns: [0.123, -0.456, 0.789, ...] (768 dimensions)
```

---

## 📊 Database Comparison

| Feature | JSON Files | SQLite (Future) |
|---------|------------|-----------------|
| **Setup** | ✅ Zero setup | Requires migration |
| **Speed** | ⚠️ Slow for large data | ✅ Very fast |
| **Queries** | ❌ Manual filtering | ✅ SQL queries |
| **Scaling** | ❌ Poor (>10K entries) | ✅ Excellent |
| **Debugging** | ✅ Easy to read | ⚠️ Needs tools |
| **Backup** | ✅ Simple copy | ⚠️ Export needed |

**Current:** JSON (simple, works great for personal use)  
**Future:** Can migrate to SQLite (code already in `database.js`)

---

## 🔐 Data Privacy

### **Local Storage (JSON)**
- ✅ All data stored on your device
- ✅ No cloud backups (unless you enable)
- ✅ Full control over data

### **Gemini API**
- ⚠️ Messages sent to Google servers
- ✅ Not used to train models
- ✅ Deleted after processing
- 🔒 Use Ollama for sensitive data

### **Ollama (Local)**
- ✅ 100% local processing
- ✅ No internet required
- ✅ Perfect for privacy-sensitive use

---

## 📖 File Structure Summary

```
backend/
├── utils/
│   ├── geminiClient.js       ← Gemini AI integration
│   ├── ollamaClient.js        ← Ollama local AI
│   ├── database.js            ← Database utilities
│   └── fileSystem.js          ← File operations
│
├── controllers/
│   ├── memoryController.js    ← Memory CRUD
│   ├── settingsController.js  ← Settings CRUD
│   └── logsController.js      ← Logs CRUD
│
├── routes/
│   ├── chat.js                ← Main AI endpoint
│   ├── memory.js              ← Memory API
│   ├── settings.js            ← Settings API
│   └── logs.js                ← Logs API
│
└── data/
    ├── memory.json            ← AI Memory
    ├── settings.json          ← User Settings
    └── logs.json              ← Chat History
```

---

## 🚀 Getting Started

### **1. Choose Your AI Provider:**

**Option A: Gemini (Recommended)**
```bash
# Get API key from https://makersuite.google.com/app/apikey
# Add to backend/.env:
GEMINI_API_KEY=your_api_key_here
```

**Option B: Ollama (Local)**
```bash
# Install Ollama
ollama pull phi
ollama serve
```

### **2. Initialize Database:**
```bash
cd backend
npm install
npm run dev
```

Backend will auto-create `data/` folder and JSON files.

### **3. Start Chatting:**
```bash
# Frontend
npm run dev
```

Open http://localhost:5173 and start talking!

---

## 📚 API Examples

### **Chat with AI:**
```bash
POST /api/chat
{
  "message": "What's the capital of France?",
  "includeMemory": true,
  "userId": "default"
}

Response:
{
  "role": "assistant",
  "content": "The capital of France is Paris.",
  "provider": "gemini",
  "model": "gemini-pro",
  "responseTime": 1200
}
```

### **Add Memory:**
```bash
POST /api/memory
{
  "content": "User loves pizza",
  "type": "preference",
  "confidence": 1.0
}
```

### **Get Logs:**
```bash
GET /api/logs?type=chat&limit=10
```

---

## 🎯 Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| **AI Brain** | Gemini/Ollama | Generate responses |
| **Memory** | memory.json | Long-term context |
| **Settings** | settings.json | User preferences |
| **Logs** | logs.json | Chat history |
| **API** | Express.js | Backend server |
| **Frontend** | React + Vite | User interface |

---

**Your Vezora AI is now powered by:**
- 🧠 Google Gemini (cloud AI) + Ollama (local fallback)
- 💾 JSON database for memory and logs
- 🔄 Automatic context injection
- 🎯 Intent parsing for actions

---

**Back to:** [Documentation Index](README.md) | [ENV Setup](ENV_SETUP_GUIDE.md)
