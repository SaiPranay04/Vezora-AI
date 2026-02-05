# 🧠 Vezora Backend - Local AI Assistant Server

Complete backend implementation for Vezora AI Personal Assistant using **Ollama + Node.js + Express**.

## 🎯 Features Implemented

✅ **Local LLM Integration** (Ollama: Phi-2 / TinyLLaMA / Mistral)  
✅ **Chat & Reasoning** - Context-aware conversations  
✅ **Memory Management** - Persistent user memory storage  
✅ **Voice Output (TTS)** - Google Cloud TTS + Browser fallback  
✅ **Voice Call Mode** - Real-time voice assistant  
✅ **App Launcher** - Launch desktop applications  
✅ **File System Access** - Read/write files  
✅ **Intent Parsing** - Extract user intent from commands  
✅ **Settings Management** - User preferences storage  
✅ **Activity Logs** - System action logging  
✅ **WebSocket Support** - Real-time voice call mode  

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18+)
2. **Ollama** installed and running
   ```bash
   # Install Ollama: https://ollama.ai
   # Pull a model:
   ollama pull phi
   # or
   ollama pull tinyllama
   # or
   ollama pull mistral:7b-instruct
   ```

### Installation

```bash
cd backend
npm install
```

### Configuration

Create a `.env` file (copy from below):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=phi

# Google Cloud TTS (Optional)
GOOGLE_TTS_API_KEY=
GOOGLE_TTS_PROJECT_ID=

# Feature Toggles
ENABLE_APP_LAUNCH=true
ENABLE_FILE_SYSTEM=true
VOICE_CALL_MODE=true

# Security
ENCRYPTION_KEY=your-32-character-encryption-key-here
MAX_MEMORY_ITEMS=100
MAX_LOG_ENTRIES=500

# Paths
DATA_DIR=./data
```

### Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`

---

## 📡 API Endpoints

### Chat & Reasoning

#### `POST /api/chat`
Main conversation endpoint.

**Request:**
```json
{
  "message": "What's the weather like?",
  "includeMemory": true,
  "userId": "default"
}
```

**Response:**
```json
{
  "id": "1234567890",
  "role": "assistant",
  "content": "I can help you check the weather...",
  "timestamp": "2024-02-03T10:30:00Z",
  "model": "phi",
  "intent": {
    "action": "chat",
    "target": null,
    "confidence": 1.0
  },
  "responseTime": 1234,
  "voiceEnabled": false
}
```

#### `POST /api/chat/intent`
Parse user intent without generating full response.

#### `GET /api/chat/health`
Check Ollama connection status.

---

### Memory Management

#### `GET /api/memory?userId=default`
Get all memory items for a user.

#### `POST /api/memory`
Add new memory item.

```json
{
  "userId": "default",
  "content": "User prefers dark mode",
  "type": "preference",
  "metadata": { "confidence": 0.9 }
}
```

#### `PUT /api/memory/:id`
Update existing memory item.

#### `DELETE /api/memory/:id?userId=default`
Delete specific memory item.

#### `DELETE /api/memory?userId=default`
Clear all memory for a user.

---

### Voice Output (TTS)

#### `POST /api/voice/speak`
Convert text to speech.

**Request:**
```json
{
  "text": "Hello, I am Vezora!",
  "voice": "default",
  "speed": 1.0,
  "pitch": 1.0,
  "language": "en-US"
}
```

**Response:**
```json
{
  "audio": "base64-encoded-audio-or-url",
  "format": "mp3",
  "duration": 3,
  "timestamp": "2024-02-03T10:30:00Z"
}
```

#### `GET /api/voice/voices`
Get available TTS voices.

#### `POST /api/voice/stream`
Stream audio for voice call mode.

---

### Application Launcher

#### `POST /api/apps/launch`
Launch a desktop application.

**Request:**
```json
{
  "appName": "chrome",
  "args": ["https://google.com"]
}
```

**Response:**
```json
{
  "success": true,
  "app": "chrome",
  "pid": 12345,
  "message": "Successfully launched chrome",
  "timestamp": "2024-02-03T10:30:00Z"
}
```

#### `GET /api/apps/installed`
Get list of commonly installed applications.

---

### File System Operations

#### `POST /api/files/open`
Open a file with default application.

