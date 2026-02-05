# 🔐 Environment Variables Setup Guide

Complete guide for configuring `.env` files for both frontend and backend.

---

## 📦 Backend Configuration

### **Step 1: Create backend/.env file**

Navigate to the `backend` folder and create a file named `.env`:

```bash
cd backend
touch .env    # Mac/Linux
# or
type nul > .env    # Windows
```

### **Step 2: Copy this template into backend/.env**

```env
# ==========================================
# VEZORA AI - BACKEND CONFIGURATION
# ==========================================

# ==========================================
# 1. SERVER CONFIGURATION
# ==========================================
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173


# ==========================================
# 2. AI PROVIDER CONFIGURATION
# ==========================================

# Primary AI Provider: gemini | ollama (default: auto-detect)
AI_PROVIDER=auto

# --- Gemini AI (Google) - RECOMMENDED ---
GEMINI_API_KEY=
GEMINI_MODEL=gemini-pro

# --- Ollama (Local) - FALLBACK ---
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=phi


# ==========================================
# 3. GOOGLE CLOUD TTS (OPTIONAL)
# ==========================================
GOOGLE_TTS_API_KEY=
GOOGLE_TTS_PROJECT_ID=


# ==========================================
# 4. FEATURE TOGGLES
# ==========================================
VOICE_CALL_MODE=true
ENABLE_APP_LAUNCH=true
ENABLE_FILE_SYSTEM=true
ENABLE_BROWSER_CONTROL=false


# ==========================================
# 5. SECURITY
# ==========================================
ENCRYPTION_KEY=vezora-local-assistant-2024-secure-key-CHANGE-THIS
MAX_MEMORY_ITEMS=100
MAX_LOG_ENTRIES=500


# ==========================================
# 6. DATA STORAGE PATHS
# ==========================================
DATA_DIR=./data
MEMORY_FILE=./data/memory.json
SETTINGS_FILE=./data/settings.json
LOGS_FILE=./data/logs.json
```

---

## 🎨 Frontend Configuration (Optional)

### **Step 1: Create .env file in project root**

```bash
cd ..    # Go back to project root
touch .env    # Mac/Linux
# or
type nul > .env    # Windows
```

### **Step 2: Copy this template into .env (root folder)**

```env
# ==========================================
# VEZORA AI - FRONTEND CONFIGURATION
# ==========================================

# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# Optional: WebSocket URL (if different)
VITE_WS_URL=ws://localhost:5000

# Optional: Enable debug mode
VITE_DEBUG=false
```

**Note:** Frontend `.env` is **OPTIONAL** - the app will use defaults if not provided.

---

## 📋 Configuration Explained

### **Backend Variables**

#### **1. Server Settings**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | 5000 | Backend server port |
| `NODE_ENV` | Yes | development | Environment (development/production) |
| `FRONTEND_URL` | Yes | http://localhost:5173 | Frontend URL for CORS |

#### **2. AI Provider (Gemini or Ollama)**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | No | auto | Which AI to use (auto/gemini/ollama) |

**Provider Selection:**
- `auto` - Use Gemini if API key is set, fallback to Ollama
- `gemini` - Force Gemini AI (requires API key)
- `ollama` - Force local Ollama (requires Ollama running)

---

#### **2a. Gemini AI (Google) - RECOMMENDED** ⭐

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | No | empty | Google AI API key |
| `GEMINI_MODEL` | No | gemini-pro | Gemini model version |

**Why Gemini?**
- ✅ **More capable** than local models (Phi-2/TinyLLaMA)
- ✅ **Better reasoning** and context understanding
- ✅ **Faster responses** (cloud-based)
- ✅ **Free tier available** (60 requests/minute)
- ✅ **No local GPU needed**

**How to Get Gemini API Key:**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Get API Key"**
3. Choose **"Create API key in new project"**
4. Copy the API key
5. Paste into `GEMINI_API_KEY` in `backend/.env`

**Free Tier:**
- 60 requests per minute
- 1,500 requests per day
- Perfect for personal use!

