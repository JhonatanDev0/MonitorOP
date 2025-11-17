import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const dashboardApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard - Auditoria
export const dashboardService = {
  // Buscar dados de auditoria
  getAuditoriaData: (cdProjeto = null) => {
    const params = cdProjeto ? { cd_projeto: cdProjeto } : {};
    return dashboardApi.get('/dashboard/auditoria', { params });
  },

  // Buscar histórico de auditoria por projeto
  getAuditoriaHistorico: (cdProjeto) => {
    return dashboardApi.get(`/dashboard/auditoria/historico/${cdProjeto}`);
  },

  // Buscar resumo de auditoria
  getAuditoriaResumo: () => {
    return dashboardApi.get('/dashboard/auditoria/resumo');
  },

  // Buscar métricas calculadas de auditoria
  getAuditoriaMetricas: (cdProjeto) => {
    return dashboardApi.get(`/dashboard/auditoria/metricas/${cdProjeto}`);
  },
};

export default dashboardApi;