import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRoute({ children, adminOnly = false, requireEdit = false }) {
  const { isAuthenticated, canAccessUsers, canEdit, loading } = useAuth();

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Se requer ser admin (ex: página de usuários)
  if (adminOnly && !canAccessUsers()) {
    return <Navigate to="/" replace />;
  }

  // Se requer permissão de edição (admin ou gestor)
  if (requireEdit && !canEdit()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;