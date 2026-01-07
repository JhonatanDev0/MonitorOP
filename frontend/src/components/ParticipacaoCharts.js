import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import '../styles/RecodificacaoCharts.css';

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
      return '-';
    }
  };

  // Processar dados de participação
  const processarDados = () => {
    if (!participacaoData) {
      return [];
    }

    if (!participacaoData.DADO_PARTICIPACAO) {
      return [];
    }

    let dados = participacaoData.DADO_PARTICIPACAO;

    // Se for string, tentar fazer parse
    if (typeof dados === 'string') {
      try {
        dados = JSON.parse(dados);
      } catch (e) {
        return [];
      }
    }

    // Verificar se é array
    if (!Array.isArray(dados)) {
      return [];
    }

    return dados;
  };

  // Extrair disciplinas dinamicamente do primeiro registro
  const extrairDisciplinas = (dados) => {
    if (!dados || dados.length === 0) return [];

    const primeiroItem = dados[0];
    const disciplinas = [];

    // Procurar por todas as chaves que terminam com "- Quantidade"
    Object.keys(primeiroItem).forEach(chave => {
      if (chave.endsWith(' - Quantidade')) {
        const nomeDisciplina = chave.replace(' - Quantidade', '');
        disciplinas.push(nomeDisciplina);
      }
    });

    return disciplinas;
  };

  const dados = processarDados();
  const disciplinas = extrairDisciplinas(dados);

  // Função para reordenar os dados - "previstas" vem primeiro
  const reordenarDados = (dados) => {
    if (!dados || dados.length === 0) return [];

    const dadosOrdenados = [...dados];

    // Encontrar o índice do card "previstas"
    const indicePrevistas = dadosOrdenados.findIndex(item => {
      const resumo = item['Resumo da Avaliação'] || '';
      return resumo.toLowerCase().includes('previsto') || resumo.toLowerCase().includes('previstas');
    });

    // Se encontrou, mover para o início
    if (indicePrevistas > 0) {
      const itemPrevistas = dadosOrdenados.splice(indicePrevistas, 1)[0];
      dadosOrdenados.unshift(itemPrevistas);
    }

    return dadosOrdenados;
  };

  const dadosOrdenados = reordenarDados(dados);

  // Função para obter ícone por tipo de resumo
  const getIconePorResumo = (resumo) => {
    if (resumo.includes('baixa participação')) return faExclamationTriangle;
    if (resumo.includes('sem participação')) return faTimesCircle;
    if (resumo.includes('com resultados')) return faCheckCircle;
    return faUsers;
  };

  // Função para obter cor por tipo de resumo
  const getCorPorResumo = (resumo) => {
    if (resumo.includes('baixa participação')) return '#f39c12'; // Laranja/Amarelo
    if (resumo.includes('sem participação')) return '#e74c3c'; // Vermelho
    if (resumo.includes('com resultados')) return '#2ecc71'; // Verde
    return '#3498db'; // Azul
  };

  if (!participacaoData || !participacaoData.DADO_PARTICIPACAO || dados.length === 0) {
    return (
      <div className="recodificacao-charts-empty">
        <p>Nenhum dado de participação disponível para este projeto</p>
      </div>
    );
  }

  return (
    <div className="recodificacao-charts">
      {/* Título do Projeto */}
      {nomeProjeto && (
        <div className="projeto-titulo">
          <h3>
            <FontAwesomeIcon icon={faUsers} style={{ marginRight: '10px', color: '#3498db' }} />
            {nomeProjeto}
          </h3>
        </div>
      )}

      {/* Cabeçalho com data de exportação */}
      <div className="recodificacao-metricas" style={{ marginTop: nomeProjeto ? '25px' : '0' }}>
        <div className="metrica-card info">
          <div className="metrica-label">Última Exportação</div>
          <div className="metrica-valor-small">
            <FontAwesomeIcon icon={faClockRotateLeft} style={{ marginRight: '6px' }} />
            {formatarData(participacaoData.DT_EXPORTACAO)}
          </div>
        </div>
      </div>

      {/* Detalhamento por Tipo de Avaliação */}
      <div className="atividades-detalhamento">
        <h4 className="detalhamento-title">
          <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px' }} />
          Indicadores de Participação
        </h4>

        {dadosOrdenados.map((item, index) => {
          const resumo = item['Resumo da Avaliação'];
          const cor = getCorPorResumo(resumo);
          const icone = getIconePorResumo(resumo);

          return (
            <div key={index} className="atividade-card" style={{ marginBottom: '20px' }}>
              <div className="atividade-header" style={{ marginBottom: '15px', borderBottom: '2px solid #e9ecef', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FontAwesomeIcon icon={icone} size="lg" style={{ color: cor }} />
                  <strong style={{ fontSize: '16px' }}>{resumo}</strong>
                </div>
              </div>

              <div className="atividade-detalhes">
                <div className="atividades-grid" style={{ gridTemplateColumns: `repeat(${disciplinas.length}, 1fr)` }}>
                  {disciplinas.map((disciplina, idx) => {
                    const quantidade = item[`${disciplina} - Quantidade`];
                    const percentual = item[`${disciplina} - Percentual`];

                    return (
                      <div key={idx} className="detalhe-item">
                        <div className="detalhe-label" style={{ fontWeight: 'bold' }}>{disciplina}</div>
                        <div className="detalhe-valor">
                          {formatarNumero(quantidade)} turmas
                        </div>
                        <div className="detalhe-percentual">
                          {formatarPercentual(percentual)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ParticipacaoCharts;
