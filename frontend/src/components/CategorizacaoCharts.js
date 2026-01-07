import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faListCheck,
  faCheckCircle,
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import '../styles/RecodificacaoCharts.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

function CategorizacaoCharts({ metricas, nomeProjeto }) {
  const tarefasVisiveis = ['T1', 'T2', 'T3', 'T4'];
  const [chartsReady, setChartsReady] = useState(false);

  // Força re-renderização dos gráficos após o DOM estar pronto
  useEffect(() => {
    setChartsReady(false);
    const timer = setTimeout(() => {
      setChartsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [nomeProjeto, metricas]);

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return '-';

    try {
      // Se vier no formato "DD/MM/YYYY às HH:MM"
      if (typeof dataString === 'string' && dataString.includes(' às ')) {
        return dataString;
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

  // Criar dados para gráfico de barras
  const getBarChartData = () => {
    if (!metricas) return null;

    // Dados completos - T4 consolida os 3 tipos
    const allData = {
      T1: { label: 'T1', previsto: metricas.PREVISTO_T1 || 0, efetivo: metricas.EFETIVO_T1 || 0 },
      T2: { label: 'T2', previsto: metricas.PREVISTO_T2 || 0, efetivo: metricas.EFETIVO_T2 || 0 },
      T3: { label: 'T3', previsto: metricas.PREVISTO_T3 || 0, efetivo: metricas.EFETIVO_T3 || 0 },
      T4: {
        label: 'T4',
        previsto: metricas.PREVISTO_T4 || 0,
        efetivo: (metricas.EFETIVO_T4_1 || 0) + (metricas.EFETIVO_T4_2 || 0) + (metricas.EFETIVO_T4_3 || 0)
      }
    };

    // Filtrar baseado nas tarefas visíveis
    const dadosFiltrados = tarefasVisiveis.map(tarefa => allData[tarefa]).filter(Boolean);

    const labels = dadosFiltrados.map(d => d.label);
    const previstos = dadosFiltrados.map(d => d.previsto);
    const efetivos = dadosFiltrados.map(d => d.efetivo);

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
          data: efetivos,
          backgroundColor: 'rgba(46, 204, 113, 0.8)',
          borderColor: 'rgba(46, 204, 113, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750
    },
    layout: {
      padding: {
        top: 30
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
        enabled: false
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
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return Number.isInteger(value) ? value : null;
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

  if (!metricas) {
    return (
      <div className="recodificacao-charts-empty">
        <p>Nenhum dado disponível para este projeto</p>
      </div>
    );
  }

  // Calcular totais baseado nas tarefas visíveis
  const calcularTotais = () => {
    let previsto = 0;
    let efetivo = 0;

    if (tarefasVisiveis.includes('T1')) {
      previsto += metricas.PREVISTO_T1 || 0;
      efetivo += metricas.EFETIVO_T1 || 0;
    }
    if (tarefasVisiveis.includes('T2')) {
      previsto += metricas.PREVISTO_T2 || 0;
      efetivo += metricas.EFETIVO_T2 || 0;
    }
    if (tarefasVisiveis.includes('T3')) {
      previsto += metricas.PREVISTO_T3 || 0;
      efetivo += metricas.EFETIVO_T3 || 0;
    }
    if (tarefasVisiveis.includes('T4')) {
      previsto += metricas.PREVISTO_T4 || 0;
      efetivo += (metricas.EFETIVO_T4_1 || 0) + (metricas.EFETIVO_T4_2 || 0) + (metricas.EFETIVO_T4_3 || 0);
    }

    return { previsto, efetivo };
  };

  const { previsto: totalPrevisto, efetivo: totalEfetivo } = calcularTotais();

  // Calcular percentuais por tarefa
  const calcularPercentual = (efetivo, previsto) => {
    if (!previsto || previsto === 0) return 0;
    const percentual = (efetivo / previsto) * 100;
    // Retornar com 2 casas decimais para mais precisão
    return percentual.toFixed(2);
  };

  return (
    <div className="recodificacao-charts">
      {/* Título do Projeto */}
      {nomeProjeto && (
        <div className="projeto-titulo">
          <h3>
            <FontAwesomeIcon icon={faListCheck} style={{ marginRight: '10px', color: '#3498db' }} />
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
          <div className="metrica-valor success">{totalEfetivo}</div>
        </div>

        <div className="metrica-card info">
          <div className="metrica-label">Última Atualização</div>
          <div className="metrica-valor-small">
            {formatarData(metricas.DT_EXPORTACAO)}
          </div>
        </div>
      </div>

      {/* Detalhamento por Tarefa */}
      <div className="atividades-detalhamento">
        <h4 className="detalhamento-title">
          <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '8px' }} />
          Detalhamento por Tarefa
        </h4>
        <div className="atividades-grid">
          {/* T1 */}
          {tarefasVisiveis.includes('T1') && (
          <div className="atividade-card">
            <div className="atividade-header">
              <strong>T1</strong>
              <span className={`percentual-badge ${calcularPercentual(metricas.EFETIVO_T1, metricas.PREVISTO_T1) >= 100 ? 'concluido' : 'pendente'}`}>
                {calcularPercentual(metricas.EFETIVO_T1, metricas.PREVISTO_T1)}%
              </span>
            </div>
            <div className="atividade-stats">
              <div className="stat-row">
                <span className="stat-label">Previsto:</span>
                <span className="stat-value">{metricas.PREVISTO_T1 || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Realizado:</span>
                <span className="stat-value success">{metricas.EFETIVO_T1 || 0}</span>
              </div>
            </div>
            <div className="atividade-progress">
              <div className="progress-bar-small">
                <div
                  className="progress-fill-small"
                  style={{
                    width: `${Math.min(calcularPercentual(metricas.EFETIVO_T1, metricas.PREVISTO_T1), 100)}%`,
                    backgroundColor: calcularPercentual(metricas.EFETIVO_T1, metricas.PREVISTO_T1) >= 100 ? '#2ecc71' : '#3498db'
                  }}
                />
              </div>
            </div>
          </div>
          )}

          {/* T2 */}
          {tarefasVisiveis.includes('T2') && (
          <div className="atividade-card">
            <div className="atividade-header">
              <strong>T2</strong>
              <span className={`percentual-badge ${calcularPercentual(metricas.EFETIVO_T2, metricas.PREVISTO_T2) >= 100 ? 'concluido' : 'pendente'}`}>
                {calcularPercentual(metricas.EFETIVO_T2, metricas.PREVISTO_T2)}%
              </span>
            </div>
            <div className="atividade-stats">
              <div className="stat-row">
                <span className="stat-label">Previsto:</span>
                <span className="stat-value">{metricas.PREVISTO_T2 || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Realizado:</span>
                <span className="stat-value success">{metricas.EFETIVO_T2 || 0}</span>
              </div>
            </div>
            <div className="atividade-progress">
              <div className="progress-bar-small">
                <div
                  className="progress-fill-small"
                  style={{
                    width: `${Math.min(calcularPercentual(metricas.EFETIVO_T2, metricas.PREVISTO_T2), 100)}%`,
                    backgroundColor: calcularPercentual(metricas.EFETIVO_T2, metricas.PREVISTO_T2) >= 100 ? '#2ecc71' : '#3498db'
                  }}
                />
              </div>
            </div>
          </div>
          )}

          {/* T3 */}
          {tarefasVisiveis.includes('T3') && (
          <div className="atividade-card">
            <div className="atividade-header">
              <strong>T3</strong>
              <span className={`percentual-badge ${calcularPercentual(metricas.EFETIVO_T3, metricas.PREVISTO_T3) >= 100 ? 'concluido' : 'pendente'}`}>
                {calcularPercentual(metricas.EFETIVO_T3, metricas.PREVISTO_T3)}%
              </span>
            </div>
            <div className="atividade-stats">
              <div className="stat-row">
                <span className="stat-label">Previsto:</span>
                <span className="stat-value">{metricas.PREVISTO_T3 || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Realizado:</span>
                <span className="stat-value success">{metricas.EFETIVO_T3 || 0}</span>
              </div>
            </div>
            <div className="atividade-progress">
              <div className="progress-bar-small">
                <div
                  className="progress-fill-small"
                  style={{
                    width: `${Math.min(calcularPercentual(metricas.EFETIVO_T3, metricas.PREVISTO_T3), 100)}%`,
                    backgroundColor: calcularPercentual(metricas.EFETIVO_T3, metricas.PREVISTO_T3) >= 100 ? '#2ecc71' : '#3498db'
                  }}
                />
              </div>
            </div>
          </div>
          )}

          {/* T4 - Consolidado (Sujeito + Dedução + Recuperação) */}
          {tarefasVisiveis.includes('T4') && (
          <div className="atividade-card">
            <div className="atividade-header">
              <strong>T4</strong>
            </div>
            <div className="atividade-stats">
              <div className="stat-row">
                <span className="stat-label">Previsto:</span>
                <span className="stat-value">{metricas.PREVISTO_T4 || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Realizado:</span>
                <span className="stat-value success">{(metricas.EFETIVO_T4_1 || 0) + (metricas.EFETIVO_T4_2 || 0) + (metricas.EFETIVO_T4_3 || 0)}</span>
              </div>
              <div className="stat-row stat-row-detail">
                <span className="stat-label-small">• Sujeito:</span>
                <span className="stat-value-small">{metricas.EFETIVO_T4_1 || 0}</span>
              </div>
              <div className="stat-row stat-row-detail">
                <span className="stat-label-small">• Dedução:</span>
                <span className="stat-value-small">{metricas.EFETIVO_T4_2 || 0}</span>
              </div>
              <div className="stat-row stat-row-detail">
                <span className="stat-label-small">• Recuperação:</span>
                <span className="stat-value-small">{metricas.EFETIVO_T4_3 || 0}</span>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Gráfico de Barras */}
      <div className="charts-row">
        <div className="chart-container full">
          <div className="chart-wrapper">
            <h4 className="chart-title">
              <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '10px', color: '#3498db' }} />
              Previsto x Realizado por Tarefa
            </h4>
            <div style={{ height: '350px' }}>
              {chartsReady && getBarChartData() && (
                <Bar
                  key={`bar-categorizacao-${nomeProjeto}`}
                  data={getBarChartData()}
                  options={barOptions}
                  redraw={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategorizacaoCharts;
