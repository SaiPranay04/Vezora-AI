import { Brain, Hash, Clock } from 'lucide-react';

interface MemoryData {
    user_facts: string[];
    recent_topics: string[];
}

export const MemoryPanel = ({ data }: { data: MemoryData }) => {
    return (
        <div className="space-y-6 p-4">

            {/* Short Term Memory / Facts */}
            <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-widest opacity-80">
                    <Brain size={14} /> Core Memory
                </h3>
                <div className="space-y-2">
                    {data.user_facts.map((fact, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-lg p-3 text-sm text-text/80 hover:bg-white/10 transition-colors">
                            {fact}
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Topics */}
            <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest opacity-80">
                    <Clock size={14} /> Recent Context
                </h3>
                <div className="flex flex-wrap gap-2">
                    {data.recent_topics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs">
                            <Hash size={10} /> {topic}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
