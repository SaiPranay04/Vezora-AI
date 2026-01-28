import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Maximize2 } from 'lucide-react';
import { useState } from 'react';

interface MiniModeProps {
    onExpand: () => void;
}

export const MiniMode = ({ onExpand }: MiniModeProps) => {
    const [isHovering, setIsHovering] = useState(false);
    const showPulse = true;

    return (
        <div className="fixed bottom-8 right-8 z-[100]">
            <div className="relative flex items-center justify-center">
                {/* Ambient Glow Rings */}
                <AnimatePresence>
                    {showPulse && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                    scale: [1, 1.4, 1]
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary blur-2xl"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 1 }}
                                animate={{
                                    opacity: [0.2, 0.4, 0.2],
                                    scale: [1.2, 1.8, 1.2]
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.5
                                }}
                                className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-secondary to-primary blur-3xl"
                            />
                        </>
                    )}
                </AnimatePresence>

                {/* Main Floating Orb */}
                <motion.button
                    onClick={onExpand}
                    onHoverStart={() => setIsHovering(true)}
                    onHoverEnd={() => setIsHovering(false)}
                    className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary via-purple-600 to-secondary shadow-2xl flex items-center justify-center border-2 border-white/20 backdrop-blur-xl overflow-hidden group"
                    whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -5, 5, -5, 0],
                    }}
                    whileTap={{ scale: 0.9 }}
                    animate={{
                        y: [0, -8, 0],
                        boxShadow: [
                            "0 10px 40px rgba(142, 68, 255, 0.4)",
                            "0 15px 60px rgba(142, 68, 255, 0.6)",
                            "0 10px 40px rgba(142, 68, 255, 0.4)"
                        ]
                    }}
                    transition={{
                        y: {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        },
                        boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                >
                    {/* Rotating Gradient Background */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-50"
                        animate={{
                            rotate: 360
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />

                    {/* Icon */}
                    <motion.div
                        animate={{
                            scale: isHovering ? [1, 1.2, 1] : 1
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: isHovering ? Infinity : 0
                        }}
                        className="relative z-10"
                    >
                        <Mic className="w-8 h-8 text-white drop-shadow-lg" />
                    </motion.div>

                    {/* Particle Effects on Hover */}
                    <AnimatePresence>
                        {isHovering && (
                            <>
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1 h-1 bg-white rounded-full"
                                        initial={{ 
                                            x: 0, 
                                            y: 0, 
                                            opacity: 1,
                                            scale: 0
                                        }}
                                        animate={{
                                            x: Math.cos((i * Math.PI * 2) / 6) * 30,
                                            y: Math.sin((i * Math.PI * 2) / 6) * 30,
                                            opacity: 0,
                                            scale: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.1
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Expand Hint Badge */}
                <AnimatePresence>
                    {isHovering && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, x: 50 }}
                            animate={{ opacity: 1, y: 0, x: 50 }}
                            exit={{ opacity: 0, y: 10, x: 50 }}
                            className="absolute -top-2 right-0 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 shadow-2xl"
                        >
                            <div className="flex items-center gap-2 text-xs font-medium whitespace-nowrap">
                                <Maximize2 size={12} className="text-primary" />
                                <span className="text-white">Expand Vezora</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status Indicator Dot */}
                <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background shadow-lg z-20"
                    animate={{
                        scale: [1, 1.2, 1],
                        boxShadow: [
                            "0 0 10px rgba(74, 222, 128, 0.5)",
                            "0 0 20px rgba(74, 222, 128, 0.8)",
                            "0 0 10px rgba(74, 222, 128, 0.5)"
                        ]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>
        </div>
    );
};
