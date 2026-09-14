import React, { useRef, useState } from 'react';
import { api } from '../api/client';

/**
 * Multi-photo upload with drag-and-drop reordering. The first image
 * (index 0) is treated as the cover photo shown in product grids.
 * Reordering updates sort_order on the backend via api.images.reorder.
 */
export default function ImageUploader({ productId, images, onChange }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleFiles(fileList) {
    setUploading(true);
    try {
      const files = Array.from(fileList);
      const uploaded = [];
      for (const file of files) {
        // Uploaded one at a time to keep upload progress simple; Cloudinary
        // itself supports batching if this needs to be faster later.
        const img = await api.images.upload(productId, file);
        uploaded.push(img);
      }
      onChange([...images, ...uploaded]);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(targetIndex) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    onChange(reordered);
    api.images.reorder(productId, reordered.map((img) => img.id));
  }

  async function handleRemove(image) {
    await api.images.remove(productId, image.id);
    onChange(images.filter((img) => img.id !== image.id));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((img, index) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="relative w-24 h-24 rounded-md overflow-hidden border-2 border-line cursor-move group"
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
              className="absolute top-1 right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
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
      {images.length > 1 && (
        <p className="text-xs text-ink/50">Drag photos to reorder. The first one is the cover photo.</p>
      )}
    </div>
  );
}
