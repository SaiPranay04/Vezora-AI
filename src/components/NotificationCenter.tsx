import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    action?: { label: string; handler: () => void };
}

export const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'success',
            title: 'Workflow Completed',
            message: 'Morning Routine workflow executed successfully',
            timestamp: '5m ago',
            isRead: false
        },
        {
            id: '2',
            type: 'info',
            title: 'Meeting Reminder',
            message: 'Team standup starts in 15 minutes',
            timestamp: '10m ago',
            isRead: false,
            action: { label: 'Join', handler: () => console.log('Join meeting') }
        },
        {
            id: '3',
            type: 'warning',
            title: 'Storage Space Low',
            message: 'Only 2GB remaining on disk',
            timestamp: '1h ago',
            isRead: true
        }
    ]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} className="text-green-400" />;
            case 'info': return <Info size={20} className="text-blue-400" />;
            case 'warning': return <AlertCircle size={20} className="text-yellow-400" />;
            case 'error': return <AlertCircle size={20} className="text-red-400" />;
        }
    };

    const getBgColor = (type: Notification['type']) => {
        switch (type) {
            case 'success': return 'bg-green-500/10 border-green-500/20';
            case 'info': return 'bg-blue-500/10 border-blue-500/20';
            case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
            case 'error': return 'bg-red-500/10 border-red-500/20';
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n => 
            n.id === id ? { ...n, isRead: true } : n
        ));
    };

    const removeNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
                <Bell size={18} className="text-text/60" />
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                    >
                        {unreadCount}
                    </motion.div>
                )}
            </motion.button>

            {/* Notification Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-full right-0 mt-2 w-96 max-h-[600px] bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-black/20">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Bell size={16} />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-white/10 rounded"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {notifications.length > 0 && (
                                <div className="flex gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs transition-all"
                                        >
                                            <Check size={12} className="inline mr-1" />
                                            Mark All Read
                                        </button>
                                    )}
                                    <button
                                        onClick={clearAll}
                                        className="flex-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs text-red-400 transition-all"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-text/40">
                                    <Bell size={40} className="mb-3 opacity-30" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-2">
                                    {notifications.map((notification, index) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => !notification.isRead && markAsRead(notification.id)}
                                            className={`group relative p-3 border rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                                                notification.isRead 
                                                    ? 'bg-white/5 border-white/5' 
                                                    : `${getBgColor(notification.type)} border`
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="shrink-0 mt-0.5">
                                                    {getIcon(notification.type)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h4 className="text-sm font-semibold">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-xs text-text/60 mb-2">
                                                        {notification.message}
                                                    </p>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-text/40">
                                                            {notification.timestamp}
                                                        </span>

                                                        {notification.action && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    notification.action?.handler();
                                                                }}
                                                                className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded text-xs font-medium transition-colors"
                                                            >
                                                                {notification.action.label}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeNotification(notification.id);
                                                    }}
                                                    className="shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                                                >
                                                    <X size={14} className="text-red-400" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
