import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartPie, 
  faInfoCircle, 
  faExclamationTriangle,
  faCheckCircle 
} from '@fortawesome/free-solid-svg-icons';
import '../styles/RecodificacaoCharts.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Mapeamento de tipos de atividade para nomes amigáveis
const TIPO_ATIVIDADE_MAP = {
  '01 - RESERVA TÉCNICA': 'CR Reserva',
  '02 - CARTÃO ANULADO': 'CR Anulado',
  '03 - IMAGEM DUPLICADA': 'CR Duplicado',
  '04 - CARTÃO GENERICO': 'CR Genérico',
  '05 - RECODIFICAÇÃO DE SUJEITO C1': 'Sujeito C1',
  '06 - RECODIFICAÇÃO DE SUJEITO C2': 'Sujeito C2',
  '07 - DEDUCAO DO PUBLICO ALVO': 'Público Alvo'
};

function RecodificacaoCharts({ cdProjeto, metricas, atividadesSquad, nomeProjeto }) {
  
  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    
    try {
      if (typeof dataString === 'string' && dataString.includes('-')) {
        const partes = dataString.split('T')[0].split('-');
        const [ano, mes, dia] = partes;
        return `${dia}/${mes}/${ano}`;
      }
      
      if (typeof dataString === 'string' && dataString.includes('/')) {
        return dataString;
      }
      
      const data = new Date(dataString);
      
      if (isNaN(data.getTime())) {
        return '-';
      }
      
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      
      return `${dia}/${mes}/${ano}`;
      
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  };

  // Processar métricas por tipo de atividade
  const processarMetricas = () => {
    if (!metricas || !metricas.metricas) return [];
    
    return metricas.metricas.map(metrica => {
      const nomeAtividade = TIPO_ATIVIDADE_MAP[metrica.tipo] || metrica.tipo;
      
      return {
        ...metrica,
        nomeAtividade,
        atividade: atividadesSquad?.find(a => a.titulo === nomeAtividade)
      };
    });
  };

  // Criar dados para gráfico de pizza geral
  const getPizzaChartData = () => {
    const metricasProcessadas = processarMetricas();
    
    if (!metricasProcessadas || metricasProcessadas.length === 0) return null;

    // Somar todos os previstos e realizados
    const totalPrevisto = metricasProcessadas.reduce((sum, m) => sum + m.qt_previsto, 0);
    const totalRealizado = metricasProcessadas.reduce((sum, m) => sum + m.qt_realizado, 0);
    const totalPendente = Math.max(0, totalPrevisto - totalRealizado);

    return {
      labels: ['Realizado', 'Pendente'],
      datasets: [{
        label: 'Quantidade',
        data: [totalRealizado, totalPendente],
        backgroundColor: [
          'rgba(46, 204, 113, 0.8)',
          'rgba(231, 76, 60, 0.8)'
        ],
        borderColor: [
          'rgba(46, 204, 113, 1)',
          'rgba(231, 76, 60, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  // Criar dados para gráfico de barras por tipo
  const getBarChartData = () => {
    const metricasProcessadas = processarMetricas();
    
    if (!metricasProcessadas || metricasProcessadas.length === 0) return null;

    const labels = metricasProcessadas.map(m => m.nomeAtividade);
    const previstos = metricasProcessadas.map(m => m.qt_previsto);
    const realizados = metricasProcessadas.map(m => m.qt_realizado);

    return {
      labels,
      datasets: [
        {
          label: 'Previsto',
          data: previstos,
          backgroundColor: 'rgba(52, 152, 219, 0.8)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2
        },
        {
          label: 'Realizado',
          data: realizados,
          backgroundColor: 'rgba(46, 204, 113, 0.8)',
          borderColor: 'rgba(46, 204, 113, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  // Gerar alertas de observações e indevidos
  const getAlertas = () => {
    const metricasProcessadas = processarMetricas();
    const alertas = [];

    metricasProcessadas.forEach(metrica => {
      // Alerta de indevidos
      if (metrica.qt_indevido > 0) {
        alertas.push({
          tipo: 'indevido',
          atividade: metrica.nomeAtividade,
          mensagem: `${metrica.qt_indevido} solicitação(ões) indevida(s)`,
          cor: '#f39c12'
        });
      }

      // Alerta de observação da atividade
      if (metrica.atividade && metrica.atividade.observacao) {
        alertas.push({
          tipo: 'observacao',
          atividade: metrica.nomeAtividade,
          mensagem: metrica.atividade.observacao,
          cor: '#3498db'
        });
      }
    });

    return alertas;
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (!metricas || !metricas.metricas || metricas.metricas.length === 0) {
    return (
      <div className="recodificacao-charts-empty">
        <p>Nenhum dado disponível para este projeto</p>
      </div>
    );
  }

  const metricasProcessadas = processarMetricas();
  const alertas = getAlertas();
  
  // Calcular totais
  const totalPrevisto = metricasProcessadas.reduce((sum, m) => sum + m.qt_previsto, 0);
  const totalRealizado = metricasProcessadas.reduce((sum, m) => sum + m.qt_realizado, 0);
  const totalIndevido = metricasProcessadas.reduce((sum, m) => sum + m.qt_indevido, 0);
  
  // Percentual geral
  const percentualGeral = totalPrevisto > 0 
    ? totalRealizado >= totalPrevisto 
      ? 100.0 
      : ((totalRealizado / totalPrevisto) * 100).toFixed(2)
    : 0;

  return (
    <div className="recodificacao-charts">
      {/* Título do Projeto */}
      {nomeProjeto && (
        <div className="projeto-titulo">
          <h3>
            <FontAwesomeIcon icon={faChartPie} style={{ marginRight: '10px', color: '#9b59b6' }} />
            {nomeProjeto}
          </h3>
        </div>
      )}

      {/* Cabeçalho com métricas gerais */}
      <div className="recodificacao-metricas" style={{ marginTop: nomeProjeto ? '25px' : '0' }}>
        <div className="metrica-card">
          <div className="metrica-label">Total Previsto</div>
          <div className="metrica-valor">{totalPrevisto}</div>
        </div>
        
        <div className="metrica-card">
          <div className="metrica-label">Total Realizado</div>
          <div className="metrica-valor success">{totalRealizado}</div>
        </div>
        
        {totalIndevido > 0 && (
          <div className="metrica-card warning">
            <div className="metrica-label">Total Indevidos</div>
            <div className="metrica-valor">{totalIndevido}</div>
          </div>
        )}
        
        <div className="metrica-card destaque">
          <div className="metrica-label">% Conclusão Geral</div>
          <div className="metrica-valor">{percentualGeral}%</div>
          <div className="progress-bar-mini">
            <div 
              className="progress-fill-mini" 
              style={{ width: `${percentualGeral}%` }}
            />
          </div>
        </div>

        <div className="metrica-card info">
          <div className="metrica-label">Última Atualização</div>
          <div className="metrica-valor-small">
            {metricasProcessadas.length > 0 
              ? formatarData(metricasProcessadas[0].dt_criacao)
              : '-'}
          </div>
        </div>
      </div>

      {/* Detalhamento por Tipo de Atividade */}
      <div className="atividades-detalhamento">
        <h4 className="detalhamento-title">
          <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '8px' }} />
          Detalhamento por Atividade
        </h4>
        <div className="atividades-grid">
          {metricasProcessadas.map((metrica, index) => (
            <div key={index} className="atividade-card">
              <div className="atividade-header">
                <strong>{metrica.nomeAtividade}</strong>
                <span className={`percentual-badge ${metrica.percentual_conclusao >= 100 ? 'concluido' : 'pendente'}`}>
                  {metrica.percentual_conclusao.toFixed(1)}%
                </span>
              </div>
              <div className="atividade-stats">
                <div className="stat-row">
                  <span className="stat-label">Previsto:</span>
                  <span className="stat-value">{metrica.qt_previsto}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Realizado:</span>
                  <span className="stat-value success">{metrica.qt_realizado}</span>
                </div>
                {metrica.qt_indevido > 0 && (
                  <div className="stat-row">
                    <span className="stat-label">Indevidos:</span>
                    <span className="stat-value warning">{metrica.qt_indevido}</span>
                  </div>
                )}
              </div>
              <div className="atividade-progress">
                <div className="progress-bar-small">
                  <div 
                    className="progress-fill-small" 
                    style={{ 
                      width: `${Math.min(metrica.percentual_conclusao, 100)}%`,
                      backgroundColor: metrica.percentual_conclusao >= 100 ? '#2ecc71' : '#3498db'
                    }}
                  />
                </div>
              </div>
              {metrica.atividade && metrica.atividade.observacao && (
                <div className="atividade-observacao">
                  <FontAwesomeIcon icon={faInfoCircle} className="obs-icon" />
                  <span className="obs-text">{metrica.atividade.observacao}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="alertas-container">
          <h4 className="alertas-title">
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
            Alertas e Observações
          </h4>
          <div className="alertas-list">
            {alertas.map((alerta, index) => (
              <div key={index} className="alerta-item" style={{ borderLeftColor: alerta.cor }}>
                <strong>{alerta.atividade}:</strong> {alerta.mensagem}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="charts-row">
        {/* Gráfico de Pizza - Resumo Geral */}
        <div className="chart-container half">
          <div className="chart-wrapper">
            <h4 className="chart-title">
              <FontAwesomeIcon icon={faChartPie} style={{ marginRight: '10px', color: '#9b59b6' }} />
              Resumo Geral
            </h4>
            <div style={{ height: '300px' }}>
              <Doughnut data={getPizzaChartData()} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Gráfico de Barras - Por Tipo */}
        <div className="chart-container half">
          <div className="chart-wrapper">
            <h4 className="chart-title">
              <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '10px', color: '#9b59b6' }} />
              Previsto x Realizado
            </h4>
            <div style={{ height: '300px' }}>
              <Bar data={getBarChartData()} options={barOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecodificacaoCharts;