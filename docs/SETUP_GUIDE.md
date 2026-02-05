# 🚀 Vezora AI - Quick Setup Guide

Get your AI assistant running in **5 minutes**!

---

## ⚡ Prerequisites

Before starting, ensure you have:

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```

2. **Ollama** installed
   - Download: https://ollama.ai
   - Install and verify:
     ```bash
     ollama --version
     ```

3. **Git** (to clone the repository)

---

## 📦 Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/SaiPranay04/Vezora-AI.git
cd Vezora-AI

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## 🧠 Step 2: Setup Ollama

### Install a Model

Choose ONE model based on your hardware:

#### For Low-End PCs (4-8GB RAM):
```bash
ollama pull phi
```
**Phi-2** (2.7B parameters) - Fast, smart, great for reasoning

#### For Mid-Range PCs (8-16GB RAM):
```bash
ollama pull tinyllama
```
**TinyLLaMA** (1.1B parameters) - Fastest, good for basic tasks

#### For High-End PCs (16GB+ RAM):
```bash
ollama pull mistral:7b-instruct
```
**Mistral 7B** - Most capable, best quality responses

### Start Ollama Server

```bash
ollama serve
```

Leave this running in a terminal. You should see:
```
Ollama is running
```

---

## ⚙️ Step 3: Configure Backend

Create a `.env` file in the `backend/` folder:

```bash
cd backend
```

Create `backend/.env` with this content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=phi

# Google Cloud TTS (Optional - leave empty to use browser TTS)
GOOGLE_TTS_API_KEY=
GOOGLE_TTS_PROJECT_ID=

# Feature Toggles
ENABLE_APP_LAUNCH=true
ENABLE_FILE_SYSTEM=true
VOICE_CALL_MODE=true

# Security
ENCRYPTION_KEY=vezora-local-assistant-2024-secure
MAX_MEMORY_ITEMS=100
MAX_LOG_ENTRIES=500

# Paths
DATA_DIR=./data
```

**Important:** Change `OLLAMA_MODEL_NAME` to match your model:
- `phi` for Phi-2
- `tinyllama` for TinyLLaMA
- `mistral:7b-instruct` for Mistral 7B

---

## 🚀 Step 4: Start the Application

### Terminal 1: Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Vezora AI Backend Server
✅ Server running on http://localhost:5000
✅ Ollama endpoint: http://localhost:11434
✅ Model: phi
✅ Voice Call Mode: ENABLED
```

### Terminal 2: Frontend App

```bash
# From project root
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

---

## 🎉 Step 5: Open & Test

1. Open your browser to: **http://localhost:5173**

2. You'll see an animated splash screen, then the Vezora interface

3. **Test Chat:**
   - Type "Hello, Vezora!" in the chat
   - You should get a response from your local AI

4. **Test Voice Call Mode:**
   - Click "Voice Call" button in the header
   - Click the microphone button
   - Say "Tell me a joke"
   - Vezora will respond with voice!

---

## 🔧 Troubleshooting

### Problem: "Ollama is not running"

**Solution:**
```bash
# Start Ollama server
ollama serve

# In another terminal, verify:
ollama list
```

### Problem: "Failed to generate response"

**Solution:**
Check that your model is downloaded:
```bash
ollama list
```

You should see your model listed. If not:
```bash
ollama pull phi
```

### Problem: Backend won't start

**Solution:**
Check if port 5000 is already in use:
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

Change `PORT` in `backend/.env` if needed.

### Problem: Voice doesn't work

**Solution:**
1. Ensure you're using **Chrome** or **Edge** (best support)
2. Grant microphone permission when prompted
3. Check browser console for errors (F12)

### Problem: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Same for backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Next Steps

### 1. Configure Settings
- Go to Settings page (gear icon)
- Set your preferred:
  - Theme (Dark Glow, Light, High Contrast)
  - Personality (Friendly, Formal, Sassy, Technical)
  - Voice Speed
  - Language

### 2. Try Voice Call Mode
- Click "Voice Call" button
- Experience the full-screen animated orb
- Have natural conversations

### 3. Test App Launcher
- Say: "Open Chrome"
- Say: "Launch VS Code"
- Say: "Open Calculator"

### 4. Explore Memory
- Go to Memory page
- See what Vezora remembers
- Edit or delete memories

---

## 🌐 Google Cloud TTS (Optional)

For **better voice quality**, set up Google Cloud TTS:

1. Go to: https://console.cloud.google.com/
2. Create a new project
3. Enable "Cloud Text-to-Speech API"
4. Create API Key
5. Add to `backend/.env`:
   ```env
   GOOGLE_TTS_API_KEY=your-api-key-here
   GOOGLE_TTS_PROJECT_ID=your-project-id
   ```

**Note:** Without this, browser TTS will be used (works but sounds robotic).

---

## 📱 Browser Compatibility

**Best Experience:**
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Brave

**Limited Support:**
- ⚠️ Firefox (voice may not work)
- ⚠️ Safari (some animations may lag)

---

## 💾 Data Storage

All data is stored locally in:
```
backend/data/
├── memory.json     # Conversation memory
├── settings.json   # User preferences
└── logs.json       # Activity logs
```

**No cloud storage** - everything stays on your machine!

---

## 🔐 Privacy & Security

- ✅ 100% local AI processing
- ✅ No data sent to cloud (except optional Google TTS)
- ✅ Your conversations stay private
- ✅ File system access restricted to home directory
- ✅ App launcher requires explicit permission

---

## 🆘 Still Having Issues?

1. Check the full logs:
   ```bash
   # Backend logs
   cd backend
   npm run dev
   
   # Frontend logs
   npm run dev
   ```

2. Verify Ollama:
   ```bash
   curl http://localhost:11434/api/tags
   ```

3. Test backend directly:
   ```bash
   curl http://localhost:5000/health
   ```

4. Check browser console (F12 > Console tab)

---

## 🎊 You're All Set!

Vezora AI is now running on your machine. Enjoy your personal AI assistant!

**Key Features to Try:**
- 💬 Natural conversations
- 🎙️ Voice call mode
- 🧠 Contextual memory
- 🚀 App launcher
- 📁 File operations
- ⚙️ Customizable settings

---

**Questions?** Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for detailed documentation.

**Back to:** [Documentation Index](README.md) | [Main README](../README.md)

**Happy Assisting!** 🤖✨
