import { useState, useEffect } from 'react';
import { ChatBox, type Message } from '../components/ChatBox';
import { InputPanel } from '../components/InputPanel';
import { AppShortcuts } from '../components/AppShortcuts';
import { ChatSidebar } from '../components/ChatSidebar';
import { useVoice } from '../hooks/useVoice';
import { useChats } from '../hooks/useChats';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const ChatPage = () => {
    const { isListening, isSpeaking, transcript, startListening, stopListening, speak, setTranscript } = useVoice();
    
    // Use chat sessions hook
    const {
        sessions,
        activeChat,
        activeChatId,
        createNewChat,
        switchChat,
        deleteChat,
        updateMessages,
        renameChat,
        clearActiveChat
    } = useChats();

    const [isTyping, setIsTyping] = useState(false);

    // Get messages from active chat
    const messages = activeChat?.messages || [];

    // Auto-send when transcript is final (simple V1 logic)
    useEffect(() => {
        if (transcript) {
            handleSend(transcript);
        }
    }, [transcript]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        // Add User Message
        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedMessages = [...messages, newUserMsg];
        updateMessages(updatedMessages);
        setTranscript(''); // Clear for next turn

        // Get REAL AI Response from backend WITH CONVERSATION CONTEXT
        setIsTyping(true);
        
        try {
            // Build conversation history (last 10 messages for context)
            const conversationHistory = updatedMessages
                .filter(msg => msg.role !== 'system') // Exclude system messages
                .slice(-10) // Keep last 10 messages (5 exchanges)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: conversationHistory, // Send full conversation history
                    includeMemory: false, // Disabled for speed (conversation context is enough)
                    userId: 'default'
                })
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            const data = await response.json();
            
            setIsTyping(false);

            const newAiMsg: Message = {
                id: data.id || (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            updateMessages([...updatedMessages, newAiMsg]);

            // Speak the response
            speak(data.content);

        } catch (error) {
            console.error('❌ Chat error:', error);
            setIsTyping(false);
            
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ **Connection Error**\n\nI couldn't reach the backend server. Please check:\n\n1. Backend is running: \`cd backend && npm run dev\`\n2. Backend URL: \`${BACKEND_URL}\`\n3. Ollama is running (if using local AI)\n4. Or Gemini API key is set (in backend/.env)`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            updateMessages([...updatedMessages, errorMsg]);
        }
    };

    const toggleVoice = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="flex h-full w-full relative">
            {/* Chat Sidebar */}
            <ChatSidebar
                sessions={sessions}
                activeChatId={activeChatId}
                onNewChat={createNewChat}
                onSwitchChat={switchChat}
                onDeleteChat={deleteChat}
                onRenameChat={renameChat}
            />

            {/* Main Chat Stream */}
            <div className="flex-1 flex flex-col h-full relative z-10">
                {/* Header with Chat Title and Clear button */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-background/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-text/90">
                            {activeChat?.title || 'New Chat'}
                        </h2>
                        <span className="text-xs text-text/40">
                            {messages.length > 1 && `${messages.length - 1} message${messages.length > 2 ? 's' : ''}`}
                        </span>
                    </div>
                    {messages.length > 1 && (
                        <button
                            onClick={clearActiveChat}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                        >
                            🗑️ Clear
                        </button>
                    )}
                </div>
                
                <ChatBox 
                    messages={messages} 
                    isTyping={isTyping}
                    onReplayMessage={(content) => speak(content)}
                />

                <div className="sticky bottom-0 w-full z-20">
                    <InputPanel
                        onSend={handleSend}
                        isListening={isListening}
                        isSpeaking={isSpeaking}
                        onVoiceToggle={toggleVoice}
                    />
                </div>
            </div>

            {/* Right Widget Panel (Desktop) */}
            <div className="hidden xl:flex w-72 flex-col gap-4 p-6 border-l border-white/5 bg-black/20 h-full overflow-y-auto">
                <AppShortcuts />

                {/* Action Log Placeholder */}
                <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex-1 min-h-[200px]">
                    <h3 className="text-xs font-bold text-text/50 uppercase tracking-widest mb-4">Action Log</h3>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1 border-l-2 border-primary/30 pl-3">
                            <span className="text-xs text-text/80">System Boot</span>
                            <span className="text-[10px] text-text/30 font-mono">10:42:01 AM</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-secondary/30 pl-3">
                            <span className="text-xs text-text/80">Microphone Access</span>
                            <span className="text-[10px] text-text/30 font-mono">10:42:05 AM</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
