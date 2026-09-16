import React, { useCallback, useEffect } from 'react';

/**
 * Full-screen image viewer with prev/next navigation.
 *
 * Props:
 *   images    - array of { id, imageUrl, tags? }
 *   index     - index of the image currently shown (controlled)
 *   onIndex   - (nextIndex) => void; called when the user navigates
 *   onClose   - () => void; called when the viewer should close
 *
 * Rendering nothing when index is null keeps the viewer closed.
 */
export default function Lightbox({ images, index, onIndex, onClose }) {
  const isOpen = index != null && images && images.length > 0;
  const count = images?.length ?? 0;

  const goPrev = useCallback(() => {
    if (!count) return;
    onIndex((index - 1 + count) % count);
  }, [index, count, onIndex]);

  const goNext = useCallback(() => {
    if (!count) return;
    onIndex((index + 1) % count);
  }, [index, count, onIndex]);

  // Keyboard navigation: Esc closes, arrows move.
  useEffect(() => {
    if (!isOpen) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, goPrev, goNext]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const current = images[index];
  const hasMultiple = count > 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-white/90 hover:text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
      >
        ×
      </button>

      {/* Counter */}
      {hasMultiple && (
        <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/80 text-sm">
          {index + 1} / {count}
        </span>
      )}

      {/* Prev */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Previous image"
          className="absolute left-3 sm:left-6 text-white/90 hover:text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          ‹
        </button>
      )}

      {/* Image + tags */}
      <figure
        className="max-w-[92vw] max-h-[88vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.imageUrl}
          alt=""
          className="max-w-[92vw] max-h-[80vh] object-contain rounded-md shadow-2xl"
        />
        {(current.tags ?? []).length > 0 && (
          <figcaption className="mt-3 flex flex-wrap gap-1.5 justify-center">
            {current.tags.map((t) => (
              <span
                key={t}
                className="text-xs bg-white/15 text-white rounded-full px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </figcaption>
        )}
      </figure>

      {/* Next */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Next image"
          className="absolute right-3 sm:right-6 text-white/90 hover:text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          ›
        </button>
      )}
    </div>
  );
}
