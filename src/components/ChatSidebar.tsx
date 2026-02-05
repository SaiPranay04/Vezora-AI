/**
 * ChatSidebar - Display and manage chat sessions
 */

import { MessageSquare, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { ChatSession } from '../hooks/useChats';

interface ChatSidebarProps {
    sessions: ChatSession[];
    activeChatId: string | null;
    onNewChat: () => void;
    onSwitchChat: (chatId: string) => void;
    onDeleteChat: (chatId: string) => void;
    onRenameChat: (chatId: string, newTitle: string) => void;
}

export const ChatSidebar = ({
    sessions,
    activeChatId,
    onNewChat,
    onSwitchChat,
    onDeleteChat,
    onRenameChat
}: ChatSidebarProps) => {
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const startEditing = (chatId: string, currentTitle: string) => {
        setEditingChatId(chatId);
        setEditingTitle(currentTitle);
    };

    const saveEdit = () => {
        if (editingChatId && editingTitle.trim()) {
            onRenameChat(editingChatId, editingTitle.trim());
        }
        setEditingChatId(null);
        setEditingTitle('');
    };

    const cancelEdit = () => {
        setEditingChatId(null);
        setEditingTitle('');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-64 h-full bg-gradient-to-b from-[#0A0A0A] to-[#050505] border-r border-white/10 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/80 rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={18} />
                    New Chat
                </motion.button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {sessions.map((session, index) => {
                        const isActive = session.id === activeChatId;
                        const isEditing = editingChatId === session.id;

                        return (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.03 }}
                                className={`group relative rounded-xl transition-all ${
                                    isActive 
                                        ? 'bg-primary/10 border border-primary/30' 
                                        : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                                }`}
                            >
                                {isEditing ? (
                                    /* Edit Mode */
                                    <div className="p-3 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEdit();
                                                if (e.key === 'Escape') cancelEdit();
                                            }}
                                            className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                                            autoFocus
                                        />
                                        <button
                                            onClick={saveEdit}
                                            className="p-1 hover:bg-green-500/20 rounded text-green-400"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    /* Normal Mode */
                                    <div
                                        onClick={() => onSwitchChat(session.id)}
                                        className="p-3 cursor-pointer flex items-start gap-3"
                                    >
                                        <MessageSquare 
                                            size={16} 
                                            className={`flex-shrink-0 mt-0.5 ${isActive ? 'text-primary' : 'text-text/40'}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${
                                                isActive ? 'text-white' : 'text-text/80'
                                            }`}>
                                                {session.title}
                                            </div>
                                            <div className="text-xs text-text/40 mt-0.5">
                                                {formatDate(session.updatedAt)}
                                            </div>
                                        </div>

                                        {/* Action Buttons (shown on hover or if active) */}
                                        <div className={`flex items-center gap-1 ${
                                            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        } transition-opacity`}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditing(session.id, session.title);
                                                }}
                                                className="p-1 hover:bg-white/10 rounded text-text/60 hover:text-text/90"
                                                title="Rename chat"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Delete "${session.title}"?`)) {
                                                        onDeleteChat(session.id);
                                                    }
                                                }}
                                                className="p-1 hover:bg-red-500/20 rounded text-text/60 hover:text-red-400"
                                                title="Delete chat"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Footer Stats */}
            <div className="p-4 border-t border-white/10 text-xs text-text/40">
                <div className="flex items-center justify-between">
                    <span>{sessions.length} chat{sessions.length !== 1 ? 's' : ''}</span>
                    <span>
                        {sessions.reduce((sum, s) => sum + s.messages.length, 0)} messages
                    </span>
                </div>
            </div>
        </div>
    );
};
