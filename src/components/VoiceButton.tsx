import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import { cn } from '../lib/utils';

interface VoiceButtonProps {
    isListening: boolean;
    isSpeaking: boolean;
    onToggle: () => void;
}

export const VoiceButton = ({ isListening, isSpeaking, onToggle }: VoiceButtonProps) => {
    return (
        <div className="relative flex items-center justify-center">
            {/* Glow Effects */}
            <AnimatePresence>
                {(isListening || isSpeaking) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.5 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className={cn(
                            "absolute inset-0 rounded-full blur-xl opacity-50",
                            isSpeaking ? "bg-secondary" : "bg-primary"
                        )}
                    />
                )}
            </AnimatePresence>

            {/* Main Orb Button */}
            <motion.button
                onClick={onToggle}
                className={cn(
                    "relative z-10 flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 backdrop-blur-md border border-white/10",
                    isListening ? "bg-primary text-white" : "bg-bubble-ai/80 text-primary hover:bg-bubble-ai",
                    isSpeaking ? "border-secondary shadow-secondary/50" : ""
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isListening ? (
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <Mic className="w-6 h-6" />
                    </motion.div>
                ) : isSpeaking ? (
                    <div className="flex items-center gap-1 h-4">
                        {[1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-secondary rounded-full"
                                animate={{
                                    height: ["20%", "100%", "20%"]
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.1,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <Mic className="w-6 h-6 opacity-80" />
                )}
            </motion.button>

            {/* Idle Pulse Ring (Visible when not active) */}
            {!isListening && !isSpeaking && (
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-idle-pulse -z-10" />
            )}
        </div>
    );
};
