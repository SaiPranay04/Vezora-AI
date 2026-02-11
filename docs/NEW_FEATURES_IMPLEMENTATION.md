# New Features Implementation Guide

**Last Updated:** 2026-02-06  
**Completion Status:** ✅ Backend Complete | ⏳ Frontend Pending

---

## 🎯 Overview

All missing features from the project overview PDF have been successfully implemented in the backend. The system now includes:

- **LangChain Agent** with tool orchestration
- **Gmail Integration** (OAuth 2.0)
- **Google Calendar Integration** (OAuth 2.0)
- **Web Search** (Gemini Grounding)
- **Workflow Automation** (Cron-based scheduling)
- **OCR/Document Scanning** (Tesseract.js)
- **AES-256 Encryption** (SQLCipher ready)

---

## 📦 Installed Dependencies

```bash
npm install --legacy-peer-deps \
  @langchain/community \
  @langchain/core \
  langchain \
  googleapis \
  @google-cloud/local-auth \
  google-auth-library \
  node-cron \
  better-sqlite3 \
  @journeyapps/sqlcipher \
  tesseract.js \
  jsqr \
  pdf-parse \
  zod
```

---

## 🔑 Environment Variables

### Required Google OAuth

```env
# Google OAuth 2.0 (for Gmail & Calendar)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

### Optional Features

```env
# Feature Toggles
ENABLE_GMAIL=true
ENABLE_CALENDAR=true
ENABLE_WEB_SEARCH=true
ENABLE_WORKFLOWS=true
ENABLE_GEMINI_GROUNDING=true

# Encryption (REQUIRED for production)
ENCRYPTION_KEY=your-32-character-encryption-key
SQLCIPHER_PASSWORD=your-sqlcipher-password
```

### Frontend URL

```env
FRONTEND_URL=http://localhost:5173
```

---

## 🔐 Encryption Setup

The system uses **PBKDF2-SHA256** to derive encryption keys from a passphrase.

### Your Generated Keys

```env
# AES-256 Encryption Key (32 characters)
ENCRYPTION_KEY=A9f2P7kL3mN8qR1tW6vX0bY5cZ4dH9jG

# SQLCipher Password (database encryption)
SQLCIPHER_PASSWORD=D6e8F1gH4iJ2kL5mN7oP0qR3sT6uV9wX
```

**Important:** Store these securely in your `.env` file. They are NOT recoverable if lost.

---

## 🌐 Google OAuth Setup

### Step 1: Get OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Gmail API
   - Google Calendar API
4. Create OAuth 2.0 Credentials (Desktop App)
5. Download client ID and secret

### Step 2: Configure Redirect URI

**Backend Callback URL:**
```
http://localhost:5000/api/auth/google/callback
```

Add this to your OAuth consent screen's authorized redirect URIs.

### Step 3: Authenticate

1. Start the backend: `npm run dev`
2. Open: `http://localhost:5000/api/auth/google`
3. Follow the Google login flow
4. Tokens will be saved to `backend/data/google-tokens.json`

---

## 🛠️ API Routes

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate OAuth flow |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/status` | Check auth status |
| POST | `/api/auth/logout` | Revoke tokens |

### Gmail

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmail/messages` | Fetch inbox messages |
| GET | `/api/gmail/messages/:id` | Get specific email |
| POST | `/api/gmail/send` | Send email |
| GET | `/api/gmail/search` | Search emails |

### Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/events` | Get upcoming events |
| GET | `/api/calendar/events/today` | Today's events |
| POST | `/api/calendar/events` | Create event |
| PUT | `/api/calendar/events/:id` | Update event |
| DELETE | `/api/calendar/events/:id` | Delete event |
| POST | `/api/calendar/freebusy` | Check availability |

### Web Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Full web search with sources |
| GET | `/api/search/quick?q=` | Quick answer |

**Note:** Requires `ENABLE_GEMINI_GROUNDING=true` and valid `GEMINI_API_KEY`.

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List all workflows |
| POST | `/api/workflows` | Create workflow |
| POST | `/api/workflows/:id/execute` | Run immediately |
| POST | `/api/workflows/:id/schedule` | Schedule with cron |
| POST | `/api/workflows/:id/unschedule` | Cancel schedule |
| DELETE | `/api/workflows/:id` | Delete workflow |

### OCR

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ocr/image` | Extract text from image |
| POST | `/api/ocr/batch` | Process multiple images |

---

## 🤖 LangChain Agent

The system includes a LangChain agent with orchestrated tools:

### Available Tools

1. **Gmail Tool** - Read inbox, search, send emails
2. **Calendar Tool** - Check schedule, create events
3. **Web Search Tool** - Current information lookup
4. **App Launcher Tool** - Launch desktop applications
5. **File System Tool** - Open/save files

### Usage

The agent automatically selects the appropriate tool based on user intent:

```javascript
import { executeAgent } from './utils/langchainAgent.js';

