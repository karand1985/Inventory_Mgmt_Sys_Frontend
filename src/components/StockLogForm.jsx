import React, { useState } from 'react';
import { api } from '../api/client';

const TODAY = () => new Date().toISOString().slice(0, 10);

export default function StockLogForm({ product, onLogged }) {
  const [changeType, setChangeType] = useState('OUT');
  const [quantity, setQuantity] = useState(1);
  // Defaults to the product's listed sell price, but is editable — most
  // sales don't get haggled, so this keeps the common case a single tap.
  const [unitPrice, setUnitPrice] = useState(product.sellPrice ?? '');
  const [note, setNote] = useState('');
  const [eventDate, setEventDate] = useState(TODAY());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const entry = await api.stockLog.log(product.id, {
        changeType,
        quantity: Number(quantity),
        unitPrice: changeType === 'IN' ? null : unitPrice === '' ? null : Number(unitPrice),
        note: note || null,
        eventDate
      });
      onLogged(entry);
      setQuantity(1);
      setNote('');
    } catch (err) {
      setError(err.message || 'Could not log this movement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-lg p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        {['IN', 'OUT'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setChangeType(type)}
            className={`flex-1 text-sm font-medium py-2 rounded-md border ${
              changeType === type
                ? 'bg-ink text-white border-ink'
                : 'border-line text-ink/60'
            }`}
          >
            {type === 'IN' ? 'Stock in' : 'Sold'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink/70">Quantity</span>
          <input
            type="number"
            min="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border border-line rounded-md px-3 py-2 bg-white"
          />
        </label>

        {changeType !== 'IN' && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink/70">Actual sale price (₹)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="border border-line rounded-md px-3 py-2 bg-white"
              placeholder={String(product.sellPrice ?? '')}
            />
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink/70">Date</span>
        <input
          type="date"
          required
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="border border-line rounded-md px-3 py-2 bg-white"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink/70">Note (optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Sold at exhibition, combo discount"
          className="border border-line rounded-md px-3 py-2 bg-white"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-ink text-white font-medium rounded-md px-4 py-2.5"
      >
        {saving ? 'Logging…' : 'Log movement'}
      </button>
    </form>
  );
}
