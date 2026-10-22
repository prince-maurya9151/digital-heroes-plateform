import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
};

let refreshing = null;

api.interceptors.response.use(
  (r) => r,
  async (e) => {
    const { config, response } = e;
    const url = config?.url || '';
    if (response?.status === 401 && !config._retry && !/\/auth\/(login|refresh)/.test(url)) {
      const rt = localStorage.getItem('refresh_token');
      if (rt) {
        config._retry = true;
        try {
          refreshing ||= axios
            .post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: rt })
            .finally(() => { refreshing = null; });
          const { data } = await refreshing;
          localStorage.setItem('token', data.token);
          localStorage.setItem('refresh_token', data.refresh_token);
          config.headers.Authorization = `Bearer ${data.token}`;
          return api(config);
        } catch(err) {
          console.error('Refresh failed', err);
         }
      }
      clearSession();
      if (!['/login', '/signup', '/'].includes(location.pathname)) location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e) => e.response?.data?.error || e.message || 'Something went wrong';
export default api;
