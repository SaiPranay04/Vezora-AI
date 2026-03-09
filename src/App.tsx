import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavRail, type View } from './components/NavRail';
import { ChatPage } from './pages/ChatPage';
import { MemoryPage } from './pages/MemoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { TaskManagerPage } from './pages/TaskManagerPage';
import { LaunchSplash } from './components/LaunchSplash';
import { MiniMode } from './components/MiniMode';
import { VoiceCallWidget } from './components/VoiceCallWidget';
import { useVoiceCall } from './hooks/useVoiceCall';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Minimize2, Phone, Loader2 } from 'lucide-react';
import './index.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('chat');
  const [showSplash, setShowSplash] = useState(true);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  // Voice Call Mode
  const {
    isVoiceCallActive,
    transcript,
    response,
    isMuted,
    isListening,
    isSpeaking,
    startVoiceCall,
    endVoiceCall,
    toggleMute,
    toggleListen
  } = useVoiceCall();

  // Hide splash after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Show auth pages if not authenticated
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="ml-4 text-xl text-text/70">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginPage onSwitchToRegister={() => setShowRegister(true)} />
    );
  }


  const renderView = () => {
    const views = {
      'chat': <ChatPage />,
      'memory': <MemoryPage />,
      'profile': <ProfilePage />,
      'tasks': <TaskManagerPage />,
      'settings': <SettingsPage />,
      'apps': <ChatPage /> // Placeholder for apps view
    };
    return views[currentView] || <ChatPage />;
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const pageTransition = {
    type: "tween" as const,
    ease: "easeInOut" as const,
    duration: 0.3
  };

  return (
    <>
      {/* Launch Splash Screen */}
      <LaunchSplash isVisible={showSplash} />

      {/* Voice Call Widget (Floating) */}
      <VoiceCallWidget
        isActive={isVoiceCallActive}
        onClose={endVoiceCall}
        isListening={isListening}
        isSpeaking={isSpeaking}
        transcript={transcript}
        response={response}
        toggleListen={toggleListen}
        toggleMute={toggleMute}
        isMuted={isMuted}
      />

      {/* Mini Mode */}
      <AnimatePresence>
        {isMiniMode && (
          <MiniMode onExpand={() => setIsMiniMode(false)} />
        )}
      </AnimatePresence>

      {/* Main App */}
      {!showSplash && !isMiniMode && (
        <div className="flex h-full w-full bg-background text-text overflow-hidden selection:bg-purple-500/30 font-sans"
        >

            {/* Background Gradients (Global) */}
            <motion.div 
              className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen z-0"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none opacity-30 mix-blend-screen z-0"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />

            {/* Global Navigation Rail */}
            <NavRail currentView={currentView} onViewChange={setCurrentView} />

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 flex flex-col h-full overflow-hidden">

              {/* Top Bar (Context Awareness) */}
              <motion.header 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="shrink-0 h-16 border-b border-white/5 px-6 flex items-center justify-between bg-black/20 backdrop-blur-sm z-30"
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="text-sm font-medium tracking-widest text-text/50 uppercase"
                    key={currentView}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentView === 'chat' ? 'Vezora Live' : `System // ${currentView}`}
                  </motion.div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Voice Call Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startVoiceCall}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 border border-primary/30 transition-all group"
                    title="Start voice call"
                  >
                    <Phone size={16} className="text-primary group-hover:text-white transition-colors" />
                    <span className="text-xs font-medium text-text/70 group-hover:text-white transition-colors">Voice Call</span>
                  </motion.button>
                  
                  {/* Minimize Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMiniMode(true)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all group"
                    title="Minimize to orb"
                  >
                    <Minimize2 size={16} className="text-text/60 group-hover:text-primary transition-colors" />
                  </motion.button>

                  <motion.div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5"
                    animate={{
                      borderColor: ["rgba(255,255,255,0.05)", "rgba(74,222,128,0.2)", "rgba(255,255,255,0.05)"]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-green-400"
                      animate={{
                        scale: [1, 1.3, 1],
                        boxShadow: [
                          "0 0 5px rgba(74,222,128,0.5)",
                          "0 0 15px rgba(74,222,128,0.8)",
                          "0 0 5px rgba(74,222,128,0.5)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <span className="text-[10px] font-mono text-text/60">ONLINE</span>
                  </motion.div>
                </div>
              </motion.header>

              {/* View Container with Animated Transitions */}
              <div className="flex-1 relative overflow-hidden view-container">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentView}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="absolute inset-0 overflow-hidden"
                  >
                    {renderView()}
                  </motion.div>
                </AnimatePresence>
              </div>

            </main>
        </div>
      )}
    </>
  );
}

export default App;
