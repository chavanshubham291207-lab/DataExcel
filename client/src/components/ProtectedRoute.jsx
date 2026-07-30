import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, normalizeRole } from '../context/AuthContext';

const isValidToken = (t) => t && t !== 'undefined' && t !== 'null' && typeof t === 'string' && t.length > 5;

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  const effectiveToken = isValidToken(token) ? token : localStorage.getItem('token');
  if (!isValidToken(effectiveToken)) return <Navigate to="/login" replace />;
  return children;
};

export const ProtectedCandidateRoute = ({ children }) => {
  const { token, role: contextRole } = useAuth();
  const effectiveToken = isValidToken(token) ? token : localStorage.getItem('token');
  const role = contextRole || normalizeRole(localStorage.getItem('role'));

  if (!isValidToken(effectiveToken)) return <Navigate to="/login" replace />;
  if (role === 'recruiter') {
    return <Navigate to="/recruiter/dashboard" replace />;
  }
  if (role !== 'candidate') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const ProtectedRecruiterRoute = ({ children }) => {
  const { token, role: contextRole } = useAuth();
  const effectiveToken = isValidToken(token) ? token : localStorage.getItem('token');
  const role = contextRole || normalizeRole(localStorage.getItem('role'));

  if (!isValidToken(effectiveToken)) return <Navigate to="/login" replace />;
  if (role === 'candidate') {
    return <Navigate to="/candidate/dashboard" replace />;
  }
  if (role !== 'recruiter') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
