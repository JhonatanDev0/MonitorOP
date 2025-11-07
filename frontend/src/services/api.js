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
  listar: () => api.get('/projetos'),
  buscar: (id) => api.get(`/projetos/${id}`),
  criar: (data) => api.post('/projetos', data),
  atualizar: (id, data) => api.put(`/projetos/${id}`, data),
  deletar: (id) => api.delete(`/projetos/${id}`),
  listarAtividades: (id) => api.get(`/projetos/${id}/atividades`),
};

// Squads
export const squadService = {
  listar: () => api.get('/squads'),
  buscar: (id) => api.get(`/squads/${id}`),
  criar: (data) => api.post('/squads', data),
  atualizar: (id, data) => api.put(`/squads/${id}`, data),
  deletar: (id) => api.delete(`/squads/${id}`),
  listarProjetos: (id) => api.get(`/squads/${id}/projetos`),
  listarAtividades: (id) => api.get(`/squads/${id}/atividades`),
};

// Atividades
export const atividadeService = {
  listar: (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.projeto_id) params.append('projeto_id', filtros.projeto_id);
    if (filtros.squad_id) params.append('squad_id', filtros.squad_id);
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.prioridade) params.append('prioridade', filtros.prioridade);
    
    return api.get(`/atividades${params.toString() ? '?' + params.toString() : ''}`);
  },
  buscar: (id) => api.get(`/atividades/${id}`),
  criar: (data) => api.post('/atividades', data),
  atualizar: (id, data) => api.put(`/atividades/${id}`, data),
  deletar: (id) => api.delete(`/atividades/${id}`),
  estatisticas: () => api.get('/atividades/estatisticas'),
};

export default api;
