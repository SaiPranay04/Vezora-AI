/**
 * Voice Call Mode - Full-screen animated voice assistant interface
 * Sci-fi style orb with waveform visualization
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

interface VoiceCallModeProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  response: string;
  onToggleListen: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const VoiceCallMode = ({
  isOpen,
  onClose,
  isListening,
  isSpeaking,
  transcript,
  response,
  onToggleListen,
  onToggleMute,
  isMuted
}: VoiceCallModeProps) => {
  const [waveform, setWaveform] = useState<number[]>([]);
  const animationFrameRef = useRef<number>();

  // Generate animated waveform
  useEffect(() => {
    if (!isOpen) return;

    const generateWaveform = () => {
      const bars = 32;
      const newWaveform = Array.from({ length: bars }, (_, i) => {
        if (isSpeaking) {
          // Active speaking: large dynamic waves
          return 0.3 + Math.random() * 0.7;
        } else if (isListening) {
          // Listening: moderate pulse
          return 0.2 + Math.random() * 0.4;
        } else {
          // Idle: gentle pulse
          return 0.1 + Math.random() * 0.2;
        }
      });
      setWaveform(newWaveform);
      animationFrameRef.current = requestAnimationFrame(generateWaveform);
    };

    generateWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isSpeaking, isListening]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Background Ambient Glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${
              isSpeaking
                ? 'rgba(94, 208, 243, 0.15)'
                : isListening
                ? 'rgba(142, 68, 255, 0.15)'
                : 'rgba(142, 68, 255, 0.08)'
            } 0%, transparent 70%)`
          }}
          animate={{
            scale: isSpeaking ? [1, 1.1, 1] : isListening ? [1, 1.05, 1] : [1, 1.02, 1]
          }}
          transition={{
            duration: isSpeaking ? 1.5 : isListening ? 2 : 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight
              ],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5
            }}
          />
        ))}

        {/* Close Button */}
        <motion.button
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors z-50"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={24} className="text-text/70" />
        </motion.button>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-md"
        >
          <motion.div
            className={cn(
              'w-2 h-2 rounded-full',
              isSpeaking
                ? 'bg-secondary'
                : isListening
                ? 'bg-primary'
                : 'bg-green-400'
            )}
            animate={{
              scale: isSpeaking || isListening ? [1, 1.3, 1] : 1,
              opacity: isSpeaking || isListening ? [1, 0.5, 1] : 1
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <span className="text-sm font-medium text-text/80">
            {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Voice Call Active'}
          </span>
        </motion.div>

        {/* Central Orb with Waveform */}
        <div className="relative flex items-center justify-center w-full max-w-2xl">
          {/* Outer Ring Glow */}
          <motion.div
            className="absolute w-96 h-96 rounded-full"
            style={{
              background: `radial-gradient(circle, ${
                isSpeaking
                  ? 'rgba(94, 208, 243, 0.3)'
                  : isListening
                  ? 'rgba(142, 68, 255, 0.3)'
                  : 'rgba(142, 68, 255, 0.2)'
              }, transparent 70%)`
            }}
            animate={{
              scale: isSpeaking ? [1, 1.3, 1] : isListening ? [1, 1.2, 1] : [1, 1.1, 1],
              rotate: [0, 360]
            }}
            transition={{
              scale: {
                duration: isSpeaking ? 1.5 : 2,
                repeat: Infinity,
                ease: 'easeInOut'
              },
              rotate: {
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
              }
            }}
          />

          {/* Circular Waveform */}
          <motion.div className="relative w-80 h-80 flex items-center justify-center">
            {waveform.map((amplitude, i) => {
              const angle = (i / waveform.length) * 2 * Math.PI;
              const radius = 120;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const barHeight = amplitude * 60;

              return (
                <motion.div
                  key={i}
                  className={cn(
                    'absolute rounded-full',
                    isSpeaking ? 'bg-secondary' : 'bg-primary'
                  )}
                  style={{
                    width: '4px',
                    height: `${barHeight}px`,
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                    transformOrigin: 'center',
                    rotate: `${(i / waveform.length) * 360}deg`
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: 0.1,
                    ease: 'easeOut'
                  }}
                />
              );
            })}

            {/* Center Orb */}
            <motion.div
              className={cn(
                'absolute w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-2',
                isSpeaking
                  ? 'bg-gradient-to-br from-secondary/30 to-secondary/10 border-secondary/30'
                  : isListening
                  ? 'bg-gradient-to-br from-primary/30 to-primary/10 border-primary/30'
                  : 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20'
              )}
              animate={{
                scale: isSpeaking ? [1, 1.1, 1] : isListening ? [1, 1.05, 1] : [1, 1.02, 1],
                boxShadow: isSpeaking
                  ? [
                      '0 0 60px rgba(94, 208, 243, 0.4)',
                      '0 0 100px rgba(94, 208, 243, 0.6)',
                      '0 0 60px rgba(94, 208, 243, 0.4)'
                    ]
                  : [
                      '0 0 40px rgba(142, 68, 255, 0.3)',
                      '0 0 60px rgba(142, 68, 255, 0.5)',
                      '0 0 40px rgba(142, 68, 255, 0.3)'
                    ]
              }}
              transition={{
                duration: isSpeaking ? 1 : 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <span className="text-4xl font-bold text-white font-display">V</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Transcript Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8"
        >
          {/* User Transcript */}
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl backdrop-blur-md"
            >
              <div className="text-xs text-primary/60 mb-1 font-medium">You</div>
              <div className="text-white">{transcript}</div>
            </motion.div>
          )}

          {/* Assistant Response */}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-secondary/10 border border-secondary/20 rounded-2xl backdrop-blur-md"
            >
              <div className="text-xs text-secondary/60 mb-1 font-medium">Vezora</div>
              <div className="text-white">{response}</div>
            </motion.div>
          )}

          {/* Placeholder when idle */}
          {!transcript && !response && (
            <div className="text-center text-text/40 text-sm">
              {isListening
                ? 'Listening... Speak now'
                : 'Press the microphone button to start speaking'}
            </div>
          )}
        </motion.div>

        {/* Control Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4"
        >
          {/* Mic Toggle */}
          <motion.button
            onClick={onToggleListen}
            className={cn(
              'p-6 rounded-full transition-all shadow-lg border-2',
              isListening
                ? 'bg-primary/30 border-primary text-white'
                : 'bg-white/5 border-white/10 text-text/60 hover:bg-white/10'
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isListening ? <Mic size={28} /> : <MicOff size={28} />}
          </motion.button>

          {/* Mute Toggle */}
          <motion.button
            onClick={onToggleMute}
            className={cn(
              'p-4 rounded-full transition-all shadow-lg border',
              isMuted
                ? 'bg-red-500/20 border-red-500/30 text-red-400'
                : 'bg-white/5 border-white/10 text-text/60 hover:bg-white/10'
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </motion.button>
        </motion.div>

        {/* Vezora Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-text/30 font-display"
        >
          Vezora AI • Voice Call Mode
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
