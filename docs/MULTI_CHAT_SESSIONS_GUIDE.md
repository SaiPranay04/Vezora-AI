# Vezora Multi-Chat Sessions - Complete Guide

## 🗂️ Overview

Vezora now supports **multiple chat sessions** with a sidebar, just like ChatGPT! Create, switch, rename, and delete conversations anytime.

---

## ✅ Features Implemented

### 1. **Multiple Chat Sessions** ✅
- Create unlimited chat conversations
- Each session has its own message history
- Auto-save on every message
- Persistent across page refreshes

### 2. **Smart Chat Sidebar** ✅
- Shows all your chat sessions
- **Auto-generated titles** from first message
- Displays last updated time ("Today", "Yesterday", etc.)
- Highlight active chat
- Quick actions on hover (edit/delete)

### 3. **Session Management** ✅
- **➕ New Chat** button - Start fresh conversations
- **✏️ Rename** - Custom chat titles
- **🗑️ Delete** - Remove unwanted sessions
- **🔄 Switch** - Click to switch between chats
- **Clear** - Clear active chat messages

### 4. **Auto-Naming** ✅
- New chats start as "New Chat"
- First user message becomes the title (40 chars max)
- Example: *"How do I..." → "How do I..."*

### 5. **Persistent Storage** ✅
- All sessions saved to `localStorage`
- Active chat remembered
- Survives page refresh
- No data loss

---

## 🎯 User Interface

### **Sidebar Layout:**

```
┌─────────────────────┐
│  ➕ New Chat        │ ← Create new
├─────────────────────┤
│ 💬 How do I...      │ ← Active chat
│    Today            │   (highlighted)
├─────────────────────┤
│ 💬 Tell me about... │
│    Yesterday        │
├─────────────────────┤
│ 💬 Explain Python   │
│    3 days ago       │
└─────────────────────┘
   X chats, Y messages  ← Footer stats
```

### **Quick Actions** (on hover):
- **✏️** Rename chat
- **🗑️** Delete chat

---

## 🧪 How to Use

### **1. Create New Chat**
1. Click **"➕ New Chat"** button (top of sidebar)
2. New empty chat opens
3. Start chatting!
4. Title auto-generated from first message

### **2. Switch Between Chats**
1. Click any chat in the sidebar
2. Chat loads instantly
3. Full conversation history preserved
4. Continue where you left off

### **3. Rename a Chat**
1. Hover over chat in sidebar
2. Click **✏️ Edit** icon
3. Type new title
4. Press **Enter** to save or **Esc** to cancel

### **4. Delete a Chat**
1. Hover over chat in sidebar
2. Click **🗑️ Delete** icon
3. Confirm deletion
4. Chat permanently removed

### **5. Clear Active Chat**
1. Click **"🗑️ Clear"** button (top-right of chat)
2. All messages in current chat cleared
3. Welcome message shown
4. Chat history preserved in sidebar

---

## 💾 Data Structure

### **Storage Key:** `vezora_chat_sessions`

### **Session Object:**
```typescript
{
  id: "chat_1738741200000",        // Unique ID
  title: "How do I deploy to AWS?", // Auto or custom
  messages: [                        // Full conversation
    {
      id: "1",
      role: "user",
      content: "How do I deploy to AWS?",
      timestamp: "10:30 AM"
    },
    {
      id: "2",
      role: "assistant",
      content: "Here's how...",
      timestamp: "10:30 AM"
    }
  ],
  createdAt: "2026-02-05T10:30:00.000Z",
  updatedAt: "2026-02-05T10:35:00.000Z"
}
```

### **Active Chat Key:** `vezora_active_chat_id`
```json
"chat_1738741200000"
```

---

## 🔧 Technical Architecture

### **New Files Created:**

#### **1. `src/hooks/useChats.ts`** - Chat Sessions Manager
```typescript
export function useChats() {
  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Functions
  return {
    sessions,           // All chat sessions
    activeChat,         // Current active chat
    createNewChat,      // Create new session
    switchChat,         // Switch to different chat
    deleteChat,         // Remove session
    updateMessages,     // Update messages in active chat
    renameChat,         // Change chat title
    clearActiveChat     // Clear messages in active chat
  };
}
```

