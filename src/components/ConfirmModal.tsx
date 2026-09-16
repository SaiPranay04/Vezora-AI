import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  preview: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = 'Confirm action',
  preview,
  confirmLabel = 'Allow',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-5 shadow-2xl"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-text">{title}</h3>
              </div>
              <button
                onClick={onCancel}
                className="p-1 rounded-lg hover:bg-white/10 text-text/50"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-text/50 mb-2">This action needs your approval:</p>
            <pre className="text-xs font-mono bg-black/40 border border-white/10 rounded-xl p-3 overflow-x-auto text-secondary whitespace-pre-wrap break-all">
              {preview}
            </pre>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-xs rounded-xl bg-primary/80 hover:bg-primary text-white border border-primary/40"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
