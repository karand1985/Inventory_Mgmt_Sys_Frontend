import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

/**
 * Multi-photo uploader for a product.
 *
 *  - New photos are STAGED in the browser first: pick files, type tags per photo
 *    (and/or common tags applied to all), then click "Upload" to send them to
 *    POST /products/{id}/images/upload one by one with their tags. Nothing hits
 *    the backend until the user commits the batch.
 *  - There is no bulk "reorder" endpoint; ordering is persisted per-image via
 *    PUT /products/{id}/images/{imageId} by swapping adjacent sortOrder values.
 *  - The first image (index 0) is treated as the cover photo.
 */
export default function ImageUploader({ productId, images, onChange, onView }) {
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTagInput, setEditTagInput] = useState('');
  // Staged-but-not-yet-uploaded files: { tempId, file, url (object URL), tags }.
  const [pending, setPending] = useState([]);
  // Optional tags applied to every staged photo, merged with each photo's own.
  const [commonTags, setCommonTags] = useState('');
  const fileInputRef = useRef(null);
  const { error: toastError, success } = useToast();

  // Release object URLs for staged previews when they change / on unmount.
  useEffect(() => {
    return () => pending.forEach((p) => URL.revokeObjectURL(p.url));
  }, [pending]);

  function startEditTags(image) {
    setEditingId(image.id);
    setEditTagInput((image.tags ?? []).join(', '));
  }

  function cancelEditTags() {
    setEditingId(null);
    setEditTagInput('');
  }

  // Persist edited tags for a single existing photo (DB + Cloudinary re-sync).
  async function saveTags(image) {
    setBusyId(image.id);
    try {
      const tags = editTagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const updated = await api.images.update(productId, image.id, {
        imageUrl: image.imageUrl, // required by the backend DTO (@NotBlank)
        tags,
      });
      onChange(images.map((img) => (img.id === image.id ? updated : img)));
      cancelEditTags();
      success('Tags updated.');
    } catch (err) {
      toastError(err.message || 'Could not update tags.');
    } finally {
      setBusyId(null);
    }
  }

  // Stage newly picked files in the browser (no upload yet). Each gets an
  // object-URL preview and its own editable tag string.
  function stageFiles(fileList) {
    const staged = Array.from(fileList).map((file) => ({
      tempId: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      tags: '',
    }));
    setPending((prev) => [...prev, ...staged]);
  }

  function updatePendingTags(tempId, value) {
    setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, tags: value } : p)));
  }

  function removePending(tempId) {
    setPending((prev) => {
      const target = prev.find((p) => p.tempId === tempId);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.tempId !== tempId);
    });
  }

  // Merge comma-separated strings into a de-duplicated, trimmed tag array.
  function mergeTags(...sources) {
    const seen = new Set();
    const out = [];
    for (const src of sources) {
      (src || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => {
          const key = t.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            out.push(t);
          }
        });
    }
    return out;
  }

  // Commit the whole staged batch: upload each photo with common + per-photo tags.
  async function uploadPending() {
    if (pending.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        const tags = mergeTags(commonTags, item.tags);
        const img = await api.images.upload(productId, item.file, {
          sortOrder: images.length + i,
          tags: tags.length ? tags : undefined,
        });
        uploaded.push(img);
      }
      onChange([...images, ...uploaded]);
      pending.forEach((p) => URL.revokeObjectURL(p.url));
      setPending([]);
      setCommonTags('');
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
        // imageUrl is required by the backend DTO (@NotBlank); send the existing one.
        api.images.update(productId, a.id, { imageUrl: a.imageUrl, sortOrder: index }),
        api.images.update(productId, b.id, { imageUrl: b.imageUrl, sortOrder: target }),
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
          <div key={img.id} className="w-24">
            <div className="relative w-24 h-24 rounded-md overflow-hidden border-2 border-line group">
              <img
                src={img.imageUrl}
                alt=""
                onClick={() => onView?.(index)}
                className="w-full h-full object-cover cursor-zoom-in"
              />
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
              {/* Edit tags for this specific photo. */}
              <button
                type="button"
                onClick={() => startEditTags(img)}
                disabled={busyId === img.id}
                title="Edit tags"
                className="absolute top-1 right-7 bg-black/70 text-white text-[11px] leading-none w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 flex items-center justify-center"
              >
                ✎
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
            {editingId === img.id ? (
              <div className="mt-1">
                <input
                  autoFocus
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveTags(img);
                    } else if (e.key === 'Escape') {
                      cancelEditTags();
                    }
                  }}
                  placeholder="tags, comma-separated"
                  className="w-24 border border-line rounded px-1.5 py-1 text-[11px] bg-white"
                />
                <div className="flex gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => saveTags(img)}
                    disabled={busyId === img.id}
                    className="text-[10px] bg-ink text-white rounded px-1.5 py-0.5 disabled:opacity-50"
                  >
                    {busyId === img.id ? '…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditTags}
                    disabled={busyId === img.id}
                    className="text-[10px] bg-paper border border-line rounded px-1.5 py-0.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              (img.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {img.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] bg-paper border border-line text-ink/70 rounded-full px-1.5 py-0.5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 rounded-md border-2 border-dashed border-line flex items-center justify-center text-xs text-ink/50 hover:border-ink/40"
        >
          + Add photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files.length) stageFiles(e.target.files);
            e.target.value = ''; // allow re-picking the same file
          }}
        />
      </div>

      {/* Staging area — photos wait here (with per-photo tags) until "Upload". */}
      {pending.length > 0 && (
        <div className="border border-dashed border-line rounded-md p-3 mb-3 bg-paper/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-ink/70">
              {pending.length} photo{pending.length === 1 ? '' : 's'} ready to upload
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={uploadPending}
                disabled={uploading}
                className="text-xs bg-ink text-white rounded px-3 py-1.5 disabled:opacity-50"
              >
                {uploading
                  ? 'Uploading…'
                  : `Upload ${pending.length} photo${pending.length === 1 ? '' : 's'}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  pending.forEach((p) => URL.revokeObjectURL(p.url));
                  setPending([]);
                  setCommonTags('');
                }}
                disabled={uploading}
                className="text-xs bg-white border border-line rounded px-3 py-1.5 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-1 mb-3">
            <span className="text-[11px] font-medium text-ink/60">
              Tags for all photos below (comma-separated, optional)
            </span>
            <input
              value={commonTags}
              onChange={(e) => setCommonTags(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              placeholder="e.g. rakhi, red, handmade"
              className="border border-line rounded-md px-3 py-2 bg-white text-sm max-w-sm"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            {pending.map((p) => (
              <div key={p.tempId} className="w-28">
                <div className="relative w-28 h-28 rounded-md overflow-hidden border-2 border-line">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePending(p.tempId)}
                    disabled={uploading}
                    className="absolute top-1 right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full disabled:opacity-50"
                    aria-label="Remove from batch"
                  >
                    ×
                  </button>
                </div>
                <input
                  value={p.tags}
                  onChange={(e) => updatePendingTags(p.tempId, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  placeholder="tags for this photo"
                  className="w-28 border border-line rounded px-1.5 py-1 text-[11px] bg-white mt-1"
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink/45 mt-2">
            Each photo gets the common tags above plus its own. Nothing is uploaded
            until you press Upload.
          </p>
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-ink/50">
          Use ‹ › to reorder. The first photo is the cover.
        </p>
      )}
    </div>
  );
}