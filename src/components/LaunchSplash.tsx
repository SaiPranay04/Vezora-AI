import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Cpu, Zap } from 'lucide-react';

interface LaunchSplashProps {
    isVisible: boolean;
}

export const LaunchSplash = ({ isVisible }: LaunchSplashProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="fixed inset-0 z-[200] bg-background flex items-center justify-center overflow-hidden"
                >
                    {/* Animated Background Gradients */}
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px]"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                            x: [0, 50, 0],
                            y: [0, -30, 0]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[100px]"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.2, 0.5, 0.2],
                            x: [0, -40, 0],
                            y: [0, 40, 0]
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    />

                    {/* Main Content */}
                    <div className="relative z-10 flex flex-col items-center gap-8">
                        {/* Logo/Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                delay: 0.2
                            }}
                            className="relative"
                        >
                            {/* Glow Rings */}
                            <motion.div
                                className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-primary to-secondary blur-2xl opacity-60"
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.4, 0.8, 0.4]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            {/* Main Logo Circle */}
                            <motion.div
                                className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary via-purple-600 to-secondary flex items-center justify-center shadow-2xl border-4 border-white/20"
                                animate={{
                                    boxShadow: [
                                        "0 0 40px rgba(142, 68, 255, 0.4)",
                                        "0 0 80px rgba(142, 68, 255, 0.8)",
                                        "0 0 40px rgba(142, 68, 255, 0.4)"
                                    ]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                {/* Rotating Inner Gradient */}
                                <motion.div
                                    className="absolute inset-2 rounded-full bg-gradient-to-r from-primary via-secondary to-primary opacity-50"
                                    animate={{
                                        rotate: 360
                                    }}
                                    transition={{
                                        duration: 6,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                />

                                <motion.span
                                    className="text-5xl font-bold text-white relative z-10"
                                    animate={{
                                        textShadow: [
                                            "0 0 20px rgba(255,255,255,0.5)",
                                            "0 0 40px rgba(255,255,255,1)",
                                            "0 0 20px rgba(255,255,255,0.5)"
                                        ]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    V
                                </motion.span>

                                {/* Orbiting Particles */}
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 bg-white rounded-full shadow-lg"
                                        animate={{
                                            rotate: 360,
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "linear",
                                            delay: i * 1
                                        }}
                                        style={{
                                            offsetPath: "path('M 16 0 A 16 16 0 1 1 15.999 0')",
                                            offsetRotate: "0deg"
                                        }}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="text-center"
                        >
                            <motion.h1
                                className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-glow to-white mb-2"
                                animate={{
                                    backgroundPosition: ["0%", "100%", "0%"]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                style={{
                                    backgroundSize: "200% 100%"
                                }}
                            >
                                Vezora
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-text/60 text-lg font-light tracking-wider flex items-center gap-2 justify-center"
                            >
                                <Sparkles size={16} className="text-primary" />
                                AI Personal Assistant
                            </motion.p>
                        </motion.div>

                        {/* Loading Status */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="flex flex-col items-center gap-4 mt-4"
                        >
                            {/* Progress Bar */}
                            <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary via-secondary to-primary"
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "200%" }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        width: "50%"
                                    }}
                                />
                            </div>

                            {/* Status Messages */}
                            <motion.div
                                className="flex items-center gap-2 text-sm text-text/50 font-mono"
                                animate={{
                                    opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                >
                                    <Cpu size={16} className="text-primary" />
                                </motion.div>
                                <span>Initializing AI Core</span>
                                <motion.span
                                    animate={{
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    ...
                                </motion.span>
                            </motion.div>

                            {/* System Stats */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                className="flex gap-6 text-xs text-text/40 mt-2"
                            >
                                <div className="flex items-center gap-1">
                                    <Zap size={12} className="text-secondary" />
                                    <span>Neural Network: Ready</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span>Voice Engine: Active</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Corner Decorations */}
                    <motion.div
                        className="absolute top-10 left-10 text-primary/20"
                        animate={{
                            rotate: 360,
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                        }}
                    >
                        <Sparkles size={40} />
                    </motion.div>
                    <motion.div
                        className="absolute bottom-10 right-10 text-secondary/20"
                        animate={{
                            rotate: -360,
                            scale: [1, 1.3, 1]
                        }}
                        transition={{
                            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                            scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }
                        }}
                    >
                        <Cpu size={50} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
