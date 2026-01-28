import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Bot, User, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ChatBoxProps {
    messages: Message[];
    isTyping?: boolean;
    onReplayMessage?: (content: string) => void;
}

export const ChatBox = ({ messages, isTyping, onReplayMessage }: ChatBoxProps) => {
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
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={cn(
                            "flex w-full group",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div className={cn(
                            "max-w-[80%] rounded-2xl p-4 flex gap-4 backdrop-blur-sm border transition-all duration-200",
                            msg.role === 'user'
                                ? "bg-bubble-user border-primary/20 text-text rounded-tr-none flex-row-reverse hover:border-primary/40"
                                : "bg-bubble-ai border-white/5 text-text rounded-tl-none shadow-[0_0_15px_-3px_rgba(142,68,255,0.1)] hover:shadow-[0_0_25px_-3px_rgba(142,68,255,0.2)] hover:border-white/10"
                        )}>

                            {/* Icon */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-primary/20" : "bg-secondary/20"
                            )}>
                                {msg.role === 'user' ? <User size={14} className="text-primary" /> : <Bot size={14} className="text-secondary" />}
                            </div>

                            <div className="flex flex-col gap-1 w-full">
                                <div className="text-sm leading-relaxed font-light tracking-wide prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            // Custom styling for markdown elements
                                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                            a: ({href, children}) => <a href={href} className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                            code: ({children}) => <code className="bg-black/30 px-1.5 py-0.5 rounded text-secondary font-mono text-xs">{children}</code>,
                                            pre: ({children}) => <pre className="bg-black/50 border border-white/10 rounded-lg p-3 overflow-x-auto my-2">{children}</pre>,
                                            ul: ({children}) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                                            ol: ({children}) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                                            strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                                            em: ({children}) => <em className="italic text-glow">{children}</em>,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-2 mt-1",
                                    msg.role === 'user' ? "justify-start" : "justify-end"
                                )}>
                                    <span className="text-[10px] opacity-30 font-mono">{msg.timestamp}</span>
                                    {msg.role === 'assistant' && onReplayMessage && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => onReplayMessage(msg.content)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                                            title="Replay voice"
                                        >
                                            <Volume2 size={12} className="text-secondary" />
                                        </motion.button>
                                    )}
                                </div>
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
