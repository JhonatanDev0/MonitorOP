import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configurar interceptor para adicionar token em todas as requisições
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só redireciona para login se:
    // 1. O erro for 401
    // 2. A requisição NÃO for de login
    // 3. O usuário NÃO estiver na página de login
    if (
      error.response && 
      error.response.status === 401 &&
      !error.config.url.includes('/auth/login') &&
      window.location.pathname !== '/login'
    ) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Login
  login: async (login, senha, lembrar = false) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      login,
      senha,
      lembrar
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    }
    
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  // Verificar se está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obter usuário logado
  getUsuario: () => {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  // Verificar se é admin
  isAdmin: () => {
    const usuario = authService.getUsuario();
    return usuario && usuario.role === 'admin';
  },

  // Verificar token no backend
  checkToken: async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/check`);
      return response.data;
    } catch (error) {
      return null;
    }
  }
};