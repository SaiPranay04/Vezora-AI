import { motion } from 'framer-motion';
import { Brain, TrendingUp, Clock, Tag, Link as LinkIcon, FileText } from 'lucide-react';

interface ContextNode {
    id: string;
    type: 'topic' | 'entity' | 'action' | 'memory';
    label: string;
    connections: number;
    relevance: number;
    lastAccessed: string;
}

export const ContextVisualization = () => {
    const contextNodes: ContextNode[] = [
        { id: '1', type: 'topic', label: 'React Development', connections: 12, relevance: 0.95, lastAccessed: '2m ago' },
        { id: '2', type: 'entity', label: 'Vezora Project', connections: 18, relevance: 0.92, lastAccessed: 'Active' },
        { id: '3', type: 'action', label: 'Code Review', connections: 5, relevance: 0.78, lastAccessed: '1h ago' },
        { id: '4', type: 'memory', label: 'User Preferences', connections: 8, relevance: 0.85, lastAccessed: '5m ago' },
        { id: '5', type: 'topic', label: 'Tauri Framework', connections: 7, relevance: 0.88, lastAccessed: '10m ago' },
        { id: '6', type: 'entity', label: 'GitHub', connections: 15, relevance: 0.82, lastAccessed: '30m ago' }
    ];

    const getNodeColor = (type: ContextNode['type']) => {
        switch (type) {
            case 'topic': return { bg: 'bg-primary/20', border: 'border-primary', text: 'text-primary' };
            case 'entity': return { bg: 'bg-secondary/20', border: 'border-secondary', text: 'text-secondary' };
            case 'action': return { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' };
            case 'memory': return { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' };
        }
    };

    const getTypeIcon = (type: ContextNode['type']) => {
        switch (type) {
            case 'topic': return <Tag size={14} />;
            case 'entity': return <FileText size={14} />;
            case 'action': return <TrendingUp size={14} />;
            case 'memory': return <Brain size={14} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Brain className="text-secondary" size={20} />
                        Context Map
                    </h3>
                    <p className="text-xs text-text/50 mt-1">Active conversation context and relationships</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text/50">
                    <TrendingUp size={14} />
                    <span>6 active nodes</span>
                </div>
            </div>

            {/* Visualization Graph (Simplified) */}
            <div className="relative h-64 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-white/10 p-6 overflow-hidden">
                {/* Connection Lines (decorative) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <line x1="20%" y1="30%" x2="80%" y2="70%" stroke="url(#gradient1)" strokeWidth="1" />
                    <line x1="50%" y1="20%" x2="30%" y2="80%" stroke="url(#gradient2)" strokeWidth="1" />
                    <line x1="70%" y1="40%" x2="40%" y2="60%" stroke="url(#gradient1)" strokeWidth="1" />
                    <defs>
                        <linearGradient id="gradient1">
                            <stop offset="0%" stopColor="#8E44FF" />
                            <stop offset="100%" stopColor="#5ED0F3" />
                        </linearGradient>
                        <linearGradient id="gradient2">
                            <stop offset="0%" stopColor="#5ED0F3" />
                            <stop offset="100%" stopColor="#8E44FF" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Nodes */}
                {contextNodes.map((node, index) => {
                    const colors = getNodeColor(node.type);
                    const positions = [
                        { x: '20%', y: '30%' },
                        { x: '50%', y: '50%' },
                        { x: '80%', y: '70%' },
                        { x: '30%', y: '80%' },
                        { x: '70%', y: '40%' },
                        { x: '40%', y: '20%' }
                    ];
                    const pos = positions[index % positions.length];

                    return (
                        <motion.div
                            key={node.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                            className="group cursor-pointer"
                        >
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                className={`relative px-3 py-2 ${colors.bg} border ${colors.border} rounded-lg ${colors.text} shadow-lg backdrop-blur-sm`}
                            >
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    {getTypeIcon(node.type)}
                                    <span className="text-xs font-medium">{node.label}</span>
                                </div>

                                {/* Hover Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="bg-black/90 border border-white/10 rounded-lg p-2 text-xs whitespace-nowrap">
                                        <div className="flex items-center gap-2 mb-1">
                                            <LinkIcon size={10} />
                                            <span>{node.connections} connections</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={10} />
                                            <span>{node.lastAccessed}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Relevance Indicator */}
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full text-[8px] font-bold flex items-center justify-center text-black">
                                    {Math.round(node.relevance * 10)}
                                </div>
                            </motion.div>

                            {/* Pulse Animation */}
                            {node.lastAccessed === 'Active' && (
                                <motion.div
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.5, 0, 0.5]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeOut"
                                    }}
                                    className={`absolute inset-0 rounded-lg border-2 ${colors.border}`}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Context Details */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-primary" />
                        <span className="text-xs font-semibold text-text/60">Relevance Score</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">92%</div>
                    <p className="text-xs text-text/40 mt-1">High context alignment</p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-secondary" />
                        <span className="text-xs font-semibold text-text/60">Session Duration</span>
                    </div>
                    <div className="text-2xl font-bold text-secondary">2.5h</div>
                    <p className="text-xs text-text/40 mt-1">Active conversation</p>
                </div>
            </div>

            {/* Recent Context Changes */}
            <div>
                <h4 className="text-xs font-semibold text-text/50 uppercase tracking-wider mb-3">
                    Recent Context Updates
                </h4>
                <div className="space-y-2">
                    {[
                        { action: 'Added topic', item: 'React Hooks', time: '2m ago' },
                        { action: 'Updated entity', item: 'User Preferences', time: '5m ago' },
                        { action: 'Linked memory', item: 'Project Settings', time: '10m ago' }
                    ].map((update, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-xs"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-text/60">{update.action}</span>
                                <span className="font-medium">{update.item}</span>
                            </div>
                            <span className="text-text/40">{update.time}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
