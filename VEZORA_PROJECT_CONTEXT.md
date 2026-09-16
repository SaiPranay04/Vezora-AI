# Vezora AI — Project Context

Durable knowledge for future coding sessions. Source of truth is the repository as inspected, not marketing docs or filenames.

Last verified from the working tree on 2026-09-16. Last Git commit on `main` is `782a321` (Electron wrapper). A large uncommitted “Fable” layer (tools, permissions, files UI, activity, AppContext) exists on top of that commit.

---

## 1. Project purpose

Vezora is a **personal desktop AI assistant**. Intended long-term scope includes conversation, voice, memory, tools/actions, tasks, files, finance (e.g. NottiPay), student utilities, research, and smart-room control.

**Currently implemented:** local-first Electron + Vite React desktop shell, Express backend, JWT login, Groq-primary chat with Ollama fallback, SQLite tasks/memory/users, keyword/heuristic tools, voice STT (browser) + TTS (Piper / Google / browser), file browsing, Gmail/Calendar (Google OAuth, keyword-routed), Tavily web research, workflows/OCR backends with little or no UI.

**Not present in code:** NottiPay, personal finance, university/student utilities, smart-room/IoT, true LLM function-calling, Tauri, Next.js, Docker, production test suite.

The assistant is referred to as **Vezora** in the UI and as **Zara** in several Groq/coordinator system prompts.

---

## 2. High-level architecture

```
Electron (main.js)
  ├─ optionally spawns backend/index.js  (skipped if SKIP_ELECTRON_BACKEND=1)
  └─ BrowserWindow → Vite React app (src/)

src/ (React 19 + TypeScript + Tailwind + Framer Motion)
  ├─ AuthContext  → JWT login/register against /api/auth
  ├─ AppContext   → current page, selected file/task, conversationId, recent actions
  └─ View switcher (no React Router): chat | memory | tasks | files | activity | profile | apps | settings

backend/index.js (Express + http + ws)
  ├─ REST /api/*
  ├─ Google OAuth at /auth/*
  └─ WebSocket /ws/voice-mode  (connection logging only; not used by the frontend)
```

**Client/server boundary:** the renderer talks to `VITE_BACKEND_URL` (default `http://localhost:5000`) over HTTP. Chat transcripts live in `localStorage`. Users, tasks, structured memory, and profiles live in SQLite (`backend/data/vezora.db`). Older memory/settings/logs still use JSON files under `backend/data/`.

This is **not** a Next.js app. Desktop packaging is **Electron**, not Tauri (Tauri is mentioned only in docs).

---

## 3. Technology stack (verified)

