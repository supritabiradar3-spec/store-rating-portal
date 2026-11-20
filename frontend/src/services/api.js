// API Service for Store Rating Backend

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let msg = data.message || response.statusText || 'Request failed';
    if (Array.isArray(msg)) {
      msg = msg.join(', ');
    }
    throw new Error(msg);
  }
  return data;
};

export const api = {
  // Auth
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  signup: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  changePassword: async (passwords) => {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwords),
    });
    return handleResponse(res);
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Admin
  getStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getAdminUsers: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/admin/users?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getUserDetail: async (id) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  adminCreateUser: async (userData) => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getAdminStores: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/admin/stores?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  adminCreateStore: async (storeData) => {
    const res = await fetch(`${API_BASE}/admin/stores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(storeData),
    });
    return handleResponse(res);
  },

  getPotentialOwners: async () => {
    const res = await fetch(`${API_BASE}/admin/potential-owners`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Stores (User & Public)
  getStores: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/stores?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Rating
  submitRating: async (storeId, value) => {
    const res = await fetch(`${API_BASE}/ratings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ storeId: Number(storeId), value: Number(value) }),
    });
    return handleResponse(res);
  },

  // Store Owner Dashboard
  getOwnerDashboard: async (storeId = null) => {
    const url = storeId
      ? `${API_BASE}/stores/owner/dashboard?storeId=${storeId}`
      : `${API_BASE}/stores/owner/dashboard`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
