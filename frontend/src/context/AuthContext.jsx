import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ id: decoded.user_id, role: decoded.role, email: decoded.email });
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:8001/api/auth/login/', { email, password });
      const { access, refresh } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      const decoded = jwtDecode(access);
      setUser({ id: decoded.user_id, role: decoded.role, email: decoded.email });
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || "Login failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
