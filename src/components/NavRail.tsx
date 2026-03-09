import { MessageSquare, Brain, Settings, LayoutGrid, User, CheckSquare, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export type View = 'chat' | 'memory' | 'profile' | 'tasks' | 'apps' | 'settings';

interface NavRailProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

export const NavRail = ({ currentView, onViewChange }: NavRailProps) => {
    const { user, logout } = useAuth();
    
    const navItems = [
        { id: 'chat', icon: MessageSquare, label: 'Chat', color: 'text-primary' },
        { id: 'memory', icon: Brain, label: 'Memory', color: 'text-secondary' },
        { id: 'profile', icon: User, label: 'Profile', color: 'text-green-400' },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks', color: 'text-yellow-400' },
        { id: 'apps', icon: LayoutGrid, label: 'Apps', color: 'text-purple-400' },
        { id: 'settings', icon: Settings, label: 'Config', color: 'text-pink-400' },
    ] as const;

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    return (
        <div className="w-20 h-full bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-8 z-50 relative overflow-hidden">
            {/* Animated Background Glow */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none"
                animate={{
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Brand Icon */}
            <motion.div 
                className="mb-10 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(142,68,255,0.4)] relative z-10 cursor-pointer"
                whileHover={{ 
                    scale: 1.1,
                    rotate: [0, -5, 5, -5, 0],
                    boxShadow: "0 0 30px rgba(142,68,255,0.6)"
                }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    boxShadow: [
                        "0 0 20px rgba(142,68,255,0.4)",
                        "0 0 30px rgba(142,68,255,0.6)",
                        "0 0 20px rgba(142,68,255,0.4)"
                    ]
                }}
                transition={{
                    boxShadow: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                }}
            >
                <motion.span 
                    className="font-bold text-white text-lg"
                    animate={{
                        textShadow: [
                            "0 0 10px rgba(255,255,255,0.5)",
                            "0 0 20px rgba(255,255,255,0.8)",
                            "0 0 10px rgba(255,255,255,0.5)"
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
            </motion.div>

            <div className="flex flex-col gap-6 w-full px-2 relative z-10">
                {navItems.map((item, index) => {
                    const isActive = currentView === item.id;
                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={cn(
                                "relative group flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-300 w-full overflow-hidden",
                                isActive
                                    ? "bg-white/10 text-primary"
                                    : "text-text/40 hover:text-text/80 hover:bg-white/5"
                            )}
                            whileHover={{ scale: 1.05, x: 2 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {/* Active Background Glow */}
                            {isActive && (
                                <motion.div
                                    layoutId="nav-bg-glow"
                                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl"
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            {/* Active Indicator Line */}
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active"
                                    className="absolute left-0 w-1 h-10 bg-gradient-to-b from-primary via-secondary to-primary rounded-r-full shadow-[0_0_10px_rgba(142,68,255,0.8)]"
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <motion.div
                                animate={isActive ? {
                                    scale: [1, 1.1, 1],
                                } : {}}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <item.icon 
                                    size={24} 
                                    className={cn(
                                        "transition-all duration-300 relative z-10",
                                        isActive 
                                            ? `${item.color} drop-shadow-[0_0_10px_rgba(142,68,255,0.6)]` 
                                            : "group-hover:scale-110"
                                    )} 
                                />
                            </motion.div>

                            {/* Hover Tooltip */}
                            <motion.span 
                                className="text-[10px] font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-all absolute left-16 bg-black/90 px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap backdrop-blur-xl shadow-xl z-50"
                                initial={{ x: -10 }}
                                whileHover={{ x: 0 }}
                            >
                                {item.label}
                                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-black/90 border-l border-b border-white/10 rotate-45" />
                            </motion.span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Spacer to push logout to bottom */}
            <div className="flex-1" />

            {/* User Info & Logout Button */}
            <div className="w-full px-2 pb-4 relative z-10">
                {/* User Email Display */}
                {user?.email && (
                    <motion.div
                        className="mb-3 px-2 py-2 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <p className="text-[9px] text-text/40 truncate w-full" title={user.email}>
                            {user.email}
                        </p>
                    </motion.div>
                )}

                {/* Logout Button */}
                <motion.button
                    onClick={handleLogout}
                    className="relative group flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-300 w-full overflow-hidden text-text/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    whileHover={{ scale: 1.05, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                >
                    {/* Hover Background Glow */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    />

                    <LogOut 
                        size={22} 
                        className="transition-all duration-300 relative z-10 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" 
                    />

                    {/* Hover Tooltip */}
                    <motion.span 
                        className="text-[10px] font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-all absolute left-16 bg-black/90 px-3 py-1.5 rounded-lg border border-red-500/20 whitespace-nowrap backdrop-blur-xl shadow-xl z-50"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                    >
                        Logout
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-black/90 border-l border-b border-red-500/20 rotate-45" />
                    </motion.span>
                </motion.button>
            </div>
        </div>
    );
};