```json
{
  "path": "/path/to/file.txt"
}
```

#### `POST /api/files/save`
Save content to a file.

```json
{
  "path": "/path/to/file.txt",
  "content": "Hello, World!",
  "encoding": "utf8"
}
```

#### `POST /api/files/read`
Read file contents.

#### `POST /api/files/list`
List directory contents.

---

### Settings Management

#### `GET /api/settings?userId=default`
Get user settings.

#### `PUT /api/settings`
Update user settings.

```json
{
  "userId": "default",
  "language": "en-US",
  "theme": "dark",
  "personality": "friendly",
  "voiceSpeed": 1.0,
  "voiceCallEnabled": true
}
```

---

### Activity Logs

#### `GET /api/logs?userId=default&type=chat&limit=100`
Get system logs.

#### `DELETE /api/logs?userId=default`
Clear all logs for a user.

---

## 🏗️ Architecture

```
backend/
├── routes/          # API route handlers
│   ├── chat.js      # Chat & reasoning endpoints
│   ├── memory.js    # Memory management
│   ├── voice.js     # TTS functionality
│   ├── apps.js      # App launcher
│   ├── files.js     # File operations
│   ├── settings.js  # User settings
│   └── logs.js      # Activity logging
├── controllers/     # Business logic
│   ├── memoryController.js
│   ├── voiceController.js
│   ├── appsController.js
│   ├── filesController.js
│   ├── settingsController.js
│   └── logsController.js
├── utils/           # Utility modules
│   ├── ollamaClient.js   # Ollama integration
│   ├── database.js       # Database setup
│   └── fileSystem.js     # File utilities
├── data/            # Data storage (JSON files)
│   ├── memory.json
│   ├── settings.json
│   └── logs.json
├── index.js         # Main server
├── package.json
└── .env             # Configuration
```

---

## 🔧 Ollama Models

### Recommended Models

1. **phi** (Microsoft Phi-2, 2.7B)
   - Fast, efficient, great for reasoning
   - Best for low-end hardware
   - `ollama pull phi`

2. **tinyllama** (TinyLLaMA 1.1B)
   - Smallest, fastest
   - Good for basic tasks
   - `ollama pull tinyllama`

3. **mistral:7b-instruct** (Mistral 7B)
   - Most capable
   - Requires more RAM (8GB+)
   - `ollama pull mistral:7b-instruct`

### Testing Ollama

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Test generation
curl http://localhost:11434/api/generate -d '{
  "model": "phi",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

---

## 🔐 Security Features

- **Path Validation**: File operations restricted to allowed directories
- **API Key Management**: Environment variables for sensitive data
- **Feature Toggles**: Disable risky features via .env
- **Request Validation**: Input sanitization on all endpoints
- **CORS Configuration**: Restricted to frontend origin

---

## 🌐 WebSocket (Voice Call Mode)

Connect to `ws://localhost:5000/ws/voice-mode` for real-time voice call interactions.

**Example:**
```javascript
const ws = new WebSocket('ws://localhost:5000/ws/voice-mode');

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'start_call', userId: 'default' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

---

## 📊 Data Storage

Currently uses **JSON files** for simplicity. Can be upgraded to **SQLite** for better performance.

### Migration to SQLite (Optional)

Uncomment the SQLite code in `utils/database.js` and run:

```bash
npm install better-sqlite3
```

---

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test chat
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, Vezora!"}'

# Test Ollama connection
curl http://localhost:5000/api/chat/health
```

---

## 🐛 Troubleshooting

### Ollama not connecting
```bash
# Check if Ollama is running
ollama serve

# Pull the model
ollama pull phi
```

### Permission errors (File/App operations)
- Update `ALLOWED_DIRECTORIES` in `controllers/filesController.js`
- Ensure `ENABLE_APP_LAUNCH=true` and `ENABLE_FILE_SYSTEM=true` in `.env`

### Google TTS not working
- Ensure `GOOGLE_TTS_API_KEY` is set in `.env`
- Fallback to browser TTS if no API key provided

---

## 🚢 Deployment

### Local Production

```bash
npm start
```

### With PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start index.js --name vezora-backend
pm2 logs vezora-backend
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

---

## 📝 License

This project is part of the Vezora AI Assistant suite.

For questions or issues, please refer to the main README.
