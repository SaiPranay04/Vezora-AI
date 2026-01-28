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
            {/* Expanding Glow Ring */}
            <AnimatePresence>
                {(isListening || isSpeaking) && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ 
                                opacity: [0.4, 0.6, 0.4],
                                scale: [1.2, 1.6, 1.2]
                            }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className={cn(
                                "absolute inset-0 rounded-full blur-2xl",
                                isSpeaking ? "bg-secondary" : "bg-primary"
                            )}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 1 }}
                            animate={{ 
                                opacity: [0.3, 0.5, 0.3],
                                scale: [1.4, 2, 1.4]
                            }}
                            exit={{ opacity: 0, scale: 1 }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.3
                            }}
                            className={cn(
                                "absolute inset-0 rounded-full blur-3xl",
                                isSpeaking ? "bg-secondary/50" : "bg-primary/50"
                            )}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Main Orb Button */}
            <motion.button
                onClick={onToggle}
                className={cn(
                    "relative z-10 flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 backdrop-blur-md border-2",
                    isListening && "bg-gradient-to-br from-primary to-primary/80 text-white border-primary shadow-[0_0_30px_rgba(142,68,255,0.6)]",
                    isSpeaking && "bg-gradient-to-br from-secondary to-secondary/80 text-white border-secondary shadow-[0_0_30px_rgba(94,208,243,0.6)]",
                    !isListening && !isSpeaking && "bg-bubble-ai/80 text-primary hover:bg-bubble-ai border-white/10 hover:border-primary/30"
                )}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                animate={isListening ? {
                    boxShadow: [
                        "0 0 20px rgba(142, 68, 255, 0.4)",
                        "0 0 40px rgba(142, 68, 255, 0.6)",
                        "0 0 20px rgba(142, 68, 255, 0.4)"
                    ]
                } : isSpeaking ? {
                    boxShadow: [
                        "0 0 20px rgba(94, 208, 243, 0.4)",
                        "0 0 40px rgba(94, 208, 243, 0.6)",
                        "0 0 20px rgba(94, 208, 243, 0.4)"
                    ]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                {isListening ? (
                    <motion.div
                        animate={{
                            scale: [1, 1.15, 1],
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <Mic className="w-7 h-7 drop-shadow-lg" />
                    </motion.div>
                ) : isSpeaking ? (
                    <div className="flex items-center gap-1 h-5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-white rounded-full"
                                animate={{
                                    height: ["30%", "100%", "30%"]
                                }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.08,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.3 }}
                    >
                        <Mic className="w-6 h-6 opacity-80" />
                    </motion.div>
                )}
            </motion.button>

            {/* Idle Pulse Ring (Visible when not active) */}
            {!isListening && !isSpeaking && (
                <>
                    <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-primary/20 -z-10"
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div 
                        className="absolute inset-0 rounded-full border border-primary/10 -z-10"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                        }}
                    />
                </>
            )}
        </div>
    );
};
