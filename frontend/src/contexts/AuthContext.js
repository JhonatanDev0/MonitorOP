import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário logado ao carregar
    const usuario = authService.getUsuario();
    if (usuario) {
      setUser(usuario);
    }
    setLoading(false);
  }, []);

  const login = async (loginData, senha, lembrar) => {
    const data = await authService.login(loginData, senha, lembrar);
    setUser(data.usuario);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      isAdmin,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}