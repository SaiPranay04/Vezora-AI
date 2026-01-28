import { useState, useEffect } from 'react';
import { ChatBox, type Message } from '../components/ChatBox';
import { InputPanel } from '../components/InputPanel';
import { AppShortcuts } from '../components/AppShortcuts';
import { useVoice } from '../hooks/useVoice';

export const ChatPage = () => {
    const { isListening, isSpeaking, transcript, startListening, stopListening, speak, setTranscript } = useVoice();

    // State lifted from original App.tsx
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: '1', 
            role: 'assistant', 
            content: "👋 **Vezora OS v1.0** initialized. Systems Nominal.\n\n✅ Neural core: *Active*\n✅ Voice engine: *Ready*\n✅ Memory banks: *Synced*\n\nReady for commands. Try asking me something!", 
            timestamp: '10:42 AM' 
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    // Auto-send when transcript is final (simple V1 logic)
    useEffect(() => {
        if (transcript) {
            handleSend(transcript);
        }
    }, [transcript]);

    const handleSend = (text: string) => {
        if (!text.trim()) return;

        // Add User Message
        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newUserMsg]);
        setTranscript(''); // Clear for next turn

        // Simulate AI Response with REAL Voice
        setIsTyping(true);
        
        // Generate smart demo responses
        const demoResponses = [
            "**Processing request...** ⚡\n\nHere are some things I can help with:\n- 📝 Take notes and remember context\n- 🔍 Search and analyze information\n- 💬 Have natural conversations\n- 🎯 Execute commands and workflows",
            "I understand! Let me help you with that. 🎯\n\nHere's what I found:\n1. First item with **bold text**\n2. Second item with *italic emphasis*\n3. Third item with `inline code`\n\nIs there anything specific you'd like to explore?",
            "Great question! 🤔\n\nLet me break this down:\n\n**Key Points:**\n- Machine learning models process patterns\n- Neural networks learn from data\n- AI can assist but not replace human creativity\n\n*Would you like me to elaborate on any of these?*"
        ];
        
        const responseText = demoResponses[Math.floor(Math.random() * demoResponses.length)];

        setTimeout(() => {
            setIsTyping(false);

            const newAiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, newAiMsg]);

            // Speak the response
            speak(responseText);

        }, 1500);
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

            {/* Main Chat Stream */}
            <div className="flex-1 flex flex-col h-full relative z-10">
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
