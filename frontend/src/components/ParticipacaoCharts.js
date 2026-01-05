import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChartLine } from '@fortawesome/free-solid-svg-icons';
import '../styles/RecodificacaoCharts.css';

function ParticipacaoCharts({ nomeProjeto, dadosParticipacao }) {
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

  if (!dadosParticipacao || !dadosParticipacao.DADO_PARTICIPACAO || dadosParticipacao.DADO_PARTICIPACAO.length === 0) {
    return (
      <div className="recodificacao-charts">
        <div className="recodificacao-charts-empty">
          <p>Nenhum dado de participação disponível para este projeto</p>
        </div>
      </div>
    );
  }

  const dados = dadosParticipacao.DADO_PARTICIPACAO;

  return (
    <div className="recodificacao-charts">
      {/* Título do Projeto */}
      {nomeProjeto && (
        <div className="projeto-titulo">
          <h3>
            <FontAwesomeIcon icon={faUsers} style={{ marginRight: '10px', color: '#9b59b6' }} />
            {nomeProjeto}
          </h3>
        </div>
      )}

      {/* Seção de Participação */}
      <div className="atividades-detalhamento" style={{ marginTop: nomeProjeto ? '25px' : '0', marginBottom: '0', paddingBottom: '20px' }}>
        <h4 className="detalhamento-title">
          <FontAwesomeIcon icon={faChartLine} style={{ marginRight: '8px' }} />
          Indicadores de Participação
        </h4>

        {/* Tabela de dados */}
        <div style={{ overflowX: 'auto', marginTop: '15px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
                  Resumo da Avaliação
                </th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
                  Língua Portuguesa<br/>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.8 }}>Quantidade</span>
                </th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
                  Língua Portuguesa<br/>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.8 }}>Percentual</span>
                </th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
                  Matemática<br/>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.8 }}>Quantidade</span>
                </th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
                  Matemática<br/>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.8 }}>Percentual</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.map((linha, index) => (
                <tr key={index} style={{
                  borderBottom: index < dados.length - 1 ? '1px solid #e9ecef' : 'none',
                  transition: 'background-color 0.2s',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                }}>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#2c3e50', fontWeight: '500' }}>
                    {linha['Resumo da Avaliação']}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#3498db' }}>
                    {linha['Língua Portuguesa - Quantidade']?.toLocaleString('pt-BR') || '-'}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#27ae60' }}>
                    {linha['Língua Portuguesa - Percentual'] || '-'}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#3498db' }}>
                    {linha['Matemática - Quantidade']?.toLocaleString('pt-BR') || '-'}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#27ae60' }}>
                    {linha['Matemática - Percentual'] || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Data de atualização */}
        {dadosParticipacao.DT_EXPORTACAO && (
          <div style={{ marginTop: '15px', textAlign: 'right', fontSize: '12px', color: '#6c757d' }}>
            Última atualização: {formatarData(dadosParticipacao.DT_EXPORTACAO)}
          </div>
        )}
      </div>
    </div>
  );
}

export default ParticipacaoCharts;
