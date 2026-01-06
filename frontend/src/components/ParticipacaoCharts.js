import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import '../styles/ParticipacaoCharts.css';

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

  const dados = processarDados();

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
    </div>
  );
}

export default ParticipacaoCharts;
