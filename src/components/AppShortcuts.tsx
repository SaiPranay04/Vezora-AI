import { Terminal, Mail, Folder, Layout, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';

export const AppShortcuts = () => {
    const apps = [
        { name: 'VS Code', icon: Terminal, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { name: 'Chrome', icon: Chrome, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { name: 'Gmail', icon: Mail, color: 'text-red-400', bg: 'bg-red-400/10' },
        { name: 'Files', icon: Folder, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        { name: 'Vezora OS', icon: Layout, color: 'text-primary', bg: 'bg-primary/10' },
    ];

    return (
        <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 w-64">
            <h3 className="text-xs font-bold text-text/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Layout size={12} /> Quick Launch
            </h3>

            <div className="grid grid-cols-2 gap-3">
                {apps.map((app) => (
                    <motion.button
                        key={app.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`${app.bg} border border-white/5 p-3 rounded-xl flex flex-col items-center gap-2 transition-colors hover:border-white/20`}
                    >
                        <div className={`${app.color} drop-shadow-lg`}>
                            <app.icon size={20} />
                        </div>
                        <span className="text-xs font-medium text-text/80">{app.name}</span>
                    </motion.button>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-[10px] text-text/40 font-mono">
                    System Resources:<br />
                    CPU: 12% • MEM: 3.4GB
                </div>
            </div>
        </div>
    );
};
