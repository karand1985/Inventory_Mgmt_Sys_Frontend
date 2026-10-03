import React from 'react';

/**
 * Business logo display with a graceful fallback.
 *
 * Shows the uploaded Cloudinary logo when `logoUrl` is present; otherwise a
 * branded gradient tile with the business's first initial. Sizing is driven by
 * the `className` (pass height/width utilities), so it drops into the navbar,
 * dashboard header, switcher rows, etc. The gradient uses the active accent
 * tokens (--iv-accent), so it matches whichever business theme is live.
 *
 * Props:
 *   - name      business name (for the initial + alt text)
 *   - logoUrl   secure Cloudinary URL, or null/undefined
 *   - className Tailwind sizing/shape classes (default: h-8 w-8 rounded-lg)
 */
export default function BusinessLogo({ name, logoUrl, className = 'h-8 w-8 rounded-lg' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name ? `${name} logo` : 'Business logo'}
        className={`${className} object-cover bg-white border border-line/70 shadow-soft`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${className} grid place-items-center text-white font-extrabold shadow-soft select-none`}
      style={{
        backgroundImage: 'linear-gradient(135deg, rgb(var(--iv-accent)), rgb(var(--iv-accent-dark)))',
        fontFamily: 'Manrope, "Work Sans", system-ui, sans-serif'
      }}
    >
      {initial}
    </span>
  );
}
