import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut, Bar } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
  faHistory,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import '../styles/RecodificacaoCharts.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
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
  const [modalAberto, setModalAberto] = useState(false);
  const [observacaoSelecionada, setObservacaoSelecionada] = useState(null);
  const [chartsReady, setChartsReady] = useState(false);

  // Força re-renderização dos gráficos após o DOM estar pronto
  useEffect(() => {
    setChartsReady(false);
    const timer = setTimeout(() => {
      setChartsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [cdProjeto, metricas]);

  // Função para abrir modal de observações
  const abrirModal = (metrica) => {
    setObservacaoSelecionada(metrica);
    setModalAberto(true);
  };

  // Função para fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setObservacaoSelecionada(null);
  };

  // Função para formatar data (apenas data)
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

  // Função para formatar data e hora (para histórico)
  const formatarDataHora = (dataString) => {
    if (!dataString) return '-';

    try {
      const data = new Date(dataString);

      if (isNaN(data.getTime())) {
        return '-';
      }

      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      const horas = String(data.getHours()).padStart(2, '0');
      const minutos = String(data.getMinutes()).padStart(2, '0');

      return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;

    } catch (error) {
      console.error('Erro ao formatar data e hora:', error);
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
  const getAlertas = (totalPrevisto, totalRealizado, totalIndevido) => {
    const metricasProcessadas = processarMetricas();
    const alertas = [];

    // Alerta geral se não atingiu 100%
    const totalRealizadoComIndevido = totalRealizado + totalIndevido;
    const percentualAtual = totalPrevisto > 0 ? ((totalRealizadoComIndevido / totalPrevisto) * 100) : 0;

    if (percentualAtual < 100 && totalPrevisto > 0) {
      const diferencaFaltante = totalPrevisto - totalRealizadoComIndevido;
      alertas.push({
        tipo: 'pendente',
        atividade: 'Geral',
        mensagem: `Faltam ${diferencaFaltante} solicitação(ões) para atingir 100% (${(100 - percentualAtual).toFixed(1)}% restante)`,
        cor: '#e74c3c'
      });
    }

    metricasProcessadas.forEach(metrica => {
      // Alerta de atividade individual que não atingiu 100%
      const realizadoComIndevido = metrica.qt_realizado + metrica.qt_indevido;
      const percentualAtividade = metrica.qt_previsto > 0 ? ((realizadoComIndevido / metrica.qt_previsto) * 100) : 0;

      if (percentualAtividade < 100 && metrica.qt_previsto > 0) {
        const faltante = metrica.qt_previsto - realizadoComIndevido;
        alertas.push({
          tipo: 'pendente_atividade',
          atividade: metrica.nomeAtividade,
          mensagem: `Faltam ${faltante} solicitação(ões) para completar (${(100 - percentualAtividade).toFixed(1)}% restante)`,
          cor: '#f39c12'
        });
      }
    });

    return alertas;
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateScale: true,
      animateRotate: true
    },
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
    animation: {
      duration: 750
    },
    layout: {
      padding: {
        top: 30  // Espaço para os valores acima das barras
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false
      },
      tooltip: {
        enabled: false  // Desabilitar tooltip
      },
      datalabels: {
        display: true,
        color: '#2c3e50',
        font: {
          size: 12,
          weight: 'bold'
        },
        anchor: 'end',
        align: 'top',
        offset: 4,
        formatter: (value) => value
      }
    },
    scales: {
      y: {
        type: 'logarithmic',
        beginAtZero: false,
        min: 0.1,
        ticks: {
          callback: function(value, index, values) {
            // Mostrar apenas valores inteiros importantes
            if (value === 1 || value === 10 || value === 100 || value === 1000 || value === 10000) {
              return value;
            }
            return null;
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
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

  // Calcular totais
  const totalPrevisto = metricasProcessadas.reduce((sum, m) => sum + m.qt_previsto, 0);
  const totalRealizado = metricasProcessadas.reduce((sum, m) => sum + m.qt_realizado, 0);
  const totalIndevido = metricasProcessadas.reduce((sum, m) => sum + m.qt_indevido, 0);

  // Percentual geral - incluindo indevidos no realizado para bater com previsto
  const totalRealizadoComIndevido = totalRealizado + totalIndevido;
  const percentualGeral = totalPrevisto > 0
    ? totalRealizadoComIndevido >= totalPrevisto
      ? 100.0
      : ((totalRealizadoComIndevido / totalPrevisto) * 100).toFixed(2)
    : 0;

  // Calcular diferença faltante
  const diferencaFaltante = Math.max(0, totalPrevisto - totalRealizadoComIndevido);

  // Gerar alertas após calcular totais
  const alertas = getAlertas(totalPrevisto, totalRealizado, totalIndevido);

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
          {metricasProcessadas.map((metrica, index) => {
            // Calcular percentual incluindo indevidos
            const realizadoComIndevido = metrica.qt_realizado + metrica.qt_indevido;
            const percentualAtividade = metrica.qt_previsto > 0
              ? ((realizadoComIndevido / metrica.qt_previsto) * 100)
              : 0;

            return (
              <div
                key={index}
                className="atividade-card"
              >
                <div className="atividade-header">
                  <strong>{metrica.nomeAtividade}</strong>
                  <span className={`percentual-badge ${percentualAtividade >= 100 ? 'concluido' : 'pendente'}`}>
                    {percentualAtividade.toFixed(1)}%
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
                        width: `${Math.min(percentualAtividade, 100)}%`,
                        backgroundColor: percentualAtividade >= 100 ? '#2ecc71' : '#3498db'
                      }}
                    />
                  </div>
                </div>
                {(metrica.atividade?.observacao || metrica.atividade?.historico_observacoes?.length > 0) && (
                  <button
                    className="btn-observacao"
                    onClick={() => abrirModal(metrica)}
                  >
                    <FontAwesomeIcon icon={faFileAlt} />
                    Ver Observações
                  </button>
                )}
              </div>
            );
          })}
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
              {chartsReady && getPizzaChartData() && (
                <Doughnut
                  key={`doughnut-${cdProjeto}`}
                  data={getPizzaChartData()}
                  options={doughnutOptions}
                  redraw={true}
                />
              )}
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
              {chartsReady && getBarChartData() && (
                <Bar
                  key={`bar-${cdProjeto}`}
                  data={getBarChartData()}
                  options={barOptions}
                  redraw={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Observações - Renderizado via Portal no body */}
      {modalAberto && observacaoSelecionada && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <FontAwesomeIcon icon={faFileAlt} />
                Observações - {observacaoSelecionada.nomeAtividade}
              </h3>
              <button className="modal-close-btn" onClick={fecharModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              {/* Observação Atual */}
              <div className="observacao-atual">
                <div className="observacao-atual-label">Observação Atual:</div>
                <div className="observacao-atual-text">
                  {observacaoSelecionada.atividade?.observacao || 'Nenhuma observação registrada.'}
                </div>
              </div>

              {/* Histórico de Observações */}
              <div className="historico-section">
                <h4 className="historico-title">
                  <FontAwesomeIcon icon={faHistory} />
                  Histórico de Observações
                </h4>
                <div className="historico-lista">
                  {observacaoSelecionada.atividade?.historico_observacoes?.length > 0 ? (
                    observacaoSelecionada.atividade.historico_observacoes.map((hist, index) => (
                      <div key={index} className="historico-item">
                        <div className="historico-item-data">
                          {formatarDataHora(hist.data_criacao)}
                        </div>
                        <div className="historico-item-texto">
                          {hist.observacao}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="sem-historico">
                      <FontAwesomeIcon icon={faHistory} style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.3 }} />
                      <p>Nenhum histórico de observações disponível.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default RecodificacaoCharts;