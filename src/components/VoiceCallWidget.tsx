import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Minimize2, Maximize2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface VoiceCallWidgetProps {
  isActive: boolean;
  onClose: () => void;
  transcript: string;
  response: string;
  isMuted: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  toggleMute: () => void;
  toggleListen: () => void;
}

export const VoiceCallWidget = ({
  isActive,
  onClose,
  transcript,
  response,
  isMuted,
  isListening,
  isSpeaking,
  toggleMute,
  toggleListen,
}: VoiceCallWidgetProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);

  // Particle animation for voice visualization
  const particles = Array.from({ length: 20 }, (_, i) => i);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        setPosition({
          x: e.clientX - dragRef.current.startX,
          y: e.clientY - dragRef.current.startY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
        }}
        className="select-none"
      >
        <div
          className={`${
            isMinimized ? 'w-16 h-16' : 'w-80 h-96'
          } bg-gradient-to-br from-[#0A0A0A] via-[#1A0A2E] to-[#0A0A0A] border border-primary/30 rounded-3xl shadow-[0_0_40px_rgba(142,68,255,0.3)] overflow-hidden transition-all duration-300`}
        >
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            className="relative h-12 bg-black/40 border-b border-white/5 flex items-center justify-between px-4 cursor-move"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400' : isListening ? 'bg-yellow-400' : 'bg-gray-400'} animate-pulse`} />
              <span className="text-xs font-medium text-text/80">
                {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Voice Mode'}
              </span>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <X size={14} />
              </motion.button>
            </div>
          </div>

          {/* Minimized View */}
          {isMinimized && (
            <div className="absolute inset-0 top-12 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: isListening || isSpeaking ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_30px_rgba(142,68,255,0.6)]">
                  <Mic size={20} className="text-white" />
                </div>
              </motion.div>
            </div>
          )}

          {/* Expanded View */}
          {!isMinimized && (
            <>
              {/* Voice Visualization */}
              <div className="relative h-40 flex items-center justify-center overflow-hidden">
                {/* Animated Orb */}
                <motion.div
                  animate={{
                    scale: isListening || isSpeaking ? [1, 1.3, 1] : 1,
                    rotate: isSpeaking ? [0, 360] : 0,
                  }}
                  transition={{
                    scale: {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                    rotate: {
                      duration: 10,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                  }}
                  className="relative"
                >
                  {/* Outer Glow Ring */}
                  <motion.div
                    animate={{
                      opacity: isListening || isSpeaking ? [0.3, 0.6, 0.3] : 0.2,
                      scale: isListening || isSpeaking ? [1, 1.2, 1] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary blur-xl"
                  />

                  {/* Main Orb */}
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary via-purple-500 to-secondary flex items-center justify-center shadow-[0_0_30px_rgba(142,68,255,0.8)]">
                    <Mic size={32} className="text-white" />
                  </div>
                </motion.div>

                {/* Floating Particles */}
                {(isListening || isSpeaking) &&
                  particles.map((i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-primary/60 rounded-full"
                      animate={{
                        x: [0, Math.cos(i * 18) * 60, 0],
                        y: [0, Math.sin(i * 18) * 60, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
              </div>

              {/* Transcript Display */}
              <div className="px-4 pb-4 h-44 flex flex-col gap-2 overflow-y-auto">
                {transcript && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                    <p className="text-xs text-text/50 mb-1">You said:</p>
                    <p className="text-sm text-white">{transcript}</p>
                  </div>
                )}
                {response && (
                  <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-3">
                    <p className="text-xs text-text/50 mb-1">Vezora:</p>
                    <p className="text-sm text-white">{response}</p>
                  </div>
                )}
                {!transcript && !response && (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-text/40 text-center">
                      Click the mic button to start listening...
                    </p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isMuted
                      ? 'bg-red-500/20 border-2 border-red-500/30 text-red-400'
                      : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleListen}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-gradient-to-br from-primary to-secondary shadow-[0_0_30px_rgba(142,68,255,0.6)] scale-110'
                      : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <Mic size={24} className="text-white" />
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
