import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, Zap, ChevronRight } from 'lucide-react';

interface Suggestion {
    id: string;
    type: 'action' | 'reminder' | 'insight' | 'tip';
    title: string;
    description: string;
    action?: string;
    priority: 'high' | 'medium' | 'low';
}

interface SuggestionsWidgetProps {
    onSuggestionClick?: (suggestion: Suggestion) => void;
}

export const SuggestionsWidget = ({ onSuggestionClick }: SuggestionsWidgetProps) => {
    const suggestions: Suggestion[] = [
        {
            id: '1',
            type: 'reminder',
            title: 'Daily Standup in 15 minutes',
            description: 'Team meeting starts soon',
            action: 'Join Now',
            priority: 'high'
        },
        {
            id: '2',
            type: 'action',
            title: 'Review pending pull requests',
            description: '3 PRs waiting for your review',
            action: 'Open GitHub',
            priority: 'medium'
        },
        {
            id: '3',
            type: 'insight',
            title: 'Peak productivity hours',
            description: 'You work best between 10 AM - 2 PM',
            priority: 'low'
        },
        {
            id: '4',
            type: 'tip',
            title: 'Try voice commands',
            description: 'Say "Hey Vezora" to activate hands-free mode',
            action: 'Learn More',
            priority: 'low'
        }
    ];

    const getIcon = (type: Suggestion['type']) => {
        switch (type) {
            case 'reminder': return <Clock size={16} className="text-yellow-400" />;
            case 'action': return <Zap size={16} className="text-primary" />;
            case 'insight': return <TrendingUp size={16} className="text-secondary" />;
            case 'tip': return <Sparkles size={16} className="text-purple-400" />;
        }
    };

    const getPriorityColor = (priority: Suggestion['priority']) => {
        switch (priority) {
            case 'high': return 'border-red-500/30 bg-red-500/10';
            case 'medium': return 'border-yellow-500/30 bg-yellow-500/10';
            case 'low': return 'border-white/10 bg-white/5';
        }
    };

    return (
        <div className="w-full bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-primary" />
                <h3 className="text-sm font-semibold">Suggestions</h3>
            </div>

            <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                    <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => onSuggestionClick?.(suggestion)}
                        className={`group p-3 border rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${getPriorityColor(suggestion.priority)}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                                {getIcon(suggestion.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium mb-0.5">
                                    {suggestion.title}
                                </h4>
                                <p className="text-xs text-text/60 line-clamp-2">
                                    {suggestion.description}
                                </p>
                                
                                {suggestion.action && (
                                    <motion.button
                                        whileHover={{ x: 2 }}
                                        className="flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
                                    >
                                        <span>{suggestion.action}</span>
                                        <ChevronRight size={12} />
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
