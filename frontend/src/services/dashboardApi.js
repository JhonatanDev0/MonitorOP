import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.6.31:5000/api';

const dashboardApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard - Recodificação
export const dashboardService = {
  // ==================== RECODIFICAÇÃO ====================
  
  // Buscar dados de recodificação
  getRecodificacaoData: (cdProjeto = null) => {
    const params = cdProjeto ? { cd_projeto: cdProjeto } : {};
    return dashboardApi.get('/dashboard/recodificacao', { params });
  },

  // Buscar histórico de recodificação por projeto
  getRecodificacaoHistorico: (cdProjeto) => {
    return dashboardApi.get(`/dashboard/recodificacao/historico/${cdProjeto}`);
  },

  // Buscar métricas calculadas de recodificação
  getRecodificacaoMetricas: (cdProjeto) => {
    return dashboardApi.get(`/dashboard/recodificacao/metricas/${cdProjeto}`);
  },

  // ==================== CATEGORIZAÇÃO ====================

  // Buscar métricas de categorização
  getCategorizacaoMetricas: (cdProjeto) => {
    return dashboardApi.get(`/categorizacao/metricas/${cdProjeto}`);
  },

  // ==================== PROCESSAMENTO ====================

  // Buscar métricas de Frop Pacote
  getFropPacoteMetricas: (cdProjeto) => {
    return dashboardApi.get(`/frop-pacote/metricas/${cdProjeto}`);
  },

  // Buscar métricas de Frop Digitalização
  getFropDigitalizacaoMetricas: (cdProjeto) => {
    return dashboardApi.get(`/frop-digitalizacao/metricas/${cdProjeto}`);
  },

  // Buscar métricas de Processamento
  getProcessamentoMetricas: (cdProjeto) => {
    return dashboardApi.get(`/processamento/metricas/${cdProjeto}`);
  },

  // ==================== PARTICIPAÇÃO ====================

  // Buscar dados de participação
  getParticipacaoData: (cdProjeto = null) => {
    const params = cdProjeto ? { cd_projeto: cdProjeto } : {};
    return dashboardApi.get('/dashboard/participacao', { params });
  },

  // Buscar dados de participação por projeto
  getParticipacaoByProjeto: (cdProjeto) => {
    return dashboardApi.get(`/dashboard/participacao/${cdProjeto}`);
  },
};

export default dashboardApi;