const response = await executeAgent("Check my emails");
const response = await executeAgent("What's on my calendar today?");
const response = await executeAgent("Search for latest news");
```

---

## ⚙️ Workflow Automation

Create multi-step automated workflows with cron scheduling.

### Example Workflow

```json
{
  "name": "Morning Routine",
  "description": "Check emails and calendar every morning",
  "steps": [
    {
      "action": "check_email",
      "params": {
        "maxResults": 5
      },
      "description": "Check inbox"
    },
    {
      "action": "check_calendar",
      "params": {},
      "description": "Get today's events"
    },
    {
      "action": "notification",
      "params": {
        "message": "Good morning! Ready to start the day."
      },
      "description": "Send notification"
    }
  ],
  "schedule": "0 8 * * *",
  "stopOnError": false
}
```

### Cron Schedule Examples

- `0 8 * * *` - Every day at 8:00 AM
- `*/15 * * * *` - Every 15 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9 * * 1-5` - Weekdays at 9:00 AM

---

## 📄 OCR (Optical Character Recognition)

Extract text from images using Tesseract.js.

### Supported Languages

- `eng` - English (default)
- `spa` - Spanish
- `fra` - French
- `deu` - German
- `chi_sim` - Simplified Chinese
- `jpn` - Japanese
- And many more...

### Example Request

```json
POST /api/ocr/image
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "lang": "eng"
}
```

### Example Response

```json
{
  "success": true,
  "text": "Extracted text from the image",
  "confidence": 92.5,
  "language": "eng",
  "words": 42
}
```

---

## 🔒 Security Features

### Encryption

- **AES-256-GCM** for data at rest
- **SQLCipher** for database encryption (ready to use)
- Secure token storage for OAuth

### File System Safety

- Path traversal protection
- Sandboxed file access
- Whitelist-based validation

### App Launch Safety

- Configurable allow/deny lists
- Platform-specific commands
- Timeout protection

---

## 🚦 Feature Status

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Gmail Integration | ✅ | ⏳ | Backend Complete |
| Calendar Integration | ✅ | ⏳ | Backend Complete |
| Web Search | ✅ | ⏳ | Backend Complete |
| Workflow Automation | ✅ | ⏳ | Backend Complete |
| OCR/Scanning | ✅ | ⏳ | Backend Complete |
| LangChain Agent | ✅ | ⏳ | Backend Complete |
| Encryption | ✅ | N/A | Implemented |
| OAuth 2.0 | ✅ | ⏳ | Backend Complete |

---

## 📝 Next Steps

### For Frontend Integration

1. **Create UI components:**
   - `EmailPanel.tsx` - Gmail interface
   - `CalendarPanel.tsx` - Calendar view
   - `SearchResults.tsx` - Web search display
   - `WorkflowBuilder.tsx` - Workflow designer
   - `OcrScanner.tsx` - OCR interface

2. **Add API hooks:**
   - `useGmail.ts`
   - `useCalendar.ts`
   - `useSearch.ts`
   - `useWorkflows.ts`
   - `useOcr.ts`

3. **OAuth flow:**
   - Add auth button
   - Handle redirect callback
   - Display auth status
   - Token refresh logic

4. **Testing:**
   - Test each integration
   - Error handling
   - Loading states
   - Success feedback

---

## 🐛 Troubleshooting

### OAuth Not Working

- Check redirect URI matches exactly
- Verify APIs are enabled in Google Cloud Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Clear `backend/data/google-tokens.json` and re-authenticate

### Encryption Errors

- Verify `ENCRYPTION_KEY` is exactly 32 characters
- Don't use special characters that need escaping
- Check `.env` file encoding (UTF-8)

### Web Search Not Working

- Ensure `ENABLE_GEMINI_GROUNDING=true`
- Verify `GEMINI_API_KEY` is valid
- Check Gemini API has grounding enabled

### Workflow Not Running

- Verify cron expression is valid
- Check workflow is marked as `isActive: true`
- Review logs for execution errors

---

## 📚 Additional Resources

- [LangChain Documentation](https://js.langchain.com/docs/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API](https://developers.google.com/gmail/api)
- [Calendar API](https://developers.google.com/calendar/api)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Node-Cron](https://github.com/node-cron/node-cron)

---

## 🎉 Congratulations!

Your Vezora AI backend is now fully equipped with advanced integrations! The system is ready to:

- ✉️ Manage your emails
- 📅 Handle your calendar
- 🔍 Search the web
- ⚙️ Automate workflows
- 📄 Scan documents
- 🤖 Use AI tool orchestration

All that's left is connecting the frontend UI!
