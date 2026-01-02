import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faServer,
  faCheckCircle,
  faBoxArchive,
  faFileImage,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import '../styles/RecodificacaoCharts.css';

function ProcessamentoCharts({ nomeProjeto, metricasPacote, metricasDigitalizacao, metricasProcessamento }) {
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
        <div className="processamento-secao">
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
        <div className="processamento-secao">
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
        <div className="processamento-secao">
          <h4 className="detalhamento-title">
            <FontAwesomeIcon icon={faCog} style={{ marginRight: '8px' }} />
            Processamento
          </h4>
          <div className="atividades-grid">
            <div className="atividade-card">
              <div className="atividade-header">
                <strong>Digitalização</strong>
                <span className={`percentual-badge ${calcularPercentual(metricasProcessamento.QT_REGISTROS_DIGITALIZADOS, metricasProcessamento.QT_REGISTROS_PREVISTOS) >= 100 ? 'concluido' : 'pendente'}`}>
                  {metricasProcessamento.PCT_REGISTROS_DIGITALIZADOS || '0%'}
                </span>
              </div>
              <div className="atividade-stats">
                <div className="stat-row">
                  <span className="stat-label">Previstos:</span>
                  <span className="stat-value">{metricasProcessamento.QT_REGISTROS_PREVISTOS || 0}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Digitalizados:</span>
                  <span className="stat-value success">{metricasProcessamento.QT_REGISTROS_DIGITALIZADOS || 0}</span>
                </div>
              </div>
            </div>

            <div className="atividade-card">
              <div className="atividade-header">
                <strong>Processamento</strong>
                <span className={`percentual-badge ${calcularPercentual(metricasProcessamento.QT_REGISTROS_PROCESSADOS, metricasProcessamento.QT_REGISTROS_PREVISTOS) >= 100 ? 'concluido' : 'pendente'}`}>
                  {metricasProcessamento.PCT_REGISTROS_PROCESSADOS || '0%'}
                </span>
              </div>
              <div className="atividade-stats">
                <div className="stat-row">
                  <span className="stat-label">Decodificados:</span>
                  <span className="stat-value">{metricasProcessamento.QT_REGISTROS_DECODIFICADOS || 0}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Processados:</span>
                  <span className="stat-value success">{metricasProcessamento.QT_REGISTROS_PROCESSADOS || 0}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Não Processados:</span>
                  <span className="stat-value" style={{ color: '#e74c3c' }}>{metricasProcessamento.QT_REGISTROS_NAO_PROCESSADOS || 0}</span>
                </div>
              </div>
            </div>

            <div className="atividade-card">
              <div className="atividade-header">
                <strong>Última Atualização</strong>
              </div>
              <div className="atividade-stats">
                <div className="stat-row">
                  <span className="stat-value-small">{formatarData(metricasProcessamento.DT_EXPORTACAO)}</span>
                </div>
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