**Model Options:**

```bash
# Recommended (best balance)
GEMINI_MODEL=gemini-pro

# Experimental (may have newer features)
GEMINI_MODEL=gemini-pro-latest

# Vision support (if using images)
GEMINI_MODEL=gemini-pro-vision
```

---

#### **2b. Ollama (Local) - FALLBACK**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OLLAMA_BASE_URL` | Yes | http://localhost:11434 | Ollama server endpoint |
| `OLLAMA_MODEL_NAME` | Yes | phi | AI model to use |

**When to Use Ollama:**
- 🔒 Need offline capability
- 🔒 Privacy-sensitive data (stays local)
- 💰 Want 100% free (no API costs)
- 💻 Have decent hardware (4GB+ RAM)

**Model Options:**

```bash
# Small & Fast (2-4GB RAM) - RECOMMENDED
OLLAMA_MODEL_NAME=phi

# Smallest & Fastest (1-2GB RAM)
OLLAMA_MODEL_NAME=tinyllama

# Most Capable (8GB+ RAM)
OLLAMA_MODEL_NAME=mistral:7b-instruct

# Before using, pull the model:
ollama pull phi
# or
ollama pull tinyllama
# or
ollama pull mistral:7b-instruct
```

#### **3. Google Cloud TTS (Optional)**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_TTS_API_KEY` | No | empty | Google Cloud API key |
| `GOOGLE_TTS_PROJECT_ID` | No | empty | Google Cloud project ID |

**If empty:** Browser TTS will be used (free but robotic voice)  
**If provided:** High-quality Google voice (better but requires API key)

**How to get API Key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Cloud Text-to-Speech API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key
6. Paste into `GOOGLE_TTS_API_KEY`

#### **4. Feature Toggles**

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_CALL_MODE` | true | Enable voice call feature |
| `ENABLE_APP_LAUNCH` | true | Allow launching apps |
| `ENABLE_FILE_SYSTEM` | true | Allow file operations |
| `ENABLE_BROWSER_CONTROL` | false | Browser automation (advanced) |

Set to `false` to disable features for security.

#### **5. Security**

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | Yes | Secret key for data encryption |
| `MAX_MEMORY_ITEMS` | No | Max memories per user |
| `MAX_LOG_ENTRIES` | No | Max log entries per user |

**⚠️ IMPORTANT:** Change `ENCRYPTION_KEY` to a random string!

Generate a secure key:
- Visit: https://randomkeygen.com/
- Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### **6. Storage Paths**

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_DIR` | ./data | Data storage directory |
| `MEMORY_FILE` | ./data/memory.json | Memory storage |
| `SETTINGS_FILE` | ./data/settings.json | Settings storage |
| `LOGS_FILE` | ./data/logs.json | Activity logs |

---

### **Frontend Variables**

#### **Optional Configuration**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BACKEND_URL` | No | http://localhost:5000 | Backend API URL |
| `VITE_WS_URL` | No | ws://localhost:5000 | WebSocket URL |
| `VITE_DEBUG` | No | false | Enable debug logs |

**Note:** These are optional. If not provided, the app uses hardcoded defaults.

---

## 🚀 Quick Setup Commands

### **For Beginners (Copy-Paste)**

```bash
# 1. Navigate to backend folder
cd backend

# 2. Create .env file with basic config
cat > .env << 'EOF'
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

ENCRYPTION_KEY=vezora-local-assistant-2024-secure-key-CHANGE-THIS
MAX_MEMORY_ITEMS=100
MAX_LOG_ENTRIES=500

DATA_DIR=./data
MEMORY_FILE=./data/memory.json
SETTINGS_FILE=./data/settings.json
LOGS_FILE=./data/logs.json
EOF

# 3. Go back to root
cd ..

# 4. (Optional) Create frontend .env
cat > .env << 'EOF'
VITE_BACKEND_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_DEBUG=false
EOF

echo "✅ Configuration files created!"
echo "⚠️  Remember to:"
echo "   1. Install Ollama: ollama pull phi"
echo "   2. Change ENCRYPTION_KEY in backend/.env"
echo "   3. (Optional) Add GOOGLE_TTS_API_KEY"
```

