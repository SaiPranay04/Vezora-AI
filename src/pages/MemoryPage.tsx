import { Brain, Search, Trash2, Edit2, Plus } from 'lucide-react';
import memoryData from '../../memory.json';

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
                        {memoryData.user_facts.map((fact, i) => (
                            <div key={i} className="group relative bg-[#1A1A1A] border border-white/5 hover:border-primary/50 transition-all rounded-2xl p-5 hover:shadow-[0_0_20px_-10px_rgba(142,68,255,0.3)]">
                                <p className="text-sm text-text/90 leading-relaxed font-light">"{fact}"</p>
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-text/40 hover:text-white transition-colors"><Edit2 size={14} /></button>
                                    <button className="text-text/40 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Recent Topics (Timeline view style) */}
                <div className="col-span-full mt-8">
                    <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Active Context</h2>
                    <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 overflow-x-auto">
                        <div className="flex gap-8 min-w-full">
                            {memoryData.recent_topics.map((topic, i) => (
                                <div key={i} className="flex flex-col gap-2 min-w-[150px] relative">
                                    <div className="w-3 h-3 rounded-full bg-primary mb-2 shadow-[0_0_10px_rgba(142,68,255,0.8)]" />
                                    <span className="text-lg font-medium text-white">{topic}</span>
                                    <span className="text-xs text-text/40 font-mono">Last accessed 2h ago</span>
                                    {/* Line connector */}
                                    {i !== memoryData.recent_topics.length - 1 && (
                                        <div className="absolute top-[5px] left-[15px] right-[-20px] h-[1px] bg-white/10 -z-10" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
