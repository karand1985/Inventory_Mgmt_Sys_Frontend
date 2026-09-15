import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';

/**
 * Catalog administration for write-capable roles (OWNER / SUPER_ADMIN):
 *  - Businesses: create / rename / delete
 *  - Categories: per selected business, create / rename / delete
 * Route is gated with requireWrite, so no in-component role checks are needed.
 */
export default function CatalogSettings() {
  const { businesses, selected, selectedId } = useBusiness();
  const { success, error: toastError } = useToast();

  const [localBusinesses, setLocalBusinesses] = useState([]);
  const [newBusiness, setNewBusiness] = useState('');

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loadingCats, setLoadingCats] = useState(false);

  // Seed from context, then keep our own list so edits reflect immediately.
  useEffect(() => {
    setLocalBusinesses(businesses);
  }, [businesses]);

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

  // ---- Businesses ----------------------------------------------------------
  async function createBusiness(e) {
    e.preventDefault();
    try {
      const b = await api.businesses.create({ name: newBusiness });
      setLocalBusinesses((list) => [...list, b]);
      setNewBusiness('');
      success('Business created. Reload to switch to it.');
    } catch (err) {
      toastError(err.message);
    }
  }

  async function renameBusiness(b) {
    const name = prompt('Rename business', b.name);
    if (!name || name === b.name) return;
    try {
      const updated = await api.businesses.update(b.id, { name });
      setLocalBusinesses((list) => list.map((x) => (x.id === b.id ? updated : x)));
      success('Business renamed.');
    } catch (err) {
      toastError(err.message);
    }
  }

  async function deleteBusiness(b) {
    if (!confirm(`Delete "${b.name}"? This can't be undone.`)) return;
    try {
      await api.businesses.remove(b.id);
      setLocalBusinesses((list) => list.filter((x) => x.id !== b.id));
      success('Business deleted.');
    } catch (err) {
      toastError(err.message);
    }
  }

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

  async function renameCategory(c) {
    const name = prompt('Rename category', c.name);
    if (!name || name === c.name) return;
    try {
      const updated = await api.categories.update(c.id, {
        businessId: Number(selectedId),
        name,
      });
      setCategories((list) => list.map((x) => (x.id === c.id ? updated : x)));
      success('Category renamed.');
    } catch (err) {
      toastError(err.message);
    }
  }

  async function deleteCategory(c) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try {
      await api.categories.remove(c.id);
      setCategories((list) => list.filter((x) => x.id !== c.id));
      success('Category deleted.');
    } catch (err) {
      toastError(err.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 grid sm:grid-cols-2 gap-8">
      {/* Businesses */}
      <section>
        <h1 className="text-xl font-semibold mb-4">Businesses</h1>
        <form onSubmit={createBusiness} className="flex gap-2 mb-4">
          <input
            required
            value={newBusiness}
            onChange={(e) => setNewBusiness(e.target.value)}
            placeholder="New business name"
            className="border border-line rounded-md px-3 py-2 flex-1 bg-white text-sm"
          />
          <button className="bg-ink text-white text-sm font-medium rounded-md px-3 py-2">
            Add
          </button>
        </form>
        <ul className="flex flex-col gap-2">
          {localBusinesses.map((b) => (
            <li
              key={b.id}
              className="bg-white border border-line rounded-lg px-3 py-2 flex items-center justify-between text-sm"
            >
              <span>{b.name}</span>
              <span className="flex gap-2">
                <button onClick={() => renameBusiness(b)} className="text-ink/60 hover:text-ink">
                  Rename
                </button>
                <button onClick={() => deleteBusiness(b)} className="text-red-600">
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories for the selected business */}
      <section>
        <h1 className="text-xl font-semibold mb-4">
          Categories
          {selected && <span className="text-ink/50 text-sm"> · {selected.name}</span>}
        </h1>
        {!selectedId ? (
          <p className="text-sm text-ink/50">Pick a business first to manage its categories.</p>
        ) : (
          <>
            <form onSubmit={createCategory} className="flex gap-2 mb-4">
              <input
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="border border-line rounded-md px-3 py-2 flex-1 bg-white text-sm"
              />
              <button className="bg-ink text-white text-sm font-medium rounded-md px-3 py-2">
                Add
              </button>
            </form>
            {loadingCats ? (
              <p className="text-ink/60 text-sm">Loading…</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="bg-white border border-line rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                  >
                    <span>{c.name}</span>
                    <span className="flex gap-2">
                      <button onClick={() => renameCategory(c)} className="text-ink/60 hover:text-ink">
                        Rename
                      </button>
                      <button onClick={() => deleteCategory(c)} className="text-red-600">
                        Delete
                      </button>
                    </span>
                  </li>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-ink/50">No categories yet.</p>
                )}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
