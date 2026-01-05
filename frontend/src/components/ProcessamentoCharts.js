import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faServer,
  faCheckCircle,
  faBoxArchive,
  faFileImage,
  faCog,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
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

function ProcessamentoCharts({ nomeProjeto, cdProjeto, metricasPacote, metricasDigitalizacao, metricasProcessamento }) {
  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return '-';

    try {
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

  // Calcular percentual
  const calcularPercentual = (valor, total) => {
    if (!total || total === 0) return 0;
    return ((valor / total) * 100).toFixed(2);
  };

  // Determinar qual é a primeira seção com dados
  const isPrimeiraSecao = (secaoAtual) => {
    if (secaoAtual === 'pacote') return true;
    if (secaoAtual === 'digitalizacao') return !metricasPacote;
    if (secaoAtual === 'processamento') return !metricasPacote && !metricasDigitalizacao;
    return false;
  };

  // Determinar qual é a última seção com dados
  const isUltimaSecao = (secaoAtual) => {
    if (secaoAtual === 'processamento') return true;
    if (secaoAtual === 'digitalizacao') return !metricasProcessamento;
    if (secaoAtual === 'pacote') return !metricasDigitalizacao && !metricasProcessamento;
    return false;
  };

  // Criar dados para gráfico de barras de Processamento
  const getProcessamentoChartData = () => {
    if (!metricasProcessamento) return null;

    // Extrair percentuais (remover o símbolo %)
    const pctDigitalizados = parseFloat((metricasProcessamento.PCT_REGISTROS_DIGITALIZADOS || '0%').replace('%', ''));
    const pctProcessados = parseFloat((metricasProcessamento.PCT_REGISTROS_PROCESSADOS || '0%').replace('%', ''));

    return {
      labels: [cdProjeto || 'Projeto'],
      datasets: [
        {
          label: 'Digitalizados',
          data: [pctDigitalizados],
          backgroundColor: 'rgba(46, 204, 113, 0.8)',
          borderColor: 'rgba(46, 204, 113, 1)',
          borderWidth: 2
        },
        {
          label: 'Processados',
          data: [pctProcessados],
          backgroundColor: 'rgba(52, 152, 219, 0.8)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '%';
          }
        }
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
        formatter: (value) => value.toFixed(2) + '%'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        title: {
          display: true,
          text: 'Percentual (%)',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        title: {
          display: true,
          text: 'Código do Projeto',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    }
  };

  return (
    <div className="recodificacao-charts">
      {/* Título do Projeto */}
      {nomeProjeto && (
        <div className="projeto-titulo">
          <h3>
            <FontAwesomeIcon icon={faServer} style={{ marginRight: '10px', color: '#3498db' }} />
            {nomeProjeto}
          </h3>
        </div>
      )}

      {/* Seção Frop Pacote */}
      {metricasPacote && (
        <div className="atividades-detalhamento" style={{
          marginTop: nomeProjeto && isPrimeiraSecao('pacote') ? '25px' : '0',
          marginBottom: '0',
          paddingBottom: isUltimaSecao('pacote') ? '20px' : '0'
        }}>
          <h4 className="detalhamento-title">
            <FontAwesomeIcon icon={faBoxArchive} style={{ marginRight: '8px' }} />
            Frop Pacote
          </h4>
          <div className="recodificacao-metricas">
            <div className="metrica-card">
              <div className="metrica-label">Pacotes Planejados</div>
              <div className="metrica-valor">{metricasPacote.QT_PACOTE_PLANEJADO || 0}</div>
            </div>

            <div className="metrica-card">
              <div className="metrica-label">Pacotes no SIA</div>
              <div className="metrica-valor success">{metricasPacote.QT_PACOTE_SIA || 0}</div>
            </div>

            <div className="metrica-card">
              <div className="metrica-label">Pacotes Ausentes</div>
              <div className="metrica-valor" style={{ color: '#e74c3c' }}>{metricasPacote.QT_PACOTE_AUSENTE || 0}</div>
              <div className="metrica-label" style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
                {metricasPacote.PCT_PACOTE_AUSENTE || '0%'} do total
              </div>
            </div>

            <div className="metrica-card info">
              <div className="metrica-label">Última Atualização</div>
              <div className="metrica-valor-small">{formatarData(metricasPacote.DT_EXPORTACAO)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Seção Frop Digitalização */}
      {metricasDigitalizacao && (
        <div className="atividades-detalhamento" style={{
          marginTop: nomeProjeto && isPrimeiraSecao('digitalizacao') ? '25px' : '0',
          marginBottom: '0',
          paddingBottom: isUltimaSecao('digitalizacao') ? '20px' : '0'
        }}>
          <h4 className="detalhamento-title">
            <FontAwesomeIcon icon={faFileImage} style={{ marginRight: '8px' }} />
            Frop Digitalização
          </h4>
          <div className="recodificacao-metricas">
            <div className="metrica-card">
              <div className="metrica-label">Instrumentos Previstos</div>
              <div className="metrica-valor">{metricasDigitalizacao.QT_INSTRUMENTO_PREVISTO || 0}</div>
            </div>

            <div className="metrica-card">
              <div className="metrica-label">Instrumentos Digitalizados</div>
              <div className="metrica-valor success">{metricasDigitalizacao.QT_INSTRUMENTO_DIGITALIZADO || 0}</div>
            </div>

            <div className="metrica-card">
              <div className="metrica-label">Percentual Digitalizado</div>
              <div className="metrica-valor" style={{ color: '#3498db' }}>
                {metricasDigitalizacao.PCT_INSTRUMENTO_DIGITALIZADO || '0%'}
              </div>
            </div>

            <div className="metrica-card info">
              <div className="metrica-label">Última Atualização</div>
              <div className="metrica-valor-small">{formatarData(metricasDigitalizacao.DT_EXPORTACAO)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Seção Processamento */}
      {metricasProcessamento && (
        <div className="atividades-detalhamento" style={{
          marginTop: nomeProjeto && isPrimeiraSecao('processamento') ? '25px' : '0',
          marginBottom: '0',
          paddingBottom: isUltimaSecao('processamento') ? '20px' : '0'
        }}>
          <h4 className="detalhamento-title">
            <FontAwesomeIcon icon={faCog} style={{ marginRight: '8px' }} />
            Processamento
          </h4>
          <div className="recodificacao-metricas">
            <div className="metrica-card">
              <div className="metrica-label">Registros Previstos</div>
              <div className="metrica-valor">{metricasProcessamento.QT_REGISTROS_PREVISTOS || 0}</div>
            </div>

            <div className="metrica-card">
              <div className="metrica-label">Digitalização</div>
              <div className="metrica-valor success">{metricasProcessamento.QT_REGISTROS_DIGITALIZADOS || 0}</div>
              <div className="metrica-label" style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
                {metricasProcessamento.PCT_REGISTROS_DIGITALIZADOS || '0%'} digitalizados
              </div>
            </div>

            <div className="metrica-card">
              <div className="metrica-label">Decodificação</div>
              <div className="metrica-valor success">{metricasProcessamento.QT_REGISTROS_DECODIFICADOS || 0}</div>
            </div>

            <div className="metrica-card">
              <div className="metrica-label">Processamento</div>
              <div className="metrica-valor success">{metricasProcessamento.QT_REGISTROS_PROCESSADOS || 0}</div>
              <div className="metrica-label" style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
                {metricasProcessamento.PCT_REGISTROS_PROCESSADOS || '0%'} processados
              </div>
            </div>

            <div className="metrica-card">
              <div className="metrica-label">Não Processados</div>
              <div className="metrica-valor" style={{ color: '#e74c3c' }}>{metricasProcessamento.QT_REGISTROS_NAO_PROCESSADOS || 0}</div>
            </div>

            <div className="metrica-card info">
              <div className="metrica-label">Última Atualização</div>
              <div className="metrica-valor-small">{formatarData(metricasProcessamento.DT_EXPORTACAO)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Processamento */}
      {metricasProcessamento && getProcessamentoChartData() && (
        <div className="charts-row" style={{ paddingBottom: '20px' }}>
          <div className="chart-container" style={{ width: '100%' }}>
            <div className="chart-wrapper">
              <h4 className="chart-title">
                <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '10px', color: '#3498db' }} />
                Comparativo de Registros - Digitalização vs Processamento
              </h4>
              <div style={{ height: '300px' }}>
                <Bar data={getProcessamentoChartData()} options={barOptions} />
              </div>
            </div>
          </div>
        </div>
      )}

      {!metricasPacote && !metricasDigitalizacao && !metricasProcessamento && (
        <div className="recodificacao-charts-empty">
          <p>Nenhum dado disponível para este projeto</p>
        </div>
      )}
    </div>
  );
}

export default ProcessamentoCharts;
