import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 24;

/**
 * Catalog-wide image search by tag (read-only, available to any authenticated
 * role). Backed by:
 *   - GET /images/search?tag=&page=&size=   -> PageResponse<ProductImage>
 *   - GET /images/tags?prefix=&limit=       -> string[] (autocomplete)
 *
 * The tag input drives a debounced autocomplete; submitting (or picking a
 * suggestion) runs the paginated search.
 */
export default function ImageSearch() {
  const { error: toastError } = useToast();

  const [tag, setTag] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null); // PageResponse
  const [loading, setLoading] = useState(false);
  const [searchedTag, setSearchedTag] = useState('');

  const debounceRef = useRef(null);

  // Debounced tag autocomplete as the user types.
  useEffect(() => {
    const prefix = tag.trim();
    if (!prefix) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api.images
        .tags({ prefix, limit: 8 })
        .then((tags) => setSuggestions(tags || []))
        .catch(() => setSuggestions([])); // autocomplete failures are non-fatal
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [tag]);

  function runSearch(nextTag = tag, nextPage = 0) {
    const q = nextTag.trim();
    if (!q) return;
    setLoading(true);
    setShowSuggest(false);
    api.images
      .search({ tag: q, page: nextPage, size: PAGE_SIZE })
      .then((res) => {
        setResult(res);
        setPage(res.page ?? nextPage);
        setSearchedTag(q);
      })
      .catch((err) => toastError(err.message || 'Search failed.'))
      .finally(() => setLoading(false));
  }

  function handleSubmit(e) {
    e.preventDefault();
    runSearch(tag, 0);
  }

  function pickSuggestion(s) {
    setTag(s);
    setSuggestions([]);
    runSearch(s, 0);
  }

  const images = result?.content ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 iv-page-in">
      <h1 className="iv-display text-2xl font-extrabold mb-1">Image search</h1>
      <p className="text-sm text-ink/60 mb-5">
        Find product photos across the whole catalog by tag.
      </p>

      <form onSubmit={handleSubmit} className="relative max-w-md mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-[20px] text-ink/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="Search by tag, e.g. rakhi"
              className="iv-input !pl-10"
            />
            {showSuggest && suggestions.length > 0 && (
              <ul className="iv-card iv-glass absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-auto p-1">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSuggestion(s)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-line/40 transition-colors"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !tag.trim()}
            className="iv-btn iv-btn-primary shrink-0"
          >
            {loading ? (
              <>
                <span className="iv-spinner h-4 w-4" />
                Searching…
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {result && (
        <>
          <p className="text-sm text-ink/60 mb-3">
            {result.totalElements} result{result.totalElements === 1 ? '' : 's'} for{' '}
            <span className="font-semibold text-ink">“{searchedTag}”</span>
          </p>

          {images.length === 0 ? (
            <div className="iv-card p-10 text-center flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[36px] text-ink/30">image_search</span>
              <p className="text-sm text-ink/50">No images match that tag.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {images.map((img, i) => (
                <Link
                  key={img.id}
                  to={img.productId ? `/products/${img.productId}` : '#'}
                  className="iv-card iv-card-hover iv-stagger block aspect-square overflow-hidden group relative !rounded-xl"
                  style={{ '--i': i }}
                  title={(img.tags || []).join(', ')}
                >
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
              ))}
            </div>
          )}

          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6 text-sm">
              <button
                onClick={() => runSearch(searchedTag, page - 1)}
                disabled={result.first || loading}
                className="iv-btn iv-btn-ghost !px-3 !py-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                Prev
              </button>
              <span className="text-ink/60">
                Page {result.page + 1} of {result.totalPages}
              </span>
              <button
                onClick={() => runSearch(searchedTag, page + 1)}
                disabled={result.last || loading}
                className="iv-btn iv-btn-ghost !px-3 !py-1.5"
              >
                Next
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
