import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilterCircleXmark, 
  faChartLine,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { atividadeService, projetoService, squadService } from '../services/api';
import { dashboardService } from '../services/dashboardApi';
import AuditoriaCharts from '../components/AuditoriaCharts';
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

  // Estados para dados SQL Server - Auditoria
  const [dadosAuditoriaSQLServer, setDadosAuditoriaSQLServer] = useState([]);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (projetos.length > 0 && squads.length > 0 && atividades.length > 0) {
      atualizarOpcoesFiltros();
      aplicarFiltros();
    }
  }, [filtros, projetos, squads, atividades]);

  // Carregar dados de auditoria do SQL Server quando projeto for selecionado
  useEffect(() => {
    if (filtros.projeto_id) {
      carregarDadosAuditoria();
    } else {
      setDadosAuditoriaSQLServer([]);
    }
  }, [filtros.projeto_id]);

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

  const carregarDadosAuditoria = async () => {
    try {
      setLoadingAuditoria(true);
      
      // Buscar o código do projeto (subprograma) do projeto selecionado
      const projetoSelecionado = projetos.find(p => p.id === parseInt(filtros.projeto_id));
      
      if (projetoSelecionado && projetoSelecionado.subprograma) {
        const cdProjeto = projetoSelecionado.subprograma;
        
        // Buscar histórico de auditoria do SQL Server
        const response = await dashboardService.getAuditoriaHistorico(cdProjeto);
        
        if (response.data.success) {
          setDadosAuditoriaSQLServer(response.data.data);
        } else {
          setDadosAuditoriaSQLServer([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de auditoria:', error);
      setDadosAuditoriaSQLServer([]);
    } finally {
      setLoadingAuditoria(false);
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

  const deveExibirSquadAuditoria = () => {
    // Se não há filtro de squad, ou se o filtro é Auditoria, exibir
    if (!filtros.squad_id) return true;
    const auditoriaSquad = squads.find(s => s.nome === 'Auditoria');
    return auditoriaSquad && parseInt(filtros.squad_id) === auditoriaSquad.id;
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

        {/* Squad Auditoria - APENAS GRÁFICOS */}
        {deveExibirSquadAuditoria() && (
          <div className="squad-section">
            <h3 className="squad-title">
              <FontAwesomeIcon icon={faChartBar} /> Squad Auditoria
            </h3>
            
            {dadosFiltrados.auditoria.length === 0 && !filtros.projeto_id ? (
              <div className="empty-state">
                <p>Selecione um projeto para visualizar os gráficos de auditoria</p>
              </div>
            ) : (
              <>
                {/* Gráficos de Auditoria do SQL Server */}
                {filtros.projeto_id && (
                  <div style={{ marginBottom: '30px' }}>
                    {loadingAuditoria ? (
                      <div className="loading">Carregando dados de auditoria...</div>
                    ) : (
                      <AuditoriaCharts 
                        cdProjeto={projetos.find(p => p.id === parseInt(filtros.projeto_id))?.subprograma}
                        dados={dadosAuditoriaSQLServer}
                        atividadesSquad={dadosFiltrados.auditoria}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;