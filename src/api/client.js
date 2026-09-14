const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  businesses: {
    list: () => request('/businesses')
  },
  categories: {
    list: (businessId) => request(`/categories?businessId=${businessId}`),
    create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) })
  },
  products: {
    list: (businessId, categoryId) => {
      const params = new URLSearchParams();
      if (businessId) params.set('businessId', businessId);
      if (categoryId) params.set('categoryId', categoryId);
      return request(`/products?${params.toString()}`);
    },
    get: (id) => request(`/products/${id}`),
    create: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/products/${id}`, { method: 'DELETE' })
  },
  stockLog: {
    history: (productId) => request(`/products/${productId}/stock-log`),
    log: (productId, data) =>
      request(`/products/${productId}/stock-log`, { method: 'POST', body: JSON.stringify(data) })
  },
  images: {
    // Adjust this path/shape to match your Cloudinary upload endpoint.
    upload: (productId, file) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${BASE}/products/${productId}/images`, {
        method: 'POST',
        body: formData
      }).then((res) => {
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        return res.json();
      });
    },
    reorder: (productId, imageIdsInOrder) =>
      request(`/products/${productId}/images/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ imageIds: imageIdsInOrder })
      }),
    remove: (productId, imageId) =>
      request(`/products/${productId}/images/${imageId}`, { method: 'DELETE' })
  }
};
