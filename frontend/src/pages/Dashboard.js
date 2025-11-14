import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilterCircleXmark, 
  faChartLine,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { atividadeService, projetoService, squadService } from '../services/api';
import '../styles/Dashboard.css';

function Dashboard() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Estados para os dados
  const [projetos, setProjetos] = useState([]);
  const [squads, setSquads] = useState([]);
  const [atividades, setAtividades] = useState([]);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    ordem_producao: '',
    projeto_id: '',
    squad_id: '',
    tipo_atividade: ''
  });
  
  // Estado para visualização geral
  const [visualizacaoGeral, setVisualizacaoGeral] = useState(true);
  
  // Estados para os dados filtrados
  const [dadosFiltrados, setDadosFiltrados] = useState({
    auditoria: [],
    recodificacao: []
  });

  // Estados para opções filtradas dos selects
  const [opcoesOrdemProducao, setOpcoesOrdemProducao] = useState([]);
  const [opcoesSquads, setOpcoesSquads] = useState([]);
  const [opcoesTiposAtividades, setOpcoesTiposAtividades] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (projetos.length > 0 && squads.length > 0 && atividades.length > 0) {
      atualizarOpcoesFiltros();
      aplicarFiltros();
    }
  }, [filtros, projetos, squads, atividades]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [projetosRes, squadsRes, atividadesRes] = await Promise.all([
        projetoService.listar(),
        squadService.listar(),
        atividadeService.listar()
      ]);

      setProjetos(projetosRes.data.items || projetosRes.data);
      setSquads(squadsRes.data.items || squadsRes.data);
      setAtividades(atividadesRes.data.items || atividadesRes.data);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarOpcoesFiltros = () => {
    let atividadesFiltradas = [...atividades];

    // Filtrar por ordem de produção
    if (filtros.ordem_producao) {
      const projetosFiltrados = projetos
        .filter(p => p.ordem_producao === filtros.ordem_producao)
        .map(p => p.id);
      
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        projetosFiltrados.includes(a.projeto.id)
      );
    }

    // Filtrar por projeto
    if (filtros.projeto_id) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.projeto.id === parseInt(filtros.projeto_id)
      );
    }

    // Filtrar por squad
    if (filtros.squad_id) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.squad.id === parseInt(filtros.squad_id)
      );
    }

    // Atualizar opções de Projetos baseado na Ordem de Produção selecionada
    let projetosDisponiveis = [...projetos];
    if (filtros.ordem_producao) {
      projetosDisponiveis = projetos.filter(p => p.ordem_producao === filtros.ordem_producao);
    }
    
    // Atualizar opções de Ordem de Produção baseado no Projeto selecionado
    if (filtros.projeto_id) {
      const projetoSelecionado = projetos.find(p => p.id === parseInt(filtros.projeto_id));
      if (projetoSelecionado && projetoSelecionado.ordem_producao) {
        setOpcoesOrdemProducao([projetoSelecionado.ordem_producao]);
      } else {
        setOpcoesOrdemProducao([]);
      }
    } else {
      // Todas as ordens de produção disponíveis
      const ordensUnicas = [...new Set(
        projetos
          .map(p => p.ordem_producao)
          .filter(op => op && op.trim() !== '')
      )].sort();
      setOpcoesOrdemProducao(ordensUnicas);
    }

    // Atualizar opções de Squads baseado nas atividades filtradas
    const squadIdsDisponiveis = [...new Set(atividadesFiltradas.map(a => a.squad.id))];
    const squadsDisponiveis = squads.filter(s => squadIdsDisponiveis.includes(s.id));
    setOpcoesSquads(squadsDisponiveis);

    // Atualizar opções de Tipos de Atividades baseado nas atividades filtradas
    const tiposDisponiveis = [...new Set(
      atividadesFiltradas.map(a => a.titulo)
    )].sort();
    setOpcoesTiposAtividades(tiposDisponiveis);
  };

  const aplicarFiltros = () => {
    let atividadesFiltradas = [...atividades];

    // Filtro por ordem de produção
    if (filtros.ordem_producao) {
      const projetosFiltrados = projetos
        .filter(p => p.ordem_producao === filtros.ordem_producao)
        .map(p => p.id);
      
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        projetosFiltrados.includes(a.projeto.id)
      );
    }

    // Filtro por projeto
    if (filtros.projeto_id) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.projeto.id === parseInt(filtros.projeto_id)
      );
    }

    // Filtro por squad
    if (filtros.squad_id) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.squad.id === parseInt(filtros.squad_id)
      );
    }

    // Filtro por tipo de atividade (título)
    if (filtros.tipo_atividade) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.titulo === filtros.tipo_atividade
      );
    }

    // Separar por squads específicas (Auditoria e Recodificação)
    const auditoriaSquad = squads.find(s => s.nome === 'Auditoria');
    const recodificacaoSquad = squads.find(s => s.nome === 'Recodificação');

    setDadosFiltrados({
      auditoria: atividadesFiltradas.filter(a => 
        auditoriaSquad && a.squad.id === auditoriaSquad.id
      ),
      recodificacao: atividadesFiltradas.filter(a => 
        recodificacaoSquad && a.squad.id === recodificacaoSquad.id
      )
    });
  };

  const limparFiltros = () => {
    setFiltros({
      ordem_producao: '',
      projeto_id: '',
      squad_id: '',
      tipo_atividade: ''
    });
  };

  const obterProjetosFormatados = () => {
    let projetosFiltrados = projetos.filter(p => p.subprograma && p.subprograma.trim() !== '');
    
    // Se há ordem de produção selecionada, filtrar projetos
    if (filtros.ordem_producao) {
      projetosFiltrados = projetosFiltrados.filter(p => p.ordem_producao === filtros.ordem_producao);
    }
    
    return projetosFiltrados
      .map(p => ({
        id: p.id,
        label: `${p.subprograma} - ${p.nome}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const calcularIndicadores = (atividadesSquad, tipoAtividade) => {
    const atividadesFiltradas = tipoAtividade 
      ? atividadesSquad.filter(a => a.titulo === tipoAtividade)
      : atividadesSquad;

    const total = atividadesFiltradas.length;
    const concluidas = atividadesFiltradas.filter(a => a.status === 'concluida').length;
    const emAndamento = atividadesFiltradas.filter(a => a.status === 'em_andamento').length;
    const pendentes = atividadesFiltradas.filter(a => a.status === 'pendente').length;
    const percentualConclusao = total > 0 ? ((concluidas / total) * 100).toFixed(1) : 0;

    return {
      total,
      concluidas,
      emAndamento,
      pendentes,
      percentualConclusao
    };
  };

  const renderIndicadorAtividade = (titulo, dados, icone, cor) => {
    // Não renderizar se não houver atividades
    if (dados.total === 0) return null;

    return (
      <div className="indicador-atividade" style={{ borderLeftColor: cor }}>
        <div className="indicador-header">
          <FontAwesomeIcon icon={icone} style={{ color: cor }} />
          <h4>{titulo}</h4>
        </div>
        <div className="indicador-body">
          <div className="indicador-stats">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{dados.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Concluídas:</span>
              <span className="stat-value" style={{ color: '#27ae60' }}>{dados.concluidas}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Em Andamento:</span>
              <span className="stat-value" style={{ color: '#3498db' }}>{dados.emAndamento}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pendentes:</span>
              <span className="stat-value" style={{ color: '#e74c3c' }}>{dados.pendentes}</span>
            </div>
          </div>
          <div className="indicador-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${dados.percentualConclusao}%`,
                  backgroundColor: cor 
                }}
              />
            </div>
            <span className="progress-label">{dados.percentualConclusao}% Concluído</span>
          </div>
        </div>
      </div>
    );
  };

  const deveExibirSquadAuditoria = () => {
    // Se não há filtro de squad, ou se o filtro é Auditoria, exibir
    if (!filtros.squad_id) return true;
    const auditoriaSquad = squads.find(s => s.nome === 'Auditoria');
    return auditoriaSquad && parseInt(filtros.squad_id) === auditoriaSquad.id;
  };

  const deveExibirSquadRecodificacao = () => {
    // Se não há filtro de squad, ou se o filtro é Recodificação, exibir
    if (!filtros.squad_id) return true;
    const recodificacaoSquad = squads.find(s => s.nome === 'Recodificação');
    return recodificacaoSquad && parseInt(filtros.squad_id) === recodificacaoSquad.id;
  };

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FontAwesomeIcon icon={faChartLine} /> Dashboard - Monitoramento de Atividades
          </h2>
        </div>

        {/* Filtros */}
        <div className="dashboard-filters">
          <div className="filter-row">
            <div className="filter-item">
              <label>Ordem de Produção</label>
              <select
                className="form-control"
                value={filtros.ordem_producao}
                onChange={(e) => setFiltros({...filtros, ordem_producao: e.target.value, projeto_id: ''})}
              >
                <option value="">Todas as ordens</option>
                {opcoesOrdemProducao.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Projeto</label>
              <select
                className="form-control"
                value={filtros.projeto_id}
                onChange={(e) => setFiltros({...filtros, projeto_id: e.target.value})}
              >
                <option value="">Todos os projetos</option>
                {obterProjetosFormatados().map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Squad</label>
              <select
                className="form-control"
                value={filtros.squad_id}
                onChange={(e) => setFiltros({...filtros, squad_id: e.target.value})}
              >
                <option value="">Todas as squads</option>
                {opcoesSquads.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Tipo de Atividade</label>
              <select
                className="form-control"
                value={filtros.tipo_atividade}
                onChange={(e) => setFiltros({...filtros, tipo_atividade: e.target.value})}
              >
                <option value="">Todas as atividades</option>
                {opcoesTiposAtividades.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="btn btn-secondary btn-small" 
              onClick={limparFiltros}
            >
              <FontAwesomeIcon icon={faFilterCircleXmark} /> Limpar Filtros
            </button>
            
            <button 
              className={`btn btn-small ${visualizacaoGeral ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setVisualizacaoGeral(!visualizacaoGeral)}
            >
              <FontAwesomeIcon icon={faChartBar} /> 
              {visualizacaoGeral ? 'Visualização Geral' : 'Visualização Detalhada'}
            </button>
          </div>
        </div>

        {/* Resumo Geral */}
        {visualizacaoGeral && (
          <div className="resumo-geral">
            <div className="resumo-card">
              <h3>Resumo Geral</h3>
              <div className="resumo-stats">
                <div className="resumo-item">
                  <span className="resumo-label">Total de Atividades:</span>
                  <span className="resumo-value">{atividades.length}</span>
                </div>
                <div className="resumo-item">
                  <span className="resumo-label">Projetos Ativos:</span>
                  <span className="resumo-value">{projetos.length}</span>
                </div>
                <div className="resumo-item">
                  <span className="resumo-label">Squads:</span>
                  <span className="resumo-value">{squads.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Squad Auditoria */}
        {deveExibirSquadAuditoria() && (
          <div className="squad-section">
            <h3 className="squad-title">
              <FontAwesomeIcon icon={faCheckCircle} /> Squad Auditoria
            </h3>
            
            {dadosFiltrados.auditoria.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma atividade encontrada para os filtros aplicados</p>
              </div>
            ) : (
              <div className="indicadores-grid">
                {renderIndicadorAtividade(
                  'Destaque',
                  calcularIndicadores(dadosFiltrados.auditoria, 'Destaque'),
                  faChartBar,
                  '#3498db'
                )}
                {renderIndicadorAtividade(
                  'Transcrição',
                  calcularIndicadores(dadosFiltrados.auditoria, 'Transcrição'),
                  faChartBar,
                  '#9b59b6'
                )}
              </div>
            )}
          </div>
        )}

        {/* Squad Recodificação */}
        {deveExibirSquadRecodificacao() && (
          <div className="squad-section">
            <h3 className="squad-title">
              <FontAwesomeIcon icon={faSpinner} /> Squad Recodificação
            </h3>
            
            {dadosFiltrados.recodificacao.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma atividade encontrada para os filtros aplicados</p>
              </div>
            ) : (
              <div className="indicadores-grid">
                {renderIndicadorAtividade(
                  'CR Reserva',
                  calcularIndicadores(dadosFiltrados.recodificacao, 'CR Reserva'),
                  faChartBar,
                  '#e67e22'
                )}
                {renderIndicadorAtividade(
                  'CR Anulado',
                  calcularIndicadores(dadosFiltrados.recodificacao, 'CR Anulado'),
                  faChartBar,
                  '#e74c3c'
                )}
                {renderIndicadorAtividade(
                  'CR Duplicado',
                  calcularIndicadores(dadosFiltrados.recodificacao, 'CR Duplicado'),
                  faChartBar,
                  '#f39c12'
                )}
                {renderIndicadorAtividade(
                  'CR Genérico',
                  calcularIndicadores(dadosFiltrados.recodificacao, 'CR Genérico'),
                  faChartBar,
                  '#16a085'
                )}
                {renderIndicadorAtividade(
                  'Sujeito C1',
                  calcularIndicadores(dadosFiltrados.recodificacao, 'Sujeito C1'),
                  faChartBar,
                  '#2ecc71'
                )}
                {renderIndicadorAtividade(
                  'Sujeito C2',
                  calcularIndicadores(dadosFiltrados.recodificacao, 'Sujeito C2'),
                  faChartBar,
                  '#27ae60'
                )}
                {renderIndicadorAtividade(
                  'Público Alvo',
                  calcularIndicadores(dadosFiltrados.recodificacao, 'Público Alvo'),
                  faChartBar,
                  '#8e44ad'
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;