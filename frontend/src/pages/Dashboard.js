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
import RecodificacaoCharts from '../components/RecodificacaoCharts';
import CategorizacaoCharts from '../components/CategorizacaoCharts';
import ProcessamentoCharts from '../components/ProcessamentoCharts';
import ParticipacaoCharts from '../components/ParticipacaoCharts';
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
    squad_id: ''
  });
  
  // Estado para visualização geral/detalhada
  const [modoVisualizacao, setModoVisualizacao] = useState('geral');
  
  // Estados para os dados filtrados
  const [dadosFiltrados, setDadosFiltrados] = useState({
    recodificacao: []
  });

  // Estados para opções filtradas dos selects
  const [opcoesOrdemProducao, setOpcoesOrdemProducao] = useState([]);
  const [opcoesSquads, setOpcoesSquads] = useState([]);

  // Estados para dados SQL Server - Recodificação
  const [dadosRecodificacaoSQLServer, setDadosRecodificacaoSQLServer] = useState({});
  const [loadingRecodificacao, setLoadingRecodificacao] = useState(false);

  // Estados para dados SQL Server - Categorização
  const [dadosCategorizacaoSQLServer, setDadosCategorizacaoSQLServer] = useState({});
  const [loadingCategorizacao, setLoadingCategorizacao] = useState(false);

  // Estados para dados SQL Server - Processamento
  const [dadosFropPacoteSQLServer, setDadosFropPacoteSQLServer] = useState({});
  const [dadosFropDigitalizacaoSQLServer, setDadosFropDigitalizacaoSQLServer] = useState({});
  const [dadosProcessamentoSQLServer, setDadosProcessamentoSQLServer] = useState({});
  const [loadingProcessamento, setLoadingProcessamento] = useState(false);

  // Estados para dados SQL Server - Participação
  const [dadosParticipacaoSQLServer, setDadosParticipacaoSQLServer] = useState({});
  const [loadingParticipacao, setLoadingParticipacao] = useState(false);

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

  // Carregar dados de categorização do SQL Server quando projeto for selecionado
  useEffect(() => {
    if (filtros.projeto_id) {
      carregarDadosCategorizacaoProjeto(filtros.projeto_id);
    } else if (projetos.length > 0) {
      carregarDadosCategorizacaoTodosProjetos();
    } else {
      setDadosCategorizacaoSQLServer({});
    }
  }, [filtros.projeto_id, filtros.ordem_producao, projetos]);

  // Carregar dados de processamento do SQL Server quando projeto for selecionado
  useEffect(() => {
    if (filtros.projeto_id) {
      carregarDadosProcessamentoProjeto(filtros.projeto_id);
    } else if (projetos.length > 0) {
      carregarDadosProcessamentoTodosProjetos();
    } else {
      setDadosFropPacoteSQLServer({});
      setDadosFropDigitalizacaoSQLServer({});
      setDadosProcessamentoSQLServer({});
    }
  }, [filtros.projeto_id, filtros.ordem_producao, projetos]);

  // Carregar dados de participação do SQL Server quando projeto for selecionado
  useEffect(() => {
    if (filtros.projeto_id) {
      carregarDadosParticipacaoProjeto(filtros.projeto_id);
    } else if (projetos.length > 0) {
      carregarDadosParticipacaoTodosProjetos();
    } else {
      setDadosParticipacaoSQLServer({});
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
      // Não logar erro 404 - significa apenas que não há dados para o projeto
      if (error.response && error.response.status !== 404) {
        console.error('Erro ao carregar dados de recodificação:', error);
      }
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
            // Não logar erro 404 - significa apenas que não há dados para o projeto
            if (error.response && error.response.status !== 404) {
              console.error(`Erro ao carregar dados de recodificação do projeto ${projeto.id}:`, error);
            }
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

  const carregarDadosCategorizacaoProjeto = async (projetoId) => {
    try {
      setLoadingCategorizacao(true);

      const projetoSelecionado = projetos.find(p => p.id === parseInt(projetoId));

      if (projetoSelecionado && projetoSelecionado.subprograma) {
        const cdProjeto = projetoSelecionado.subprograma;

        const response = await dashboardService.getCategorizacaoMetricas(cdProjeto);

        if (response.data.success) {
          setDadosCategorizacaoSQLServer({
            [projetoId]: response.data.metricas
          });
        } else {
          setDadosCategorizacaoSQLServer({});
        }
      }
    } catch (error) {
      // Não logar erro 404 - significa apenas que não há dados para o projeto
      if (error.response && error.response.status !== 404) {
        console.error('Erro ao carregar dados de categorização:', error);
      }
      setDadosCategorizacaoSQLServer({});
    } finally {
      setLoadingCategorizacao(false);
    }
  };

  const carregarDadosCategorizacaoTodosProjetos = async () => {
    try {
      setLoadingCategorizacao(true);

      let projetosComSubprograma = projetos.filter(p => p.subprograma && p.subprograma.trim() !== '');

      if (filtros.ordem_producao) {
        projetosComSubprograma = projetosComSubprograma.filter(p => p.ordem_producao === filtros.ordem_producao);
      }

      const dadosTodosProjetos = {};

      await Promise.all(
        projetosComSubprograma.map(async (projeto) => {
          try {
            const response = await dashboardService.getCategorizacaoMetricas(projeto.subprograma);

            if (response.data.success && response.data.metricas) {
              dadosTodosProjetos[projeto.id] = response.data.metricas;
            }
          } catch (error) {
            // Não logar erro 404 - significa apenas que não há dados para o projeto
            if (error.response && error.response.status !== 404) {
              console.error(`Erro ao carregar dados de categorização do projeto ${projeto.id}:`, error);
            }
          }
        })
      );

      setDadosCategorizacaoSQLServer(dadosTodosProjetos);

    } catch (error) {
      console.error('Erro ao carregar dados de categorização de todos os projetos:', error);
      setDadosCategorizacaoSQLServer({});
    } finally {
      setLoadingCategorizacao(false);
    }
  };

  const carregarDadosProcessamentoProjeto = async (projetoId) => {
    try {
      setLoadingProcessamento(true);

      const projetoSelecionado = projetos.find(p => p.id === parseInt(projetoId));

      if (projetoSelecionado && projetoSelecionado.subprograma) {
        const cdProjeto = projetoSelecionado.subprograma;

        // Carregar as 3 métricas em paralelo
        const [responsePacote, responseDigitalizacao, responseProcessamento] = await Promise.all([
          dashboardService.getFropPacoteMetricas(cdProjeto).catch(() => null),
          dashboardService.getFropDigitalizacaoMetricas(cdProjeto).catch(() => null),
          dashboardService.getProcessamentoMetricas(cdProjeto).catch(() => null)
        ]);

        if (responsePacote && responsePacote.data.success) {
          setDadosFropPacoteSQLServer({ [projetoId]: responsePacote.data.metricas });
        }

        if (responseDigitalizacao && responseDigitalizacao.data.success) {
          setDadosFropDigitalizacaoSQLServer({ [projetoId]: responseDigitalizacao.data.metricas });
        }

        if (responseProcessamento && responseProcessamento.data.success) {
          setDadosProcessamentoSQLServer({ [projetoId]: responseProcessamento.data.metricas });
        }
      }
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        console.error('Erro ao carregar dados de processamento:', error);
      }
    } finally {
      setLoadingProcessamento(false);
    }
  };

  const carregarDadosProcessamentoTodosProjetos = async () => {
    try {
      setLoadingProcessamento(true);

      let projetosComSubprograma = projetos.filter(p => p.subprograma && p.subprograma.trim() !== '');

      if (filtros.ordem_producao) {
        projetosComSubprograma = projetosComSubprograma.filter(p => p.ordem_producao === filtros.ordem_producao);
      }

      const dadosPacote = {};
      const dadosDigitalizacao = {};
      const dadosProcessamento = {};

      await Promise.all(
        projetosComSubprograma.map(async (projeto) => {
          try {
            const [responsePacote, responseDigitalizacao, responseProcessamento] = await Promise.all([
              dashboardService.getFropPacoteMetricas(projeto.subprograma).catch(() => null),
              dashboardService.getFropDigitalizacaoMetricas(projeto.subprograma).catch(() => null),
              dashboardService.getProcessamentoMetricas(projeto.subprograma).catch(() => null)
            ]);

            if (responsePacote && responsePacote.data.success) {
              dadosPacote[projeto.id] = responsePacote.data.metricas;
            }

            if (responseDigitalizacao && responseDigitalizacao.data.success) {
              dadosDigitalizacao[projeto.id] = responseDigitalizacao.data.metricas;
            }

            if (responseProcessamento && responseProcessamento.data.success) {
              dadosProcessamento[projeto.id] = responseProcessamento.data.metricas;
            }
          } catch (error) {
            if (error.response && error.response.status !== 404) {
              console.error(`Erro ao carregar dados de processamento do projeto ${projeto.id}:`, error);
            }
          }
        })
      );

      setDadosFropPacoteSQLServer(dadosPacote);
      setDadosFropDigitalizacaoSQLServer(dadosDigitalizacao);
      setDadosProcessamentoSQLServer(dadosProcessamento);

    } catch (error) {
      console.error('Erro ao carregar dados de processamento de todos os projetos:', error);
      setDadosFropPacoteSQLServer({});
      setDadosFropDigitalizacaoSQLServer({});
      setDadosProcessamentoSQLServer({});
    } finally {
      setLoadingProcessamento(false);
    }
  };

  const carregarDadosParticipacaoProjeto = async (projetoId) => {
    try {
      setLoadingParticipacao(true);

      const projetoSelecionado = projetos.find(p => p.id === parseInt(projetoId));

      console.log('=== Carregando dados de participação ===');
      console.log('Projeto ID:', projetoId);
      console.log('Projeto selecionado:', projetoSelecionado);

      if (projetoSelecionado && projetoSelecionado.subprograma) {
        const cdProjeto = projetoSelecionado.subprograma;
        console.log('CD_PROJETO:', cdProjeto);

        const response = await dashboardService.getParticipacaoByProjeto(cdProjeto);

        console.log('Resposta da API:', response.data);

        if (response.data.success) {
          console.log('Dados recebidos:', response.data.data);
          console.log('DADO_PARTICIPACAO:', response.data.data.DADO_PARTICIPACAO);
          setDadosParticipacaoSQLServer({
            [projetoId]: response.data.data
          });
        } else {
          console.log('API retornou success: false');
          setDadosParticipacaoSQLServer({});
        }
      } else {
        console.log('Projeto não tem subprograma');
      }
    } catch (error) {
      // Não logar erro 404 - significa apenas que não há dados para o projeto
      if (error.response && error.response.status !== 404) {
        console.error('Erro ao carregar dados de participação:', error);
        console.error('Resposta do erro:', error.response?.data);
      } else {
        console.log('Nenhum dado de participação encontrado (404)');
      }
      setDadosParticipacaoSQLServer({});
    } finally {
      setLoadingParticipacao(false);
    }
  };

  const carregarDadosParticipacaoTodosProjetos = async () => {
    try {
      setLoadingParticipacao(true);

      let projetosComSubprograma = projetos.filter(p => p.subprograma && p.subprograma.trim() !== '');

      console.log('=== Carregando participação de todos os projetos ===');
      console.log('Total de projetos com subprograma:', projetosComSubprograma.length);

      if (filtros.ordem_producao) {
        projetosComSubprograma = projetosComSubprograma.filter(p => p.ordem_producao === filtros.ordem_producao);
        console.log('Projetos após filtro de ordem:', projetosComSubprograma.length);
      }

      const dadosParticipacao = {};
      let sucessos = 0;
      let erros = 0;

      await Promise.all(
        projetosComSubprograma.map(async (projeto) => {
          try {
            console.log(`Buscando participação do projeto ${projeto.id} (${projeto.subprograma})...`);
            const response = await dashboardService.getParticipacaoByProjeto(projeto.subprograma);

            if (response.data.success && response.data.data) {
              console.log(`✓ Dados encontrados para projeto ${projeto.id}`);
              console.log(`  - DADO_PARTICIPACAO:`, response.data.data.DADO_PARTICIPACAO);
              dadosParticipacao[projeto.id] = response.data.data;
              sucessos++;
            }
          } catch (error) {
            erros++;
            // Não logar erro 404 - significa apenas que não há dados para o projeto
            if (error.response && error.response.status !== 404) {
              console.error(`✗ Erro ao carregar dados de participação do projeto ${projeto.id}:`, error);
            } else {
              console.log(`✗ Sem dados para projeto ${projeto.id} (404)`);
            }
          }
        })
      );

      console.log(`Resumo: ${sucessos} projetos com dados, ${erros} sem dados`);
      console.log('Dados de participação carregados:', Object.keys(dadosParticipacao).length);

      setDadosParticipacaoSQLServer(dadosParticipacao);

    } catch (error) {
      console.error('Erro ao carregar dados de participação de todos os projetos:', error);
      setDadosParticipacaoSQLServer({});
    } finally {
      setLoadingParticipacao(false);
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

    const recodificacaoSquad = squads.find(s => s.nome === 'Recodificação');

    setDadosFiltrados({
      recodificacao: atividadesFiltradas.filter(a =>
        recodificacaoSquad && a.squad.id === recodificacaoSquad.id
      )
    });
  };

  const limparFiltros = () => {
    setFiltros({
      ordem_producao: '',
      projeto_id: '',
      squad_id: ''
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

  const deveExibirSquadRecodificacao = () => {
    if (!filtros.squad_id) return true;
    const recodificacaoSquad = squads.find(s => s.nome === 'Recodificação');
    return recodificacaoSquad && parseInt(filtros.squad_id) === recodificacaoSquad.id;
  };

  const deveExibirSquadCategorizacao = () => {
    if (!filtros.squad_id) return true;
    const categorizacaoSquad = squads.find(s => s.nome === 'Categorização');
    return categorizacaoSquad && parseInt(filtros.squad_id) === categorizacaoSquad.id;
  };

  const deveExibirSquadProcessamento = () => {
    if (!filtros.squad_id) return true;
    const processamentoSquad = squads.find(s => s.nome === 'Processamento');
    return processamentoSquad && parseInt(filtros.squad_id) === processamentoSquad.id;
  };

  const deveExibirParticipacao = () => {
    // Sempre exibir participação quando não houver filtro de squad
    // ou quando não houver squad específico (participação é geral)
    return !filtros.squad_id;
  };

  const obterProjetosParaExibir = () => {
    if (filtros.projeto_id) {
      const projeto = projetos.find(p => p.id === parseInt(filtros.projeto_id));
      return projeto ? [projeto] : [];
    } else {
      let projetosComDados = projetos.filter(p =>
        (dadosRecodificacaoSQLServer[p.id] && dadosRecodificacaoSQLServer[p.id].metricas && dadosRecodificacaoSQLServer[p.id].metricas.length > 0)
      );

      if (filtros.ordem_producao) {
        projetosComDados = projetosComDados.filter(p => p.ordem_producao === filtros.ordem_producao);
      }

      return projetosComDados;
    }
  };

  const obterProjetosParaExibirParticipacao = () => {
    if (filtros.projeto_id) {
      const projeto = projetos.find(p => p.id === parseInt(filtros.projeto_id));
      return projeto ? [projeto] : [];
    } else {
      let projetosComDados = projetos.filter(p =>
        dadosParticipacaoSQLServer[p.id] && dadosParticipacaoSQLServer[p.id].DADO_PARTICIPACAO
      );

      if (filtros.ordem_producao) {
        projetosComDados = projetosComDados.filter(p => p.ordem_producao === filtros.ordem_producao);
      }

      console.log('Projetos com dados de participação para exibir:', projetosComDados.length);
      projetosComDados.forEach(p => {
        console.log(`  - Projeto ${p.id}: ${p.nome}`);
      });

      return projetosComDados;
    }
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
              {(filtros.ordem_producao || filtros.projeto_id || filtros.squad_id) && (
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
                    Tipos de Atividades
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

                  const metricas = dadosRecodificacaoSQLServer[projeto.id];

                  if (!metricas ||
                      !metricas.metricas ||
                      metricas.metricas.length === 0) {
                    return null;
                  }

                  return (
                    <div key={`recodificacao-${projeto.id}`} className="projeto-grafico-wrapper">
                      <RecodificacaoCharts
                        cdProjeto={projeto.subprograma}
                        metricas={metricas}
                        atividadesSquad={atividadesRecodificacaoProjeto}
                        nomeProjeto={projeto.nome_completo || projeto.nome}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Squad Categorização - Gráficos (apenas em modo detalhado) */}
        {modoVisualizacao === 'detalhado' && deveExibirSquadCategorizacao() && (
          <div className="squad-section">
            {loadingCategorizacao ? (
              <div className="loading">Carregando dados de categorização...</div>
            ) : projetosParaExibir.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum projeto com dados de categorização disponível</p>
              </div>
            ) : (
              <div className="projetos-graficos-container">
                {projetosParaExibir.map(projeto => {
                  const metricasCategorizacao = dadosCategorizacaoSQLServer[projeto.id];

                  if (!metricasCategorizacao) {
                    return null;
                  }

                  return (
                    <div key={`categorizacao-${projeto.id}`} className="projeto-grafico-wrapper">
                      <CategorizacaoCharts
                        metricas={metricasCategorizacao}
                        nomeProjeto={projeto.nome_completo || projeto.nome}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Squad Processamento - Gráficos (apenas em modo detalhado) */}
        {modoVisualizacao === 'detalhado' && deveExibirSquadProcessamento() && (
          <div className="squad-section">
            {loadingProcessamento ? (
              <div className="loading">Carregando dados de processamento...</div>
            ) : projetosParaExibir.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum projeto com dados de processamento disponível</p>
              </div>
            ) : (
              <div className="projetos-graficos-container">
                {projetosParaExibir.map(projeto => {
                  const metricasPacote = dadosFropPacoteSQLServer[projeto.id];
                  const metricasDigitalizacao = dadosFropDigitalizacaoSQLServer[projeto.id];
                  const metricasProcessamento = dadosProcessamentoSQLServer[projeto.id];

                  // Só exibir se houver pelo menos uma métrica
                  if (!metricasPacote && !metricasDigitalizacao && !metricasProcessamento) {
                    return null;
                  }

                  return (
                    <div key={`processamento-${projeto.id}`} className="projeto-grafico-wrapper">
                      <ProcessamentoCharts
                        nomeProjeto={projeto.nome_completo || projeto.nome}
                        cdProjeto={projeto.id}
                        metricasPacote={metricasPacote}
                        metricasDigitalizacao={metricasDigitalizacao}
                        metricasProcessamento={metricasProcessamento}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Indicadores de Participação - Gráficos (apenas em modo detalhado) */}
        {modoVisualizacao === 'detalhado' && deveExibirParticipacao() && (
          <div className="squad-section">
            {loadingParticipacao ? (
              <div className="loading">Carregando dados de participação...</div>
            ) : (() => {
                const projetosParticipacao = obterProjetosParaExibirParticipacao();
                console.log('Renderizando seção de participação. Projetos:', projetosParticipacao.length);

                if (projetosParticipacao.length === 0) {
                  return (
                    <div className="empty-state">
                      <p>Nenhum projeto com dados de participação disponível</p>
                    </div>
                  );
                }

                return (
                  <div className="projetos-graficos-container">
                    {projetosParticipacao.map(projeto => {
                      const participacaoData = dadosParticipacaoSQLServer[projeto.id];

                      console.log(`Renderizando participação do projeto ${projeto.id}:`, participacaoData);

                      if (!participacaoData) {
                        console.log(`Sem dados de participação para projeto ${projeto.id}`);
                        return null;
                      }

                      return (
                        <div key={`participacao-${projeto.id}`} className="projeto-grafico-wrapper">
                          <ParticipacaoCharts
                            cdProjeto={projeto.subprograma}
                            participacaoData={participacaoData}
                            nomeProjeto={projeto.nome_completo || projeto.nome}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;