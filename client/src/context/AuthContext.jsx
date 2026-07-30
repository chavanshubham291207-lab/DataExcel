import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

// Helper to normalize roles for client-side routing
export const normalizeRole = (roleStr) => {
  if (!roleStr) return null;
  const cleaned = roleStr.toString().trim().toLowerCase();
  if (cleaned === 'candidate') return 'candidate';
  return 'recruiter';
};

// Helper to sanitize localStorage and maintain strictly 3 keys: token, role, user
const sanitizeLocalStorage = () => {
  try {
    const invalidValues = ['undefined', 'null', ''];
    ['token', 'role', 'user', 'candidateUser', 'recruiter', 'demoUser', 'tempUser'].forEach(key => {
      const val = localStorage.getItem(key);
      if (!val || invalidValues.includes(val.trim())) {
        localStorage.removeItem(key);
      }
    });
    // Remove legacy duplicate keys
    localStorage.removeItem('candidateUser');
    localStorage.removeItem('recruiter');
    localStorage.removeItem('demoUser');
    localStorage.removeItem('tempUser');
  } catch (e) {
    console.warn('[AuthContext] LocalStorage cleanup warning:', e);
  }
};

const safeJsonParse = (key) => {
  try {
    const str = localStorage.getItem(key);
    if (!str || str === 'undefined' || str === 'null') {
      localStorage.removeItem(key);
      return null;
    }
    return JSON.parse(str);
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    sanitizeLocalStorage();
    return localStorage.getItem('token') || null;
  });

  const [role, setRole] = useState(() => {
    const rawRole = localStorage.getItem('role');
    return normalizeRole(rawRole);
  });

  const [user, setUser] = useState(() => {
    return safeJsonParse('user');
  });

  useEffect(() => {
    sanitizeLocalStorage();
  }, []);

  const saveAuthSession = (newToken, userPayload, rawRole) => {
    sanitizeLocalStorage();

    const normalizedRole = normalizeRole(rawRole || userPayload?.role || 'recruiter');
    const finalUserPayload = userPayload ? { ...userPayload } : null;

    localStorage.setItem('token', newToken);
    localStorage.setItem('role', normalizedRole);
    if (finalUserPayload) {
      localStorage.setItem('user', JSON.stringify(finalUserPayload));
    }

    setToken(newToken);
    setRole(normalizedRole);
    setUser(finalUserPayload);

    return { token: newToken, role: normalizedRole, user: finalUserPayload };
  };

  const login = async (selectedRole, email, password) => {
    sanitizeLocalStorage();
    const reqRole = (selectedRole || '').trim().toLowerCase();
    const endpoint = reqRole === 'candidate' ? '/candidate-auth/login' : '/auth/login';

    const res = await api.post(endpoint, { email, password });
    
    // Robust payload parsing for diverse backend response formats
    const resData = res.data?.data || res.data || {};
    const newToken = resData.token || res.data?.token;
    const userData = resData.user || resData.candidateUser || resData.recruiter || resData.candidate || res.data?.user;
    const roleFromRes = resData.role || userData?.role || reqRole;

    if (!newToken) {
      throw new Error('Authentication succeeded but no token was returned by the server.');
    }

    return saveAuthSession(newToken, userData, roleFromRes);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('candidateUser');
    localStorage.removeItem('recruiter');
    localStorage.removeItem('demoUser');
    localStorage.removeItem('tempUser');

    setToken(null);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, saveAuthSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
