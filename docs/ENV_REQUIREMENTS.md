# 🔐 ENVIRONMENT VARIABLES - COMPLETE REQUIREMENTS

## 📋 TABLE OF CONTENTS
1. [Local Development (.env)](#local-development)
2. [Production Backend (Render)](#production-backend-render)
3. [Production Frontend (Vercel)](#production-frontend-vercel)
4. [How to Generate Secrets](#how-to-generate-secrets)
5. [Complete Example Files](#complete-example-files)

---

## 🏠 LOCAL DEVELOPMENT

### **File: `backend/.env`**

Copy this template and fill in your values:

```env
# ==================== REQUIRED ====================

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL - Local)
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/vezora_dev

# Security Keys (GENERATE NEW ONES!)
ENCRYPTION_KEY=GENERATE_32_CHAR_KEY_SEE_BELOW
JWT_SECRET=GENERATE_RANDOM_SECRET_SEE_BELOW

# ==================== AI PROVIDERS ====================

# Groq API (Primary AI)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Gemini API (Fallback)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro

# Ollama (Local LLM - Optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=mistral:latest
AI_PROVIDER=groq

# ==================== GOOGLE OAUTH ====================

# Google OAuth (for Gmail/Calendar)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# ==================== OPTIONAL FEATURES ====================

# Voice & Features
VOICE_CALL_MODE=true
ENABLE_APP_LAUNCH=true
ENABLE_FILE_SYSTEM=true

# Data Directory
DATA_DIR=./data
```

---

## ☁️ PRODUCTION BACKEND (RENDER)

### **Where to Add: Render Dashboard → Your Service → Environment**

Add these environment variables in Render dashboard:

```env
# ==================== REQUIRED ====================

# Server Configuration
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app

# Database (PostgreSQL - Render provides this automatically!)
# DATABASE_URL is auto-set by Render when you create PostgreSQL
# Format: postgresql://user:pass@host:5432/dbname
DATABASE_URL=${DATABASE_URL}

# Security Keys (GENERATE NEW ONES FOR PRODUCTION!)
ENCRYPTION_KEY=your_32_char_encryption_key
JWT_SECRET=your_random_jwt_secret_minimum_32_chars

# ==================== AI PROVIDERS ====================

# Groq API
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro

# AI Provider (don't use Ollama on Render - no GPU)
AI_PROVIDER=groq

# ==================== GOOGLE OAUTH ====================

# Google OAuth (UPDATE redirect URI!)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/auth/google/callback

# ==================== OPTIONAL ====================

# Features (disable file system on Render)
VOICE_CALL_MODE=true
ENABLE_APP_LAUNCH=false
ENABLE_FILE_SYSTEM=false

# Data Directory (not used with PostgreSQL)
DATA_DIR=./data
```

### **⚠️ IMPORTANT NOTES:**

1. **DATABASE_URL**: Automatically set by Render when you add PostgreSQL
2. **GOOGLE_REDIRECT_URI**: Must match Google Cloud Console settings
3. **FRONTEND_URL**: Your Vercel deployment URL
4. **ENABLE_FILE_SYSTEM**: Set to `false` (Render has ephemeral filesystem)
5. **ENABLE_APP_LAUNCH**: Set to `false` (can't launch apps on server)

---

## 🌐 PRODUCTION FRONTEND (VERCEL)

### **Where to Add: Vercel Dashboard → Your Project → Settings → Environment Variables**

```env
# Backend API URL
VITE_API_URL=https://your-backend.onrender.com

# Optional: Analytics, Monitoring
VITE_SENTRY_DSN=your_sentry_dsn_if_using
```

### **⚠️ IMPORTANT:**
- Only add variables prefixed with `VITE_` (Vite requirement)
- Never put secrets in frontend env vars (they're exposed to browser!)
- Backend URL must be your Render service URL

---

## 🔑 HOW TO GENERATE SECRETS

### **1. ENCRYPTION_KEY (32 characters exactly)**

**Method 1: Using Node.js (Recommended)**
```bash
# In your terminal:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Output example: 14f69344fc20f8e6b74e78e5c9037589
# Copy this to ENCRYPTION_KEY
```

**Method 2: Using OpenSSL**
```bash
openssl rand -hex 16

# Output example: a8f5f167f44f4964e6c998dee827110c
```

**Method 3: Online Generator**
```
Visit: https://www.random.org/strings/
Settings: 
- Length: 32
- Characters: Hex (0-9, a-f)
```

---

### **2. JWT_SECRET (random string, min 32 chars)**

**Method 1: Using Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Output example: kj3h4kjh5k3jh45k3jh45k3jh45k3jh4k5j3h4k5j=
# Copy this to JWT_SECRET
```

**Method 2: Using OpenSSL**
```bash
openssl rand -base64 32

# Output example: XN7TqPnRBj3vJx4LkM2pQwE8Fy9GzHs=
```

---

### **3. GROQ_API_KEY**

```
1. Go to: https://console.groq.com/
2. Sign up / Log in
3. Navigate to: API Keys
4. Click "Create API Key"
5. Copy the key (starts with "gsk_...")
6. Paste into GROQ_API_KEY
```

---

### **4. GEMINI_API_KEY**

```
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Get API Key"
4. Click "Create API key in new project"
5. Copy the key (starts with "AIza...")
6. Paste into GEMINI_API_KEY
```

---

### **5. GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET**

```
1. Go to: https://console.cloud.google.com/
2. Create new project or select existing
3. Enable APIs:
   - Gmail API
   - Google Calendar API
4. Go to: Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - Local: http://localhost:5000/auth/google/callback
   - Production: https://your-backend.onrender.com/auth/google/callback
7. Copy Client ID and Client Secret
```

---

## 📝 COMPLETE EXAMPLE FILES

### **Example 1: Local Development**

**File: `backend/.env`**
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/vezora_dev

# Security (GENERATED VALUES - DON'T USE THESE!)
ENCRYPTION_KEY=14f69344fc20f8e6b74e78e5c9037589
JWT_SECRET=kj3h4kjh5k3jh45k3jh45k3jh45k3jh4k5j3h4k5j=

# AI
GROQ_API_KEY=gsk_abcdefghijklmnopqrstuvwxyz123456
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_API_KEY=AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ123456
GEMINI_MODEL=gemini-1.5-pro
AI_PROVIDER=groq

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Features
VOICE_CALL_MODE=true
ENABLE_APP_LAUNCH=true
ENABLE_FILE_SYSTEM=true
DATA_DIR=./data

# Ollama (Optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=mistral:latest
```

---

### **Example 2: Production (Render Environment Variables)**

**In Render Dashboard, add these individually:**

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | `production` |
| `PORT` | `10000` | `10000` |
| `FRONTEND_URL` | Your Vercel URL | `https://vezora-ai.vercel.app` |
| `DATABASE_URL` | Auto-set by Render | `postgresql://user:pass@...` |
| `ENCRYPTION_KEY` | Generated 32 chars | `14f69344fc20f8e6b74e78e5c9037589` |
| `JWT_SECRET` | Generated secret | `kj3h4kjh5k3jh45...` |
| `GROQ_API_KEY` | Your Groq key | `gsk_abc123...` |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | `llama-3.3-70b-versatile` |
| `GEMINI_API_KEY` | Your Gemini key | `AIzaSyABC...` |
| `GEMINI_MODEL` | `gemini-1.5-pro` | `gemini-1.5-pro` |
| `AI_PROVIDER` | `groq` | `groq` |
| `GOOGLE_CLIENT_ID` | From Google Console | `123-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Console | `GOCSPX-abc123` |
| `GOOGLE_REDIRECT_URI` | Render callback URL | `https://vezora-api.onrender.com/auth/google/callback` |
| `VOICE_CALL_MODE` | `true` | `true` |
| `ENABLE_APP_LAUNCH` | `false` | `false` |
| `ENABLE_FILE_SYSTEM` | `false` | `false` |

---

### **Example 3: Production Frontend (Vercel)**

**In Vercel Dashboard → Environment Variables:**

| Key | Value | Example |
|-----|-------|---------|
| `VITE_API_URL` | Your Render backend URL | `https://vezora-api.onrender.com` |

---

## ✅ CHECKLIST BEFORE DEPLOYMENT

### **Local Development:**
- [ ] Created `backend/.env` file
- [ ] Generated unique ENCRYPTION_KEY (32 chars)
- [ ] Generated unique JWT_SECRET (32+ chars)
- [ ] Added GROQ_API_KEY
- [ ] Added GEMINI_API_KEY
- [ ] Added GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- [ ] Set DATABASE_URL to local PostgreSQL
- [ ] Set FRONTEND_URL to `http://localhost:5173`
- [ ] Never committed .env to Git

### **Production (Render Backend):**
- [ ] Created PostgreSQL database on Render
- [ ] Added all environment variables in Render dashboard
- [ ] Generated NEW ENCRYPTION_KEY (different from local!)
- [ ] Generated NEW JWT_SECRET (different from local!)
- [ ] Used production GROQ_API_KEY
- [ ] Used production GEMINI_API_KEY
- [ ] Updated GOOGLE_REDIRECT_URI to Render URL
- [ ] Set FRONTEND_URL to Vercel URL
- [ ] Set ENABLE_FILE_SYSTEM to false
- [ ] Set ENABLE_APP_LAUNCH to false
- [ ] DATABASE_URL auto-set by Render

### **Production (Vercel Frontend):**
- [ ] Added VITE_API_URL pointing to Render backend
- [ ] No secrets in frontend env vars
- [ ] All env vars prefixed with VITE_

### **Google OAuth Setup:**
- [ ] Enabled Gmail API in Google Console
- [ ] Enabled Google Calendar API
- [ ] Created OAuth 2.0 credentials
- [ ] Added local redirect URI (for development)
- [ ] Added production redirect URI (for Render)
- [ ] Tested OAuth flow

---

## 🚨 SECURITY WARNINGS

### **❌ NEVER DO THIS:**
```env
# DON'T use simple/guessable values
ENCRYPTION_KEY=12345678901234567890123456789012  ❌
JWT_SECRET=mysecret  ❌
JWT_SECRET=password123  ❌

# DON'T reuse the same secrets across environments
Local ENCRYPTION_KEY = Production ENCRYPTION_KEY  ❌

# DON'T commit .env to Git
git add backend/.env  ❌
```

### **✅ ALWAYS DO THIS:**
```env
# DO use cryptographically random values
ENCRYPTION_KEY=14f69344fc20f8e6b74e78e5c9037589  ✅
JWT_SECRET=kj3h4kjh5k3jh45k3jh45k3jh45k3jh4k5j3h4k5j=  ✅

# DO use different secrets for each environment
Local: ENCRYPTION_KEY=abc123...
Prod:  ENCRYPTION_KEY=xyz789...  ✅

# DO use .gitignore
echo "backend/.env" >> .gitignore  ✅
```

---

## 🔄 ENVIRONMENT-SPECIFIC DIFFERENCES

| Setting | Local | Production (Render) |
|---------|-------|---------------------|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `5000` | `10000` |
| `DATABASE_URL` | Local PostgreSQL | Render PostgreSQL |
| `FRONTEND_URL` | `localhost:5173` | Vercel URL |
| `GOOGLE_REDIRECT_URI` | `localhost:5000/auth/...` | Render URL |
| `ENCRYPTION_KEY` | Generated key #1 | **Different** key #2 |
| `JWT_SECRET` | Generated secret #1 | **Different** secret #2 |
| `ENABLE_FILE_SYSTEM` | `true` | `false` |
| `ENABLE_APP_LAUNCH` | `true` | `false` |
| `AI_PROVIDER` | `ollama` or `groq` | `groq` only |

---

## 📞 QUICK REFERENCE

### **Minimum Required Variables:**

**Local Development:**
```
DATABASE_URL
ENCRYPTION_KEY
JWT_SECRET
GROQ_API_KEY
```

**Production Backend:**
```
DATABASE_URL (auto-set)
ENCRYPTION_KEY
JWT_SECRET
GROQ_API_KEY
FRONTEND_URL
```

**Production Frontend:**
```
VITE_API_URL
```

---

## 🆘 TROUBLESHOOTING

### **"ENCRYPTION_KEY must be exactly 32 characters"**
```bash
# Check length:
echo -n "your_key_here" | wc -c

# Should output: 32

# Generate new:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### **"JWT malformed" or "Invalid token"**
```
Problem: JWT_SECRET is different between environments
Solution: Make sure JWT_SECRET is the same on all backend instances
```

### **"Database connection failed"**
```
Problem: DATABASE_URL format wrong
Correct format: postgresql://user:password@host:5432/database

Check:
1. Username correct?
2. Password correct?
3. Host correct?
4. Port correct (5432)?
5. Database name exists?
```

### **"Google OAuth redirect_uri_mismatch"**
```
Problem: GOOGLE_REDIRECT_URI doesn't match Google Console
Solution: 
1. Go to Google Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URI:
   - Local: http://localhost:5000/auth/google/callback
   - Prod: https://your-backend.onrender.com/auth/google/callback
4. Save and wait 5 minutes for changes to propagate
```

---

## ✅ READY TO PROCEED?

**Once you have:**
1. ✅ Generated all secrets (ENCRYPTION_KEY, JWT_SECRET)
2. ✅ Obtained API keys (Groq, Gemini, Google OAuth)
3. ✅ Created `backend/.env` with all values
4. ✅ Verified .env file is in .gitignore

**Then say:** "ENV ready, proceed with implementation"

**I will then:**
1. Create .gitignore
2. Add rate limiting
3. Set up PostgreSQL
4. Build authentication system
5. Migrate all services to PostgreSQL
6. Add user isolation
7. Create deployment guide

---

**📝 Need help getting any API keys? Ask me and I'll guide you step-by-step!**
