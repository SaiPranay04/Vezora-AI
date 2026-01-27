import { X, Volume2, Monitor, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <h2 className="text-xl font-semibold">Settings</h2>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-8">

                                {/* Voice Settings */}
                                <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 text-sm font-medium text-text/60 uppercase tracking-widest">
                                        <Volume2 size={16} /> Voice Configuration
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Response Speed</span>
                                            <input type="range" className="accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer w-32" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Pitch</span>
                                            <input type="range" className="accent-secondary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer w-32" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Voice Style</span>
                                            <select className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-primary">
                                                <option>Nova (Energetic)</option>
                                                <option>Shimmer (Warm)</option>
                                                <option>Neon (Robotic)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* System Settings */}
                                <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 text-sm font-medium text-text/60 uppercase tracking-widest">
                                        <Monitor size={16} /> System
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Hardware Acceleration</span>
                                        <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                                            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Always on Top</span>
                                        <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer">
                                            <div className="absolute left-1 top-1 w-3 h-3 bg-white/50 rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="p-4 bg-black/20 text-center text-xs text-text/30 border-t border-white/5">
                                <Shield size={10} className="inline mr-1" /> Vezora Core v0.1.0 • Secure Enclave Active
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
