'use client';

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ds-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ds-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            className="ds-modal-card"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <div className="ds-modal-head">
              <div>
                <h2 id="ds-modal-title" style={{ fontSize: '1.3rem' }}>
                  {title}
                </h2>
                {description && (
                  <p className="ds-muted" style={{ marginTop: 6, fontSize: '0.94rem' }}>
                    {description}
                  </p>
                )}
              </div>
              <button type="button" className="ds-icon-btn" aria-label="Close modal" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            {children}
            {footer && <div className="ds-modal-actions">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
