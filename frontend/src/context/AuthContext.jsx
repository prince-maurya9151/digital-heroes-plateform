import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSub] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setSub(data.subscription);
    } catch (e) {
      if (e.response?.status === 401) {
        clearTokens();
        setUser(null);
        setSub(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('token')) refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login',
       { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refresh_token', data.refresh_token);
    await refresh();
    return data.user;
  };
  const signup = (payload) => api.post('/auth/signup', payload);
  const logout = () => {
    clearTokens();
    setUser(null);
    setSub(null);
  };

  const active = !!subscription && subscription.status === 'active' && new Date(subscription.current_period_end) > new Date();

  return <Ctx.Provider value={{ user, subscription, active, loading, login, signup, logout, refresh }}>{children}</Ctx.Provider>;
}
