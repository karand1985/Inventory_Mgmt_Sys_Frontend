import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { usePrompt } from '../context/PromptContext';
import AuditMeta from '../components/AuditMeta';
import LogoUploader from '../components/LogoUploader';
import BusinessLogo from '../components/BusinessLogo';

/**
 * Business administration — SUPER_ADMIN only (route gated with requireSuperAdmin).
 * Create / rename / delete businesses. Any mutation calls the shared
 * BusinessContext.refresh() so the roster and the header switcher update live,
 * no page reload required. A convenience "Work on this" action selects the
 * business so categories/products screens act on it immediately.
 */
export default function Businesses() {
  const { businesses, selectedId, setSelectedId, refresh } = useBusiness();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();
  const prompt = usePrompt();

  const [list, setList] = useState([]);
  const [newBusiness, setNewBusiness] = useState('');
  const [saving, setSaving] = useState(false);

  // Mirror the context roster locally so edits reflect instantly.
  useEffect(() => {
    setList(businesses);
  }, [businesses]);

  async function createBusiness(e) {
    e.preventDefault();
    const name = newBusiness.trim();
    if (!name) return;
    setSaving(true);
    try {
      const created = await api.businesses.create({ name });
      setNewBusiness('');
      await refresh();
      // Select the freshly created business so the admin can start adding
      // categories/products to it right away.
      setSelectedId(created.id);
      success(`"${created.name}" created and selected.`);
    } catch (err) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function renameBusiness(b) {
    const name = await prompt({
      title: 'Rename business',
      label: 'Business name',
      defaultValue: b.name,
      confirmLabel: 'Rename',
    });
    if (!name || name.trim() === b.name) return;
    try {
      await api.businesses.update(b.id, { name: name.trim() });
      await refresh();
      success('Business renamed.');
    } catch (err) {
      toastError(err.message);
    }
  }

  async function deleteBusiness(b) {
    const ok = await confirm({
      title: 'Delete business',
      message:
        `This permanently removes "${b.name}" with its products, categories, ` +
        `images, logo, and its owner/viewer user accounts. This can't be undone.`,
      challenge: b.name,
      confirmLabel: 'Delete everything',
    });
    if (!ok) return;
    try {
      await api.businesses.remove(b.id);
      await refresh();
      success('Business and all its data deleted.');
    } catch (err) {
      toastError(err.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 iv-page-in">
      <header className="mb-5">
        <h1 className="iv-display text-2xl font-extrabold">Businesses</h1>
        <p className="text-sm text-ink/60 mt-1">
          Create and manage businesses. Select one to work on — categories and
          products you add will belong to the selected business.
        </p>
      </header>

      <form onSubmit={createBusiness} className="flex gap-2 mb-6">
        <input
          required
          value={newBusiness}
          onChange={(e) => setNewBusiness(e.target.value)}
          placeholder="New business name"
          className="iv-input flex-1"
        />
        <button disabled={saving} className="iv-btn iv-btn-primary shrink-0">
          {saving ? (
            <>
              <span className="iv-spinner h-4 w-4" />
              Adding…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              Add business
            </>
          )}
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {list.map((b, i) => {
          const isSelected = String(b.id) === String(selectedId);
          return (
            <li
              key={b.id}
              className={`iv-card iv-stagger p-4 flex flex-col gap-2.5 text-sm ${
                isSelected ? '!border-[rgb(var(--iv-accent))]' : ''
              }`}
              style={{ '--i': i }}
            >
              {/* Header: logo + name on the left, actions on the right */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <BusinessLogo
                    name={b.name}
                    logoUrl={b.logoUrl}
                    className="h-11 w-11 rounded-lg shrink-0"
                  />
                  <span className="font-semibold truncate flex items-center gap-2 min-w-0">
                    <span className="truncate">{b.name}</span>
                    {isSelected && (
                      <span className="iv-badge text-white shrink-0" style={{ backgroundColor: 'rgb(var(--iv-accent))' }}>
                        <span className="iv-status-dot h-1.5 w-1.5" style={{ backgroundColor: 'currentColor' }} />
                        Working on
                      </span>
                    )}
                  </span>
                </div>
                <span className="flex gap-3 shrink-0">
                  {!isSelected && (
                    <button
                      onClick={() => setSelectedId(b.id)}
                      className="text-ink/70 hover:text-ink font-medium transition-colors"
                    >
                      Work on this
                    </button>
                  )}
                  <button onClick={() => renameBusiness(b)} className="text-ink/60 hover:text-ink transition-colors">
                    Rename
                  </button>
                  <button onClick={() => deleteBusiness(b)} className="text-red-600 hover:text-red-700 transition-colors">
                    Delete
                  </button>
                </span>
              </div>

              {/* Audit meta — full width so it never gets squeezed into a column */}
              <AuditMeta entity={b} variant="inline" />

              {/* Branding — its own row so the logo controls never crowd the name */}
              <div className="pt-2.5 border-t border-line/60">
                <LogoUploader
                  business={b}
                  onUpdated={() => refresh()}
                  showPreview={false}
                  showHint={false}
                />
              </div>
            </li>
          );
        })}
        {list.length === 0 && (
          <p className="text-sm text-ink/50">No businesses yet. Add one above.</p>
        )}
      </ul>
    </div>
  );
}