| Layer | Actual |
|---|---|
| Frontend | React 19.2, TypeScript ~5.9, Vite 7, Tailwind 3.4, Framer Motion 12, lucide-react, react-markdown |
| Desktop | Electron 30 (`main.js`), electron-builder; Windows NSIS / Linux AppImage |
| Backend | Node.js, Express 4, ESM (`"type": "module"`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt; Google OAuth for Gmail/Calendar only |
| Primary LLM | Groq (`groq-sdk`), default model `llama-3.3-70b-versatile` |
| Local LLM | Ollama HTTP API (`/api/generate`), default `mistral:latest` |
| Gemini | Client exists; `initializeGemini()` is **not** called at startup, so `isGeminiAvailable()` stays false |
| Embeddings | Voyage AI `voyage-3` via REST; cosine similarity in JS over SQLite JSON embeddings |
| Web search | Tavily (`TAVILY_API_KEY`) in coordinator; `/api/search` still depends on Gemini grounding (effectively unused) |
| Page reading | Jina Reader (`https://r.jina.ai/`) |
| TTS | Piper (`backend/bin/piper/piper.exe`) on `/api/tts`; Google Cloud TTS on `/api/voice`; browser `speechSynthesis` fallback |
| STT | Browser `webkitSpeechRecognition` only |
| DB runtime | `better-sqlite3` → `./data/vezora.db` |
| Unused DB deps | `pg`, `@journeyapps/sqlcipher`; Postgres SQL migrations exist but are not applied |
| Workflows | `node-cron` + JSON file `data/workflows.json` |
| Reminders | `node-cron` + `node-notifier` (hardcoded `userId = 'default'`) |
| OCR | `tesseract.js` (`/api/ocr/image`); PDF endpoint returns 501 |
| Tests | No `npm test` script. Ad-hoc files: `backend/test-*.js` |
| Hosting hints in code | CORS allows `https://vezora-ai.vercel.app`; Helmet connectSrc includes `vezora-server.onrender.com` |

---

## 4. Directory map

```
Vezora-AI/
├── main.js                 Electron main process; spawns backend unless SKIP_ELECTRON_BACKEND=1
├── index.html              Vite HTML shell
├── start-vezora.bat        Windows launcher: Ollama (optional) + backend + Electron
├── start-vezora.sh         Unix launcher: Ollama + backend + Vite browser (no Electron)
├── package.json            Frontend + Electron scripts
├── src/
│   ├── main.tsx            AuthProvider + AppProvider
│   ├── App.tsx             Auth gate, splash, NavRail, page switch, VoiceCallWidget
│   ├── index.css           Tailwind + Poppins/Sora
│   ├── contexts/
│   │   ├── AuthContext.tsx JWT + localStorage tokens
│   │   └── AppContext.tsx  UI context payload sent with chat
│   ├── pages/              Chat, Memory, Tasks, Files, Activity, Profile, Settings, Login, Register
│   ├── components/         Mix of live UI and unused/legacy panels
│   ├── hooks/              useChats, useVoice, useVoiceCall
│   └── lib/utils.ts        className helper (cn)
├── backend/
│   ├── index.js            Express server entry
│   ├── core/               Newest tool/context layer (uncommitted at last inspect)
│   │   ├── toolRegistry.js Declarative tools (todo/file/memory/app/settings)
│   │   ├── toolExecutor.js Validate + permission + run; heuristic inferToolCall
│   │   ├── permissions.js  Risky-tool confirm tickets (in-memory, 5 min TTL)
│   │   ├── contextEngine.js Compact UI context to ~150 tokens
│   │   ├── prompts.js      buildSystemPrompt — currently unused by chat/coordinator
│   │   └── llmRouter.js    Groq-primary / Ollama fallback
│   ├── routes/             HTTP endpoints (see §6)
│   ├── controllers/        Older JSON-file + filesystem/app/voice controllers
│   ├── services/           SQLite memory/tasks, coordinator, retrieval, TTS, Tavily, workflows
│   ├── utils/              LLM clients, JWT, Google OAuth, SQLite, encryption, LangChain wrapper
│   ├── models/User.js      bcrypt users in SQLite
│   ├── middleware/         JWT auth + express-rate-limit
│   ├── migrations/         PostgreSQL SQL (not used by runtime SQLite)
│   ├── public/auth-test.html  Google OAuth test page
│   └── data/               Runtime DB/JSON (gitignored)
├── docs/                   Many guides; several contradict current Groq/SQLite/Electron reality
└── fable.pdf               Untracked local doc (not part of the running app)
```

Ignore `node_modules/`, `dist/`, `release/`, `backend/data/`, `backend/bin/piper/`.

---

## 5. Frontend routing and state

There is **no React Router**. `App.tsx` switches views from `AppContext.page`.

| View id | Page | Notes |
|---|---|---|
| `chat` | `ChatPage` | Main product surface |
| `memory` | `MemoryPage` | Reads `/api/structured-memory?type=USER_PREFERENCE` |
| `tasks` | `TaskManagerPage` | Full CRUD + `/api/tasks/ai-organize` |
| `files` | `FilesPage` | List/read via `/api/files`; delete confirm UI is a no-op |
| `activity` | `ActivityPage` | `/api/logs` |
| `profile` | `ProfilePage` | `/api/profile` |
| `apps` | **renders `ChatPage` again** | Nav item exists; no dedicated apps page |
| `settings` | `SettingsPage` | Mostly `localStorage`; one fetch to `/api/settings` |

Auth: unauthenticated users see `LoginPage` / `RegisterPage`. Tokens: `authToken`, `refreshToken`, `user` in `localStorage`.

Chat sessions: `useChats` stores all conversations in `localStorage` keys `vezora_chat_sessions` and `vezora_active_chat_id`. **Not** persisted to SQLite (Postgres migration tables `chat_sessions` / `chat_messages` are unused).

---

## 6. Backend API map (mounted in `backend/index.js`)

| Mount | File | Auth | Role |
|---|---|---|---|
| `/api/chat` | `routes/chat.js` | optional JWT | Main AI entry |
| `/api/memory` | `routes/memory.js` | **none** | Legacy JSON memory |
| `/api/structured-memory` | `routes/structuredMemory.js` | required JWT | SQLite typed memory |
| `/api/voice` | `routes/voice.js` | none | Google TTS or browser-TTS hint |
| `/api/tts` | `routes/tts.js` | none | Piper WAV stream |
| `/api/settings` | `routes/settings.js` | none | JSON settings file |
| `/api/files` | `routes/files.js` | none | open/save/read/list if `ENABLE_FILE_SYSTEM=true` |
| `/api/apps` | `routes/apps.js` | none | launch if `ENABLE_APP_LAUNCH=true` |
| `/api/logs` | `routes/logs.js` | none | JSON activity logs; accepts `userId` query |
| `/api/auth` | `routes/authRoutes.js` | mixed | register/login/refresh/me/logout/verify-token |
| `/auth` | `routes/auth.js` | none | Google OAuth start/callback/status |
| `/api/gmail` | `routes/gmail.js` | Google tokens file | Gmail REST |
| `/api/calendar` | `routes/calendar.js` | Google tokens file | Calendar REST |
| `/api/search` | `routes/search.js` | none | Gemini grounding (effectively dead) |
| `/api/workflows` | `routes/workflows.js` | none | JSON workflow CRUD + cron |
| `/api/ocr` | `routes/ocr.js` | none | Tesseract image OCR |
| `/api/tasks` | `routes/tasks.js` | required JWT | SQLite tasks |
| `/api/coordinator` | `routes/coordinator.js` | none | daily-summary, preview-context |
| `/api/profile` | `routes/profile.js` | required JWT | SQLite `user_profiles` |
| `/api/tools` | `routes/tools.js` | optional JWT | list/execute/confirm/infer |
| `/health` | `index.js` | none | Groq/Ollama status |
| `/ws/voice-mode` | `index.js` | none | stub |

Rate limit: `apiLimiter` on all `/api` (100 req / 15 min / IP). `authLimiter` on login/register. `aiLimiter` is **defined but never applied**.

---

## 7. Major systems

### 7.1 Chat / AI request flow (current)

`ChatPage.handleSend` → `POST /api/chat` with last 10 messages, `personality`, `context` from `AppContext.getContextPayload()`, Bearer token.

`routes/chat.js` order:

1. Optional tool **confirmation** (`confirmTool` pendingId).
2. Compact UI context (`compactContext`) — stored on some responses, **not injected** into coordinator/LLM prompts.
3. **Ollama health gate:** if Gemini is unavailable (always, today) and Ollama is down, returns **503 before Groq/coordinator**. This can block Groq-only setups.
4. Heuristic `inferToolCall` → `executeTool` (Fable registry). Early return if matched.
5. Keyword Gmail/Calendar/email/meeting → `executeAgent` (LangChain wrapper). Requires **Google** tokens, not JWT. Else tells user to visit `/auth-test.html`.
6. If `useContext` (default true): `processWithContext` in `coordinatorService.js`.
7. Fallback: `executeRoutedQuery` in `llmRouter.js` (Groq then Ollama) + optional JSON memory if `includeMemory`.

Coordinator (`processWithContext`):

1. Extra Groq JSON **intent classification** (`task_*`, `web_research`, `general_chat`, …).
2. Execute task CRUD or Tavily+Jina **before** the answer.
3. Optionally retrieve Voyage/keyword context.
4. Build coordinator-local system prompt (not `core/prompts.js`).
5. Groq `generateGroqCompletion` (flattens history into one user prompt) or Ollama.
6. Fire-and-forget Groq extraction into project/decision/preference memories.

Streaming: `POST /api/chat/stream` exists (SSE) but the **frontend does not call it**. Voice uses non-streaming `/api/chat`.

### 7.2 LLM providers

- **Groq** is the intended primary (`GROQ_API_KEY`, `GROQ_MODEL`). `llmRouter` always prefers Groq when the key exists. `requiresDeepReasoning()` is unused.
- **Ollama** is emergency fallback and still required by the chat 503 gate.
- **Gemini** is leftover. Startup explicitly does not call `initializeGemini()`.
- System prompt identity is inconsistent: Groq router uses “You are Zara…”; coordinator uses “You are Zara (formerly Vezora AI)…”; `core/prompts.js` uses “You are Vezora (also called Zara)…” but is unused.

### 7.3 Memory

Two parallel systems:

1. **Active structured memory** — SQLite `memory` table via `services/memoryService.js`. Types: `PROJECT_MEMORY`, `DECISION_MEMORY`, `USER_PREFERENCE`. Content stored as JSON strings. Embeddings JSON-encoded. Retrieval: Voyage cosine similarity, keyword fallback. Memory page and coordinator use this.
2. **Legacy JSON memory** — `controllers/memoryController.js` → `data/memory.json`. Used only if chat falls through to `includeMemory`. Frontend Memory page does **not** use it.

Root `memory.json` is a sample/demo file, not the runtime store.

There is **no** conversation-level long-term memory DB. Chat history is browser `localStorage` only.

### 7.4 Tools / actions

Two generations:

**A. Fable registry (newest, uncommitted):** `backend/core/toolRegistry.js`

Registered: `todo.add/update/delete/list`, `file.read/search/write/open`, `memory.add/search/forget/list`, `app.open`, `settings.update`.

Zod validation → `permissions.js` (risky tools need confirm ticket) → handler. Heuristic `inferToolCall` until real function-calling exists. UI: `ToolExecutionCard` + `ConfirmModal`.

Risky set also lists `file.delete`, `file.rename`, `file.move`, `shell.run` — **those tools are not registered**.

**B. LangChain wrapper (older):** `utils/langchainAgent.js`

Not a real LangChain agent. Keyword if/else calling `DynamicStructuredTool` funcs for Gmail, Calendar, search, apps, files. Triggered when the user message contains email/calendar words.

**C. Coordinator task actions:** Groq JSON classify then `taskService` / Tavily — bypasses the Fable registry.

### 7.5 Voice

- STT: `useVoice` → Web Speech API (`webkitSpeechRecognition`). Chrome/Edge.
- Chat mic: `ChatPage` toggle; optional wake-word regex `hey zara|zara|vezora` if `vezora_wake_word_enabled`.
- Voice call: `useVoiceCall` + `VoiceCallWidget` (floating). Sends a **single** user message (no history, no AppContext). Prefers `POST /api/tts` (Piper); falls back to `speechSynthesis`.
- `VoiceCallMode.tsx` is unused (replaced by widget).
- `WakeWordDetector.tsx` is a UI placeholder; not mounted. Picovoice env var is unused.
- WebSocket voice mode is unused.
- Chat `handleSend` also calls `speak()` for typed replies (browser TTS).

### 7.6 Files

Backend: `filesController.js` allows paths under `HOME`/`USERPROFILE` or `process.cwd()`. Gated by `ENABLE_FILE_SYSTEM=true`. **No JWT.**

Frontend `FilesPage` lists/reads and sets `AppContext.selectedFile`. Delete modal does not delete.

### 7.7 Tasks

SQLite `tasks` via `taskService.js`. JWT required on `/api/tasks`. Also mutated by coordinator and Fable `todo.*` tools. Voyage embeddings on write. `TaskManagerPage` is the dedicated UI. Reminders cron uses `userId = 'default'` only.

### 7.8 Auth

- **App users:** `/api/auth/register|login` → SQLite `users` + JWT (`JWT_SECRET`, default fallback string if unset). 7-day access / 30-day refresh. Refresh tokens are **not stored server-side**.
- **Google:** single shared `data/google-tokens.json` for the whole process. Not per Vezora user. Used by Gmail/Calendar/LangChain agent.

### 7.9 Workflows / OCR / search APIs

Backend exists. Frontend `WorkflowBuilder`, `EmailPanel`, `CalendarPanel` are **not imported** anywhere. Web research that actually runs goes through coordinator + Tavily, not `/api/search`.

---

## 8. Data architecture

**Runtime SQLite schema** (`utils/database.js` CREATE TABLE):

- `users` — email, password_hash, name, avatar
- `user_profiles` — bio, occupation, location, timezone, interests, preferences
- `memory` — typed memories + embedding TEXT
- `tasks` — status/priority/category/deadline + embedding TEXT
- `settings` — per-user JSON blob (parallel to JSON file settings)
- `logs` — table created; **logs controller still uses JSON files**

**JSON files** (legacy, still live): `data/memory.json`, `data/settings.json`, `data/logs.json`, `data/workflows.json`, `data/google-tokens.json`, `data/notified-tasks.json`.

**Postgres migrations** (`backend/migrations/001–003`) describe a cloud multi-user schema including `chat_sessions`. They are **not executed** by `initializeDatabase()`.

**Encryption:** AES-256-CBC helpers exist; `testEncryption()` runs at boot. **No production path encrypts DB rows.** SQLCipher is a dependency only.

---

## 9. Environment variables (names only)

Frontend (root `.env`):

- `VITE_BACKEND_URL` — API origin
- `VITE_API_URL` — alternate name accepted by AuthContext

Backend (`backend/.env`). `.env.example` is incomplete vs actual usage.

Used in code:

- `PORT`, `NODE_ENV`, `FRONTEND_URL`
- `GROQ_API_KEY`, `GROQ_MODEL` — **not listed in `backend/.env.example`**
- `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_PROVIDER`, `ENABLE_GEMINI_GROUNDING`
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL_NAME`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `GOOGLE_TTS_API_KEY`, `GOOGLE_TTS_PROJECT_ID`
- `TAVILY_API_KEY`, `VOYAGE_API_KEY`
- `JWT_SECRET` — **not in `.env.example`**; hardcoded fallback exists
- `ENCRYPTION_KEY` (must be exactly 32 chars), `SQLCIPHER_PASSWORD` (unused)
- `VOICE_CALL_MODE`, `ENABLE_APP_LAUNCH`, `ENABLE_FILE_SYSTEM`, `ENABLE_GMAIL`, `ENABLE_CALENDAR`, `ENABLE_WEB_SEARCH`, `ENABLE_WORKFLOWS`
- `DATA_DIR`, `DATABASE_PATH` (path name exists in example; runtime uses `DATA_DIR` + `vezora.db`)
- `MAX_MEMORY_ITEMS`, `MAX_LOG_ENTRIES`
- `PIPER_VOICE_MODEL`
- `PICOVOICE_ACCESS_KEY` — unused
- `SKIP_ELECTRON_BACKEND` — Electron only
- `HOME` / `USERPROFILE` — file allow-list roots

Also mentioned in docs/examples but not verified as loaded by runtime: `DATABASE_URL`, `SERPAPI_KEY`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`, `GOOGLE_TOKENS_FILE`, `MEMORY_FILE`, `SETTINGS_FILE`, `LOGS_FILE`.

---

## 10. How to run locally

**Prerequisites:** Node.js 18+, npm. Ollama optional but currently required by the chat 503 gate unless that code is changed. Piper binaries under `backend/bin/piper/` for voice-call TTS. Groq API key for the intended primary model.

```text
npm install
cd backend && npm install && cd ..
# Create backend/.env  (copy backend/.env.example, then ADD GROQ_API_KEY and JWT_SECRET)
# Optional root .env: VITE_BACKEND_URL=http://localhost:5000
```

Windows desktop (current intended path):

```text
start-vezora.bat
# Backend http://localhost:5000
# Vite    http://localhost:5173
# Electron window after Vite is ready
```

Manual:

```text
cd backend && npm run dev     # nodemon index.js
npm run electron:dev          # or npm run dev for browser-only
```

Unix script `start-vezora.sh` starts Vite in a browser, not Electron.

```text
npm run build                 # tsc -b && vite build
npm run electron:build        # packages dist + backend
npm run lint                  # eslint
# No project test command
```

Database: created automatically at backend start. No migration runner.

---

## 11. Important files to read first

1. `backend/index.js` — mounts, boot, feature flags
2. `backend/routes/chat.js` — real chat pipeline order
3. `backend/services/coordinatorService.js` — intent, tasks, memory, web research, prompt
4. `backend/core/llmRouter.js` + `utils/groqClient.js` + `utils/ollamaClient.js`
5. `backend/core/toolRegistry.js` + `toolExecutor.js` + `permissions.js`
6. `backend/utils/database.js` + `models/User.js` + `services/memoryService.js` + `services/taskService.js`
7. `backend/services/retrievalService.js` + `utils/voyageClient.js`
8. `src/App.tsx` + `src/contexts/AppContext.tsx` + `src/contexts/AuthContext.tsx`
9. `src/pages/ChatPage.tsx` + `src/hooks/useChats.ts` + `src/hooks/useVoiceCall.ts`
10. `main.js` + `start-vezora.bat`
11. `backend/utils/langchainAgent.js` — older Gmail/Calendar path
12. `backend/utils/googleAuth.js` — Google token file
13. `backend/services/ttsService.js` — Piper
14. `backend/middleware/auth.js` + `routes/authRoutes.js`

Treat `README.md`, `backend/README.md`, and most of `docs/` as **historical**. They still describe Ollama/Phi as primary, JSON-only storage, and Tauri/Docker that are not in this repo.

---

## 12. Current development state

**Last committed architecture (`782a321`, 2026-07-06):** Electron wrapper around Vite + Express; Groq-primary coordinator chat; JWT + SQLite users/tasks/memory; Google OAuth integrations; voice call widget.

**Uncommitted working tree (active “Fable” work):** `backend/core/*`, `/api/tools`, Files + Activity pages, AppContext, ConfirmModal, ToolExecutionCard, chat confirmation flow, start-vezora.bat Electron launch.

**Fully usable (with env + Ollama/Groq):** login/register, chat UI, task manager, structured memory page, profile, settings (local), voice call (if Piper or browser TTS), app launch/file APIs.

**Partial:** tools (heuristic, not LLM function-calling), UI context compaction (computed, not injected into prompts), `core/prompts.js` (unused), Gmail/Calendar (keyword agent + test HTML), web research (Tavily in coordinator only), workflows/OCR (API only), wake word (regex, not Porcupine), files delete, apps nav view.

**Legacy / unused UI:** `Sidebar`, `SettingsPanel`, `MemoryPanel`, `VoiceCallMode`, `WakeWordDetector`, `WorkflowBuilder`, `EmailPanel`, `CalendarPanel`, `EnhancedAppLauncher`, `SearchResults`, `ContextVisualization`, `CameraInput`, `FileUpload`, `SuggestionsWidget`, `OnboardingTutorial`, `NotificationCenter`, `PrivacyDashboard`.

**Abandoned cloud track:** Postgres migrations, `DATABASE_URL` docs, Vercel/Render CORS leftovers.

---

## 13. Known technical debt (verified)

- Chat 503 if Ollama is down even when Groq is configured.
- Gemini disabled at boot; health/chat still mention it.
- Dual memory, dual settings, dual logs, dual tool stacks, dual TTS stacks.
- `core/prompts.js` and `injectContextIntoMessages` unused.
- Conversations not in DB; lost if localStorage is cleared.
- JWT default secret; encryption unused; SQLCipher unused.
- File/app/logs/legacy-memory routes unauthenticated; file allow-list is the whole home directory; `appsController` `exec`s a string command.
- Electron `nodeIntegration: true`, `contextIsolation: false`.
- Google OAuth tokens are process-global, not per user.
- Coordinator reminder user hard-coded to `'default'`.
- Extra Groq classification + extraction calls per chat (cost/latency).
- Coordinator flattens message history into one Groq prompt (weaker multi-turn than `generateGroqChatCompletion`).
- Rate limit 100/15min on all `/api` can throttle voice; `aiLimiter` unused.
- Startup logs a prefix of `GEMINI_API_KEY`.
- Docs and `.env.example` lag the code (`GROQ_API_KEY` missing from example).
- No automated tests.

---

## 14. Architecture decisions verified in code

- Desktop shell is Electron, not Tauri.
- LLM strategy: Groq cloud primary, Ollama local fallback (Gemini client retained but not initialized).
- Personal data intended local-first via SQLite; a Postgres multi-user design was started then left unused.
- Chat UX state is client-side; “memory” is a separate structured store, not the transcript.
- Tools currently use heuristics + a registry, not provider-native function calling.
- Risky desktop actions are designed to require an in-memory confirmation ticket (Fable permissions).
- Voice STT is browser-native; production-ish TTS path for calls is local Piper.

---

## 15. Touch points for likely future work

| Request | Start here |
|---|---|
| Memory architecture | `memoryService.js`, `retrievalService.js`, `coordinatorService.js` `analyzeAndUpdateMemory`, `routes/structuredMemory.js`, `MemoryPage.tsx`; do not confuse with `memoryController.js` |
| Voice pipeline | `useVoice.ts`, `useVoiceCall.ts`, `ChatPage.tsx` mic loop, `ttsService.js`, `voiceController.js`; WS stub in `index.js` is not live |
| Tools / actions | `core/toolRegistry.js`, `toolExecutor.js`, `permissions.js`, `routes/tools.js`, chat heuristic path; Gmail/Calendar still in `langchainAgent.js` |
| NottiPay / finance | **Nothing exists.** New integration: register tools in `toolRegistry.js`, routes under `backend/routes/`, UI page + NavRail. Do not assume a finance module. |
| Chat quality / prompts | `coordinatorService.js` `buildSystemPrompt` (live) vs unused `core/prompts.js`; `groqClient.js` vs flattened coordinator prompt |
| Files | `filesController.js`, `routes/files.js`, `FilesPage.tsx`, `file.*` tools |
| Auth / multi-user | `authRoutes.js`, `middleware/auth.js`, `models/User.js`; Google is separate (`googleAuth.js`) |
| LLM provider change | `llmRouter.js`, `index.js` health, `coordinatorService.js` Step 5, chat 503 gate |
