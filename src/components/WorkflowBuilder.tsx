import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Trash2, Edit2, Save, Zap, ChevronDown, ChevronRight } from 'lucide-react';

interface WorkflowStep {
    id: string;
    action: string;
    params: Record<string, any>;
    description: string;
}

interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    trigger?: string;
    isActive: boolean;
}

export const WorkflowBuilder = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([
        {
            id: '1',
            name: 'Morning Routine',
            description: 'Open apps and check daily tasks',
            trigger: 'Every day at 9:00 AM',
            isActive: true,
            steps: [
                { id: 's1', action: 'Open VS Code', params: {}, description: 'Launch development environment' },
                { id: 's2', action: 'Check Calendar', params: {}, description: 'Review today\'s schedule' },
                { id: 's3', action: 'Read Emails', params: { unread: true }, description: 'Check unread messages' }
            ]
        },
        {
            id: '2',
            name: 'End of Day Backup',
            description: 'Save and organize files',
            trigger: 'Every day at 6:00 PM',
            isActive: true,
            steps: [
                { id: 's4', action: 'Close Apps', params: {}, description: 'Close all development tools' },
                { id: 's5', action: 'Backup Files', params: { location: 'D:/Backups' }, description: 'Save important files' }
            ]
        }
    ]);

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const toggleWorkflow = (id: string) => {
        setWorkflows(workflows.map(w => 
            w.id === id ? { ...w, isActive: !w.isActive } : w
        ));
    };

    const runWorkflow = (workflow: Workflow) => {
        console.log('Running workflow:', workflow.name);
        // In Tauri: invoke('run_workflow', { workflowId: workflow.id })
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="text-primary" size={20} />
                        Workflows & Macros
                    </h3>
                    <p className="text-xs text-text/50 mt-1">Automate repetitive tasks</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm font-medium"
                >
                    <Plus size={16} />
                    New Workflow
                </motion.button>
            </div>

            {/* Workflows List */}
            <div className="space-y-3">
                {workflows.map((workflow, index) => (
                    <motion.div
                        key={workflow.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-transparent"
                    >
                        {/* Workflow Header */}
                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => setExpandedId(expandedId === workflow.id ? null : workflow.id)}
                                    className="mt-1 text-text/60 hover:text-primary transition-colors"
                                >
                                    {expandedId === workflow.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-semibold">{workflow.name}</h4>
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                            workflow.isActive 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : 'bg-white/10 text-text/50'
                                        }`}>
                                            {workflow.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                    <p className="text-xs text-text/60 mb-2">{workflow.description}</p>
                                    {workflow.trigger && (
                                        <div className="flex items-center gap-2 text-xs text-text/40">
                                            <Zap size={12} className="text-primary" />
                                            <span>Trigger: {workflow.trigger}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => runWorkflow(workflow)}
                                        className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg"
                                        title="Run workflow"
                                    >
                                        <Play size={16} />
                                    </motion.button>
                                    <button
                                        onClick={() => toggleWorkflow(workflow.id)}
                                        className={`w-10 h-5 rounded-full transition-colors ${
                                            workflow.isActive ? 'bg-green-500/20' : 'bg-white/10'
                                        } relative`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${
                                            workflow.isActive ? 'right-1' : 'left-1'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Workflow Steps */}
                        <AnimatePresence>
                            {expandedId === workflow.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-white/5 bg-black/20"
                                >
                                    <div className="p-4 space-y-2">
                                        {workflow.steps.map((step, idx) => (
                                            <div
                                                key={step.id}
                                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{step.action}</p>
                                                    <p className="text-xs text-text/50">{step.description}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button className="p-1.5 hover:bg-white/10 rounded">
                                                        <Edit2 size={14} className="text-text/60" />
                                                    </button>
                                                    <button className="p-1.5 hover:bg-red-500/20 rounded">
                                                        <Trash2 size={14} className="text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="w-full p-2 border border-dashed border-white/10 rounded-lg hover:border-primary/30 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm text-text/60">
                                            <Plus size={14} />
                                            Add Step
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Quick Macros */}
            <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-semibold text-text/50 uppercase tracking-wider mb-3">
                    Quick Macros
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {['Focus Mode', 'Break Time', 'Deep Work', 'Meeting Prep'].map((macro) => (
                        <button
                            key={macro}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all group"
                        >
                            <span className="block font-medium mb-1">{macro}</span>
                            <span className="text-xs text-text/50 group-hover:text-primary transition-colors">Click to run</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
