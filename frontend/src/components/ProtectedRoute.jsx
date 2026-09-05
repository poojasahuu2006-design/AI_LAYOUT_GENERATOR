import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children, onRedirectToLogin }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    if (onRedirectToLogin) {
      onRedirectToLogin();
    }
    return null;
  }

  return children;
}
