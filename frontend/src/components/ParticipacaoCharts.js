import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import '../styles/ParticipacaoCharts.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function ParticipacaoCharts({ cdProjeto, participacaoData, nomeProjeto }) {
  // Função para formatar percentual
  const formatarPercentual = (percentualStr) => {
    if (!percentualStr) return '-';
    return percentualStr;
  };

  // Função para formatar número
  const formatarNumero = (numero) => {
    if (numero === null || numero === undefined) return '-';
    return numero.toLocaleString('pt-BR');
  };

  // Processar dados de participação
  const processarDados = () => {
    if (!participacaoData || !participacaoData.DADO_PARTICIPACAO) return [];

    return participacaoData.DADO_PARTICIPACAO;
  };

  // Criar dados para gráfico de barras de Língua Portuguesa
  const getLinguaPortuguesaChartData = () => {
    const dados = processarDados();

    if (!dados || dados.length === 0) return null;

    const labels = dados.map(item => item['Resumo da Avaliação']);
    const quantidades = dados.map(item => item['Língua Portuguesa - Quantidade']);

    return {
      labels,
      datasets: [
        {
          label: 'Língua Portuguesa',
          data: quantidades,
          backgroundColor: 'rgba(52, 152, 219, 0.8)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  // Criar dados para gráfico de barras de Matemática
  const getMatematicaChartData = () => {
    const dados = processarDados();

    if (!dados || dados.length === 0) return null;

    const labels = dados.map(item => item['Resumo da Avaliação']);
    const quantidades = dados.map(item => item['Matemática - Quantidade']);

    return {
      labels,
      datasets: [
        {
          label: 'Matemática',
          data: quantidades,
          backgroundColor: 'rgba(155, 89, 182, 0.8)',
          borderColor: 'rgba(155, 89, 182, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  // Criar dados para gráfico comparativo
  const getComparativoChartData = () => {
    const dados = processarDados();

    if (!dados || dados.length === 0) return null;

    const labels = dados.map(item => item['Resumo da Avaliação']);
    const linguaPortuguesa = dados.map(item => item['Língua Portuguesa - Quantidade']);
    const matematica = dados.map(item => item['Matemática - Quantidade']);

    return {
      labels,
      datasets: [
        {
          label: 'Língua Portuguesa',
          data: linguaPortuguesa,
          backgroundColor: 'rgba(52, 152, 219, 0.8)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2
        },
        {
          label: 'Matemática',
          data: matematica,
          backgroundColor: 'rgba(155, 89, 182, 0.8)',
          borderColor: 'rgba(155, 89, 182, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  // Opções dos gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatarNumero(context.parsed.y)} turmas`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatarNumero(value);
          }
        }
      }
    }
  };

  const dados = processarDados();
  const linguaPortuguesaData = getLinguaPortuguesaChartData();
  const matematicaData = getMatematicaChartData();
  const comparativoData = getComparativoChartData();

  // Função para obter ícone por tipo de resumo
  const getIconePorResumo = (resumo) => {
    if (resumo.includes('baixa participação')) return faExclamationTriangle;
    if (resumo.includes('sem participação')) return faTimesCircle;
    if (resumo.includes('com resultados')) return faCheckCircle;
    return faUsers;
  };

  // Função para obter classe CSS por tipo de resumo
  const getClassePorResumo = (resumo) => {
    if (resumo.includes('baixa participação')) return 'card-warning';
    if (resumo.includes('sem participação')) return 'card-danger';
    if (resumo.includes('com resultados')) return 'card-success';
    return 'card-info';
  };

  if (!participacaoData || !participacaoData.DADO_PARTICIPACAO) {
    return (
      <div className="participacao-charts-container">
        <div className="sem-dados">
          <FontAwesomeIcon icon={faUsers} size="3x" />
          <p>Nenhum dado de participação disponível para este projeto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="participacao-charts-container">
      <div className="participacao-header">
        <h2>
          <FontAwesomeIcon icon={faUsers} /> Indicadores de Participação
        </h2>
        {nomeProjeto && <p className="projeto-nome">{nomeProjeto}</p>}
      </div>

      {/* Cards de Resumo */}
      <div className="cards-resumo">
        {dados.map((item, index) => (
          <div key={index} className={`card-resumo ${getClassePorResumo(item['Resumo da Avaliação'])}`}>
            <div className="card-header">
              <FontAwesomeIcon icon={getIconePorResumo(item['Resumo da Avaliação'])} size="2x" />
              <h3>{item['Resumo da Avaliação']}</h3>
            </div>
            <div className="card-content">
              <div className="disciplina">
                <h4>Língua Portuguesa</h4>
                <p className="quantidade">{formatarNumero(item['Língua Portuguesa - Quantidade'])} turmas</p>
                <p className="percentual">{formatarPercentual(item['Língua Portuguesa - Percentual'])}</p>
              </div>
              <div className="disciplina">
                <h4>Matemática</h4>
                <p className="quantidade">{formatarNumero(item['Matemática - Quantidade'])} turmas</p>
                <p className="percentual">{formatarPercentual(item['Matemática - Percentual'])}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="graficos-container">
        {/* Gráfico Comparativo */}
        {comparativoData && (
          <div className="grafico-card">
            <h3>
              <FontAwesomeIcon icon={faChartBar} /> Comparativo por Disciplina
            </h3>
            <div className="grafico-wrapper">
              <Bar data={comparativoData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Gráfico Língua Portuguesa */}
        {linguaPortuguesaData && (
          <div className="grafico-card">
            <h3>
              <FontAwesomeIcon icon={faChartBar} /> Língua Portuguesa
            </h3>
            <div className="grafico-wrapper">
              <Bar data={linguaPortuguesaData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Gráfico Matemática */}
        {matematicaData && (
          <div className="grafico-card">
            <h3>
              <FontAwesomeIcon icon={faChartBar} /> Matemática
            </h3>
            <div className="grafico-wrapper">
              <Bar data={matematicaData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParticipacaoCharts;
