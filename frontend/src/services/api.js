import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Medicine API calls
export const medicineApi = {
  // Create a new medicine
  create: (medicineData) => {
    return api.post('/medicines', medicineData);
  },

  // Get all medicines
  getAll: () => {
    return api.get('/medicines');
  },

  // Get a specific medicine
  getById: (id) => {
    return api.get(`/medicines/${id}`);
  },

  // Update a medicine
  update: (id, medicineData) => {
    return api.put(`/medicines/${id}`, medicineData);
  },

  // Delete a medicine
  delete: (id) => {
    return api.delete(`/medicines/${id}`);
  }
};

// Auth API calls
export const authApi = {
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  register: (userData) => {
    return api.post('/auth/register', userData);
  }
};

export default api; 