import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import ImageUploader from '../components/ImageUploader';
import Lightbox from '../components/Lightbox';
import StockLogForm from '../components/StockLogForm';
import AuditMeta from '../components/AuditMeta';

// Mirror the dashboard's low-stock threshold (backend has no per-product value).
const LOW_STOCK_AT = 5;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  function refresh() {
    setLoading(true);
    Promise.all([api.products.get(id), api.stockLog.history(id)])
      .then(([p, h]) => {
        setProduct(p);
        setHistory(h);
      })
      .catch((err) => toastError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [id]);

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete product',
      message: `Delete "${product.name || product.productCode}"? This can't be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await api.products.remove(id);
      success('Product deleted.');
      navigate('/products');
    } catch (err) {
      toastError(err.message);
    }
  }

  if (loading || !product)
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="iv-skeleton h-7 w-56 mb-2" />
        <div className="iv-skeleton h-4 w-40 mb-6" />
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="iv-skeleton h-20 rounded-xl" />
          ))}
        </div>
        <div className="iv-skeleton h-40 rounded-xl" />
      </div>
    );

  const lowStock = (product.currentQuantity ?? 0) <= LOW_STOCK_AT;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 iv-page-in">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="iv-display text-2xl font-extrabold">{product.name || product.productCode}</h1>
          <p className="text-sm text-ink/60">
            {product.categoryName}
            {product.productCode && (
              <span className="text-ink/40"> · {product.productCode}</span>
            )}
          </p>
          {product.seasonTag && (
            <span className="iv-badge mt-2 bg-amber-100 text-amber-800 border border-amber-200">
              <span className="material-symbols-outlined text-[14px]">sell</span>
              {product.seasonTag}
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {canWrite && (
            <>
              <Link to={`/products/${id}/edit`} className="iv-btn iv-btn-ghost !px-3 !py-1.5">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </Link>
              <button onClick={handleDelete} className="iv-btn iv-btn-danger !px-3 !py-1.5">
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="iv-card iv-glow-border p-3">
          <div className="text-xs text-ink/50">Current stock</div>
          <div className={`iv-display text-xl font-extrabold ${lowStock ? 'text-red-600' : ''}`}>
            {product.currentQuantity ?? 0}
          </div>
        </div>
        <div className="iv-card iv-glow-border p-3">
          <div className="text-xs text-ink/50">Cost price</div>
          <div className="iv-display text-xl font-extrabold">₹{product.costPrice ?? '—'}</div>
        </div>
        <div className="iv-card iv-glow-border p-3">
          <div className="text-xs text-ink/50">Sell price</div>
          <div className="iv-display text-xl font-extrabold">₹{product.sellPrice ?? '—'}</div>
        </div>
      </div>

      <div className="mb-6">
        <span className="iv-display text-sm font-bold block mb-2">Photos</span>
        {!canWrite ? (
          <div className="flex flex-wrap gap-3">
            {(product.images ?? []).map((img) => (
              <div key={img.id} className="w-24">
                <img
                  src={img.imageUrl}
                  alt=""
                  onClick={() =>
                    setLightboxIndex((product.images ?? []).findIndex((i) => i.id === img.id))
                  }
                  className="w-24 h-24 rounded-md object-cover border-2 border-line cursor-zoom-in transition-transform hover:scale-105"
                />
                {(img.tags ?? []).length > 0 && (
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
                )}
              </div>
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
            onView={(idx) => setLightboxIndex(idx)}
          />
        )}
      </div>

      <Lightbox
        images={product.images ?? []}
        index={lightboxIndex}
        onIndex={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />

      <div className="grid sm:grid-cols-2 gap-6">
        {canWrite && (
          <div>
            <h2 className="iv-display text-sm font-bold mb-2">Log stock movement</h2>
            <StockLogForm product={product} onLogged={refresh} />
          </div>
        )}

        <div>
          <h2 className="iv-display text-sm font-bold mb-2">History</h2>
          {history.length === 0 ? (
            <div className="iv-card p-6 text-center text-sm text-ink/50">
              No stock movements logged yet.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((h, i) => (
                <li
                  key={h.id}
                  className="iv-card iv-stagger px-3 py-2.5 text-sm flex items-center justify-between gap-3"
                  style={{ '--i': i }}
                >
                  <div>
                    <div>
                      <span className={h.changeType === 'IN' ? 'text-green-700 font-semibold' : 'text-ink font-semibold'}>
                        {h.changeType === 'IN' ? '+' : '−'}
                        {h.quantity}
                      </span>
                      <span className="text-ink/40 text-xs"> · {h.changeType}</span>
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

      <AuditMeta entity={product} />
    </div>
  );
}