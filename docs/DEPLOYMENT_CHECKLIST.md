# ✅ Vezora AI - Deployment Checklist

Use this checklist to ensure everything is set up correctly.

---

## 📦 Installation Checklist

### Prerequisites
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Ollama installed (`ollama --version`)
- [ ] Git installed (optional, for cloning)

### Repository Setup
- [ ] Repository cloned or downloaded
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend dependencies installed (`cd backend && npm install`)

---

## 🧠 Ollama Setup

### Model Installation
Choose at least ONE model:

- [ ] **Phi-2** installed (`ollama pull phi`) ⭐ Recommended
- [ ] **TinyLLaMA** installed (`ollama pull tinyllama`)
- [ ] **Mistral 7B** installed (`ollama pull mistral:7b-instruct`)

### Ollama Service
- [ ] Ollama server started (`ollama serve`)
- [ ] Ollama API accessible (`curl http://localhost:11434/api/tags`)
- [ ] Model listed in Ollama (`ollama list`)

---

## ⚙️ Backend Configuration

### Environment File
- [ ] Created `backend/.env` file
- [ ] Set `PORT=5000`
- [ ] Set `OLLAMA_BASE_URL=http://localhost:11434`
- [ ] Set `OLLAMA_MODEL_NAME` to your chosen model
- [ ] Set `ENABLE_APP_LAUNCH=true`
- [ ] Set `ENABLE_FILE_SYSTEM=true`
- [ ] Set `VOICE_CALL_MODE=true`
- [ ] (Optional) Set `GOOGLE_TTS_API_KEY` for better voice quality

### Backend Verification
- [ ] Backend starts without errors (`cd backend && npm run dev`)
- [ ] Health endpoint responds (`curl http://localhost:5000/health`)
- [ ] Ollama connection verified (`curl http://localhost:5000/api/chat/health`)
- [ ] WebSocket server running

---

## 🎨 Frontend Configuration

### Environment (Optional)
- [ ] Created `.env` in project root
- [ ] Set `VITE_BACKEND_URL=http://localhost:5000` (if needed)

### Frontend Verification
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] Opens in browser at `http://localhost:5173`
- [ ] No console errors (F12 > Console)
- [ ] Splash screen appears
- [ ] UI loads correctly

---

## 🧪 Feature Testing

### Chat Functionality
- [ ] Type a message and send
- [ ] Receive response from AI
- [ ] Messages display correctly (user vs assistant)
- [ ] Markdown renders properly
- [ ] Typing indicator appears
- [ ] No error messages

### Voice Call Mode ⭐
- [ ] Click "Voice Call" button
- [ ] Full-screen orb appears
- [ ] Microphone permission granted
- [ ] Click mic button to start listening
- [ ] Speak a test phrase
- [ ] Transcript appears
- [ ] Vezora responds with voice
- [ ] Waveform animates correctly
- [ ] Mute button works
- [ ] Close button exits voice mode

### Memory System
- [ ] Navigate to Memory page
- [ ] Memory items display as cards
- [ ] Confidence tags visible
- [ ] Edit button appears on hover
- [ ] Delete button appears on hover
- [ ] Memory persists across reloads

### Settings
- [ ] Navigate to Settings page
- [ ] Theme selector works
- [ ] Personality dropdown changes
- [ ] Voice speed slider adjusts
- [ ] Language dropdown shows options
- [ ] Privacy switches toggle
- [ ] Settings persist after reload

### Navigation
- [ ] NavRail highlights active view
- [ ] Click Chat icon → Chat page
- [ ] Click Brain icon → Memory page
- [ ] Click Gear icon → Settings page
- [ ] Smooth transitions between pages
- [ ] No navigation errors

### Mini Mode
- [ ] Click minimize button
- [ ] Floating orb appears
- [ ] Orb animates (pulse, rotate)
- [ ] Click orb to expand
- [ ] App restores correctly

---

## 🚀 Advanced Features

### App Launcher
- [ ] Say "Open Chrome" (or type in chat)
- [ ] Chrome browser opens
- [ ] Try other apps (VS Code, Calculator)
- [ ] No permission errors

### File Operations
- [ ] Say "Save file as test.txt"
- [ ] File saves successfully
- [ ] Say "Open my documents folder"
- [ ] File explorer opens
- [ ] No file system errors

