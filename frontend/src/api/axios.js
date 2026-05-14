import axios from 'axios';

const getStoredAccessToken = () => localStorage.getItem('caretrackAccessToken');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry && !originalRequest?.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        if (data?.accessToken) localStorage.setItem('caretrackAccessToken', data.accessToken);
        return api(originalRequest);
      } catch {
        localStorage.removeItem('caretrackUser');
        localStorage.removeItem('caretrackAccessToken');
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('caretrackUser');
      localStorage.removeItem('caretrackAccessToken');
    }
    return Promise.reject(error);
  }
);

export default api;
