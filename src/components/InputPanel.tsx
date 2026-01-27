import { Send } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

interface InputPanelProps {
    onSend: (text: string) => void;
    isListening: boolean;
    isSpeaking: boolean;
    onVoiceToggle: () => void;
}

export const InputPanel = ({ onSend, isListening, isSpeaking, onVoiceToggle }: InputPanelProps) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    return (
        <div className="p-4 bg-background/50 backdrop-blur-lg border-t border-white/5">
            <div className="max-w-5xl mx-auto flex items-end gap-4">

                {/* Voice Button Integration */}
                <div className="shrink-0">
                    <VoiceButton
                        isListening={isListening}
                        isSpeaking={isSpeaking}
                        onToggle={onVoiceToggle}
                    />
                </div>

                {/* Text Area */}
                <div className="flex-1 relative bg-bubble-user/50 border border-white/10 rounded-3xl focus-within:border-primary/50 focus-within:bg-bubble-user transition-all duration-300">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Vezora anything..."
                        rows={1}
                        className="w-full bg-transparent text-text p-4 pr-12 outline-none resize-none max-h-32 min-h-[3.5rem] scrollbar-hide font-light"
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim()}
                        className={cn(
                            "absolute right-3 bottom-3 p-2 rounded-full transition-all duration-200",
                            input.trim()
                                ? "bg-primary text-white hover:scale-110 shadow-lg shadow-primary/30"
                                : "bg-white/5 text-white/30 cursor-not-allowed"
                        )}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
