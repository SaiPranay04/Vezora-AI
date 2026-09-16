import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type AppView = 'chat' | 'memory' | 'profile' | 'tasks' | 'apps' | 'settings' | 'files' | 'activity';

export interface AppContextState {
  page: AppView;
  selectedFile: string | null;
  activeTask: string | null;
  conversationId: string | null;
  selectedText: string | null;
  recentActions: string[];
}

interface AppContextValue extends AppContextState {
  setPage: (page: AppView) => void;
  setSelectedFile: (path: string | null) => void;
  setActiveTask: (task: string | null) => void;
  setConversationId: (id: string | null) => void;
  setSelectedText: (text: string | null) => void;
  pushAction: (action: string) => void;
  /** Compact object to send with chat/voice requests */
  getContextPayload: () => Record<string, unknown>;
  contextLabel: string;
  voiceCallActive: boolean;
  setVoiceCallActive: (active: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<AppView>('chat');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [voiceCallActive, setVoiceCallActive] = useState(false);

  const pushAction = useCallback((action: string) => {
    setRecentActions((prev) => [action, ...prev].slice(0, 5));
  }, []);

  const getContextPayload = useCallback(
    () => ({
      page,
      selectedFile,
      activeTask,
      conversationId,
      selectedText,
      recentActions
    }),
    [page, selectedFile, activeTask, conversationId, selectedText, recentActions]
  );

  const contextLabel = [
    page,
    selectedFile ? selectedFile.split(/[/\\]/).pop() : null,
    activeTask
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <AppContext.Provider
      value={{
        page,
        selectedFile,
        activeTask,
        conversationId,
        selectedText,
        recentActions,
        setPage,
        setSelectedFile,
        setActiveTask,
        setConversationId,
        setSelectedText,
        pushAction,
        getContextPayload,
        contextLabel,
        voiceCallActive,
        setVoiceCallActive
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
