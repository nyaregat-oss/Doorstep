'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastVariant = 'info' | 'success' | 'error';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  notify: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue>({ notify: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="ds-toast-stack" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`ds-toast ${toast.variant === 'error' ? 'is-error' : toast.variant === 'success' ? 'is-success' : ''}`}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              role={toast.variant === 'error' ? 'alert' : 'status'}
            >
              {toast.variant === 'success' ? (
                <CheckCircle2 size={18} aria-hidden="true" />
              ) : toast.variant === 'error' ? (
                <AlertCircle size={18} aria-hidden="true" />
              ) : (
                <Info size={18} aria-hidden="true" />
              )}
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button
                type="button"
                className="ds-password-toggle"
                style={{ position: 'static', flex: 'none' }}
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
              >
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
