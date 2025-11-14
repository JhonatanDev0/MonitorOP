import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projetos
export const projetoService = {
  listar: (page = null, perPage = 10, filtros = {}) => {
    const params = new URLSearchParams();
    
    // Paginação
    if (page) {
      params.append('page', page);
      params.append('per_page', perPage);
    }
    
    // Filtros de busca
    if (filtros.search_subprograma) params.append('search_subprograma', filtros.search_subprograma);
    if (filtros.search_nome) params.append('search_nome', filtros.search_nome);
    if (filtros.search_ordem_producao) params.append('search_ordem_producao', filtros.search_ordem_producao);
    if (filtros.search_disciplinas) params.append('search_disciplinas', filtros.search_disciplinas);
    if (filtros.search_tipos_processamento) params.append('search_tipos_processamento', filtros.search_tipos_processamento);
    
    const queryString = params.toString();
    return api.get(`/projetos${queryString ? '?' + queryString : ''}`);
  },
  buscar: (id) => api.get(`/projetos/${id}`),
  criar: (data) => api.post('/projetos', data),
  atualizar: (id, data) => api.put(`/projetos/${id}`, data),
  deletar: (id) => api.delete(`/projetos/${id}`),
  listarAtividades: (id) => api.get(`/projetos/${id}/atividades`),
};

// Squads
export const squadService = {
  listar: (page = null, perPage = 10, filtros = {}) => {
    const params = new URLSearchParams();
    
    // Paginação
    if (page) {
      params.append('page', page);
      params.append('per_page', perPage);
    }
    
    // Filtros de busca
    if (filtros.search_nome) params.append('search_nome', filtros.search_nome);
    if (filtros.search_descricao) params.append('search_descricao', filtros.search_descricao);
    
    const queryString = params.toString();
    return api.get(`/squads${queryString ? '?' + queryString : ''}`);
  },
  buscar: (id) => api.get(`/squads/${id}`),
  criar: (data) => api.post('/squads', data),
  atualizar: (id, data) => api.put(`/squads/${id}`, data),
  deletar: (id) => api.delete(`/squads/${id}`),
  listarProjetos: (id) => api.get(`/squads/${id}/projetos`),
  listarAtividades: (id) => api.get(`/squads/${id}/atividades`),
};

// Atividades
export const atividadeService = {
  listar: (filtros = {}, page = null, perPage = 10) => {
    const params = new URLSearchParams();
    
    // Filtros dropdown (já existentes)
    if (filtros.projeto_id) params.append('projeto_id', filtros.projeto_id);
    if (filtros.squad_id) params.append('squad_id', filtros.squad_id);
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.prioridade) params.append('prioridade', filtros.prioridade);
    
    // Filtros de busca por texto (novos)
    if (filtros.search_titulo) params.append('search_titulo', filtros.search_titulo);
    if (filtros.search_descricao) params.append('search_descricao', filtros.search_descricao);
    
    // Paginação
    if (page) {
      params.append('page', page);
      params.append('per_page', perPage);
    }
    
    return api.get(`/atividades${params.toString() ? '?' + params.toString() : ''}`);
  },
  buscar: (id) => api.get(`/atividades/${id}`),
  criar: (data) => api.post('/atividades', data),
  atualizar: (id, data) => api.put(`/atividades/${id}`, data),
  deletar: (id) => api.delete(`/atividades/${id}`),
  estatisticas: () => api.get('/atividades/estatisticas'),
};

export const usuarioService = {
  listar: (page = null, perPage = 10, filtros = {}) => {
    const params = new URLSearchParams();
    
    // Paginação
    if (page) {
      params.append('page', page);
      params.append('per_page', perPage);
    }
    
    // Filtros de busca por texto
    if (filtros.search_nome) params.append('search_nome', filtros.search_nome);
    if (filtros.search_login) params.append('search_login', filtros.search_login);
    
    // Filtros dropdown
    if (filtros.filter_role) params.append('filter_role', filtros.filter_role);
    if (filtros.filter_ativo) params.append('filter_ativo', filtros.filter_ativo);
    
    const queryString = params.toString();
    return axios.get(`${API_URL}/usuarios${queryString ? '?' + queryString : ''}`);
  },
  criar: (data) => axios.post(`${API_URL}/usuarios`, data),
  atualizar: (id, data) => axios.put(`${API_URL}/usuarios/${id}`, data),
  deletar: (id) => axios.delete(`${API_URL}/usuarios/${id}`)
};

export default api;