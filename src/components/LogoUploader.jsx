import React, { useRef, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import BusinessLogo from './BusinessLogo';

/**
 * Logo upload/replace/remove control for a single business.
 *
 * Reused by SUPER_ADMIN (Businesses page, any business) and OWNER (their own
 * business settings). Backend authorization enforces who may change what; this
 * is purely the UI. On any change it calls `onUpdated(updatedBusiness)` with the
 * fresh business payload (including the new logoUrl) so callers can refresh.
 *
 * Props:
 *   - business     { id, name, logoUrl }
 *   - onUpdated    (updatedBusiness) => void
 *   - size         Tailwind classes for the preview (default h-16 w-16 rounded-xl)
 *   - showHint     show the "PNG, JPG…" helper line (default true)
 *   - showPreview  show the logo thumbnail next to the buttons (default true).
 *                  Set false when the caller already renders the logo elsewhere.
 */
export default function LogoUploader({
  business,
  onUpdated,
  size = 'h-16 w-16 rounded-xl',
  showHint = true,
  showPreview = true
}) {
  const { success, error: toastError } = useToast();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handlePick(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('Please choose an image file.');
      return;
    }
    setBusy(true);
    try {
      const updated = await api.businesses.uploadLogo(business.id, file);
      onUpdated?.(updated);
      success('Logo updated.');
    } catch (err) {
      toastError(err.message || 'Could not upload the logo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      const updated = await api.businesses.removeLogo(business.id);
      onUpdated?.(updated);
      success('Logo removed.');
    } catch (err) {
      toastError(err.message || 'Could not remove the logo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {showPreview && (
        <BusinessLogo name={business.name} logoUrl={business.logoUrl} className={size} />
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink/50 mr-1">Logo</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="iv-btn iv-btn-ghost !px-3 !py-1.5 text-xs"
          >
            {busy ? (
              <>
                <span className="iv-spinner h-3.5 w-3.5" />
                Working…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">upload</span>
                {business.logoUrl ? 'Replace logo' : 'Upload logo'}
              </>
            )}
          </button>
          {business.logoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="iv-btn iv-btn-ghost !px-3 !py-1.5 text-xs !text-red-600 !border-red-200"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Remove
            </button>
          )}
        </div>
        {showHint && (
          <p className="text-[11px] text-ink/45">PNG, JPG or SVG. Square images look best.</p>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handlePick}
      />
    </div>
  );
}
