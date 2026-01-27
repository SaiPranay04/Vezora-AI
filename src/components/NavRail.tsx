import { MessageSquare, Brain, Settings, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export type View = 'chat' | 'memory' | 'apps' | 'settings';

interface NavRailProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

export const NavRail = ({ currentView, onViewChange }: NavRailProps) => {
    const navItems = [
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'memory', icon: Brain, label: 'Memory' },
        { id: 'apps', icon: LayoutGrid, label: 'Apps' },
        { id: 'settings', icon: Settings, label: 'Config' },
    ] as const;

    return (
        <div className="w-20 h-full bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-8 z-50">

            {/* Brand Icon */}
            <div className="mb-10 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(142,68,255,0.3)]">
                <span className="font-bold text-white text-lg">V</span>
            </div>

            <div className="flex flex-col gap-6 w-full px-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={cn(
                            "relative group flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-300 w-full",
                            currentView === item.id
                                ? "bg-white/10 text-primary"
                                : "text-text/40 hover:text-text/80 hover:bg-white/5"
                        )}
                    >
                        {/* Active Indicator Line */}
                        {currentView === item.id && (
                            <motion.div
                                layoutId="nav-active"
                                className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                            />
                        )}

                        <item.icon size={24} className={cn(
                            "transition-transform duration-300",
                            currentView === item.id ? "scale-110 drop-shadow-[0_0_8px_rgba(142,68,255,0.5)]" : ""
                        )} />
                        <span className="text-[10px] font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity absolute left-14 bg-black/80 px-2 py-1 rounded border border-white/10 whitespace-nowrap lg:hidden">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
