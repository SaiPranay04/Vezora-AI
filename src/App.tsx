import { useState } from 'react';
import { NavRail, type View } from './components/NavRail';
import { ChatPage } from './pages/ChatPage';
import { MemoryPage } from './pages/MemoryPage';
import { SettingsPage } from './pages/SettingsPage';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState<View>('chat');

  const renderView = () => {
    switch (currentView) {
      case 'chat': return <ChatPage />;
      case 'memory': return <MemoryPage />;
      case 'settings': return <SettingsPage />;
      default: return <ChatPage />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden selection:bg-purple-500/30 font-sans">

      {/* Background Gradients (Global) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none opacity-30 mix-blend-screen z-0" />

      {/* Global Navigation Rail */}
      <NavRail currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden">

        {/* Top Bar (Context Awareness) */}
        <header className="shrink-0 h-16 border-b border-white/5 px-6 flex items-center justify-between bg-black/20 backdrop-blur-sm z-30">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium tracking-widest text-text/50 uppercase">
              {currentView === 'chat' ? 'Vezora Live' : `System // ${currentView}`}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-mono text-text/60">ONLINE</span>
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 relative overflow-hidden">
          {renderView()}
        </div>

      </main>
    </div>
  );
}

export default App;
