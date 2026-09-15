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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Image search</h1>
      <p className="text-sm text-ink/60 mb-5">
        Find product photos across the whole catalog by tag.
      </p>

      <form onSubmit={handleSubmit} className="relative max-w-md mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="Search by tag, e.g. rakhi"
              className="border border-line rounded-md px-3 py-2 bg-white text-sm w-full"
            />
            {showSuggest && suggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-line rounded-md shadow-sm max-h-56 overflow-auto">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSuggestion(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-paper"
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
            className="bg-ink text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {result && (
        <>
          <p className="text-sm text-ink/60 mb-3">
            {result.totalElements} result{result.totalElements === 1 ? '' : 's'} for{' '}
            <span className="font-medium text-ink">“{searchedTag}”</span>
          </p>

          {images.length === 0 ? (
            <p className="text-sm text-ink/50">No images match that tag.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {images.map((img) => (
                <Link
                  key={img.id}
                  to={img.productId ? `/products/${img.productId}` : '#'}
                  className="block aspect-square rounded-md overflow-hidden border border-line group relative"
                  title={(img.tags || []).join(', ')}
                >
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:opacity-90"
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
                className="border border-line rounded-md px-3 py-1.5 disabled:opacity-40"
              >
                ‹ Prev
              </button>
              <span className="text-ink/60">
                Page {result.page + 1} of {result.totalPages}
              </span>
              <button
                onClick={() => runSearch(searchedTag, page + 1)}
                disabled={result.last || loading}
                className="border border-line rounded-md px-3 py-1.5 disabled:opacity-40"
              >
                Next ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
