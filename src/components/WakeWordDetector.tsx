import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ear, EarOff, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface WakeWordDetectorProps {
    onWakeWordDetected?: () => void;
    wakeWord?: string;
}

export const WakeWordDetector = ({ 
    onWakeWordDetected, 
    wakeWord = "Hey Vezora" 
}: WakeWordDetectorProps) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [sensitivity, setSensitivity] = useState(0.7);
    const [showSettings, setShowSettings] = useState(false);
    const [detectionCount, setDetectionCount] = useState(0);

    // This is a placeholder for wake word detection
    // In Tauri app, you'd use:
    // - Porcupine (Picovoice) via native Rust binding
    // - Snowboy (though deprecated)
    // - Custom ML model
    // For now, we'll simulate with Web Speech API continuous listening

    useEffect(() => {
        if (!isEnabled) {
            setIsListening(false);
            return;
        }

        // In real implementation:
        // 1. Load wake word model
        // 2. Start audio capture
        // 3. Process audio chunks
        // 4. Detect wake word
        // 5. Trigger callback

        // Placeholder: Just show listening status
        setIsListening(true);

        // Cleanup
        return () => {
            setIsListening(false);
        };
    }, [isEnabled]);

    const toggle = () => {
        setIsEnabled(!isEnabled);
    };

    return (
        <div className="relative">
            {/* Main Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggle}
                className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                    isEnabled
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-white/5 border-white/10 text-text/60 hover:bg-white/10"
                )}
            >
                {isEnabled ? <Ear size={16} /> : <EarOff size={16} />}
                <span className="text-xs font-medium">
                    {isEnabled ? "Wake Word Active" : "Wake Word Off"}
                </span>
                
                {/* Listening Indicator */}
                {isListening && (
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -right-1 -top-1 w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                    />
                )}
            </motion.button>

            {/* Settings Icon */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(!showSettings)}
                className="absolute -right-2 -top-2 p-1 bg-black/80 border border-white/10 rounded-full text-text/60 hover:text-primary transition-colors"
            >
                <SettingsIcon size={12} />
            </motion.button>

            {/* Settings Panel */}
            {showSettings && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 right-0 w-72 p-4 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50"
                >
                    <h4 className="text-sm font-semibold mb-3">Wake Word Settings</h4>
                    
                    <div className="space-y-4">
                        {/* Wake Word Display */}
                        <div>
                            <label className="text-xs text-text/60 mb-1 block">Listening For:</label>
                            <div className="px-3 py-2 bg-black/50 border border-primary/20 rounded-lg text-sm font-mono text-primary">
                                "{wakeWord}"
                            </div>
                        </div>

                        {/* Sensitivity Slider */}
                        <div>
                            <div className="flex justify-between text-xs text-text/60 mb-2">
                                <span>Sensitivity</span>
                                <span>{Math.round(sensitivity * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.3"
                                max="1"
                                step="0.05"
                                value={sensitivity}
                                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                                className="w-full accent-primary"
                            />
                            <div className="flex justify-between text-[10px] text-text/40 mt-1">
                                <span>Less Sensitive</span>
                                <span>More Sensitive</span>
                            </div>
                        </div>

                        {/* Detection Count */}
                        <div className="pt-3 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text/60">Detections Today:</span>
                                <span className="font-mono text-secondary">{detectionCount}</span>
                            </div>
                        </div>

                        {/* Status Info */}
                        <div className="pt-3 border-t border-white/5 text-[10px] text-text/40">
                            <p>💡 Wake word runs locally and is always private</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
