import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Bot, User } from 'lucide-react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ChatBoxProps {
    messages: Message[];
    isTyping?: boolean;
}

export const ChatBox = ({ messages, isTyping }: ChatBoxProps) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent flex flex-col">
            <div className="mt-auto space-y-6 w-full">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "flex w-full",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div className={cn(
                            "max-w-[80%] rounded-2xl p-4 flex gap-4 backdrop-blur-sm border",
                            msg.role === 'user'
                                ? "bg-bubble-user border-primary/20 text-text rounded-tr-none flex-row-reverse text-right"
                                : "bg-bubble-ai border-white/5 text-text rounded-tl-none shadow-[0_0_15px_-3px_rgba(142,68,255,0.1)]"
                        )}>

                            {/* Icon */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-primary/20" : "bg-secondary/20"
                            )}>
                                {msg.role === 'user' ? <User size={14} className="text-primary" /> : <Bot size={14} className="text-secondary" />}
                            </div>

                            <div className="flex flex-col gap-1 w-full">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-light tracking-wide">{msg.content}</p>
                                <span className={cn(
                                    "text-[10px] opacity-30 font-mono mt-1 block",
                                    msg.role === 'user' ? "text-left" : "text-right"
                                )}>{msg.timestamp}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start w-full"
                    >
                        <div className="bg-bubble-ai border border-white/5 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </motion.div>
                )}
            </div>
            <div ref={bottomRef} />
        </div>
    );
};
