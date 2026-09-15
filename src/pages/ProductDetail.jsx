import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ImageUploader from '../components/ImageUploader';
import StockLogForm from '../components/StockLogForm';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isViewer } = useAuth();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    Promise.all([api.products.get(id), api.stockLog.history(id)])
      .then(([p, h]) => {
        setProduct(p);
        setHistory(h);
      })
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [id]);

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    await api.products.remove(id);
    navigate('/products');
  }

  if (loading || !product) return <p className="text-center mt-16 text-ink/60">Loading…</p>;

  const lowStock = product.currentQuantity <= 3;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-semibold">{product.name}</h1>
          <p className="text-sm text-ink/60">{product.category?.name}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!isViewer && (
            <>
              <Link
                to={`/products/${id}/edit`}
                className="text-sm font-medium border border-line rounded-md px-3 py-1.5"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="text-sm font-medium border border-red-200 text-red-600 rounded-md px-3 py-1.5"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-line rounded-lg p-3">
          <div className="text-xs text-ink/50">Current stock</div>
          <div className={`text-lg font-semibold ${lowStock ? 'text-red-600' : ''}`}>
            {product.currentQuantity}
          </div>
        </div>
        <div className="bg-white border border-line rounded-lg p-3">
          <div className="text-xs text-ink/50">Cost price</div>
          <div className="text-lg font-semibold">₹{product.costPrice ?? '—'}</div>
        </div>
        <div className="bg-white border border-line rounded-lg p-3">
          <div className="text-xs text-ink/50">Sell price</div>
          <div className="text-lg font-semibold">₹{product.sellPrice ?? '—'}</div>
        </div>
      </div>

      <div className="mb-6">
        <span className="text-sm font-medium block mb-2">Photos</span>
        {isViewer ? (
          <div className="flex flex-wrap gap-3">
            {(product.images ?? []).map((img) => (
              <img
                key={img.id}
                src={img.imageUrl}
                alt=""
                className="w-24 h-24 rounded-md object-cover border-2 border-line"
              />
            ))}
            {(product.images ?? []).length === 0 && (
              <p className="text-sm text-ink/50">No photos yet.</p>
            )}
          </div>
        ) : (
          <ImageUploader
            productId={id}
            images={product.images ?? []}
            onChange={(images) => setProduct({ ...product, images })}
          />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {!isViewer && (
          <div>
            <h2 className="text-sm font-medium mb-2">Log stock movement</h2>
            <StockLogForm product={product} onLogged={refresh} />
          </div>
        )}

        <div>
          <h2 className="text-sm font-medium mb-2">History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-ink/50">No stock movements logged yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="bg-white border border-line rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-3"
                >
                  <div>
                    <div>
                      <span className={h.changeType === 'IN' ? 'text-green-700' : 'text-ink'}>
                        {h.changeType === 'IN' ? '+' : '−'}
                        {h.quantity}
                      </span>
                      {h.unitPrice != null && (
                        <span className="text-ink/50"> at ₹{h.unitPrice}</span>
                      )}
                    </div>
                    {h.note && <div className="text-ink/50 text-xs">{h.note}</div>}
                  </div>
                  <span className="text-xs text-ink/40 shrink-0">{h.eventDate}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
