import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          const response = await axios.get('/api/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user on init', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        logout();
        toast.error('Session expired. Please log in again.');
      }
      return Promise.reject(error);
    }
  );

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("Attempting to log in with email:", email); // DEBUG LOG
    try {
      const response = await axios.post('/api/login', { email, password });
      console.log("Backend response received:", response); // DEBUG LOG
      const { access_token, user } = response.data;

      if (!access_token || !user) {
        console.error("Incomplete data from backend:", response.data); // DEBUG LOG
        toast.error('Login failed: Invalid response from server.');
        return false;
      }

      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      toast.success(`Welcome back, ${user.username}!`);
      return true;
    } catch (error) {
      console.error('Login API call failed:', error); // DEBUG LOG
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", error.response?.data); // DEBUG LOG
      }
      toast.error('Login failed. Please check your credentials.');
      return false;
    }
  };

  const register = async (email: string, username: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/register', { email, username, password });
      const { access_token, user } = response.data;

      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      toast.success('Registration successful! Welcome!');
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
    toast.success('Logged out successfully.');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 