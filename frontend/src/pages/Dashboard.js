import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilterCircleXmark, 
  faChartLine,
  faChartBar,
  faListUl
} from '@fortawesome/free-solid-svg-icons';
import { atividadeService, projetoService, squadService } from '../services/api';
import { dashboardService } from '../services/dashboardApi';
import AuditoriaCharts from '../components/AuditoriaCharts';
import RecodificacaoCharts from '../components/RecodificacaoCharts';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/Dashboard.css';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

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
  
  // Estado para visualização geral/detalhada
  const [modoVisualizacao, setModoVisualizacao] = useState('geral');
  
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
  const [dadosAuditoriaSQLServer, setDadosAuditoriaSQLServer] = useState({});
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);

  // Estados para dados SQL Server - Recodificação
  const [dadosRecodificacaoSQLServer, setDadosRecodificacaoSQLServer] = useState({});
  const [loadingRecodificacao, setLoadingRecodificacao] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (projetos.length > 0 && squads.length > 0 && atividades.length > 0) {
      atualizarOpcoesFiltros();
      aplicarFiltros();
    }
  }, [filtros, projetos, squads, atividades]);

  // Criar gráfico de pizza do resumo geral
  useEffect(() => {
    if (modoVisualizacao === 'geral' && atividades.length > 0) {
      const ctx = document.getElementById('resumoGeralChart');
      if (ctx) {
        const existingChart = ChartJS.getChart(ctx);
        if (existingChart) {
          existingChart.destroy();
        }

        let atividadesFiltradas = [...atividades];
        
        if (filtros.ordem_producao) {
          const projetosFiltrados = projetos
            .filter(p => p.ordem_producao === filtros.ordem_producao)
            .map(p => p.id);
          atividadesFiltradas = atividadesFiltradas.filter(a => projetosFiltrados.includes(a.projeto.id));
        }
        
        if (filtros.projeto_id) {
          atividadesFiltradas = atividadesFiltradas.filter(a => a.projeto.id === parseInt(filtros.projeto_id));
        }
        
        if (filtros.squad_id) {
          atividadesFiltradas = atividadesFiltradas.filter(a => a.squad.id === parseInt(filtros.squad_id));
        }
        
        if (filtros.tipo_atividade) {
          atividadesFiltradas = atividadesFiltradas.filter(a => a.titulo === filtros.tipo_atividade);
        }

        const concluidas = atividadesFiltradas.filter(a => a.status === 'concluida').length;
        const emAndamento = atividadesFiltradas.filter(a => a.status === 'em_andamento').length;
        const pendentes = atividadesFiltradas.filter(a => a.status === 'pendente').length;

        new ChartJS(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Concluídas', 'Em Andamento', 'Pendentes'],
            datasets: [{
              data: [concluidas, emAndamento, pendentes],
              backgroundColor: [
                'rgba(46, 204, 113, 0.8)',
                'rgba(52, 152, 219, 0.8)',
                'rgba(231, 76, 60, 0.8)'
              ],
              borderColor: [
                'rgba(46, 204, 113, 1)',
                'rgba(52, 152, 219, 1)',
                'rgba(231, 76, 60, 1)'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                  size: 14
                },
                bodyFont: {
                  size: 13
                },
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }
  }, [modoVisualizacao, atividades, filtros, projetos]);

  // Carregar dados de auditoria do SQL Server quando projeto for selecionado
  useEffect(() => {
    if (filtros.projeto_id) {
      carregarDadosAuditoriaProjeto(filtros.projeto_id);
    } else if (projetos.length > 0) {
      carregarDadosAuditoriaTodosProjetos();
    } else {
      setDadosAuditoriaSQLServer({});
    }
  }, [filtros.projeto_id, filtros.ordem_producao, projetos]);

  // Carregar dados de recodificação do SQL Server quando projeto for selecionado
  useEffect(() => {
    if (filtros.projeto_id) {
      carregarDadosRecodificacaoProjeto(filtros.projeto_id);
    } else if (projetos.length > 0) {
      carregarDadosRecodificacaoTodosProjetos();
    } else {
      setDadosRecodificacaoSQLServer({});
    }
  }, [filtros.projeto_id, filtros.ordem_producao, projetos]);

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

  const carregarDadosAuditoriaProjeto = async (projetoId) => {
    try {
      setLoadingAuditoria(true);
      
      const projetoSelecionado = projetos.find(p => p.id === parseInt(projetoId));
      
      if (projetoSelecionado && projetoSelecionado.subprograma) {
        const cdProjeto = projetoSelecionado.subprograma;
        
        const response = await dashboardService.getAuditoriaHistorico(cdProjeto);
        
        if (response.data.success) {
          setDadosAuditoriaSQLServer({
            [projetoId]: response.data.data
          });
        } else {
          setDadosAuditoriaSQLServer({});
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de auditoria:', error);
      setDadosAuditoriaSQLServer({});
    } finally {
      setLoadingAuditoria(false);
    }
  };

  const carregarDadosAuditoriaTodosProjetos = async () => {
    try {
      setLoadingAuditoria(true);
      
      let projetosComSubprograma = projetos.filter(p => p.subprograma && p.subprograma.trim() !== '');
      
      if (filtros.ordem_producao) {
        projetosComSubprograma = projetosComSubprograma.filter(p => p.ordem_producao === filtros.ordem_producao);
      }
      
      const dadosTodosProjetos = {};
      
      await Promise.all(
        projetosComSubprograma.map(async (projeto) => {
          try {
            const response = await dashboardService.getAuditoriaHistorico(projeto.subprograma);
            
            if (response.data.success && response.data.data.length > 0) {
              dadosTodosProjetos[projeto.id] = response.data.data;
            }
          } catch (error) {
            console.error(`Erro ao carregar dados do projeto ${projeto.id}:`, error);
          }
        })
      );
      
      setDadosAuditoriaSQLServer(dadosTodosProjetos);
      
    } catch (error) {
      console.error('Erro ao carregar dados de auditoria de todos os projetos:', error);
      setDadosAuditoriaSQLServer({});
    } finally {
      setLoadingAuditoria(false);
    }
  };

  const carregarDadosRecodificacaoProjeto = async (projetoId) => {
    try {
      setLoadingRecodificacao(true);
      
      const projetoSelecionado = projetos.find(p => p.id === parseInt(projetoId));
      
      if (projetoSelecionado && projetoSelecionado.subprograma) {
        const cdProjeto = projetoSelecionado.subprograma;
        
        const response = await dashboardService.getRecodificacaoMetricas(cdProjeto);
        
        if (response.data.success) {
          setDadosRecodificacaoSQLServer({
            [projetoId]: response.data.data
          });
        } else {
          setDadosRecodificacaoSQLServer({});
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de recodificação:', error);
      setDadosRecodificacaoSQLServer({});
    } finally {
      setLoadingRecodificacao(false);
    }
  };

  const carregarDadosRecodificacaoTodosProjetos = async () => {
    try {
      setLoadingRecodificacao(true);
      
      let projetosComSubprograma = projetos.filter(p => p.subprograma && p.subprograma.trim() !== '');
      
      if (filtros.ordem_producao) {
        projetosComSubprograma = projetosComSubprograma.filter(p => p.ordem_producao === filtros.ordem_producao);
      }
      
      const dadosTodosProjetos = {};
      
      await Promise.all(
        projetosComSubprograma.map(async (projeto) => {
          try {
            const response = await dashboardService.getRecodificacaoMetricas(projeto.subprograma);
            
            if (response.data.success && response.data.data.metricas && response.data.data.metricas.length > 0) {
              dadosTodosProjetos[projeto.id] = response.data.data;
            }
          } catch (error) {
            console.error(`Erro ao carregar dados de recodificação do projeto ${projeto.id}:`, error);
          }
        })
      );
      
      setDadosRecodificacaoSQLServer(dadosTodosProjetos);
      
    } catch (error) {
      console.error('Erro ao carregar dados de recodificação de todos os projetos:', error);
      setDadosRecodificacaoSQLServer({});
    } finally {
      setLoadingRecodificacao(false);
    }
  };

  const atualizarOpcoesFiltros = () => {
    let atividadesFiltradas = [...atividades];

    if (filtros.ordem_producao) {
      const projetosFiltrados = projetos
        .filter(p => p.ordem_producao === filtros.ordem_producao)
        .map(p => p.id);
      
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        projetosFiltrados.includes(a.projeto.id)
      );
    }

    if (filtros.projeto_id) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.projeto.id === parseInt(filtros.projeto_id)
      );
    }

    if (filtros.squad_id) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.squad.id === parseInt(filtros.squad_id)
      );
    }

    let projetosDisponiveis = [...projetos];
    if (filtros.ordem_producao) {
      projetosDisponiveis = projetos.filter(p => p.ordem_producao === filtros.ordem_producao);
    }
    
    if (filtros.projeto_id) {
      const projetoSelecionado = projetos.find(p => p.id === parseInt(filtros.projeto_id));
      if (projetoSelecionado && projetoSelecionado.ordem_producao) {
        setOpcoesOrdemProducao([projetoSelecionado.ordem_producao]);
      } else {
        setOpcoesOrdemProducao([]);
      }
    } else {
      const ordensUnicas = [...new Set(
        projetos
          .map(p => p.ordem_producao)
          .filter(op => op && op.trim() !== '')
      )].sort();
      setOpcoesOrdemProducao(ordensUnicas);
    }

    const squadIdsDisponiveis = [...new Set(atividadesFiltradas.map(a => a.squad.id))];
    const squadsDisponiveis = squads.filter(s => squadIdsDisponiveis.includes(s.id));
    setOpcoesSquads(squadsDisponiveis);

    const tiposDisponiveis = [...new Set(
      atividadesFiltradas.map(a => a.titulo)
    )].sort();
    setOpcoesTiposAtividades(tiposDisponiveis);
  };

  const aplicarFiltros = () => {
    let atividadesFiltradas = [...atividades];

    if (filtros.ordem_producao) {
      const projetosFiltrados = projetos
        .filter(p => p.ordem_producao === filtros.ordem_producao)
        .map(p => p.id);
      
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        projetosFiltrados.includes(a.projeto.id)
      );
    }

    if (filtros.projeto_id) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.projeto.id === parseInt(filtros.projeto_id)
      );
    }

    if (filtros.squad_id) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.squad.id === parseInt(filtros.squad_id)
      );
    }

    if (filtros.tipo_atividade) {
      atividadesFiltradas = atividadesFiltradas.filter(a => 
        a.titulo === filtros.tipo_atividade
      );
    }

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
    if (!filtros.squad_id) return true;
    const auditoriaSquad = squads.find(s => s.nome === 'Auditoria');
    return auditoriaSquad && parseInt(filtros.squad_id) === auditoriaSquad.id;
  };

  const deveExibirSquadRecodificacao = () => {
    if (!filtros.squad_id) return true;
    const recodificacaoSquad = squads.find(s => s.nome === 'Recodificação');
    return recodificacaoSquad && parseInt(filtros.squad_id) === recodificacaoSquad.id;
  };

  const obterProjetosParaExibir = () => {
    if (filtros.projeto_id) {
      const projeto = projetos.find(p => p.id === parseInt(filtros.projeto_id));
      return projeto ? [projeto] : [];
    } else {
      let projetosComDados = projetos.filter(p => 
        (dadosAuditoriaSQLServer[p.id] && dadosAuditoriaSQLServer[p.id].length > 0) ||
        (dadosRecodificacaoSQLServer[p.id] && dadosRecodificacaoSQLServer[p.id].metricas && dadosRecodificacaoSQLServer[p.id].metricas.length > 0)
      );
      
      if (filtros.ordem_producao) {
        projetosComDados = projetosComDados.filter(p => p.ordem_producao === filtros.ordem_producao);
      }
      
      return projetosComDados;
    }
  };

  // ✅ NOVA FUNÇÃO: Filtrar métricas de recodificação baseado na atividade selecionada
  const filtrarMetricasRecodificacao = (metricas) => {
    if (!metricas || !metricas.metricas || !filtros.tipo_atividade) {
      return metricas;
    }

    // Mapear o tipo de atividade selecionado para o tipo de recodificação
    const atividadeMap = {
      'CR Reserva': '01 - RESERVA TÉCNICA',
      'CR Anulado': '02 - CARTÃO ANULADO',
      'CR Duplicado': '03 - IMAGEM DUPLICADA',
      'CR Genérico': '04 - CARTÃO GENERICO',
      'Sujeito C1': '05 - RECODIFICAÇÃO DE SUJEITO C1',
      'Sujeito C2': '06 - RECODIFICAÇÃO DE SUJEITO C2',
      'Público Alvo': '07 - DEDUCAO DO PUBLICO ALVO'
    };

    const tipoRecodificacao = atividadeMap[filtros.tipo_atividade];

    if (!tipoRecodificacao) {
      return metricas;
    }

    return {
      ...metricas,
      metricas: metricas.metricas.filter(m => m.tipo === tipoRecodificacao)
    };
  };

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  const projetosParaExibir = obterProjetosParaExibir();

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
            
            <div className="visualizacao-toggle">
              <button
                className={`btn btn-small ${modoVisualizacao === 'geral' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setModoVisualizacao('geral')}
              >
                <FontAwesomeIcon icon={faChartBar} /> Visão Geral
              </button>
              <button
                className={`btn btn-small ${modoVisualizacao === 'detalhado' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setModoVisualizacao('detalhado')}
              >
                <FontAwesomeIcon icon={faListUl} /> Visão Detalhada
              </button>
            </div>
          </div>
        </div>

        {/* Resumo Geral */}
        {modoVisualizacao === 'geral' && (
          <div className="resumo-geral">
            <div className="resumo-geral-header">
              <h3>
                <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '10px' }} />
                Resumo Geral
              </h3>
              {(filtros.ordem_producao || filtros.projeto_id || filtros.squad_id || filtros.tipo_atividade) && (
                <div className="resumo-filtro-ativo">
                  <FontAwesomeIcon icon={faFilterCircleXmark} style={{ marginRight: '8px' }} />
                  Filtros ativos aplicados
                </div>
              )}
            </div>

            {/* Grid de Estatísticas Principais */}
            <div className="resumo-stats-grid">
              <div className="stat-card stat-card-total">
                <div className="stat-card-icon">
                  <FontAwesomeIcon icon={faListUl} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Total de Atividades</div>
                  <div className="stat-card-value">
                    {(() => {
                      let atividadesFiltradas = [...atividades];
                      
                      if (filtros.ordem_producao) {
                        const projetosFiltrados = projetos
                          .filter(p => p.ordem_producao === filtros.ordem_producao)
                          .map(p => p.id);
                        atividadesFiltradas = atividadesFiltradas.filter(a => projetosFiltrados.includes(a.projeto.id));
                      }
                      
                      if (filtros.projeto_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.projeto.id === parseInt(filtros.projeto_id));
                      }
                      
                      if (filtros.squad_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.squad.id === parseInt(filtros.squad_id));
                      }
                      
                      if (filtros.tipo_atividade) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.titulo === filtros.tipo_atividade);
                      }
                      
                      return atividadesFiltradas.length;
                    })()}
                  </div>
                </div>
              </div>

              <div className="stat-card stat-card-concluidas">
                <div className="stat-card-icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Atividades Concluídas</div>
                  <div className="stat-card-value">
                    {(() => {
                      let atividadesFiltradas = [...atividades];
                      
                      if (filtros.ordem_producao) {
                        const projetosFiltrados = projetos
                          .filter(p => p.ordem_producao === filtros.ordem_producao)
                          .map(p => p.id);
                        atividadesFiltradas = atividadesFiltradas.filter(a => projetosFiltrados.includes(a.projeto.id));
                      }
                      
                      if (filtros.projeto_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.projeto.id === parseInt(filtros.projeto_id));
                      }
                      
                      if (filtros.squad_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.squad.id === parseInt(filtros.squad_id));
                      }
                      
                      if (filtros.tipo_atividade) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.titulo === filtros.tipo_atividade);
                      }
                      
                      return atividadesFiltradas.filter(a => a.status === 'concluida').length;
                    })()}
                  </div>
                </div>
              </div>

              <div className="stat-card stat-card-pendentes">
                <div className="stat-card-icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Atividades Pendentes</div>
                  <div className="stat-card-value">
                    {(() => {
                      let atividadesFiltradas = [...atividades];
                      
                      if (filtros.ordem_producao) {
                        const projetosFiltrados = projetos
                          .filter(p => p.ordem_producao === filtros.ordem_producao)
                          .map(p => p.id);
                        atividadesFiltradas = atividadesFiltradas.filter(a => projetosFiltrados.includes(a.projeto.id));
                      }
                      
                      if (filtros.projeto_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.projeto.id === parseInt(filtros.projeto_id));
                      }
                      
                      if (filtros.squad_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.squad.id === parseInt(filtros.squad_id));
                      }
                      
                      if (filtros.tipo_atividade) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.titulo === filtros.tipo_atividade);
                      }
                      
                      return atividadesFiltradas.filter(a => a.status === 'pendente').length;
                    })()}
                  </div>
                </div>
              </div>

              <div className="stat-card stat-card-andamento">
                <div className="stat-card-icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-label">Em Andamento</div>
                  <div className="stat-card-value">
                    {(() => {
                      let atividadesFiltradas = [...atividades];
                      
                      if (filtros.ordem_producao) {
                        const projetosFiltrados = projetos
                          .filter(p => p.ordem_producao === filtros.ordem_producao)
                          .map(p => p.id);
                        atividadesFiltradas = atividadesFiltradas.filter(a => projetosFiltrados.includes(a.projeto.id));
                      }
                      
                      if (filtros.projeto_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.projeto.id === parseInt(filtros.projeto_id));
                      }
                      
                      if (filtros.squad_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.squad.id === parseInt(filtros.squad_id));
                      }
                      
                      if (filtros.tipo_atividade) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.titulo === filtros.tipo_atividade);
                      }
                      
                      return atividadesFiltradas.filter(a => a.status === 'em_andamento').length;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de Percentual e Gráfico */}
            <div className="resumo-detalhes">
              <div className="percentual-card">
                <h4>Taxa de Conclusão</h4>
                <div className="percentual-display">
                  <div className="percentual-valor">
                    {(() => {
                      let atividadesFiltradas = [...atividades];
                      
                      if (filtros.ordem_producao) {
                        const projetosFiltrados = projetos
                          .filter(p => p.ordem_producao === filtros.ordem_producao)
                          .map(p => p.id);
                        atividadesFiltradas = atividadesFiltradas.filter(a => projetosFiltrados.includes(a.projeto.id));
                      }
                      
                      if (filtros.projeto_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.projeto.id === parseInt(filtros.projeto_id));
                      }
                      
                      if (filtros.squad_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.squad.id === parseInt(filtros.squad_id));
                      }
                      
                      if (filtros.tipo_atividade) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.titulo === filtros.tipo_atividade);
                      }
                      
                      const total = atividadesFiltradas.length;
                      const concluidas = atividadesFiltradas.filter(a => a.status === 'concluida').length;
                      
                      return total > 0 ? ((concluidas / total) * 100).toFixed(1) : 0;
                    })()}%
                  </div>
                  <div className="percentual-label">
                    {(() => {
                      let atividadesFiltradas = [...atividades];
                      
                      if (filtros.ordem_producao) {
                        const projetosFiltrados = projetos
                          .filter(p => p.ordem_producao === filtros.ordem_producao)
                          .map(p => p.id);
                        atividadesFiltradas = atividadesFiltradas.filter(a => projetosFiltrados.includes(a.projeto.id));
                      }
                      
                      if (filtros.projeto_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.projeto.id === parseInt(filtros.projeto_id));
                      }
                      
                      if (filtros.squad_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.squad.id === parseInt(filtros.squad_id));
                      }
                      
                      if (filtros.tipo_atividade) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.titulo === filtros.tipo_atividade);
                      }
                      
                      const total = atividadesFiltradas.length;
                      const concluidas = atividadesFiltradas.filter(a => a.status === 'concluida').length;
                      
                      return `${concluidas} de ${total} atividades`;
                    })()}
                  </div>
                </div>
                <div className="percentual-progress-bar">
                  <div 
                    className="percentual-progress-fill"
                    style={{ 
                      width: `${(() => {
                        let atividadesFiltradas = [...atividades];
                        
                        if (filtros.ordem_producao) {
                          const projetosFiltrados = projetos
                            .filter(p => p.ordem_producao === filtros.ordem_producao)
                            .map(p => p.id);
                          atividadesFiltradas = atividadesFiltradas.filter(a => projetosFiltrados.includes(a.projeto.id));
                        }
                        
                        if (filtros.projeto_id) {
                          atividadesFiltradas = atividadesFiltradas.filter(a => a.projeto.id === parseInt(filtros.projeto_id));
                        }
                        
                        if (filtros.squad_id) {
                          atividadesFiltradas = atividadesFiltradas.filter(a => a.squad.id === parseInt(filtros.squad_id));
                        }
                        
                        if (filtros.tipo_atividade) {
                          atividadesFiltradas = atividadesFiltradas.filter(a => a.titulo === filtros.tipo_atividade);
                        }
                        
                        const total = atividadesFiltradas.length;
                        const concluidas = atividadesFiltradas.filter(a => a.status === 'concluida').length;
                        
                        return total > 0 ? (concluidas / total) * 100 : 0;
                      })()}%` 
                    }}
                  />
                </div>
              </div>

              <div className="grafico-card">
                <h4>Distribuição por Status</h4>
                <div className="grafico-pizza-container">
                  <canvas id="resumoGeralChart"></canvas>
                </div>
              </div>
            </div>

            {/* Cards de Informações Adicionais */}
            <div className="resumo-info-adicional">
              <div className="info-card">
                <div className="info-card-icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="info-card-content">
                  <div className="info-card-value">
                    {(() => {
                      if (filtros.ordem_producao) {
                        return projetos.filter(p => p.ordem_producao === filtros.ordem_producao).length;
                      }
                      return projetos.length;
                    })()}
                  </div>
                  <div className="info-card-label">
                    {filtros.ordem_producao ? 'Projetos nesta OP' : 'Projetos Totais'}
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="info-card-content">
                  <div className="info-card-value">
                    {filtros.squad_id ? 1 : squads.length}
                  </div>
                  <div className="info-card-label">
                    {filtros.squad_id ? 'Squad Selecionada' : 'Squads Totais'}
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="info-card-content">
                  <div className="info-card-value">
                    {(() => {
                      if (filtros.tipo_atividade) {
                        return 1;
                      }
                      
                      let atividadesFiltradas = [...atividades];
                      
                      if (filtros.ordem_producao) {
                        const projetosFiltrados = projetos
                          .filter(p => p.ordem_producao === filtros.ordem_producao)
                          .map(p => p.id);
                        atividadesFiltradas = atividadesFiltradas.filter(a => projetosFiltrados.includes(a.projeto.id));
                      }
                      
                      if (filtros.projeto_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.projeto.id === parseInt(filtros.projeto_id));
                      }
                      
                      if (filtros.squad_id) {
                        atividadesFiltradas = atividadesFiltradas.filter(a => a.squad.id === parseInt(filtros.squad_id));
                      }
                      
                      return [...new Set(atividadesFiltradas.map(a => a.titulo))].length;
                    })()}
                  </div>
                  <div className="info-card-label">
                    {filtros.tipo_atividade ? 'Tipo Selecionado' : 'Tipos de Atividades'}
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="info-card-content">
                  <div className="info-card-value">
                    {filtros.ordem_producao ? 1 : [...new Set(projetos.map(p => p.ordem_producao).filter(op => op && op.trim() !== ''))].length}
                  </div>
                  <div className="info-card-label">
                    {filtros.ordem_producao ? 'OP Selecionada' : 'Ordens de Produção'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Squad Auditoria - Gráficos (apenas em modo detalhado) */}
        {modoVisualizacao === 'detalhado' && deveExibirSquadAuditoria() && (
          <div className="squad-section">
            {loadingAuditoria ? (
              <div className="loading">Carregando dados de auditoria...</div>
            ) : projetosParaExibir.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum projeto com dados de auditoria disponível</p>
              </div>
            ) : (
              <div className="projetos-graficos-container">
                {projetosParaExibir.map(projeto => {
                  const atividadesAuditoriaProjeto = dadosFiltrados.auditoria.filter(
                    a => a.projeto.id === projeto.id
                  );

                  // Só renderiza se tiver dados de auditoria
                  if (!dadosAuditoriaSQLServer[projeto.id] || dadosAuditoriaSQLServer[projeto.id].length === 0) {
                    return null;
                  }

                  return (
                    <div key={`auditoria-${projeto.id}`} className="projeto-grafico-wrapper">
                      <AuditoriaCharts 
                        cdProjeto={projeto.subprograma}
                        dados={dadosAuditoriaSQLServer[projeto.id] || []}
                        atividadesSquad={atividadesAuditoriaProjeto}
                        nomeProjeto={`${projeto.subprograma} - ${projeto.nome}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Squad Recodificação - Gráficos (apenas em modo detalhado) */}
        {modoVisualizacao === 'detalhado' && deveExibirSquadRecodificacao() && (
          <div className="squad-section">
            {loadingRecodificacao ? (
              <div className="loading">Carregando dados de recodificação...</div>
            ) : projetosParaExibir.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum projeto com dados de recodificação disponível</p>
              </div>
            ) : (
              <div className="projetos-graficos-container">
                {projetosParaExibir.map(projeto => {
                  const atividadesRecodificacaoProjeto = dadosFiltrados.recodificacao.filter(
                    a => a.projeto.id === projeto.id
                  );

                  // ✅ NOVA LINHA: Filtrar as métricas de recodificação baseado na atividade selecionada
                  const metricasFiltradas = filtrarMetricasRecodificacao(
                    dadosRecodificacaoSQLServer[projeto.id]
                  );

                  // ✅ MODIFICADO: Usar metricasFiltradas em vez de dadosRecodificacaoSQLServer[projeto.id]
                  if (!metricasFiltradas || 
                      !metricasFiltradas.metricas || 
                      metricasFiltradas.metricas.length === 0) {
                    return null;
                  }

                  return (
                    <div key={`recodificacao-${projeto.id}`} className="projeto-grafico-wrapper">
                      <RecodificacaoCharts 
                        cdProjeto={projeto.subprograma}
                        metricas={metricasFiltradas}
                        atividadesSquad={atividadesRecodificacaoProjeto}
                        nomeProjeto={`${projeto.subprograma} - ${projeto.nome}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;