import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useBusiness, themeFor } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import ImageUploader from '../components/ImageUploader';

const ACCENT_BG = { yogart: 'bg-yogart', mk: 'bg-mk' };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { selected } = useBusiness();
  const { success, error: toastError } = useToast();
  const theme = themeFor(selected?.name);

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
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
        setCategoryId(p.categoryId ?? '');
        setCostPrice(p.costPrice ?? '');
        setSellPrice(p.sellPrice ?? '');
        setSeasonTag(p.seasonTag ?? '');
        setImages(p.images ?? []);
      })
      .catch((err) => toastError(err.message));
  }, [id, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        businessId: selected.id,
        categoryId: Number(categoryId),
        name,
        productCode,
        costPrice: costPrice === '' ? null : Number(costPrice),
        sellPrice: sellPrice === '' ? null : Number(sellPrice),
        seasonTag: seasonTag || null,
      };
      const saved = isEdit
        ? await api.products.update(id, payload)
        : await api.products.create(payload);
      success(isEdit ? 'Product updated.' : 'Product created.');
      navigate(`/products/${saved.id}`);
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
        {isEdit ? 'Edit product' : 'Add product'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
            placeholder="e.g. Krishna frame — medium"
          />
          {fieldError('name')}
        </label>

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
          <span className="text-sm font-medium">Category</span>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldError('categoryId')}
        </label>

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

        {isEdit && (
          <div>
            <span className="text-sm font-medium block mb-2">Photos</span>
            <ImageUploader productId={id} images={images} onChange={setImages} />
          </div>
        )}
        {!isEdit && (
          <p className="text-sm text-ink/50">
            Save the product first, then add photos on its detail page.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className={`text-white font-medium rounded-md px-4 py-2.5 mt-2 ${ACCENT_BG[theme.accent]}`}
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
        </button>
      </form>
    </div>
  );
}