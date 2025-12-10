import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// NOTA: Os interceptors foram movidos para api.js para funcionarem corretamente
// com a instância customizada do axios usada pelos serviços

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

  // Trocar senha
  trocarSenha: async (senhaAtual, senhaNova) => {
    const response = await axios.put(`${API_URL}/auth/trocar-senha`, {
      senha_atual: senhaAtual,
      senha_nova: senhaNova
    });
    
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