'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';

export type GalleryItem = {
  id: string;
  url: string;
  caption?: string;
};

export function PortfolioLightbox({
  items,
  businessName,
}: {
  items: GalleryItem[];
  businessName: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowRight') {
        setActiveIndex((idx) => (idx === null ? null : (idx + 1) % items.length));
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((idx) => (idx === null ? null : (idx - 1 + items.length) % items.length));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, items.length]);

  const current = activeIndex !== null ? items[activeIndex] : null;

  return (
    <>
      <div className="ds-gallery-grid">
        {items.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            className="ds-gallery-item"
            onClick={() => setActiveIndex(idx)}
            aria-label={`View portfolio image ${idx + 1}${item.caption ? `: ${item.caption}` : ''}`}
          >
            <div style={{ position: 'relative', aspectRatio: '4 / 3', width: '100%' }}>
              <Image
                src={item.url}
                alt={item.caption || `${businessName} portfolio work ${idx + 1}`}
                fill
                unoptimized={item.url.startsWith('http')}
                sizes="(max-width: 640px) 50vw, 220px"
                style={{ objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  background: 'rgba(16, 29, 43, 0.78)',
                  color: '#fff',
                  borderRadius: 6,
                  padding: 5,
                  display: 'inline-flex',
                }}
                aria-hidden="true"
              >
                <Expand size={14} />
              </span>
            </div>
            {item.caption && <div className="ds-gallery-caption">{item.caption}</div>}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            className="ds-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Portfolio image viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setActiveIndex(null);
            }}
          >
            <motion.div
              className="ds-modal-card"
              style={{ width: 'min(780px, 100%)', padding: 18 }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ds-modal-head">
                <div>
                  <strong style={{ display: 'block' }}>{businessName}</strong>
                  <span className="ds-muted" style={{ fontSize: '0.86rem' }}>
                    Photo {(activeIndex ?? 0) + 1} of {items.length}
                  </span>
                </div>
                <button
                  type="button"
                  className="ds-icon-btn"
                  aria-label="Close image viewer"
                  onClick={() => setActiveIndex(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 'min(62vh, 520px)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'var(--bg-elevated)',
                }}
              >
                <Image
                  src={current.url}
                  alt={current.caption || `${businessName} portfolio work`}
                  fill
                  unoptimized={current.url.startsWith('http')}
                  sizes="780px"
                  style={{ objectFit: 'contain' }}
                />
              </div>

              <div className="ds-actions-row" style={{ justifyContent: 'space-between' }}>
                <p className="ds-muted" style={{ fontSize: '0.92rem' }}>
                  {current.caption || 'Work portfolio photo'}
                </p>
                {items.length > 1 && (
                  <div className="ds-actions-row">
                    <button
                      type="button"
                      className="ds-btn ds-btn-secondary ds-btn-sm"
                      aria-label="Previous photo"
                      onClick={() =>
                        setActiveIndex((idx) => (idx === null ? 0 : (idx - 1 + items.length) % items.length))
                      }
                    >
                      <ChevronLeft size={15} />
                      Prev
                    </button>
                    <button
                      type="button"
                      className="ds-btn ds-btn-secondary ds-btn-sm"
                      aria-label="Next photo"
                      onClick={() => setActiveIndex((idx) => (idx === null ? 0 : (idx + 1) % items.length))}
                    >
                      Next
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
