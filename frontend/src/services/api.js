import axios from 'axios';

// In dev, Vite proxies /api to the backend (see vite.config.js) or you can
// set VITE_API_URL. In production, set VITE_API_URL to your deployed API.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('goscheme_jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('goscheme_jwt_token');
      localStorage.removeItem('goscheme_user');
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  updateProfile: (payload) => api.put('/auth/profile', payload),
};

// ---- Sectors (fast, split loading) ----
export const sectorsApi = {
  list: () => api.get('/sectors'),
  schemesBySector: (slug, params) => api.get(`/sectors/${slug}/schemes`, { params }),
};

// ---- Schemes ----
export const schemesApi = {
  list: (params) => api.get('/schemes', { params }),
  detail: (id) => api.get(`/schemes/${id}`),
  eligible: () => api.get('/schemes/eligible'),
};

// ---- Saved schemes ----
export const savedApi = {
  list: () => api.get('/saved-schemes'),
  toggle: (schemeId) => api.post('/saved-schemes/toggle', { schemeId }),
};

// ---- Notifications ----
export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

// ---- Admin ----
export const adminApi = {
  login: (password) => api.post('/admin/login', { password }),
  metrics: () => api.get('/admin/metrics'),
  createScheme: (payload) => api.post('/admin/schemes', payload),
  toggleStatus: (id) => api.put(`/admin/schemes/${id}/status`),
  deleteScheme: (id) => api.delete(`/admin/schemes/${id}`),
  triggerScrape: () => api.post('/admin/scrape-schemes'),
};

export default api;
