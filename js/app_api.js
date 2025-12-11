/* app_api.js - API Helper Functions for MySQL Backend */

const API_BASE = '/api';

// API call wrapper with error handling
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Unauthorized - redirect to login
      sessionStorage.removeItem('sessionUser');
      window.location.href = 'login.html';
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Products API
const ProductsAPI = {
  async getAll() {
    return await apiCall('/products');
  },

  async getOne(id) {
    return await apiCall(`/products/${id}`);
  },

  async create(product) {
    return await apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  },

  async update(id, product) {
    return await apiCall(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  },

  async delete(id) {
    return await apiCall(`/products/${id}`, {
      method: 'DELETE'
    });
  }
};

// Sales API
const SalesAPI = {
  async getAll() {
    return await apiCall('/sales');
  },

  async getOne(id) {
    return await apiCall(`/sales/${id}`);
  },

  async create(sale) {
    return await apiCall('/sales', {
      method: 'POST',
      body: JSON.stringify(sale)
    });
  },

  async delete(id) {
    return await apiCall(`/sales/${id}`, {
      method: 'DELETE'
    });
  },

  async clearAll() {
    return await apiCall('/sales', {
      method: 'DELETE'
    });
  }
};

// Settings API
const SettingsAPI = {
  async getAll() {
    return await apiCall('/settings');
  },

  async get(key) {
    return await apiCall(`/settings/${key}`);
  },

  async update(key, value) {
    return await apiCall(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  }
};

// Auth API
const AuthAPI = {
  async checkSession() {
    return await apiCall('/auth/session');
  },

  async logout() {
    return await apiCall('/auth/logout', {
      method: 'POST'
    });
  }
};