**Key Features:**
- ✅ Auto-load from localStorage on mount
- ✅ Auto-save on every change
- ✅ Smart title generation
- ✅ Active chat tracking
- ✅ Graceful fallbacks

#### **2. `src/components/ChatSidebar.tsx`** - Sidebar UI
```typescript
export const ChatSidebar = ({
  sessions,
  activeChatId,
  onNewChat,
  onSwitchChat,
  onDeleteChat,
  onRenameChat
}: ChatSidebarProps) => {
  // Renders:
  // - "New Chat" button
  // - List of chat sessions
  // - Edit/Delete actions
  // - Footer stats
}
```

**Features:**
- ✅ Framer Motion animations
- ✅ Inline editing (rename)
- ✅ Hover quick actions
- ✅ Relative time display
- ✅ Smooth transitions

### **Modified Files:**

#### **`src/pages/ChatPage.tsx`**
- ✅ Integrated `useChats` hook
- ✅ Integrated `ChatSidebar` component
- ✅ Updated message handling to use `updateMessages`
- ✅ Removed old `localStorage` logic (now handled by `useChats`)

---

## 📊 Behavior & Edge Cases

### **Scenario 1: First Visit**
1. No saved sessions found
2. Creates first chat session automatically
3. Shows welcome message
4. User starts chatting

### **Scenario 2: Page Refresh**
1. Loads all sessions from localStorage
2. Restores active chat
3. Full conversation history preserved
4. User continues chatting

### **Scenario 3: Deleting Active Chat**
1. User deletes the currently active chat
2. Automatically switches to next chat in list
3. If no chats left, creates new chat
4. No error state

### **Scenario 4: Renaming Chat**
1. User clicks edit icon
2. Inline input appears
3. Type new title
4. Press Enter/Escape to save/cancel
5. Title updates immediately

### **Scenario 5: Multiple Devices**
- **Note:** localStorage is per-device/browser
- Chat sessions **NOT synced** across devices
- Each device has its own session list
- (Future: Add backend sync for cross-device)

---

## 🎨 UI/UX Details

### **Sidebar Width:** `256px` (16rem)

### **Color Scheme:**
- Background: `#0A0A0A → #050505` gradient
- Active chat: Primary color `#8E44FF` with glow
- Hover: White/10 opacity
- Border: White/10 opacity

### **Animations:**
- **Stagger entrance** - Each chat fades in sequentially
- **Smooth exit** - Deleted chats fade out
- **Layout shift** - AnimatePresence handles smooth transitions

### **Relative Time Display:**
```javascript
"Today"          // < 24 hours
"Yesterday"      // 24-48 hours
"3 days ago"     // < 7 days
"Jan 28"         // > 7 days
```

### **Title Truncation:**
- Max 40 characters
- Adds "..." if longer
- Full title in hover tooltip (future)

---

## 🧪 Testing Guide

### **Test 1: Create Multiple Chats**
```
1. Open Chat page
2. Click "➕ New Chat" (5 times)
3. ✅ Should have 5 sessions in sidebar
4. ✅ Each starts as "New Chat"
```

### **Test 2: Auto-Naming**
```
1. Create new chat
2. Send: "How do I learn React?"
3. ✅ Title becomes "How do I learn React?"
4. Send more messages
5. ✅ Title stays "How do I learn React?"
```

### **Test 3: Switch Between Chats**
```
1. Create chat A: "Tell me about Python"
2. Create chat B: "Explain JavaScript"
3. Switch to chat A
4. ✅ Should show Python conversation
5. Switch to chat B
6. ✅ Should show JavaScript conversation
7. ✅ Messages don't mix
```

### **Test 4: Rename Chat**
```
1. Hover over chat
2. Click ✏️ icon
3. Type "My Custom Title"
4. Press Enter
5. ✅ Title updated in sidebar
6. ✅ Persists after refresh
```

### **Test 5: Delete Chat**
```
1. Create 3 chats
2. Select chat #2 (make active)
3. Hover and click 🗑️
4. Confirm deletion
5. ✅ Chat #2 removed
6. ✅ Switches to chat #1 or #3
7. ✅ Never shows empty state
```

