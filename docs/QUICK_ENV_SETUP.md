# ⚡ Quick .env Setup (Copy-Paste)

**Just follow these 3 steps and you're done!**

---

## 🎯 Step 1: Backend .env (REQUIRED)

### **Create the file:**
```bash
cd backend
```

**Windows:**
```cmd
copy nul .env
```

**Mac/Linux:**
```bash
touch .env
```

### **Copy this into `backend/.env`:**

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=phi

GOOGLE_TTS_API_KEY=
GOOGLE_TTS_PROJECT_ID=

VOICE_CALL_MODE=true
ENABLE_APP_LAUNCH=true
ENABLE_FILE_SYSTEM=true
ENABLE_BROWSER_CONTROL=false

ENCRYPTION_KEY=vezora-local-assistant-2024-secure-CHANGE-ME
MAX_MEMORY_ITEMS=100
MAX_LOG_ENTRIES=500

DATA_DIR=./data
MEMORY_FILE=./data/memory.json
SETTINGS_FILE=./data/settings.json
LOGS_FILE=./data/logs.json
```

**✅ DONE! That's all you need for backend.**

---

## 🎨 Step 2: Frontend .env (OPTIONAL)

### **Create the file:**
```bash
cd ..    # Go back to project root
```

**Windows:**
```cmd
copy nul .env
```

**Mac/Linux:**
```bash
touch .env
```

### **Copy this into `.env` (project root):**

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_DEBUG=false
```

**Note:** This is **OPTIONAL** - the app works without it!

---

## 🧠 Step 3: Install Ollama Model

```bash
# Pull the AI model (choose ONE):

# Option 1: Phi-2 (RECOMMENDED - 2.7B, fast, smart)
ollama pull phi

# Option 2: TinyLLaMA (smallest, 1.1B)
ollama pull tinyllama

# Option 3: Mistral (most capable, 7B, needs 8GB+ RAM)
ollama pull mistral:7b-instruct
```

---

## ✅ Verification

### **1. Check files exist:**

```bash
# Backend
ls backend/.env        # Mac/Linux
dir backend\.env       # Windows

# Frontend (optional)
ls .env                # Mac/Linux  
dir .env               # Windows
```

### **2. Start Ollama:**

```bash
ollama serve
```

Leave this running!

### **3. Test Backend:**

```bash
cd backend
npm run dev
```

Should see:
```
✅ Server running on http://localhost:5000
✅ Ollama endpoint: http://localhost:11434
✅ Model: phi
```

### **4. Test Frontend:**

```bash
# In new terminal
npm run dev
```

Should see:
```
➜ Local: http://localhost:5173/
```

---

## 🎉 That's It!

Open **http://localhost:5173** and enjoy Vezora AI! 🚀

---

## 🔧 Common Edits

### **Change AI Model:**

Edit `backend/.env`:
```env
OLLAMA_MODEL_NAME=tinyllama    # Change to tinyllama or mistral:7b-instruct
```

### **Add Google Voice (Better Quality):**

1. Get API key: https://console.cloud.google.com/
2. Edit `backend/.env`:
```env
GOOGLE_TTS_API_KEY=your-key-here
GOOGLE_TTS_PROJECT_ID=your-project-id
```

### **Change Port:**

Edit `backend/.env`:
```env
PORT=5001    # Change to any free port
```

Then edit `.env` (frontend):
```env
VITE_BACKEND_URL=http://localhost:5001
```

---

## 🐛 Troubleshooting

### **"Ollama not found"**
```bash
# Install from: https://ollama.ai
# Then: ollama pull phi
```

### **"Port 5000 in use"**
```bash
# Change PORT in backend/.env to 5001
```

### **"Cannot find module"**
```bash
# Reinstall dependencies
npm install
cd backend && npm install
```

---

## 📚 More Help

- **Detailed guide:** [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md)
- **Full setup:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Tauri + Next.js:** [TAURI_NEXTJS_GUIDE.md](TAURI_NEXTJS_GUIDE.md)
- **Back to main:** [README.md](../README.md)

---

**Questions?** Just ask! 😊
