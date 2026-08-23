import React, { createContext, useCallback, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const META: Record<ToastType, { icon: typeof CheckCircle2; cls: string; iconCls: string }> = {
  success: {
    icon: CheckCircle2,
    cls: 'bg-[#1a2a1f] border-emerald-500/40 text-emerald-300',
    iconCls: 'text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    cls: 'bg-[#2a1518] border-[#ff3650]/50 text-[#ffb3bd]',
    iconCls: 'text-[#ff3650]',
  },
  info: {
    icon: Info,
    cls: 'bg-[#181a2a] border-blue-500/40 text-blue-300',
    iconCls: 'text-blue-400',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const api: ToastApi = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-2.5 pointer-events-none">
        <AnimatePresence>
          {items.map((t) => {
            const meta = META[t.type];
            const Icon = meta.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 48, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 48, scale: 0.92 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-sm font-bold max-w-xs ${meta.cls}`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${meta.iconCls}`} />
                <span className="leading-snug">{t.message}</span>
                <button
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                  className="ml-1 opacity-50 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                  aria-label="关闭"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
