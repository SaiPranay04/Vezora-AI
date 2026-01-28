import { motion } from 'framer-motion';
import { ExternalLink, Globe, Calendar, TrendingUp } from 'lucide-react';

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source?: string;
    publishedDate?: string;
    relevanceScore?: number;
}

interface SearchResultsProps {
    results: SearchResult[];
    query?: string;
    isLoading?: boolean;
}

export const SearchResults = ({ results, query, isLoading = false }: SearchResultsProps) => {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-4 bg-white/5 border border-white/5 rounded-xl">
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-white/10 rounded w-1/2 mb-2" />
                        <div className="h-3 bg-white/10 rounded w-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-text/40">
                <Globe size={40} className="mb-3 opacity-30" />
                <p className="text-sm">No search results found</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {query && (
                <div className="flex items-center gap-2 text-xs text-text/50 mb-4">
                    <TrendingUp size={14} />
                    <span>Search results for: <span className="text-primary font-medium">"{query}"</span></span>
                </div>
            )}

            {results.map((result, index) => (
                <motion.a
                    key={index}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="block group p-4 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-xl hover:border-primary/30 hover:bg-white/10 transition-all"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white group-hover:text-primary transition-colors line-clamp-2">
                                {result.title}
                            </h3>
                            {result.source && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Globe size={12} className="text-secondary shrink-0" />
                                    <span className="text-xs text-text/60 truncate">{result.source}</span>
                                    {result.publishedDate && (
                                        <>
                                            <span className="text-text/30">•</span>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={10} className="text-text/40" />
                                                <span className="text-xs text-text/40">{result.publishedDate}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="shrink-0 p-1.5 rounded-lg bg-primary/10 text-primary"
                        >
                            <ExternalLink size={14} />
                        </motion.div>
                    </div>

                    {/* Snippet */}
                    <p className="text-xs text-text/70 leading-relaxed line-clamp-2">
                        {result.snippet}
                    </p>

                    {/* Relevance Score */}
                    {result.relevanceScore !== undefined && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.relevanceScore * 100}%` }}
                                    transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                                    className="h-full bg-gradient-to-r from-secondary to-primary"
                                />
                            </div>
                            <span className="text-[10px] text-text/40 font-mono">
                                {Math.round(result.relevanceScore * 100)}%
                            </span>
                        </div>
                    )}
                </motion.a>
            ))}
        </div>
    );
};
