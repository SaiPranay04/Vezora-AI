import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus, X, MapPin, Users, Video } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalendarEvent {
    id: string;
    title: string;
    time: string;
    duration: string;
    type: 'meeting' | 'reminder' | 'task';
    location?: string;
    attendees?: number;
    isVirtual?: boolean;
    color: string;
}

interface CalendarPanelProps {
    onClose?: () => void;
}

export const CalendarPanel = ({ onClose }: CalendarPanelProps) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

    // Mock events - In Tauri, this would come from Google Calendar API
    const [events] = useState<CalendarEvent[]>([
        {
            id: '1',
            title: 'Team Standup',
            time: '09:00 AM',
            duration: '30 min',
            type: 'meeting',
            attendees: 5,
            isVirtual: true,
            color: 'bg-primary'
        },
        {
            id: '2',
            title: 'Code Review Session',
            time: '11:30 AM',
            duration: '1 hour',
            type: 'meeting',
            location: 'Conference Room A',
            attendees: 3,
            color: 'bg-secondary'
        },
        {
            id: '3',
            title: 'Lunch Break',
            time: '01:00 PM',
            duration: '1 hour',
            type: 'reminder',
            color: 'bg-green-500'
        },
        {
            id: '4',
            title: 'Client Presentation',
            time: '03:00 PM',
            duration: '2 hours',
            type: 'meeting',
            isVirtual: true,
            attendees: 8,
            color: 'bg-purple-500'
        }
    ]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-white/5 bg-black/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-secondary" size={20} />
                        <h2 className="font-semibold">Calendar</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-secondary hover:bg-secondary/90 rounded-lg shadow-lg shadow-secondary/30"
                        >
                            <Plus size={18} />
                        </motion.button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Date & View Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">{formatDate(selectedDate)}</h3>
                        <p className="text-xs text-text/50 mt-1">{events.length} events today</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('day')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                viewMode === 'day'
                                    ? "bg-secondary/20 text-secondary border border-secondary/30"
                                    : "bg-white/5 text-text/60 hover:bg-white/10"
                            )}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                viewMode === 'week'
                                    ? "bg-secondary/20 text-secondary border border-secondary/30"
                                    : "bg-white/5 text-text/60 hover:bg-white/10"
                            )}
                        >
                            Week
                        </button>
                    </div>
                </div>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary/20 p-4">
                <div className="space-y-3">
                    {events.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative p-4 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-xl hover:border-secondary/30 hover:bg-white/10 transition-all cursor-pointer"
                        >
                            {/* Color Indicator */}
                            <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", event.color)} />

                            {/* Event Content */}
                            <div className="ml-3">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h4 className="text-sm font-semibold text-white">
                                        {event.title}
                                    </h4>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {event.isVirtual && (
                                            <div className="p-1 bg-secondary/20 rounded">
                                                <Video size={12} className="text-secondary" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-text/60">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>{event.time}</span>
                                        <span className="text-text/40">•</span>
                                        <span>{event.duration}</span>
                                    </div>

                                    {event.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} />
                                            <span>{event.location}</span>
                                        </div>
                                    )}

                                    {event.attendees && (
                                        <div className="flex items-center gap-1">
                                            <Users size={12} />
                                            <span>{event.attendees} attendees</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="px-3 py-1 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg text-xs font-medium transition-colors">
                                        Join
                                    </button>
                                    <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors">
                                        Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {events.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-text/40">
                        <Calendar size={40} className="mb-3 opacity-30" />
                        <p className="text-sm">No events scheduled</p>
                    </div>
                )}
            </div>

            {/* Quick Add Footer */}
            <div className="shrink-0 p-4 border-t border-white/5 bg-black/20">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group">
                    <Plus size={16} className="text-secondary" />
                    <span className="text-sm text-text/70 group-hover:text-white transition-colors">
                        Quick add event
                    </span>
                </button>
            </div>
        </div>
    );
};
