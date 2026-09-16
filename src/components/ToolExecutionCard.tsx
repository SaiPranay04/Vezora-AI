import { motion } from 'framer-motion';
import { Wrench, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ToolRunInfo {
  name: string;
  status: 'ok' | 'error' | 'pending_confirmation' | 'cancelled' | 'running';
  preview?: string;
  error?: string;
  pendingId?: string;
  result?: unknown;
}

interface ToolExecutionCardProps {
  tool: ToolRunInfo;
  onConfirm?: (pendingId: string) => void;
  onCancel?: (pendingId: string) => void;
}

const statusMeta = {
  ok: { icon: CheckCircle2, label: 'Done', color: 'text-green-400 border-green-500/20 bg-green-500/10' },
  error: { icon: XCircle, label: 'Failed', color: 'text-red-400 border-red-500/20 bg-red-500/10' },
  pending_confirmation: { icon: Clock, label: 'Needs confirm', color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-text/50 border-white/10 bg-white/5' },
  running: { icon: Loader2, label: 'Running', color: 'text-secondary border-secondary/20 bg-secondary/10' }
} as const;

export function ToolExecutionCard({ tool, onConfirm, onCancel }: ToolExecutionCardProps) {
  const meta = statusMeta[tool.status] || statusMeta.running;
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('mt-2 rounded-xl border p-3 text-xs', meta.color)}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Wrench size={12} />
        <span className="font-mono font-medium">{tool.name}</span>
        <span className="ml-auto flex items-center gap-1 opacity-80">
          <Icon size={12} className={tool.status === 'running' ? 'animate-spin' : ''} />
          {meta.label}
        </span>
      </div>
      {tool.preview && (
        <p className="font-mono text-[10px] opacity-70 break-all mb-2">{tool.preview}</p>
      )}
      {tool.error && <p className="text-red-300/90">{tool.error}</p>}
      {tool.status === 'pending_confirmation' && tool.pendingId && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onConfirm?.(tool.pendingId!)}
            className="px-2.5 py-1 rounded-lg bg-primary/70 hover:bg-primary text-white text-[10px]"
          >
            Allow
          </button>
          <button
            onClick={() => onCancel?.(tool.pendingId!)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px]"
          >
            Deny
          </button>
        </div>
      )}
    </motion.div>
  );
}
