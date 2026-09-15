import React, { useRef, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

/**
 * Multi-photo uploader for a product.
 *
 *  - Uploads go to POST /products/{id}/images/upload (Cloudinary) with optional
 *    comma-separated tags applied to every file in the batch.
 *  - There is no bulk "reorder" endpoint; ordering is persisted per-image via
 *    PUT /products/{id}/images/{imageId} by swapping adjacent sortOrder values.
 *  - The first image (index 0) is treated as the cover photo.
 */
export default function ImageUploader({ productId, images, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [busyId, setBusyId] = useState(null);
  const fileInputRef = useRef(null);
  const { error: toastError, success } = useToast();

  async function handleFiles(fileList) {
    setUploading(true);
    try {
      const files = Array.from(fileList);
      const tags = tagInput.trim() || undefined;
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        // Uploaded one at a time to keep progress simple; Cloudinary supports
        // batching if this needs to be faster later. sortOrder appends to the end.
        const img = await api.images.upload(productId, files[i], {
          sortOrder: images.length + i,
          tags,
        });
        uploaded.push(img);
      }
      onChange([...images, ...uploaded]);
      setTagInput('');
      success(`Uploaded ${uploaded.length} photo${uploaded.length === 1 ? '' : 's'}.`);
    } catch (err) {
      toastError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  // Move an image one slot left/right and persist the swapped sortOrder values.
  async function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    // Optimistic UI update.
    onChange(reordered);
    setBusyId(moved.id);
    try {
      // Persist new positions for the two affected images.
      const a = reordered[index];
      const b = reordered[target];
      await Promise.all([
        api.images.update(productId, a.id, { sortOrder: index }),
        api.images.update(productId, b.id, { sortOrder: target }),
      ]);
    } catch (err) {
      toastError(err.message || 'Could not save the new order.');
      onChange(images); // revert on failure
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(image) {
    setBusyId(image.id);
    try {
      await api.images.remove(productId, image.id);
      onChange(images.filter((img) => img.id !== image.id));
    } catch (err) {
      toastError(err.message || 'Could not delete this photo.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="relative w-24 h-24 rounded-md overflow-hidden border-2 border-line group"
          >
            <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
            {index === 0 && (
              <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(img)}
              disabled={busyId === img.id}
              className="absolute top-1 right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              ×
            </button>
            {/* Reorder controls — persisted per-image (no bulk endpoint). */}
            <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0 || busyId === img.id}
                className="bg-black/70 text-white text-xs w-5 h-5 rounded disabled:opacity-30"
                aria-label="Move left"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === images.length - 1 || busyId === img.id}
                className="bg-black/70 text-white text-xs w-5 h-5 rounded disabled:opacity-30"
                aria-label="Move right"
              >
                ›
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 rounded-md border-2 border-dashed border-line flex items-center justify-center text-xs text-ink/50 hover:border-ink/40"
        >
          {uploading ? 'Uploading…' : '+ Add photos'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files.length && handleFiles(e.target.files)}
        />
      </div>

      <label className="flex flex-col gap-1 mb-2">
        <span className="text-xs font-medium text-ink/70">
          Tags for next upload (comma-separated)
        </span>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="e.g. rakhi, red, handmade"
          className="border border-line rounded-md px-3 py-2 bg-white text-sm max-w-sm"
        />
      </label>

      {images.length > 1 && (
        <p className="text-xs text-ink/50">
          Use ‹ › to reorder. The first photo is the cover.
        </p>
      )}
    </div>
  );
}