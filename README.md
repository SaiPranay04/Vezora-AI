# 🤖 Vezora AI - Personal AI Assistant

<div align="center">

![Vezora Logo](https://img.shields.io/badge/Vezora-AI%20Assistant-8E44FF?style=for-the-badge&logo=robot&logoColor=white)

**A beautiful, privacy-first AI personal assistant with voice call mode**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js)](https://nodejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-000000?logo=ollama)](https://ollama.ai/)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**[Setup Guide](docs/SETUP_GUIDE.md)** • **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** • **[Backend Docs](backend/README.md)**

</div>

---

## ✨ Features

### 🎙️ Voice Call Mode
Full-screen animated voice assistant interface with real-time speech recognition and synthesis. Experience a **Jarvis/Her-like** interaction with beautiful waveform visualizations.

https://github.com/user-attachments/assets/your-demo-video.mp4

### 💬 Natural Conversations
Chat with Vezora using natural language. Supports markdown formatting, emoji, code blocks, and more.

### 🧠 Contextual Memory
Vezora remembers your preferences, past conversations, and important information. View and manage memories in the Memory page.

### 🚀 Desktop Integration
- **App Launcher:** "Open Chrome", "Launch VS Code"
- **File Operations:** Save, open, and manage files
- **System Control:** Execute commands safely

### 🎨 Beautiful UI
- Modern glassmorphism design
- Smooth Framer Motion animations
- Dark mode optimized
- Custom themes and personalities

### 🔒 Privacy-First
- **100% Local AI** - No cloud dependency (Ollama)
- **Offline Capable** - Works without internet
- **Encrypted Storage** - Your data stays private
- **No Tracking** - Zero telemetry

---

## 🎬 Demo

### Voice Call Mode
![Voice Call Mode](docs/images/voice-call-mode.png)

### Chat Interface
![Chat Interface](docs/images/chat-interface.png)

### Memory Management
![Memory Panel](docs/images/memory-panel.png)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Ollama** ([Install](https://ollama.ai/))

### Installation

```bash
# 1. Clone repository
git clone https://github.com/SaiPranay04/Vezora-AI.git
cd Vezora-AI

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Install Ollama model
ollama pull phi

# 4. Configure backend
cd backend
cp .env.template .env
# Edit .env with your settings

# 5. Start services
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev
```

Open **http://localhost:5173** 🎉

**📖 Detailed setup:** See [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Vezora AI Frontend                     │
│  React + TypeScript + Tailwind + Framer Motion             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Voice Call Mode  │  Chat  │  Memory  │  Settings    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API + WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                    Vezora AI Backend                         │
│                 Node.js + Express                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chat  │  Memory  │  Voice  │  Apps  │  Files       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Ollama (Local LLM)                         │
│         Phi-2 / TinyLLaMA / Mistral 7B                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Vezora-AI/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   │   ├── VoiceCallMode.tsx      ⭐ Full-screen voice UI
│   │   ├── VoiceButton.tsx        ✅ Enhanced voice button
│   │   ├── ChatBox.tsx            ✅ Markdown chat
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── useVoice.ts            ✅ Voice I/O
│   │   └── useVoiceCall.ts        ⭐ Voice call logic
│   ├── pages/              # Page components
│   └── ...
│
├── backend/                # Backend Node.js server
│   ├── routes/             # API routes
│   ├── controllers/        # Business logic
│   ├── utils/              # Utilities
│   │   └── ollamaClient.js        ✅ Ollama integration
│   ├── data/               # JSON storage
│   └── index.js            # Main server
│
├── public/                 # Static assets
├── docs/                   # Documentation
│
├── SETUP_GUIDE.md          📖 Quick setup guide
├── IMPLEMENTATION_SUMMARY.md  📋 Complete feature list
└── README.md               📄 This file
```

---

## 🎯 Key Features

### 1. Voice Call Mode ⭐
```tsx
// Activate voice call mode
<VoiceCallMode
  isOpen={true}
  onClose={() => {}}
  isListening={true}
  isSpeaking={false}
  transcript="Hello Vezora"
  response="Hi! How can I help?"
/>
```

Features:
- Full-screen animated orb
- Real-time waveform visualization
- Transcript display
- Mic and mute controls

### 2. Chat with Memory
```bash
User: "Remember that I like dark mode"
Vezora: "I'll remember that you prefer dark mode."

# Later...
User: "What's my preferred theme?"
Vezora: "You prefer dark mode."
```

### 3. App Launcher
```bash
User: "Open Chrome"
Vezora: *launches Chrome browser*

User: "Start VS Code"
Vezora: *opens Visual Studio Code*
```

### 4. File Operations
```bash
User: "Save this as notes.txt"
Vezora: "File saved to notes.txt"

User: "Open my project folder"
Vezora: *opens file explorer*
```

---

## 🔧 Configuration

### Backend (.env)

```env
# Ollama Configuration
OLLAMA_MODEL_NAME=phi        # or tinyllama, mistral:7b-instruct

# Feature Toggles
VOICE_CALL_MODE=true
ENABLE_APP_LAUNCH=true
ENABLE_FILE_SYSTEM=true

# Optional: Google Cloud TTS
GOOGLE_TTS_API_KEY=your-key-here
```

### Frontend (environment)

```bash
# Create .env in project root
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🎨 Customization

### Themes
Go to Settings > Theme Selector:
- **Dark Glow** (default)
- **Light Mode**
- **High Contrast**

### Personalities
Choose assistant personality:
- **Friendly** 😊
- **Formal** 🎩
- **Sassy** 😎
- **Technical** 🤓

### Voice Settings
Adjust in Settings:
- Voice Speed (0.5x - 2x)
- Voice Pitch
- Language (50+ languages)

---

## 📚 Documentation

- **[Setup Guide](docs/SETUP_GUIDE.md)** - Step-by-step installation
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Complete feature list
- **[Backend API Docs](backend/README.md)** - API reference
- **[Ollama Models](https://ollama.ai/library)** - Available LLMs

---

## 🧪 Development

### Frontend Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development

```bash
cd backend
npm run dev          # Start with nodemon
npm start            # Start production
npm test             # Run tests (if configured)
```

### Adding New Features

1. **Frontend Component:**
   ```tsx
   // src/components/MyFeature.tsx
   export const MyFeature = () => {
     return <div>My Feature</div>;
   };
   ```

2. **Backend Route:**
   ```javascript
   // backend/routes/myRoute.js
   router.get('/my-endpoint', (req, res) => {
     res.json({ message: 'Hello!' });
   });
   ```

3. **Connect:**
   ```typescript
   // In your component
   const response = await fetch('http://localhost:5000/api/my-endpoint');
   ```

---

## 🐛 Troubleshooting

### Ollama not connecting

```bash
# Check if Ollama is running
ollama list

# Start Ollama
ollama serve

# Test API
curl http://localhost:11434/api/tags
```

### Voice not working

- Use **Chrome** or **Edge** (best support)
- Grant microphone permission
- Check browser console (F12)

### Backend errors

```bash
# Check logs
cd backend
npm run dev

# Verify .env configuration
cat .env
```

**More help:** [SETUP_GUIDE.md](docs/SETUP_GUIDE.md#troubleshooting)

---

## 🚢 Deployment

### Tauri Desktop App (Coming Soon)

```bash
# Install Tauri
npm install -D @tauri-apps/cli

# Build desktop app
npm run tauri build
```

### Docker (Optional)

```bash
# Build image
docker-compose up --build

# Or manually:
docker build -t vezora-backend ./backend
docker run -p 5000:5000 vezora-backend
```

---

## 🗺️ Roadmap

- [x] Voice Call Mode
- [x] Local LLM Integration
- [x] Memory Management
- [x] App Launcher
- [ ] Tauri Desktop App
- [ ] Email/Calendar Integration
- [ ] Workflow Automation
- [ ] Mobile App (React Native)
- [ ] Plugin System

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is open-source. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **[Ollama](https://ollama.ai/)** - Local LLM runtime
- **[Microsoft Phi-2](https://www.microsoft.com/en-us/research/blog/phi-2/)** - Small language model
- **[React](https://reactjs.org/)** - UI framework
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Framer Motion](https://www.framer.com/motion/)** - Animations

---

## 📧 Contact

- **Author:** Sai Pranay
- **GitHub:** [@SaiPranay04](https://github.com/SaiPranay04)
- **Repository:** [Vezora-AI](https://github.com/SaiPranay04/Vezora-AI)

---

<div align="center">

**Made with ❤️ and lots of ☕**

⭐ **Star this repo if you found it helpful!**

</div>