---

## 🔍 Verification

### **1. Check if .env files exist:**

```bash
# Backend
ls backend/.env        # Mac/Linux
dir backend\.env       # Windows

# Frontend (optional)
ls .env                # Mac/Linux
dir .env               # Windows
```

### **2. Verify backend configuration:**

```bash
cd backend
npm run dev
```

You should see:
```
✅ Server running on http://localhost:5000
✅ Ollama endpoint: http://localhost:11434
✅ Model: phi
✅ Voice Call Mode: ENABLED
```

### **3. Test backend:**

```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "features": {
    "ollama": true,
    "voiceCallMode": true,
    "appLaunch": true,
    "fileSystem": true
  }
}
```

---

## 🐛 Troubleshooting

### **Problem: "Ollama not found"**

**Solution:**
```bash
# Check if Ollama is installed
ollama --version

# If not installed:
# Download from https://ollama.ai

# Pull the model
ollama pull phi

# Start Ollama server
ollama serve
```

### **Problem: "Port 5000 already in use"**

**Solution:**
Change `PORT` in `backend/.env`:
```env
PORT=5001    # or any other available port
```

Then update `VITE_BACKEND_URL` in frontend `.env`:
```env
VITE_BACKEND_URL=http://localhost:5001
```

### **Problem: "Voice doesn't work"**

**Solutions:**
1. **Browser TTS (free):**
   - Leave `GOOGLE_TTS_API_KEY` empty
   - Use Chrome or Edge browser

2. **Google TTS (better quality):**
   - Add your `GOOGLE_TTS_API_KEY`
   - Restart backend

### **Problem: "Cannot launch apps"**

**Solution:**
Ensure `ENABLE_APP_LAUNCH=true` in `backend/.env`

---

## 🔐 Security Best Practices

### **1. Change Default Encryption Key**

❌ **Bad:**
```env
ENCRYPTION_KEY=vezora-local-assistant-2024-secure-key-CHANGE-THIS
```

✅ **Good:**
```env
ENCRYPTION_KEY=a8f5d2b9c4e7f1a3d6b8e2c5f9a1d4b7c2e5f8a3d6b9c2e5f8a1d4b7c2e5f8a3
```

Generate:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **2. Never Commit .env Files**

The `.env` files are already in `.gitignore`. Double-check:

```bash
# Should output nothing (file is ignored)
git status backend/.env
git status .env
```

### **3. Use Environment Variables in Production**

For production deployment, use platform-specific environment variables:
- Heroku: Settings → Config Vars
- Vercel: Settings → Environment Variables
- Docker: `docker-compose.yml` or `-e` flags

---

## 📝 Summary

### **Minimum Required Configuration:**

**Backend (.env in `backend/` folder):**
```env
PORT=5000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=phi
VOICE_CALL_MODE=true
ENABLE_APP_LAUNCH=true
ENABLE_FILE_SYSTEM=true
ENCRYPTION_KEY=your-random-32-char-key
```

**Frontend (.env in project root):**
```env
# Optional - can skip entirely!
VITE_BACKEND_URL=http://localhost:5000
```

### **Checklist:**

- [ ] Created `backend/.env` file
- [ ] Set `OLLAMA_MODEL_NAME=phi` (or tinyllama/mistral)
- [ ] Changed `ENCRYPTION_KEY` to random string
- [ ] (Optional) Added `GOOGLE_TTS_API_KEY`
- [ ] (Optional) Created frontend `.env`
- [ ] Installed Ollama: `ollama pull phi`
- [ ] Started Ollama: `ollama serve`
- [ ] Tested backend: `npm run dev`

---

## 🎉 Ready!

Once configured, start the application:

```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
npm run dev
```

Open **http://localhost:5173** and enjoy! 🚀

---

**Need Help?** Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for more details.

**Back to:** [Documentation Index](README.md) | [Main README](../README.md)