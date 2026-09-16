import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { usePrompt } from '../context/PromptContext';
import AuditMeta from '../components/AuditMeta';

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
      message: `Delete "${b.name}"? This can't be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await api.businesses.remove(b.id);
      await refresh();
      success('Business deleted.');
    } catch (err) {
      toastError(err.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold">Businesses</h1>
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
          className="border border-line rounded-md px-3 py-2 flex-1 bg-white text-sm"
        />
        <button
          disabled={saving}
          className="bg-ink text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add business'}
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {list.map((b) => {
          const isSelected = String(b.id) === String(selectedId);
          return (
            <li
              key={b.id}
              className={`bg-white border rounded-lg px-3 py-2.5 flex items-center justify-between text-sm ${
                isSelected ? 'border-ink' : 'border-line'
              }`}
            >
              <span className="flex flex-col gap-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-medium">{b.name}</span>
                  {isSelected && (
                    <span className="text-xs text-white bg-ink rounded-full px-2 py-0.5">
                      Working on
                    </span>
                  )}
                </span>
                <AuditMeta entity={b} variant="inline" />
              </span>
              <span className="flex gap-3">
                {!isSelected && (
                  <button
                    onClick={() => setSelectedId(b.id)}
                    className="text-ink/70 hover:text-ink"
                  >
                    Work on this
                  </button>
                )}
                <button onClick={() => renameBusiness(b)} className="text-ink/60 hover:text-ink">
                  Rename
                </button>
                <button onClick={() => deleteBusiness(b)} className="text-red-600 hover:text-red-700">
                  Delete
                </button>
              </span>
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
