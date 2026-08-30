import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Styled confirmation dialog — replaces native window.confirm/alert. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  danger = true,
  onConfirm,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm bg-white border border-black/20 rounded-3xl p-6 space-y-4 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                danger ? 'bg-[#ff3650]/15 text-[#ff3650] border border-[#ff3650]/30' : 'bg-white/10 text-white border border-black/10'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-black text-white text-base leading-snug">{title}</h3>
            </div>
            {description && <p className="text-sm text-black/60 leading-relaxed">{description}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-black/60 hover:text-white border border-black/15 transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer shadow-lg ${
                  danger
                    ? 'bg-[#ff3650] hover:bg-[#ff203c] text-white'
                    : 'bg-white hover:bg-white/90 text-[#181818]'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