### **Test 6: Clear vs Delete**
```
1. Active chat with 10 messages
2. Click "Clear" (top-right)
3. ✅ Messages cleared
4. ✅ Chat still in sidebar
5. ✅ Title preserved
6. ✅ Can continue chatting

VS

1. Active chat with 10 messages
2. Click 🗑️ Delete in sidebar
3. ✅ Entire chat removed from sidebar
4. ✅ Cannot recover
```

### **Test 7: Persistence**
```
1. Create 5 chats with different conversations
2. Refresh page (F5)
3. ✅ All 5 chats still in sidebar
4. ✅ Active chat preserved
5. ✅ Full message history intact
```

### **Test 8: Long Titles**
```
1. Send message: "How do I build a full-stack application using React, Node.js, and PostgreSQL?"
2. ✅ Title truncates to "How do I build a full-stack applicati..."
3. ✅ No UI overflow
```

---

## 🚀 Future Enhancements

### 1. **Search Chats**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const filteredSessions = sessions.filter(s => 
  s.title.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### 2. **Sort/Filter**
```typescript
// Sort by: Recent, A-Z, Oldest
const sortedSessions = [...sessions].sort((a, b) => 
  sortBy === 'recent' 
    ? new Date(b.updatedAt) - new Date(a.updatedAt)
    : a.title.localeCompare(b.title)
);
```

### 3. **Folders/Categories**
```typescript
interface ChatSession {
  id: string;
  title: string;
  folder?: string; // "Work", "Personal", "Coding"
  messages: ChatMessage[];
}
```

### 4. **Export Chat**
```typescript
const exportChat = (chatId: string) => {
  const chat = sessions.find(s => s.id === chatId);
  const json = JSON.stringify(chat, null, 2);
  downloadFile(json, `${chat.title}.json`);
};
```

### 5. **Pin Important Chats**
```typescript
interface ChatSession {
  isPinned: boolean;
}
// Pinned chats always at top
```

### 6. **Backend Sync** (Cross-Device)
```typescript
// Save to backend instead of localStorage
await fetch('/api/chats', {
  method: 'POST',
  body: JSON.stringify(sessions)
});
```

### 7. **AI-Generated Summaries**
```typescript
// For long chats, show summary instead of full messages
interface ChatSession {
  summary?: string; // Generated by AI
}
```

---

## 🐛 Troubleshooting

### Issue: Sidebar not showing
**Check:**
1. Browser console for errors
2. `localStorage` quota not exceeded
3. ChatSidebar component imported

### Issue: Chats not persisting
**Check:**
1. Browser localStorage enabled (not private mode)
2. Storage key: `vezora_chat_sessions`
3. Data format is valid JSON

**Debug:**
```javascript
// In browser console
console.log(localStorage.getItem('vezora_chat_sessions'));
// Should show array of sessions
```

### Issue: Active chat not switching
**Check:**
1. `activeChatId` matches a session ID
2. No errors in console
3. Sessions array populated

**Force reset:**
```javascript
// In browser console
localStorage.removeItem('vezora_chat_sessions');
localStorage.removeItem('vezora_active_chat_id');
// Refresh page
```

### Issue: Title not auto-generating
**Check:**
1. First message is from user (not assistant)
2. Message has content
3. useChats hook `updateMessages` is called

---

## ✅ Summary

**You can now:**

✅ **Create unlimited chats** - Separate conversations for different topics  
✅ **Auto-naming** - Titles generated from first message  
✅ **Switch instantly** - Click to load any conversation  
✅ **Rename anytime** - Custom titles for organization  
✅ **Delete unwanted** - Remove old or test chats  
✅ **Persistent storage** - All chats survive page refresh  
✅ **Never lose context** - Each chat maintains full history  

**Just like ChatGPT, but yours! 🎉**

---

## 📝 API Reference

### useChats Hook

```typescript
const {
  sessions,         // ChatSession[] - All chat sessions
  activeChat,       // ChatSession | null - Current active chat
  activeChatId,     // string | null - ID of active chat
  createNewChat,    // () => string - Create new session, returns ID
  switchChat,       // (chatId: string) => void - Switch to chat
  deleteChat,       // (chatId: string) => void - Delete session
  updateMessages,   // (messages: ChatMessage[]) => void - Update active chat
  renameChat,       // (chatId: string, newTitle: string) => void - Rename
  clearActiveChat   // () => void - Clear messages in active chat
} = useChats();
```

---

**Your multi-chat system is ready! 🗂️✨**
