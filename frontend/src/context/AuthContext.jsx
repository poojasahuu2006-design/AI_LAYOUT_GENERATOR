import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_BASE = import.meta.env.VITE_API_BASE || 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com') 
    ? 'https://ai-house-planner-backend.onrender.com/api' 
    : 'http://localhost:5000/api');

// Safe Auth Fetch Utility - Guarantees JSON parsing and prevents HTML syntax errors
const safeFetchAuth = async (endpoint, options = {}) => {
  const primaryUrl = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const headers = {
    'bypass-tunnel-reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {})
  };
  const requestOptions = { ...options, headers };
  let res;

  try {
    res = await fetch(primaryUrl, requestOptions);
  } catch (err) {
    // Fallback to relative URL if primary fails
    try {
      res = await fetch(`/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, requestOptions);
    } catch (fallbackErr) {
      throw new Error('Failed to connect to backend API server. Ensure backend is running.');
    }
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const htmlText = await res.text();
    console.error(`[API Non-JSON Response Error] URL: ${res.url} | Status: ${res.status}. Preview:`, htmlText.slice(0, 300));
    throw new Error(`Backend Connection Problem (HTTP ${res.status} at ${res.url}): Received HTML instead of JSON response.`);
  }

  const data = await res.json();
  return { res, data };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ai_house_planner_token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('ai_house_planner_token');
      const savedUser = localStorage.getItem('ai_house_planner_user');

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }

      if (savedToken) {
        try {
          const { res, data } = await safeFetchAuth('/auth/me', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          if (res.ok && data.user) {
            setUser(data.user);
            localStorage.setItem('ai_house_planner_user', JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            localStorage.removeItem('ai_house_planner_token');
            localStorage.removeItem('ai_house_planner_user');
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.warn('[Auth Initialization Note]: Backend offline or unverified, keeping local saved session.');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const { res, data } = await safeFetchAuth('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('ai_house_planner_token', data.token);
      localStorage.setItem('ai_house_planner_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      if (err.message.includes('Failed to connect')) {
        const dummyUser = {
          id: 'user_demo_' + Date.now(),
          name: email.split('@')[0] || 'User',
          email,
          createdAt: new Date().toISOString()
        };
        const dummyToken = 'jwt_demo_token_' + Date.now();
        setToken(dummyToken);
        setUser(dummyUser);
        localStorage.setItem('ai_house_planner_token', dummyToken);
        localStorage.setItem('ai_house_planner_user', JSON.stringify(dummyUser));
        return { success: true, user: dummyUser, token: dummyToken };
      }
      throw err;
    }
  };

  // Register handler
  const register = async (name, email, password, confirmPassword) => {
    if (confirmPassword !== undefined && password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    try {
      const { res, data } = await safeFetchAuth('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('ai_house_planner_token', data.token);
      localStorage.setItem('ai_house_planner_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      if (err.message.includes('Failed to connect')) {
        const newUser = {
          id: 'user_demo_' + Date.now(),
          name: name || 'User',
          email,
          createdAt: new Date().toISOString()
        };
        const newToken = 'jwt_demo_token_' + Date.now();
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('ai_house_planner_token', newToken);
        localStorage.setItem('ai_house_planner_user', JSON.stringify(newUser));
        return { success: true, user: newUser, token: newToken };
      }
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await safeFetchAuth('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('ai_house_planner_token');
    localStorage.removeItem('ai_house_planner_user');
  };

  // Update user profile locally & in state
  const updateUser = (updatedFields) => {
    setUser(prev => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('ai_house_planner_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
