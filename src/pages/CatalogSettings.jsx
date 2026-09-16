import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { usePrompt } from '../context/PromptContext';
import AuditMeta from '../components/AuditMeta';

/**
 * Category administration for write-capable roles (OWNER / SUPER_ADMIN).
 * Categories are always scoped to the business currently selected in the header
 * switcher — there is no cross-business editing here. Business creation lives on
 * its own SUPER_ADMIN-only page (/businesses). Route is gated with requireWrite
 * + requireBusiness, so no in-component role checks are needed.
 */
export default function CatalogSettings() {
  const { selected, selectedId } = useBusiness();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();
  const prompt = usePrompt();

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loadingCats, setLoadingCats] = useState(false);

  function loadCategories() {
    if (!selectedId) {
      setCategories([]);
      return;
    }
    setLoadingCats(true);
    api.categories
      .list(selectedId)
      .then(setCategories)
      .catch((err) => toastError(err.message))
      .finally(() => setLoadingCats(false));
  }

  useEffect(loadCategories, [selectedId]);

  // Build the two-level tree from the flat list the API returns.
  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (parentId) => categories.filter((c) => c.parentId === parentId);

  // ---- Categories ----------------------------------------------------------
  async function createCategory(e) {
    e.preventDefault();
    try {
      const c = await api.categories.create({
        businessId: Number(selectedId),
        name: newCategory,
      });
      setCategories((list) => [...list, c]);
      setNewCategory('');
      success('Category created.');
    } catch (err) {
      toastError(err.message);
    }
  }

  async function addSubCategory(parent) {
    const name = await prompt({
      title: `Add sub-category under "${parent.name}"`,
      label: 'Sub-category name',
      confirmLabel: 'Add',
    });
    if (!name) return;
    try {
      const c = await api.categories.create({
        businessId: Number(selectedId),
        name,
        parentId: parent.id,
      });
      // Refresh so parent.hasChildren reflects its new child.
      setCategories((list) =>
        [...list, c].map((x) => (x.id === parent.id ? { ...x, hasChildren: true } : x)),
      );
      success('Sub-category created.');
    } catch (err) {
      toastError(err.message);
    }
  }

  async function renameCategory(c) {
    const name = await prompt({
      title: 'Rename category',
      label: 'Category name',
      defaultValue: c.name,
      confirmLabel: 'Rename',
    });
    if (!name || name === c.name) return;
    try {
      const updated = await api.categories.update(c.id, {
        businessId: Number(selectedId),
        name,
        parentId: c.parentId ?? null, // preserve nesting on rename
      });
      setCategories((list) => list.map((x) => (x.id === c.id ? updated : x)));
      success('Category renamed.');
    } catch (err) {
      toastError(err.message);
    }
  }

  async function deleteCategory(c) {
    const ok = await confirm({
      title: 'Delete category',
      message: `Delete "${c.name}"? This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.categories.remove(c.id);
      setCategories((list) => list.filter((x) => x.id !== c.id));
      success('Category deleted.');
    } catch (err) {
      toastError(err.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold">
          Categories
          {selected && <span className="text-ink/50 text-base font-normal"> · {selected.name}</span>}
        </h1>
        <p className="text-sm text-ink/60 mt-1">
          Categories belong to the business you're currently working on. Switch
          businesses from the header to manage another one's categories.
        </p>
      </header>

      {!selectedId ? (
        <p className="text-sm text-ink/50">
          Pick a business first to manage its categories.{' '}
          <Link to="/select-business" className="underline">
            Select a business
          </Link>
          .
        </p>
      ) : (
        <>
          <form onSubmit={createCategory} className="flex gap-2 mb-5">
            <input
              required
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="border border-line rounded-md px-3 py-2 flex-1 bg-white text-sm"
            />
            <button className="bg-ink text-white text-sm font-medium rounded-md px-4 py-2">
              Add category
            </button>
          </form>
          {loadingCats ? (
            <p className="text-ink/60 text-sm">Loading…</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {roots.map((c) => {
                const kids = childrenOf(c.id);
                return (
                  <li
                    key={c.id}
                    className="bg-white border border-line rounded-lg px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex flex-col gap-1 min-w-0">
                        <span className="font-medium">{c.name}</span>
                        <AuditMeta entity={c} variant="inline" />
                      </span>
                      <span className="flex gap-3">
                        <button
                          onClick={() => addSubCategory(c)}
                          className="text-ink/60 hover:text-ink"
                        >
                          + Sub
                        </button>
                        <button onClick={() => renameCategory(c)} className="text-ink/60 hover:text-ink">
                          Rename
                        </button>
                        <button onClick={() => deleteCategory(c)} className="text-red-600 hover:text-red-700">
                          Delete
                        </button>
                      </span>
                    </div>

                    {kids.length > 0 && (
                      <ul className="mt-2 ml-4 pl-3 border-l border-line flex flex-col gap-1.5">
                        {kids.map((sub) => (
                          <li
                            key={sub.id}
                            className="flex items-center justify-between py-1"
                          >
                            <span className="flex flex-col gap-1 min-w-0">
                              <span className="text-ink/80">{sub.name}</span>
                              <AuditMeta entity={sub} variant="inline" />
                            </span>
                            <span className="flex gap-3">
                              <button
                                onClick={() => renameCategory(sub)}
                                className="text-ink/60 hover:text-ink"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => deleteCategory(sub)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
              {roots.length === 0 && (
                <p className="text-sm text-ink/50">No categories yet.</p>
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
