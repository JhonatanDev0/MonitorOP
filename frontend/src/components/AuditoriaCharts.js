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
import { Doughnut } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import '../styles/AuditoriaCharts.css';

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

function AuditoriaCharts({ cdProjeto, dados, atividadesSquad, nomeProjeto }) {

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    
    try {
      // Se for string no formato YYYY-MM-DD
      if (typeof dataString === 'string' && dataString.includes('-')) {
        const partes = dataString.split('T')[0].split('-'); // Remove hora se tiver
        const [ano, mes, dia] = partes;
        return `${dia}/${mes}/${ano}`;
      }
      
      // Se for string no formato DD/MM/YYYY (já formatada)
      if (typeof dataString === 'string' && dataString.includes('/')) {
        return dataString;
      }
      
      // Tentar converter para Date
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

  // Configuração do gráfico de pizza (Doughnut)
  const getPizzaChartData = () => {
    if (!dados || dados.length === 0) return null;

    const dadoAtual = dados[dados.length - 1]; // Último registro

    return {
      labels: ['Transcrição Realizada', 'Transcrição Pendente'],
      datasets: [{
        label: 'Pacotes',
        data: [
          dadoAtual.QT_PACOTE_TRANSCRICAO,
          dadoAtual.QT_PACOTE_PREVISTO_TRANSCRICAO - dadoAtual.QT_PACOTE_TRANSCRICAO
        ],
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

  // Gerar alertas de prazo
  const getAlertasPrazo = () => {
    if (!atividadesSquad || atividadesSquad.length === 0) return [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const alertas = [];

    atividadesSquad.forEach(atividade => {
      const fimProgramado = atividade.fim_programado ? new Date(atividade.fim_programado) : null;
      const fimRealizado = atividade.fim_realizado ? new Date(atividade.fim_realizado) : null;

      if (fimProgramado) {
        fimProgramado.setHours(0, 0, 0, 0);
      }
      if (fimRealizado) {
        fimRealizado.setHours(0, 0, 0, 0);
      }

      // Atividade não concluída e atrasada
      if (atividade.status !== 'concluida' && fimProgramado && hoje > fimProgramado) {
        const diasAtraso = Math.ceil((hoje - fimProgramado) / (1000 * 60 * 60 * 24));
        alertas.push({
          tipo: 'atrasada',
          atividade: atividade.titulo,
          mensagem: `Atrasada há ${diasAtraso} dia(s)`,
          cor: '#e74c3c',
          observacao: atividade.observacao
        });
      }
      // Atividade concluída com atraso
      else if (atividade.status === 'concluida' && fimRealizado && fimProgramado && fimRealizado > fimProgramado) {
        const diasAtraso = Math.ceil((fimRealizado - fimProgramado) / (1000 * 60 * 60 * 24));
        alertas.push({
          tipo: 'concluida_atrasada',
          atividade: atividade.titulo,
          mensagem: `Concluída com ${diasAtraso} dia(s) de atraso`,
          cor: '#f39c12',
          observacao: atividade.observacao
        });
      }
      // Atividade próxima do prazo (menos de 3 dias)
      else if (atividade.status !== 'concluida' && fimProgramado) {
        const diasRestantes = Math.ceil((fimProgramado - hoje) / (1000 * 60 * 60 * 24));
        if (diasRestantes >= 0 && diasRestantes <= 3) {
          alertas.push({
            tipo: 'prazo_proximo',
            atividade: atividade.titulo,
            mensagem: `Vence em ${diasRestantes} dia(s)`,
            cor: '#f39c12',
            observacao: atividade.observacao
          });
        }
      }
    });

    return alertas;
  };

  // Criar lista de atividades com observação (mesmo sem alerta)
  const getAtividadesComObservacao = () => {
    if (!atividadesSquad || atividadesSquad.length === 0) return [];

    // Pegar todas as atividades que têm observação
    return atividadesSquad
      .filter(a => a.observacao && a.observacao.trim() !== '')
      .map(a => ({
        titulo: a.titulo,
        observacao: a.observacao,
        status: a.status
      }));
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

  if (!dados || dados.length === 0) {
    return (
      <div className="auditoria-charts-empty">
        <p>Nenhum dado disponível para este projeto</p>
      </div>
    );
  }

  const dadoAtual = dados[dados.length - 1];
  const percentualConclusao = dadoAtual.PCT_PACOTE_TRANSCRICAO || 0;
  const alertasPrazo = getAlertasPrazo();
  const atividadesComObservacao = getAtividadesComObservacao();

  return (
    <div className="auditoria-charts">
      {/* Título do Projeto */}
      {nomeProjeto && (
        <div className="projeto-titulo">
          <h3>
            <FontAwesomeIcon icon={faChartPie} style={{ marginRight: '10px', color: '#3498db' }} />
            {nomeProjeto}
          </h3>
        </div>
      )}

      {/* Cabeçalho com métricas - SEM PACOTES MÉTRICA */}
      <div className="auditoria-metricas" style={{ marginTop: nomeProjeto ? '25px' : '0' }}>
        <div className="metrica-card">
          <div className="metrica-label">Previsto Transcrição</div>
          <div className="metrica-valor">{dadoAtual.QT_PACOTE_PREVISTO_TRANSCRICAO}</div>
        </div>
        
        <div className="metrica-card">
          <div className="metrica-label">Transcrição Realizada</div>
          <div className="metrica-valor success">{dadoAtual.QT_PACOTE_TRANSCRICAO}</div>
        </div>
        
        <div className="metrica-card destaque">
          <div className="metrica-label">% Conclusão</div>
          <div className="metrica-valor">{percentualConclusao.toFixed(2)}%</div>
          <div className="progress-bar-mini">
            <div 
              className="progress-fill-mini" 
              style={{ width: `${percentualConclusao}%` }}
            />
          </div>
        </div>

        <div className="metrica-card info">
          <div className="metrica-label">Última Atualização</div>
          <div className="metrica-valor-small">
            {formatarData(dadoAtual.DT_EXPORTACAO)}
          </div>
        </div>
      </div>

      {/* Observações das Atividades */}
      {atividadesComObservacao.length > 0 && (
        <div className="observacoes-container">
          <h4 className="observacoes-title">
            <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '8px' }} />
            Observações das Atividades
          </h4>
          <div className="observacoes-list">
            {atividadesComObservacao.map((atividade, index) => (
              <div key={index} className="observacao-item">
                <div className="observacao-header">
                  <strong>{atividade.titulo}</strong>
                  <span className={`observacao-badge badge-status-${atividade.status}`}>
                    {atividade.status === 'pendente' ? 'Pendente' : 
                     atividade.status === 'em_andamento' ? 'Em Andamento' : 'Concluída'}
                  </span>
                </div>
                <div className="observacao-tooltip-wrapper">
                  <FontAwesomeIcon 
                    icon={faInfoCircle} 
                    className="observacao-icon"
                  />
                  <div className="observacao-tooltip">
                    {atividade.observacao}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas de Prazo */}
      {alertasPrazo.length > 0 && (
        <div className="alertas-container">
          <h4 className="alertas-title">⚠️ Alertas de Prazo</h4>
          <div className="alertas-list">
            {alertasPrazo.map((alerta, index) => (
              <div key={index} className="alerta-item" style={{ borderLeftColor: alerta.cor }}>
                <strong>{alerta.atividade}:</strong> {alerta.mensagem}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico de Pizza */}
      <div className="chart-container">
        <div className="chart-wrapper">
          <h4 className="chart-title">
            <FontAwesomeIcon icon={faChartPie} style={{ marginRight: '10px', color: '#3498db' }} />
            Resumo de Transcrição
          </h4>
          <div style={{ height: '300px' }}>
            <Doughnut data={getPizzaChartData()} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditoriaCharts;