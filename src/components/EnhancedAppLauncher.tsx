import { motion } from 'framer-motion';
import { Terminal, Chrome, Mail, Folder, Code, FileText, Music, Image as ImageIcon, Plus, Star } from 'lucide-react';
import { useState } from 'react';

interface App {
    id: string;
    name: string;
    icon: any;
    color: string;
    category: 'dev' | 'productivity' | 'media' | 'other';
    isFavorite: boolean;
    lastUsed?: string;
    // For Tauri: command to execute
    command?: string;
}

export const EnhancedAppLauncher = () => {
    const [apps] = useState<App[]>([
        { id: '1', name: 'VS Code', icon: Code, color: 'text-blue-400', category: 'dev', isFavorite: true, command: 'code' },
        { id: '2', name: 'Chrome', icon: Chrome, color: 'text-yellow-400', category: 'productivity', isFavorite: true, command: 'chrome' },
        { id: '3', name: 'Terminal', icon: Terminal, color: 'text-green-400', category: 'dev', isFavorite: false, command: 'powershell' },
        { id: '4', name: 'Gmail', icon: Mail, color: 'text-red-400', category: 'productivity', isFavorite: true, lastUsed: '2h ago' },
        { id: '5', name: 'Files', icon: Folder, color: 'text-orange-400', category: 'productivity', isFavorite: false, command: 'explorer' },
        { id: '6', name: 'Notes', icon: FileText, color: 'text-purple-400', category: 'productivity', isFavorite: false },
        { id: '7', name: 'Spotify', icon: Music, color: 'text-green-500', category: 'media', isFavorite: false },
        { id: '8', name: 'Photos', icon: ImageIcon, color: 'text-pink-400', category: 'media', isFavorite: false }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredApps = apps.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', 'dev', 'productivity', 'media'];

    // In Tauri, this would use: invoke('launch_app', { command: app.command })
    const launchApp = (app: App) => {
        console.log(`Launching ${app.name}`, app.command);
        // Tauri command would go here
    };

    return (
        <div className="w-full space-y-4">
            {/* Search & Filter */}
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Search apps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-primary transition-colors"
                />
                
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                                selectedCategory === cat
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-white/5 text-text/60 hover:bg-white/10'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-3 gap-3">
                {filteredApps.map((app, index) => (
                    <motion.button
                        key={app.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => launchApp(app)}
                        className="relative group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 hover:bg-white/10 transition-all"
                    >
                        {/* Favorite Badge */}
                        {app.isFavorite && (
                            <div className="absolute top-2 right-2">
                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-2">
                            <div className={`${app.color} drop-shadow-lg`}>
                                <app.icon size={24} />
                            </div>
                            <span className="text-xs font-medium text-center line-clamp-1">
                                {app.name}
                            </span>
                            {app.lastUsed && (
                                <span className="text-[10px] text-text/40">
                                    {app.lastUsed}
                                </span>
                            )}
                        </div>

                        {/* Quick Launch Indicator */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                ))}

                {/* Add Custom App */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 border-2 border-dashed border-white/10 rounded-xl hover:border-primary/30 transition-all group"
                >
                    <div className="flex flex-col items-center gap-2 text-text/40 group-hover:text-primary transition-colors">
                        <Plus size={24} />
                        <span className="text-xs">Add App</span>
                    </div>
                </motion.button>
            </div>

            {/* Recent Apps */}
            <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-semibold text-text/50 uppercase tracking-wider mb-3">
                    Recently Used
                </h4>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {apps.filter(a => a.lastUsed).map((app) => (
                        <button
                            key={app.id}
                            onClick={() => launchApp(app)}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all whitespace-nowrap group"
                        >
                            <app.icon size={14} className={app.color} />
                            <span className="text-xs">{app.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
