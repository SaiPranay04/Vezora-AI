import { Brain, Search, Trash2, Edit2, Plus, Shield, Clock, Zap } from 'lucide-react';
import memoryData from '../../memory.json';
import { motion } from 'framer-motion';

export const MemoryPage = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                        Neural Core
                    </h1>
                    <p className="text-text/60">Manage internalized knowledge and learned patterns.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" size={16} />
                        <input
                            placeholder="Search engrams..."
                            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-primary outline-none min-w-[250px]"
                        />
                    </div>
                    <button className="bg-primary hover:bg-primary/90 text-white p-2 rounded-xl transition-colors">
                        <Plus size={20} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Section: User Facts */}
                <div className="col-span-full">
                    <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Brain size={16} /> Core Facts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {memoryData.user_facts.map((fact, i) => {
                            // Assign random confidence levels for demo
                            const confidenceLevels = ['High', 'Medium', 'Low'] as const;
                            const confidence = confidenceLevels[i % 3];
                            const confidenceColors: Record<typeof confidenceLevels[number], string> = {
                                'High': 'bg-green-500/10 text-green-400 border-green-500/20',
                                'Medium': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                                'Low': 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            };
                            
                            return (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 hover:border-primary/50 transition-all rounded-2xl p-5 hover:shadow-[0_0_30px_-10px_rgba(142,68,255,0.4)] hover:scale-[1.02]"
                                >
                                    {/* Confidence Badge */}
                                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${confidenceColors[confidence]}`}>
                                        <Shield size={10} className="inline mr-1" />
                                        {confidence}
                                    </div>
                                    
                                    <p className="text-sm text-text/90 leading-relaxed font-light mt-8 mb-4">"{fact}"</p>
                                    
                                    {/* Metadata Footer */}
                                    <div className="flex items-center justify-between text-[10px] text-text/40 mt-3 pt-3 border-t border-white/5">
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {Math.floor(Math.random() * 30) + 1}d ago
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Zap size={10} />
                                            Used {Math.floor(Math.random() * 20) + 5}x
                                        </span>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="p-1.5 rounded-lg bg-black/50 text-text/40 hover:text-white hover:bg-primary/20 transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </motion.button>
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="p-1.5 rounded-lg bg-black/50 text-text/40 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Section: Recent Topics (Timeline view style) */}
                <div className="col-span-full mt-8">
                    <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap size={16} /> Active Context
                    </h2>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-2xl p-6 overflow-x-auto"
                    >
                        <div className="flex gap-8 min-w-full">
                            {memoryData.recent_topics.map((topic, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="flex flex-col gap-2 min-w-[150px] relative group cursor-pointer"
                                >
                                    <motion.div 
                                        className="w-3 h-3 rounded-full bg-primary mb-2 shadow-[0_0_15px_rgba(142,68,255,0.8)]"
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            boxShadow: [
                                                "0 0 15px rgba(142,68,255,0.8)",
                                                "0 0 25px rgba(142,68,255,1)",
                                                "0 0 15px rgba(142,68,255,0.8)"
                                            ]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.3
                                        }}
                                    />
                                    <span className="text-lg font-medium text-white group-hover:text-primary transition-colors">{topic}</span>
                                    <span className="text-xs text-text/40 font-mono">Active now</span>
                                    <div className="mt-2 px-2 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] text-primary font-mono">
                                        {Math.floor(Math.random() * 50) + 10} refs
                                    </div>
                                    {/* Line connector */}
                                    {i !== memoryData.recent_topics.length - 1 && (
                                        <div className="absolute top-[5px] left-[15px] right-[-20px] h-[1px] bg-gradient-to-r from-primary/50 to-primary/10 -z-10" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
};
