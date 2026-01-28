import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Inbox, Star, Trash2, Archive, Search, Plus, X, Paperclip } from 'lucide-react';
import { cn } from '../lib/utils';

interface Email {
    id: string;
    from: string;
    subject: string;
    preview: string;
    date: string;
    isRead: boolean;
    isStarred: boolean;
    hasAttachments?: boolean;
}

interface EmailPanelProps {
    onClose?: () => void;
}

export const EmailPanel = ({ onClose }: EmailPanelProps) => {
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'starred'>('inbox');

    // Mock email data - In Tauri, this would come from Gmail API
    const [emails] = useState<Email[]>([
        {
            id: '1',
            from: 'team@vezora.ai',
            subject: 'Welcome to Vezora AI Assistant',
            preview: 'Thanks for joining! Here are some tips to get started...',
            date: '2h ago',
            isRead: false,
            isStarred: true,
            hasAttachments: true
        },
        {
            id: '2',
            from: 'notifications@github.com',
            subject: '[GitHub] New PR awaiting review',
            preview: 'A pull request has been submitted to your repository...',
            date: '5h ago',
            isRead: true,
            isStarred: false
        },
        {
            id: '3',
            from: 'calendar@google.com',
            subject: 'Meeting Reminder: Team Sync',
            preview: 'Your meeting starts in 30 minutes...',
            date: 'Yesterday',
            isRead: true,
            isStarred: false
        }
    ]);

    const ComposeModal = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsComposing(false)}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="font-semibold">New Message</h3>
                    <button
                        onClick={() => setIsComposing(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Compose Form */}
                <div className="p-6 space-y-4">
                    <input
                        type="email"
                        placeholder="To"
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg outline-none focus:border-primary transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="Subject"
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg outline-none focus:border-primary transition-colors"
                    />
                    <textarea
                        placeholder="Compose your message..."
                        rows={8}
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg outline-none focus:border-primary transition-colors resize-none"
                    />

                    <div className="flex items-center justify-between">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                            <Paperclip size={16} />
                            <span className="text-sm">Attach</span>
                        </button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 rounded-lg font-medium shadow-lg shadow-primary/30"
                        >
                            <Send size={16} />
                            Send
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="flex flex-col h-full bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-white/5 bg-black/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Mail className="text-primary" size={20} />
                        <h2 className="font-semibold">Email</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsComposing(true)}
                            className="p-2 bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/30"
                        >
                            <Plus size={18} />
                        </motion.button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40" size={16} />
                    <input
                        type="text"
                        placeholder="Search emails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-primary transition-colors text-sm"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                    {[
                        { id: 'inbox', icon: Inbox, label: 'Inbox' },
                        { id: 'sent', icon: Send, label: 'Sent' },
                        { id: 'starred', icon: Star, label: 'Starred' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-white/5 text-text/60 hover:bg-white/10"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                <div className="p-2 space-y-1">
                    {emails.map((email, index) => (
                        <motion.div
                            key={email.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedEmail(email)}
                            className={cn(
                                "p-3 rounded-xl cursor-pointer transition-all group",
                                email.isRead ? "bg-white/5" : "bg-primary/10 border border-primary/20",
                                selectedEmail?.id === email.id && "bg-primary/20 border-primary/30"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className={cn(
                                            "text-sm font-medium truncate",
                                            !email.isRead && "font-semibold"
                                        )}>
                                            {email.from}
                                        </p>
                                        {email.isStarred && (
                                            <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                                        )}
                                        {email.hasAttachments && (
                                            <Paperclip size={12} className="text-text/40 shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-text/80 font-medium truncate mb-1">
                                        {email.subject}
                                    </p>
                                    <p className="text-xs text-text/50 line-clamp-2">
                                        {email.preview}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-[10px] text-text/40 whitespace-nowrap">
                                        {email.date}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1 hover:bg-white/10 rounded">
                                            <Archive size={12} className="text-text/60" />
                                        </button>
                                        <button className="p-1 hover:bg-red-500/20 rounded">
                                            <Trash2 size={12} className="text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Compose Modal */}
            <AnimatePresence>
                {isComposing && <ComposeModal />}
            </AnimatePresence>
        </div>
    );
};