### Intent Parsing
- [ ] Backend correctly identifies app launch commands
- [ ] Backend correctly identifies file operations
- [ ] Backend correctly identifies chat messages
- [ ] Intent confidence scores reasonable

---

## 🔒 Security Verification

### Backend Security
- [ ] `.env` file NOT in git repository
- [ ] File system access restricted to home directory
- [ ] App launcher requires explicit permission
- [ ] No sensitive data in logs
- [ ] CORS configured correctly

### Frontend Security
- [ ] No API keys in frontend code
- [ ] Microphone permission requested properly
- [ ] No sensitive data in localStorage
- [ ] All API calls use environment variables

---

## 📊 Performance Checks

### Response Times
- [ ] Chat responses < 5 seconds
- [ ] Voice recognition < 2 seconds
- [ ] Voice synthesis < 3 seconds
- [ ] Page transitions smooth (< 500ms)
- [ ] No UI lag or freezing

### Memory Usage
- [ ] Backend RAM usage acceptable (check Task Manager)
- [ ] Frontend RAM usage acceptable
- [ ] Ollama RAM usage within limits
- [ ] No memory leaks after extended use

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Edge
- [ ] Works in Brave
- [ ] (Optional) Works in Firefox
- [ ] (Optional) Works in Safari

---

## 🐛 Known Issues to Check

### Common Problems
- [ ] Voice doesn't work in Firefox → Use Chrome/Edge
- [ ] Slow first response → Ollama model loading (normal)
- [ ] "Ollama not running" error → Start `ollama serve`
- [ ] Port 5000 in use → Change `PORT` in `.env`
- [ ] Voice sounds robotic → Add Google TTS API key

### Error Handling
- [ ] Backend errors show helpful messages
- [ ] Frontend errors don't crash app
- [ ] Network errors handled gracefully
- [ ] Invalid user input validated

---

## 📝 Documentation Verification

### Files Present
- [ ] README.md
- [ ] SETUP_GUIDE.md
- [ ] IMPLEMENTATION_SUMMARY.md
- [ ] DEPLOYMENT_CHECKLIST.md (this file)
- [ ] backend/README.md

### Documentation Quality
- [ ] All links work
- [ ] Code examples correct
- [ ] Instructions clear
- [ ] Screenshots/demos included (optional)

---

## 🚢 Production Readiness (Optional)

### Build Process
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Production bundle size acceptable
- [ ] No build warnings or errors
- [ ] Assets optimized

### Deployment Prep
- [ ] Environment variables documented
- [ ] Deployment guide created
- [ ] Backup strategy planned
- [ ] Monitoring setup (optional)

---

## 🎉 Final Verification

### User Acceptance
- [ ] All core features work
- [ ] UI is polished and responsive
- [ ] Voice call mode impressive
- [ ] No critical bugs
- [ ] Performance acceptable

### Ready for Users
- [ ] Installation instructions clear
- [ ] User guide available
- [ ] Support channels defined
- [ ] Feedback mechanism in place

---

## 📞 Support Checklist

If any item above fails:

1. **Check logs:**
   ```bash
   # Backend logs
   cd backend && npm run dev
   
   # Frontend logs (browser console)
   Press F12 > Console tab
   ```

2. **Verify Ollama:**
   ```bash
   ollama list
   ollama serve
   curl http://localhost:11434/api/tags
   ```

3. **Restart services:**
   ```bash
   # Stop all
   Ctrl+C in all terminals
   
   # Restart backend
   cd backend && npm run dev
   
   # Restart frontend
   npm run dev
   ```

4. **Check documentation:**
   - [SETUP_GUIDE.md](SETUP_GUIDE.md)
   - [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
   - [backend/README.md](backend/README.md)

5. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## ✅ Completion

Once all items are checked:

**🎊 Congratulations!** Vezora AI is fully deployed and ready to use!

**Next Steps:**
1. Test with real users
2. Gather feedback
3. Monitor performance
4. Plan improvements
5. Share your experience!

---

**Date Completed:** _______________

**Deployed By:** _______________

**Notes:**

```
_______________________________________________________

_______________________________________________________

_______________________________________________________
```

---

**Questions?** Refer to [SETUP_GUIDE.md](SETUP_GUIDE.md) or [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

**Navigation:**
- [Documentation Index](README.md)
- [Setup Guide](SETUP_GUIDE.md)
- [ENV Setup Guide](ENV_SETUP_GUIDE.md)
- [Main README](../README.md)