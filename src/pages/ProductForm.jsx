import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useBusiness, themeFor } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import ImageUploader from '../components/ImageUploader';

const ACCENT_BG = { yogart: 'bg-yogart', mk: 'bg-mk' };

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selected } = useBusiness();
  const { success, error: toastError } = useToast();
  const theme = themeFor(selected?.name);

  // Once a brand-new product is saved we keep the user on this screen and reveal
  // the photo uploader (images attach to an existing product id). `savedId`
  // tracks that just-created product so edit mode kicks in without a route change.
  const [savedId, setSavedId] = useState(null);
  const persistedId = id || savedId; // present in edit route OR right after create
  const isEdit = Boolean(id); // true only for the /edit route (drives initial load)
  const isPersisted = Boolean(persistedId); // product exists in the backend

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  // Dependent category selector: `topId` is the chosen top-level category and
  // `subId` the chosen sub-category (only relevant when the top-level has
  // children). The product's real categoryId is always a LEAF — the sub when
  // one exists, otherwise the top-level itself.
  const [topId, setTopId] = useState('');
  const [subId, setSubId] = useState('');
  // In edit mode the loaded product gives us a leaf categoryId; we reconcile it
  // into topId/subId once the category list has arrived.
  const [pendingCategoryId, setPendingCategoryId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [seasonTag, setSeasonTag] = useState('');
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  // Map of field -> message from ApiError.fieldErrors for inline validation.
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!selected) return;
    api.categories.list(selected.id).then(setCategories).catch((err) => toastError(err.message));
  }, [selected]);

  useEffect(() => {
    if (!isEdit) return;
    api.products
      .get(id)
      .then((p) => {
        setName(p.name);
        setProductCode(p.productCode ?? '');
        setPendingCategoryId(p.categoryId ?? '');
        setCostPrice(p.costPrice ?? '');
        setSellPrice(p.sellPrice ?? '');
        setSeasonTag(p.seasonTag ?? '');
        setImages(p.images ?? []);
      })
      .catch((err) => toastError(err.message));
  }, [id, isEdit]);

  // Reconcile a loaded product's leaf categoryId into the top/sub selectors once
  // categories are available. A leaf with a parent -> pick parent as top and the
  // leaf as sub; a top-level leaf -> just select it as top.
  useEffect(() => {
    if (!pendingCategoryId || categories.length === 0) return;
    const cat = categories.find((c) => c.id === Number(pendingCategoryId));
    if (!cat) return;
    if (cat.parentId) {
      setTopId(String(cat.parentId));
      setSubId(String(cat.id));
    } else {
      setTopId(String(cat.id));
      setSubId('');
    }
  }, [pendingCategoryId, categories]);

  // Derived tree pieces for the dependent selector.
  const roots = categories.filter((c) => !c.parentId);
  const subs = categories.filter((c) => c.parentId === Number(topId));
  const effectiveCategoryId = subs.length > 0 ? subId : topId;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        businessId: selected.id,
        categoryId: Number(effectiveCategoryId),
        name: name.trim() || null,
        productCode,
        costPrice: costPrice === '' ? null : Number(costPrice),
        sellPrice: sellPrice === '' ? null : Number(sellPrice),
        seasonTag: seasonTag || null,
      };
      const saved = isPersisted
        ? await api.products.update(persistedId, payload)
        : await api.products.create(payload);
      if (isPersisted) {
        // Existing product (edit route or already-saved new one): go to detail.
        success('Product updated.');
        navigate(`/products/${saved.id}`);
      } else {
        // Brand-new product: stay here, flip into edit mode, reveal the uploader.
        setSavedId(saved.id);
        setImages(saved.images ?? []);
        success('Product created — you can now add photos below.');
      }
    } catch (err) {
      // fieldErrors drive inline messages; the top-level message goes to a toast.
      setFieldErrors(err.fieldErrors || {});
      toastError(err.message || 'Something went wrong saving this product.');
    } finally {
      setSaving(false);
    }
  }

  if (!selected) return null;

  const fieldError = (name) =>
    fieldErrors[name] ? (
      <span className="text-xs text-red-600">{fieldErrors[name]}</span>
    ) : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-5">
        {isPersisted ? 'Edit product' : 'Add product'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Product code (SKU)</span>
          <input
            required
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
            placeholder="e.g. MK-01-J"
          />
          <span className="text-xs text-ink/50">
            Required, unique admin SKU for this product.
          </span>
          {fieldError('productCode')}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Name (optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
            placeholder="e.g. Krishna frame — medium"
          />
          <span className="text-xs text-ink/50">
            Optional — leave blank to identify the product by its code.
          </span>
          {fieldError('name')}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Category</span>
          <select
            required
            value={topId}
            onChange={(e) => {
              setTopId(e.target.value);
              setSubId(''); // reset sub-category when the top-level changes
            }}
            className="border border-line rounded-md px-3 py-2 bg-white"
          >
            <option value="" disabled>
              Choose a category
            </option>
            {roots.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldError('categoryId')}
        </label>

        {subs.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Sub-category</span>
            <select
              required
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              className="border border-line rounded-md px-3 py-2 bg-white"
            >
              <option value="" disabled>
                Choose a sub-category
              </option>
              {subs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-ink/50">
              This category has sub-categories — pick the one this product belongs to.
            </span>
          </label>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Cost price (₹)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="border border-line rounded-md px-3 py-2 bg-white"
            />
            {fieldError('costPrice')}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Sell price (₹)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="border border-line rounded-md px-3 py-2 bg-white"
            />
            {fieldError('sellPrice')}
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Season tag (optional)</span>
          <input
            value={seasonTag}
            onChange={(e) => setSeasonTag(e.target.value)}
            placeholder="e.g. Rakhi 2026 — leave blank for year-round items like jewelry"
            className="border border-line rounded-md px-3 py-2 bg-white"
          />
          {fieldError('seasonTag')}
        </label>

        {!isPersisted && (
          <p className="text-sm text-ink/50">
            Save the product first, then add photos below.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className={`text-white font-medium rounded-md px-4 py-2.5 mt-2 ${ACCENT_BG[theme.accent]}`}
        >
          {saving ? 'Saving…' : isPersisted ? 'Save changes' : 'Add product'}
        </button>
      </form>

      {/* Photos live OUTSIDE the product <form> so image/tag interactions (e.g.
          pressing Enter in a tag field) can never trigger a product save. */}
      {isPersisted && (
        <div className="mt-6">
          <span className="text-sm font-medium block mb-2">Photos</span>
          <ImageUploader productId={persistedId} images={images} onChange={setImages} />

          {savedId && (
            // Shown only right after an in-place create so the user can finish up.
            <button
              type="button"
              onClick={() => navigate(`/products/${savedId}`)}
              className="text-sm font-medium border border-line rounded-md px-4 py-2 mt-4"
            >
              Done — view product
            </button>
          )}
        </div>
      )}
    </div>
  );
}