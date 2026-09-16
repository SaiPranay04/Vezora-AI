import { useState, useEffect, useRef } from 'react';
import { ChatBox, type Message } from '../components/ChatBox';
import { InputPanel } from '../components/InputPanel';
import { AppShortcuts } from '../components/AppShortcuts';
import { ChatSidebar } from '../components/ChatSidebar';
import { ConfirmModal } from '../components/ConfirmModal';
import { useVoice } from '../hooks/useVoice';
import { useChats } from '../hooks/useChats';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const ChatPage = () => {
    const { token } = useAuth();
    const { getContextPayload, setConversationId, pushAction, contextLabel, voiceCallActive } = useAppContext();
    const { isListening, isSpeaking, transcript, startListening, stopListening, speak, setTranscript } = useVoice();

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
    const [voiceModeActive, setVoiceModeActive] = useState(false);
    const [isPassiveListening, setIsPassiveListening] = useState(false);
    const [pendingConfirm, setPendingConfirm] = useState<{ pendingId: string; preview: string } | null>(null);
    const lastProcessedTranscript = useRef<string>('');
    const voiceModeActiveRef = useRef(false);

    const messages = activeChat?.messages || [];

    useEffect(() => {
        voiceModeActiveRef.current = voiceModeActive;
    }, [voiceModeActive]);

    useEffect(() => {
        if (activeChatId) setConversationId(activeChatId);
    }, [activeChatId, setConversationId]);

    // Voice Call owns the mic — pause chat voice while it's open
    useEffect(() => {
        if (voiceCallActive) {
            stopListening();
        } else if (voiceModeActiveRef.current) {
            startListening();
        }
    }, [voiceCallActive, stopListening, startListening]);

    useEffect(() => {
        const wakeEnabled = localStorage.getItem('vezora_wake_word_enabled') === 'true';
        if (wakeEnabled && !voiceCallActive) {
            setVoiceModeActive(true);
            setIsPassiveListening(true);
            startListening();
        }
    }, [startListening, voiceCallActive]);

    useEffect(() => {
        if (!transcript || transcript === lastProcessedTranscript.current) return;
        if (voiceCallActive) return;

        lastProcessedTranscript.current = transcript;
        const spoken = transcript;

        if (isPassiveListening) {
            const wakeWordRegex = /\b(hey zara|zara|vezora|hey vezora)\b/i;
            const match = spoken.match(wakeWordRegex);

            if (match) {
                const command = spoken.substring(match.index! + match[0].length).trim();
                if (command.length > 2) {
                    // Stay in active listen mode for the conversation turn
                    setIsPassiveListening(false);
                    handleSend(command);
                } else {
                    setIsPassiveListening(false);
                    setTranscript('');
                    lastProcessedTranscript.current = '';
                }
            } else {
                // Wake-word mode: ignore chatter without the wake word
                setTranscript('');
                lastProcessedTranscript.current = '';
            }
        } else if (voiceModeActive) {
            handleSend(spoken);
        }
    }, [transcript, isPassiveListening, voiceModeActive, voiceCallActive]);

    useEffect(() => {
        if (voiceCallActive || !voiceModeActive || isSpeaking || isTyping || isListening || isPassiveListening) return;
        const timer = setTimeout(() => {
            if (voiceModeActiveRef.current && !voiceCallActive) startListening();
        }, 400);
        return () => clearTimeout(timer);
    }, [voiceModeActive, isSpeaking, isTyping, isListening, isPassiveListening, startListening, voiceCallActive]);

    // Toggle ONLY on voiceModeActive — using isListening caused "unmute flips to mute"
    const toggleVoice = () => {
        if (voiceCallActive) return;
        if (voiceModeActive) {
            stopListening();
            setVoiceModeActive(false);
            setIsPassiveListening(false);
        } else {
            setVoiceModeActive(true);
            // Manual mic = active conversation mode (not wake-word gate)
            setIsPassiveListening(false);
            startListening();
        }
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        // Pause mic while we think / talk — otherwise it "just keeps listening"
        stopListening();

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedMessages = [...messages, newUserMsg];
        updateMessages(updatedMessages);
        setTranscript('');
        lastProcessedTranscript.current = '';
        pushAction(`chat:${text.slice(0, 40)}`);

        setIsTyping(true);

        try {
            const conversationHistory = updatedMessages
                .filter(msg => msg.role !== 'system')
                .slice(-10)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            const personalityTone = localStorage.getItem('vezora_voice_tone') || 'friendly';

            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: conversationHistory,
                    includeMemory: false,
                    personality: personalityTone,
                    context: getContextPayload()
                })
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            const data = await response.json();
            setIsTyping(false);

            let responseContent = data.content;
            if (data.actionConfirmations && data.actionConfirmations.length > 0 && data.taskAction) {
                const confirmationText = data.actionConfirmations.join('\n');
                if (!responseContent.includes('✅') && !responseContent.includes('📋')) {
                    responseContent = confirmationText + '\n\n' + responseContent;
                }
            }

            if (data.requiresConfirmation && data.pendingId) {
                setPendingConfirm({
                    pendingId: data.pendingId,
                    preview: data.tools?.[0]?.preview || data.content
                });
            }

            const newAiMsg: Message = {
                id: data.id || (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseContent,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                provider: data.provider,
                model: data.model,
                tools: data.tools
            };
            updateMessages([...updatedMessages, newAiMsg]);

            if (!data.requiresConfirmation && data.content) {
                await speak(data.content);
            }
        } catch (error) {
            console.error('❌ Chat error:', error);
            setIsTyping(false);

            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ **Connection Error**\n\nI couldn't reach the backend server. Please check:\n\n1. Backend is running: \`cd backend && npm run dev\`\n2. Backend URL: \`${BACKEND_URL}\`\n3. Ollama is running (if using local AI)\n4. Or Groq API key is set (in backend/.env)`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            updateMessages([...updatedMessages, errorMsg]);
        } finally {
            // Resume mic for next turn if voice mode still on
            if (voiceModeActiveRef.current && !voiceCallActive) {
                const wakeEnabled = localStorage.getItem('vezora_wake_word_enabled') === 'true';
                // Only return to wake-word gate if user didn't manually open mic for active chat
                // Manual toggle sets isPassiveListening false; wake-boot sets it true.
                if (wakeEnabled && isPassiveListening) {
                    setIsPassiveListening(true);
                }
                startListening();
            }
        }
    };

    const resolveToolConfirm = async (pendingId: string, approve: boolean) => {
        setPendingConfirm(null);
        setIsTyping(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: approve ? 'confirm' : 'cancel' }],
                    confirmTool: { pendingId, approve },
                    context: getContextPayload()
                })
            });
            const data = await response.json();
            setIsTyping(false);
            const newAiMsg: Message = {
                id: data.id || (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                provider: data.provider,
                model: data.model,
                tools: data.tools
            };
            updateMessages([...messages, newAiMsg]);
            if (approve) speak(data.content);
        } catch (err) {
            console.error(err);
            setIsTyping(false);
        }
    };

    const handleExtractMemory = async (content: string) => {
        if (!token) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/structured-memory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'USER_PREFERENCE',
                    key: `manual_extract_${Date.now()}`,
                    content: content
                })
            });
            if (response.ok) {
                pushAction('memory:extract');
            }
        } catch (err) {
            console.error('Failed to extract memory', err);
        }
    };

    return (
        <div className="flex h-full w-full relative">
            <ChatSidebar
                sessions={sessions}
                activeChatId={activeChatId}
                onNewChat={createNewChat}
                onSwitchChat={switchChat}
                onDeleteChat={deleteChat}
                onRenameChat={renameChat}
            />

            <div className="flex-1 flex flex-col h-full relative z-10">
                <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-background/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-text/90">
                            {activeChat?.title || 'New Chat'}
                        </h2>
                        <span className="text-xs text-text/40">
                            {messages.length > 1 && `${messages.length - 1} message${messages.length > 2 ? 's' : ''}`}
                        </span>
                        <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text/40">
                            Context: {contextLabel}
                        </span>
                    </div>
                    {messages.length > 1 && (
                        <button
                            onClick={clearActiveChat}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <ChatBox
                    messages={messages.filter(m => m.role !== 'system') as Message[]}
                    isTyping={isTyping}
                    onReplayMessage={(content) => speak(content)}
                    onExtractMemory={handleExtractMemory}
                    onConfirmTool={(id) => resolveToolConfirm(id, true)}
                    onCancelTool={(id) => resolveToolConfirm(id, false)}
                />

                <div className="sticky bottom-0 w-full z-20">
                    <InputPanel
                        onSend={handleSend}
                        isListening={voiceModeActive}
                        isSpeaking={isSpeaking}
                        onVoiceToggle={toggleVoice}
                        isPassiveMode={isPassiveListening && voiceModeActive}
                    />
                </div>
            </div>

            <div className="hidden xl:flex w-72 flex-col gap-4 p-6 border-l border-white/5 bg-black/20 h-full overflow-y-auto">
                <AppShortcuts />
                <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex-1 min-h-[200px]">
                    <h3 className="text-xs font-bold text-text/50 uppercase tracking-widest mb-4">Action Log</h3>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1 border-l-2 border-primary/30 pl-3">
                            <span className="text-xs text-text/80">System Boot</span>
                            <span className="text-[10px] text-text/30 font-mono">ready</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-secondary/30 pl-3">
                            <span className="text-xs text-text/80">Context: {contextLabel}</span>
                            <span className="text-[10px] text-text/30 font-mono">live</span>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                open={!!pendingConfirm}
                title="Confirm risky action"
                preview={pendingConfirm?.preview || ''}
                onConfirm={() => pendingConfirm && resolveToolConfirm(pendingConfirm.pendingId, true)}
                onCancel={() => pendingConfirm && resolveToolConfirm(pendingConfirm.pendingId, false)}
            />
        </div>
    );
};
