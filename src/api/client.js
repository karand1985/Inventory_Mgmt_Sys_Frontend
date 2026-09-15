const BASE = '/api';

function getToken() {
  const raw = localStorage.getItem('inventory_auth');
  return raw ? JSON.parse(raw).token : null;
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });
  if (res.status === 401) {
    // Session expired or was never valid — clear it and send the user back
    // to login rather than surfacing a confusing API error.
    localStorage.removeItem('inventory_auth');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
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
  dashboard: {
    get: (businessId) => {
      const params = businessId ? `?businessId=${businessId}` : '';
      return request(`/dashboard${params}`);
    }
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
        headers: { Authorization: `Bearer ${getToken()}` },
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
