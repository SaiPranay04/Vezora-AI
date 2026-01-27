import { X, Settings, Database, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryPanel } from './MemoryPanel';
import memoryData from '../../memory.json';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
}

export const Sidebar = ({ isOpen, onClose, onOpenSettings }: SidebarProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="absolute right-0 top-0 bottom-0 w-80 bg-background/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
                                <Database size={18} className="text-primary" />
                                Vezora Systems
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <MemoryPanel data={memoryData} />

                            <div className="p-4 mt-4">
                                <h3 className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-widest opacity-80 mb-3">
                                    <Activity size={14} /> System Status
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                                        <div className="text-xs text-text/50">Tauri Core</div>
                                        <div className="text-green-400 font-mono text-sm">Active</div>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                                        <div className="text-xs text-text/50">Gemini Pro</div>
                                        <div className="text-purple-400 font-mono text-sm">Connected</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-black/20">
                            <button
                                onClick={onOpenSettings}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-text/80"
                            >
                                <Settings size={16} /> Open Settings
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
