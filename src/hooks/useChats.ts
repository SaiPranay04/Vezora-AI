/**
 * Chat Sessions Hook - Manage multiple conversations
 */

import { useState, useEffect, useCallback } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'vezora_chat_sessions';
const ACTIVE_CHAT_KEY = 'vezora_active_chat_id';

// Default welcome message
const createWelcomeMessage = (): ChatMessage => ({
    id: Date.now().toString(),
    role: 'assistant',
    content: "👋 **Vezora AI** initialized. Systems Nominal.\n\n✅ Neural core: *Active*\n✅ Voice engine: *Ready*\n✅ Memory banks: *Synced*\n\nReady for commands. Try asking me something!",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
});

// Generate chat title from first user message
const generateChatTitle = (messages: ChatMessage[]): string => {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
        const content = firstUserMessage.content;
        // Take first 40 chars or until first sentence ends
        const title = content.length > 40 
            ? content.substring(0, 40) + '...'
            : content;
        return title;
    }
    return 'New Chat';
};

export function useChats() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // Load sessions from localStorage on mount
    useEffect(() => {
        try {
            const savedSessions = localStorage.getItem(STORAGE_KEY);
            const savedActiveId = localStorage.getItem(ACTIVE_CHAT_KEY);

            if (savedSessions) {
                const parsed = JSON.parse(savedSessions);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSessions(parsed);
                    // Set active chat
                    if (savedActiveId && parsed.some(s => s.id === savedActiveId)) {
                        setActiveChatId(savedActiveId);
                    } else {
                        setActiveChatId(parsed[0].id);
                    }
                    return;
                }
            }

            // No saved sessions - create first one
            const firstChat = createNewSession();
            setSessions([firstChat]);
            setActiveChatId(firstChat.id);
        } catch (e) {
            console.error('Failed to load chat sessions:', e);
            const firstChat = createNewSession();
            setSessions([firstChat]);
            setActiveChatId(firstChat.id);
        }
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    // Save active chat ID
    useEffect(() => {
        if (activeChatId) {
            localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
        }
    }, [activeChatId]);

    // Create new session
    const createNewSession = (): ChatSession => {
        const now = new Date().toISOString();
        return {
            id: `chat_${Date.now()}`,
            title: 'New Chat',
            messages: [createWelcomeMessage()],
            createdAt: now,
            updatedAt: now
        };
    };

    // Create and switch to new chat
    const createNewChat = useCallback(() => {
        const newChat = createNewSession();
        setSessions(prev => [newChat, ...prev]); // Add to beginning
        setActiveChatId(newChat.id);
        return newChat.id;
    }, []);

    // Switch to a different chat
    const switchChat = useCallback((chatId: string) => {
        if (sessions.some(s => s.id === chatId)) {
            setActiveChatId(chatId);
        }
    }, [sessions]);

    // Delete a chat
    const deleteChat = useCallback((chatId: string) => {
        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== chatId);
            
            // If deleted chat was active, switch to another
            if (activeChatId === chatId) {
                if (filtered.length > 0) {
                    setActiveChatId(filtered[0].id);
                } else {
                    // No chats left - create new one
                    const newChat = createNewSession();
                    setActiveChatId(newChat.id);
                    return [newChat];
                }
            }
            
            return filtered.length > 0 ? filtered : [createNewSession()];
        });
    }, [activeChatId]);

    // Update messages in active chat
    const updateMessages = useCallback((messages: ChatMessage[]) => {
        setSessions(prev => prev.map(session => {
            if (session.id === activeChatId) {
                // Auto-generate title from first user message if still "New Chat"
                let title = session.title;
                if (title === 'New Chat' && messages.length > 1) {
                    title = generateChatTitle(messages);
                }
                
                return {
                    ...session,
                    title,
                    messages,
                    updatedAt: new Date().toISOString()
                };
            }
            return session;
        }));
    }, [activeChatId]);

    // Rename chat
    const renameChat = useCallback((chatId: string, newTitle: string) => {
        setSessions(prev => prev.map(session => 
            session.id === chatId 
                ? { ...session, title: newTitle, updatedAt: new Date().toISOString() }
                : session
        ));
    }, []);

    // Clear all messages in active chat
    const clearActiveChat = useCallback(() => {
        setSessions(prev => prev.map(session => {
            if (session.id === activeChatId) {
                return {
                    ...session,
                    messages: [createWelcomeMessage()],
                    updatedAt: new Date().toISOString()
                };
            }
            return session;
        }));
    }, [activeChatId]);

    // Get active chat
    const activeChat = sessions.find(s => s.id === activeChatId) || null;

    return {
        sessions,
        activeChat,
        activeChatId,
        createNewChat,
        switchChat,
        deleteChat,
        updateMessages,
        renameChat,
        clearActiveChat
    };
}
