import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faPlay,
  faSpinner,
  faUpload,
  faFile,
  faTrash,
  faTimes,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimesCircle,
  faScrewdriverWrench,
  faFileExcel,
  faFilter,
  faListCheck,
  faClockRotateLeft,
  faChevronDown,
  faChevronUp,
  faBox
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import '../styles/Dashboard.css';
import { useAuth } from '../contexts/AuthContext';

// Configuração da API
const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.6.31:5000/api';

const Rotinas = () => {
  const { user, canEdit } = useAuth();
  const currentUser = user;
  const [squads, setSquads] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [filtros, setFiltros] = useState({ squad_id: '', projeto_id: '' });
  const [projetoSearch, setProjetoSearch] = useState('');
  const [projetosFiltrados, setProjetosFiltrados] = useState([]);
  const [showProjetoDropdown, setShowProjetoDropdown] = useState(false);

  // Estados para execução e job - Recodificação
  const [executando, setExecutando] = useState(false);
  const [jobAtual, setJobAtual] = useState(null);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const logsEndRef = useRef(null);
  const pollingInterval = useRef(null);

  // Estados para execução e job - Categorização
  const [executandoCategorizacao, setExecutandoCategorizacao] = useState(false);
  const [jobAtualCategorizacao, setJobAtualCategorizacao] = useState(null);
  const [logsExpandedCategorizacao, setLogsExpandedCategorizacao] = useState(false);
  const logsEndRefCategorizacao = useRef(null);
  const pollingIntervalCategorizacao = useRef(null);

  // Estados para execução e job - Frop Pacote
  const [executandoFropPacote, setExecutandoFropPacote] = useState(false);
  const [jobAtualFropPacote, setJobAtualFropPacote] = useState(null);
  const [logsExpandedFropPacote, setLogsExpandedFropPacote] = useState(false);
  const logsEndRefFropPacote = useRef(null);
  const pollingIntervalFropPacote = useRef(null);

  // Estados para execução e job - Frop Digitalização
  const [executandoFropDigitalizacao, setExecutandoFropDigitalizacao] = useState(false);
  const [jobAtualFropDigitalizacao, setJobAtualFropDigitalizacao] = useState(null);
  const [logsExpandedFropDigitalizacao, setLogsExpandedFropDigitalizacao] = useState(false);
  const logsEndRefFropDigitalizacao = useRef(null);
  const pollingIntervalFropDigitalizacao = useRef(null);

  // Função auxiliar que verifica permissão
  const temPermissao = () => {
    if (typeof canEdit === 'function') {
      return canEdit();
    }
    return Boolean(canEdit);
  };

  // Carregar squads e projetos
  useEffect(() => {
    fetch(`${API_URL}/squads`)
      .then(res => res.json())
      .then(data => setSquads(data))
      .catch(err => toast.error('Erro ao carregar squads'));

    fetch(`${API_URL}/projetos`)
      .then(res => res.json())
      .then(data => setProjetos(data))
      .catch(err => toast.error('Erro ao carregar projetos'));
  }, []);

  // Verificar status do job quando o projeto muda - Recodificação
  useEffect(() => {
    if (filtros.projeto_id) {
      verificarStatusJob(filtros.projeto_id);
      verificarStatusJobCategorizacao(filtros.projeto_id);
      verificarStatusJobFropPacote(filtros.projeto_id);
      verificarStatusJobFropDigitalizacao(filtros.projeto_id);
    } else {
      setJobAtual(null);
      setJobAtualCategorizacao(null);
      setJobAtualFropPacote(null);
      setJobAtualFropDigitalizacao(null);
      pararPolling();
      pararPollingCategorizacao();
      pararPollingFropPacote();
      pararPollingFropDigitalizacao();
    }
  }, [filtros.projeto_id]);

  // Auto-scroll dos logs - Recodificação
  useEffect(() => {
    if (logsExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobAtual?.logs, logsExpanded]);

  // Auto-scroll dos logs - Categorização
  useEffect(() => {
    if (logsExpandedCategorizacao && logsEndRefCategorizacao.current) {
      logsEndRefCategorizacao.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobAtualCategorizacao?.logs, logsExpandedCategorizacao]);

  // Auto-scroll dos logs - Frop Pacote
  useEffect(() => {
    if (logsExpandedFropPacote && logsEndRefFropPacote.current) {
      logsEndRefFropPacote.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobAtualFropPacote?.logs, logsExpandedFropPacote]);

  // Auto-scroll dos logs - Frop Digitalização
  useEffect(() => {
    if (logsExpandedFropDigitalizacao && logsEndRefFropDigitalizacao.current) {
      logsEndRefFropDigitalizacao.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobAtualFropDigitalizacao?.logs, logsExpandedFropDigitalizacao]);

  // Limpar polling ao desmontar componente
  useEffect(() => {
    return () => {
      pararPolling();
      pararPollingCategorizacao();
      pararPollingFropPacote();
      pararPollingFropDigitalizacao();
    };
  }, []);

  const verificarStatusJob = async (projeto_id) => {
    try {
      const response = await fetch(`${API_URL}/recodificacao/job/projeto/${projeto_id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobAtual(data.job);

          // Se está em andamento, iniciar polling
          if (data.job.status === 'em_andamento') {
            setExecutando(true);
            iniciarPolling(projeto_id);
            if (!logsExpanded) {
              setLogsExpanded(true);
            }
          } else {
            setExecutando(false);
            pararPolling();
          }
        }
      } else {
        // Job não encontrado, limpar estado
        setJobAtual(null);
        setExecutando(false);
        pararPolling();
      }
    } catch (error) {
      console.error('Erro ao verificar status do job:', error);
    }
  };

  const iniciarPolling = (projeto_id) => {
    // Limpar polling anterior se existir
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Polling a cada 2 segundos
    pollingInterval.current = setInterval(() => {
      verificarStatusJob(projeto_id);
    }, 2000);
  };

  const pararPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  // Filtrar projetos
  useEffect(() => {
    if (projetoSearch.trim() === '') {
      setProjetosFiltrados(projetos);
    } else {
      const termo = projetoSearch.toLowerCase();
      const filtrados = projetos.filter(p =>
        (p.subprograma && p.subprograma.toLowerCase().includes(termo)) ||
        (p.nome && p.nome.toLowerCase().includes(termo))
      );
      setProjetosFiltrados(filtrados);
    }
  }, [projetoSearch, projetos]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.projeto-autocomplete')) {
        setShowProjetoDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const selecionarProjeto = (projeto) => {
    setFiltros({...filtros, projeto_id: projeto.id});
    setProjetoSearch(`${projeto.subprograma || projeto.nome}`);
    setShowProjetoDropdown(false);
  };

  const limparProjeto = () => {
    setFiltros({...filtros, projeto_id: ''});
    setProjetoSearch('');
    setShowProjetoDropdown(false);
  };

  const executarRotinaRecodificacao = async () => {
    if (!temPermissao()) {
      toast.error('Você não tem permissão para executar rotinas');
      return;
    }

    if (!filtros.squad_id || !filtros.projeto_id) {
      toast.warning('Selecione Squad e Projeto para executar a rotina');
      return;
    }

    // Verificar se user existe e tem username
    if (!currentUser) {
      toast.error('Erro: Usuário não identificado. Faça login novamente.');
      return;
    }

    const nomeUsuario = currentUser.username || currentUser.login || 'Sistema';

    // Obter código do projeto (subprograma)
    const projetoSelecionado = projetos.find(p => p.id === parseInt(filtros.projeto_id));
    if (!projetoSelecionado || !projetoSelecionado.subprograma) {
      toast.error('Projeto selecionado não possui código de subprograma');
      return;
    }

    setExecutando(true);
    setLogsExpanded(true);

    try {
      const response = await fetch(`${API_URL}/recodificacao/executar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: nomeUsuario,
          squad_id: filtros.squad_id,
          projeto_id: filtros.projeto_id,
          cd_projeto: projetoSelecionado.subprograma
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao executar rotina');
      }

      toast.success('Rotina iniciada em background!');

      // Iniciar polling para atualizar status
      iniciarPolling(filtros.projeto_id);

      // Buscar status inicial
      setTimeout(() => verificarStatusJob(filtros.projeto_id), 500);

    } catch (error) {
      toast.error(error.message);
      setExecutando(false);
    }
  };

  const podeExecutar = () => {
    return temPermissao() &&
           filtros.squad_id &&
           filtros.projeto_id &&
           !executando;
  };

  // ===== FUNÇÕES PARA CATEGORIZAÇÃO =====

  const verificarStatusJobCategorizacao = async (projeto_id) => {
    try {
      const response = await fetch(`${API_URL}/categorizacao/job/projeto/${projeto_id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobAtualCategorizacao(data.job);

          if (data.job.status === 'em_andamento') {
            setExecutandoCategorizacao(true);
            iniciarPollingCategorizacao(projeto_id);
            if (!logsExpandedCategorizacao) {
              setLogsExpandedCategorizacao(true);
            }
          } else {
            setExecutandoCategorizacao(false);
            pararPollingCategorizacao();
          }
        }
      } else {
        setJobAtualCategorizacao(null);
        setExecutandoCategorizacao(false);
        pararPollingCategorizacao();
      }
    } catch (error) {
      console.error('Erro ao verificar status do job de categorização:', error);
    }
  };

  const iniciarPollingCategorizacao = (projeto_id) => {
    if (pollingIntervalCategorizacao.current) {
      clearInterval(pollingIntervalCategorizacao.current);
    }

    pollingIntervalCategorizacao.current = setInterval(() => {
      verificarStatusJobCategorizacao(projeto_id);
    }, 2000);
  };

  const pararPollingCategorizacao = () => {
    if (pollingIntervalCategorizacao.current) {
      clearInterval(pollingIntervalCategorizacao.current);
      pollingIntervalCategorizacao.current = null;
    }
  };

  const executarRotinaCategorizacao = async () => {
    if (!temPermissao()) {
      toast.error('Você não tem permissão para executar rotinas');
      return;
    }

    if (!filtros.squad_id || !filtros.projeto_id) {
      toast.warning('Selecione Squad e Projeto para executar a rotina');
      return;
    }

    if (!currentUser) {
      toast.error('Erro: Usuário não identificado. Faça login novamente.');
      return;
    }

    const nomeUsuario = currentUser.username || currentUser.login || 'Sistema';

    const projetoSelecionado = projetos.find(p => p.id === parseInt(filtros.projeto_id));
    if (!projetoSelecionado || !projetoSelecionado.subprograma) {
      toast.error('Projeto selecionado não possui código de subprograma');
      return;
    }

    setExecutandoCategorizacao(true);
    setLogsExpandedCategorizacao(true);

    try {
      const response = await fetch(`${API_URL}/categorizacao/executar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: nomeUsuario,
          squad_id: filtros.squad_id,
          projeto_id: filtros.projeto_id,
          cd_projeto: projetoSelecionado.subprograma
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao executar rotina');
      }

      toast.success('Rotina de categorização iniciada em background!');

      iniciarPollingCategorizacao(filtros.projeto_id);
      setTimeout(() => verificarStatusJobCategorizacao(filtros.projeto_id), 500);

    } catch (error) {
      toast.error(error.message);
      setExecutandoCategorizacao(false);
    }
  };

  const podeExecutarCategorizacao = () => {
    return temPermissao() &&
           filtros.squad_id &&
           filtros.projeto_id &&
           !executandoCategorizacao;
  };

  // ========== FROP PACOTE ==========

  const verificarStatusJobFropPacote = async (projeto_id) => {
    try {
      const response = await fetch(`${API_URL}/frop-pacote/job/projeto/${projeto_id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobAtualFropPacote(data.job);

          if (data.job.status === 'em_andamento') {
            setExecutandoFropPacote(true);
            iniciarPollingFropPacote(projeto_id);
            if (!logsExpandedFropPacote) {
              setLogsExpandedFropPacote(true);
            }
          } else {
            setExecutandoFropPacote(false);
            pararPollingFropPacote();
          }
        }
      } else {
        setJobAtualFropPacote(null);
        setExecutandoFropPacote(false);
        pararPollingFropPacote();
      }
    } catch (error) {
      console.error('Erro ao verificar status do job de Frop Pacote:', error);
    }
  };

  const iniciarPollingFropPacote = (projeto_id) => {
    if (pollingIntervalFropPacote.current) {
      clearInterval(pollingIntervalFropPacote.current);
    }

    pollingIntervalFropPacote.current = setInterval(() => {
      verificarStatusJobFropPacote(projeto_id);
    }, 2000);
  };

  const pararPollingFropPacote = () => {
    if (pollingIntervalFropPacote.current) {
      clearInterval(pollingIntervalFropPacote.current);
      pollingIntervalFropPacote.current = null;
    }
  };

  const executarRotinaFropPacote = async () => {
    if (!temPermissao()) {
      toast.error('Você não tem permissão para executar rotinas');
      return;
    }

    if (!filtros.squad_id || !filtros.projeto_id) {
      toast.warning('Selecione Squad e Projeto para executar a rotina');
      return;
    }

    if (!currentUser) {
      toast.error('Erro: Usuário não identificado. Faça login novamente.');
      return;
    }

    const nomeUsuario = currentUser.username || currentUser.login || 'Sistema';

    const projetoSelecionado = projetos.find(p => p.id === parseInt(filtros.projeto_id));
    if (!projetoSelecionado || !projetoSelecionado.subprograma) {
      toast.error('Projeto selecionado não possui código de subprograma');
      return;
    }

    setExecutandoFropPacote(true);
    setLogsExpandedFropPacote(true);

    try {
      const response = await fetch(`${API_URL}/frop-pacote/executar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: nomeUsuario,
          squad_id: filtros.squad_id,
          projeto_id: filtros.projeto_id,
          cd_projeto: projetoSelecionado.subprograma
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao executar rotina');
      }

      toast.success('Rotina Frop Pacote iniciada em background!');

      iniciarPollingFropPacote(filtros.projeto_id);
      setTimeout(() => verificarStatusJobFropPacote(filtros.projeto_id), 500);

    } catch (error) {
      toast.error(error.message);
      setExecutandoFropPacote(false);
    }
  };

  const podeExecutarFropPacote = () => {
    return temPermissao() &&
           filtros.squad_id &&
           filtros.projeto_id &&
           !executandoFropPacote;
  };

  // ========== FROP DIGITALIZAÇÃO ==========

  const verificarStatusJobFropDigitalizacao = async (projeto_id) => {
    try {
      const response = await fetch(`${API_URL}/frop-digitalizacao/job/projeto/${projeto_id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobAtualFropDigitalizacao(data.job);

          if (data.job.status === 'em_andamento') {
            setExecutandoFropDigitalizacao(true);
            iniciarPollingFropDigitalizacao(projeto_id);
            if (!logsExpandedFropDigitalizacao) {
              setLogsExpandedFropDigitalizacao(true);
            }
          } else {
            setExecutandoFropDigitalizacao(false);
            pararPollingFropDigitalizacao();
          }
        }
      } else if (response.status === 404) {
        // 404 é normal quando não há job ainda - não é erro
        setJobAtualFropDigitalizacao(null);
        setExecutandoFropDigitalizacao(false);
        pararPollingFropDigitalizacao();
      } else {
        // Outros erros (500, etc)
        console.error('Erro ao verificar status do job de Frop Digitalização:', response.status);
        setJobAtualFropDigitalizacao(null);
        setExecutandoFropDigitalizacao(false);
        pararPollingFropDigitalizacao();
      }
    } catch (error) {
      console.error('Erro ao verificar status do job de Frop Digitalização:', error);
    }
  };

  const iniciarPollingFropDigitalizacao = (projeto_id) => {
    if (pollingIntervalFropDigitalizacao.current) {
      clearInterval(pollingIntervalFropDigitalizacao.current);
    }

    pollingIntervalFropDigitalizacao.current = setInterval(() => {
      verificarStatusJobFropDigitalizacao(projeto_id);
    }, 2000);
  };

  const pararPollingFropDigitalizacao = () => {
    if (pollingIntervalFropDigitalizacao.current) {
      clearInterval(pollingIntervalFropDigitalizacao.current);
      pollingIntervalFropDigitalizacao.current = null;
    }
  };

  const executarRotinaFropDigitalizacao = async () => {
    if (!temPermissao()) {
      toast.error('Você não tem permissão para executar rotinas');
      return;
    }

    if (!filtros.squad_id || !filtros.projeto_id) {
      toast.warning('Selecione Squad e Projeto para executar a rotina');
      return;
    }

    if (!currentUser) {
      toast.error('Erro: Usuário não identificado. Faça login novamente.');
      return;
    }

    const nomeUsuario = currentUser.username || currentUser.login || 'Sistema';

    const projetoSelecionado = projetos.find(p => p.id === parseInt(filtros.projeto_id));
    if (!projetoSelecionado || !projetoSelecionado.subprograma) {
      toast.error('Projeto selecionado não possui código de subprograma');
      return;
    }

    setExecutandoFropDigitalizacao(true);
    setLogsExpandedFropDigitalizacao(true);

    try {
      const response = await fetch(`${API_URL}/frop-digitalizacao/executar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: nomeUsuario,
          squad_id: filtros.squad_id,
          projeto_id: filtros.projeto_id,
          cd_projeto: projetoSelecionado.subprograma
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao executar rotina');
      }

      toast.success('Rotina Frop Digitalização iniciada em background!');

      iniciarPollingFropDigitalizacao(filtros.projeto_id);
      setTimeout(() => verificarStatusJobFropDigitalizacao(filtros.projeto_id), 500);

    } catch (error) {
      toast.error(error.message);
      setExecutandoFropDigitalizacao(false);
    }
  };

  const podeExecutarFropDigitalizacao = () => {
    return temPermissao() &&
           filtros.squad_id &&
           filtros.projeto_id &&
           !executandoFropDigitalizacao;
  };

  const formatarTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLogIcon = (tipo) => {
    switch(tipo) {
      case 'success': return faCheckCircle;
      case 'error': return faTimesCircle;
      case 'warning': return faExclamationTriangle;
      default: return faInfoCircle;
    }
  };

  const getLogColor = (tipo) => {
    switch(tipo) {
      case 'success': return '#27ae60';
      case 'error': return '#e74c3c';
      case 'warning': return '#f39c12';
      default: return '#3498db';
    }
  };

  // Verificar se squad selecionada é Recodificação ou Categorização
  const squadSelecionada = squads.find(s => s.id === parseInt(filtros.squad_id));
  const mostrarRotinaRecodificacao = squadSelecionada && squadSelecionada.nome === 'Recodificação' && filtros.projeto_id;
  const mostrarRotinaCategorizacao = squadSelecionada && squadSelecionada.nome === 'Categorização' && filtros.projeto_id;
  const mostrarRotinaFropPacote = squadSelecionada && squadSelecionada.nome === 'Processamento' && filtros.projeto_id;
  const mostrarRotinaFropDigitalizacao = squadSelecionada && squadSelecionada.nome === 'Processamento' && filtros.projeto_id;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FontAwesomeIcon icon={faCog} /> Rotinas Automatizadas
          </h2>
        </div>

        <div style={{padding: '20px'}}>
          <div style={{
            background: '#ecf0f1',
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FontAwesomeIcon icon={faScrewdriverWrench} style={{fontSize: '24px', color: '#7f8c8d'}} />
            <div>
              <strong style={{display: 'block', marginBottom: '5px', color: '#2c3e50'}}>
                Painel de Controle de Rotinas
              </strong>
              <span style={{color: '#7f8c8d', fontSize: '14px'}}>
                Selecione os parâmetros e execute as rotinas para atualização dos indicadores.
              </span>
            </div>
          </div>

          {!temPermissao() && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#856404'
            }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{marginRight: '10px'}} />
              <strong>Acesso Restrito:</strong> Você não tem permissão para executar rotinas.
            </div>
          )}

          {/* FILTROS */}
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '25px'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faFilter} style={{fontSize: '20px', color: '#3498db'}} />
              Parâmetros de Execução
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '15px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2c3e50'
                }}>
                  Squad *
                </label>
                <select
                  className="form-control"
                  value={filtros.squad_id}
                  onChange={(e) => {
                    setFiltros({...filtros, squad_id: e.target.value, projeto_id: ''});
                    setProjetoSearch('');
                  }}
                  style={{width: '100%'}}
                  disabled={executando || executandoCategorizacao || executandoFropPacote || executandoFropDigitalizacao}
                >
                  <option value="">Selecione uma Squad</option>
                  {squads.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div style={{position: 'relative'}} className="projeto-autocomplete">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2c3e50'
                }}>
                  Projeto *
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={!filtros.squad_id ? "Selecione uma Squad primeiro" : "Digite para buscar..."}
                    value={projetoSearch}
                    onChange={(e) => {
                      setProjetoSearch(e.target.value);
                      setShowProjetoDropdown(true);
                    }}
                    onFocus={() => setShowProjetoDropdown(true)}
                    disabled={!filtros.squad_id || executando || executandoCategorizacao || executandoFropPacote || executandoFropDigitalizacao}
                    style={{width: '100%', paddingRight: filtros.projeto_id ? '40px' : '10px'}}
                  />
                  {filtros.projeto_id && (
                    <button
                      onClick={limparProjeto}
                      disabled={executando || executandoCategorizacao || executandoFropPacote || executandoFropDigitalizacao}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#95a5a6',
                        cursor: (executando || executandoCategorizacao || executandoFropPacote || executandoFropDigitalizacao) ? 'not-allowed' : 'pointer',
                        fontSize: '18px',
                        padding: '0',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: (executando || executandoCategorizacao || executandoFropPacote || executandoFropDigitalizacao) ? 0.5 : 1
                      }}
                      title="Limpar projeto"
                    >
                      ×
                    </button>
                  )}
                </div>

                {showProjetoDropdown && projetosFiltrados.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    marginTop: '2px'
                  }}>
                    {projetosFiltrados.map(projeto => (
                      <div
                        key={projeto.id}
                        onClick={() => !(executando || executandoCategorizacao || executandoFropPacote || executandoFropDigitalizacao) && selecionarProjeto(projeto)}
                        style={{
                          padding: '10px 15px',
                          cursor: (executando || executandoCategorizacao || executandoFropPacote || executandoFropDigitalizacao) ? 'not-allowed' : 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'background 0.2s',
                          opacity: (executando || executandoCategorizacao || executandoFropPacote || executandoFropDigitalizacao) ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => !(executando || executandoCategorizacao || executandoFropPacote || executandoFropDigitalizacao) && (e.target.style.background = '#f8f9fa')}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        <div style={{fontWeight: 600, color: '#2c3e50', marginBottom: '3px'}}>
                          {projeto.subprograma}
                        </div>
                        <div style={{fontSize: '13px', color: '#7f8c8d'}}>
                          {projeto.nome}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD DE RECODIFICAÇÃO */}
          {mostrarRotinaRecodificacao && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0'
            }}>
              {/* Header do Card */}
              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                padding: '20px 30px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px'
                  }}>
                    <FontAwesomeIcon icon={faScrewdriverWrench} />
                  </div>
                  <h3 style={{margin: 0, fontSize: '22px', fontWeight: 600, color: '#2c3e50'}}>
                    Rotina de Recodificação
                  </h3>
                </div>
              </div>

              {/* Conteúdo do Card */}
              <div style={{padding: '30px'}}>
                {/* Descrição */}
                <div style={{
                  marginBottom: '25px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3498db'
                }}>
                  <h4 style={{
                    margin: '0 0 10px 0',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#2c3e50'
                  }}>
                    Descrição da Rotina
                  </h4>
                  <p style={{margin: 0, color: '#7f8c8d', fontSize: '14px', lineHeight: '1.6'}}>
                    Rotina automatizada de monitoramento de recodificação. Esta rotina executará o processamento
                    de dados de recodificação para o projeto selecionado através de uma stored procedure no SQL Server.
                  </p>
                </div>

                {/* Informações do Projeto e Job */}
                {filtros.projeto_id && (
                  <div style={{
                    marginBottom: '25px',
                    padding: '15px 20px',
                    background: '#e8f4f8',
                    borderRadius: '6px',
                    border: '1px solid #b8dce8'
                  }}>
                    <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                      Projeto Selecionado:
                    </div>
                    <div style={{fontSize: '16px', fontWeight: 600, color: '#2c3e50', marginBottom: '15px'}}>
                      {projetos.find(p => p.id === parseInt(filtros.projeto_id))?.subprograma} - {projetos.find(p => p.id === parseInt(filtros.projeto_id))?.nome}
                    </div>

                    {/* Informações da Execução */}
                    <div style={{borderTop: '1px solid #b8dce8', paddingTop: '12px'}}>
                      <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                        <strong>Executado por:</strong> {jobAtual ? jobAtual.usuario : '-'}
                      </div>
                      <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                        <strong>Início:</strong> {jobAtual ? formatarTimestamp(jobAtual.data_inicio) : '-'}
                        {' | '}
                        <strong>Fim:</strong> {jobAtual?.data_fim ? formatarTimestamp(jobAtual.data_fim) : '-'}
                      </div>
                      <div style={{fontSize: '13px', marginTop: '8px'}}>
                        <strong>Status:</strong>{' '}
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: !jobAtual
                            ? '#95a5a6'
                            : jobAtual.status === 'concluido'
                            ? '#27ae60'
                            : jobAtual.status === 'erro'
                            ? '#e74c3c'
                            : '#f39c12',
                          color: 'white'
                        }}>
                          {!jobAtual
                            ? 'Não executado'
                            : jobAtual.status === 'concluido'
                            ? 'Executado'
                            : jobAtual.status === 'erro'
                            ? 'Erro'
                            : 'Em execução'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Área de Logs */}
                {jobAtual && jobAtual.logs && jobAtual.logs.length > 0 && (
                  <div style={{
                    marginBottom: '25px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setLogsExpanded(!logsExpanded)}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        background: '#f8f9fa',
                        border: 'none',
                        borderBottom: logsExpanded ? '1px solid #e0e0e0' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#2c3e50'
                      }}
                    >
                      <span>
                        <FontAwesomeIcon icon={faClockRotateLeft} style={{marginRight: '8px'}} />
                        Logs de Execução ({jobAtual.logs.length})
                      </span>
                      <FontAwesomeIcon icon={logsExpanded ? faChevronUp : faChevronDown} />
                    </button>

                    {logsExpanded && (
                      <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: '15px',
                        background: '#fafafa'
                      }}>
                        {jobAtual.logs.map((log, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '10px',
                              marginBottom: '8px',
                              background: 'white',
                              borderRadius: '4px',
                              borderLeft: `3px solid ${getLogColor(log.tipo)}`,
                              fontSize: '13px',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start'
                            }}
                          >
                            <FontAwesomeIcon
                              icon={getLogIcon(log.tipo)}
                              style={{
                                color: getLogColor(log.tipo),
                                marginTop: '2px',
                                flexShrink: 0
                              }}
                            />
                            <div style={{flex: 1}}>
                              <div style={{
                                fontSize: '11px',
                                color: '#95a5a6',
                                marginBottom: '4px'
                              }}>
                                {formatarTimestamp(log.timestamp)}
                              </div>
                              <div style={{color: '#2c3e50'}}>
                                {log.mensagem}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    )}
                  </div>
                )}

                {/* Rodapé com Botão de Ação */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  {/* Botão Executar - Esquerda */}
                  <button
                    onClick={executarRotinaRecodificacao}
                    disabled={!podeExecutar()}
                    style={{
                      padding: '12px 24px',
                      background: !podeExecutar()
                        ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)'
                        : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: !podeExecutar() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '140px',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => podeExecutar() && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <FontAwesomeIcon icon={executando ? faSpinner : faPlay} spin={executando} />
                    {executando ? 'Executando...' : 'Executar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CARD DE CATEGORIZAÇÃO */}
          {mostrarRotinaCategorizacao && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0'
            }}>
              {/* Header do Card */}
              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                padding: '20px 30px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px'
                  }}>
                    <FontAwesomeIcon icon={faListCheck} />
                  </div>
                  <h3 style={{margin: 0, fontSize: '22px', fontWeight: 600, color: '#2c3e50'}}>
                    Rotina de Categorização
                  </h3>
                </div>
              </div>

              {/* Conteúdo do Card */}
              <div style={{padding: '30px'}}>
                {/* Descrição */}
                <div style={{
                  marginBottom: '25px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3498db'
                }}>
                  <h4 style={{
                    margin: '0 0 10px 0',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#2c3e50'
                  }}>
                    Descrição da Rotina
                  </h4>
                  <p style={{margin: 0, color: '#7f8c8d', fontSize: '14px', lineHeight: '1.6'}}>
                    Rotina automatizada de monitoramento de categorização da ata de sala. Esta rotina executará o
                    processamento de dados com CTEs complexas, coletando métricas dos processos de categorização
                    (PREVISTO_T1-T4 e EFETIVO_T1-T4) e sincronizando com a tabela TMP_CATEGORIZACAO através de MERGE.
                  </p>
                </div>

                {/* Informações do Projeto e Job */}
                {filtros.projeto_id && (
                  <div style={{
                    marginBottom: '25px',
                    padding: '15px 20px',
                    background: '#e8f4f8',
                    borderRadius: '6px',
                    border: '1px solid #b8dce8'
                  }}>
                    <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                      Projeto Selecionado:
                    </div>
                    <div style={{fontSize: '16px', fontWeight: 600, color: '#2c3e50', marginBottom: '15px'}}>
                      {projetos.find(p => p.id === parseInt(filtros.projeto_id))?.subprograma} - {projetos.find(p => p.id === parseInt(filtros.projeto_id))?.nome}
                    </div>

                    {/* Informações da Execução */}
                    <div style={{borderTop: '1px solid #b8dce8', paddingTop: '12px'}}>
                      <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                        <strong>Executado por:</strong> {jobAtualCategorizacao ? jobAtualCategorizacao.usuario : '-'}
                      </div>
                      <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                        <strong>Início:</strong> {jobAtualCategorizacao ? formatarTimestamp(jobAtualCategorizacao.data_inicio) : '-'}
                        {' | '}
                        <strong>Fim:</strong> {jobAtualCategorizacao?.data_fim ? formatarTimestamp(jobAtualCategorizacao.data_fim) : '-'}
                      </div>
                      <div style={{fontSize: '13px', marginTop: '8px'}}>
                        <strong>Status:</strong>{' '}
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: !jobAtualCategorizacao
                            ? '#95a5a6'
                            : jobAtualCategorizacao.status === 'concluido'
                            ? '#27ae60'
                            : jobAtualCategorizacao.status === 'erro'
                            ? '#e74c3c'
                            : '#f39c12',
                          color: 'white'
                        }}>
                          {!jobAtualCategorizacao
                            ? 'Não executado'
                            : jobAtualCategorizacao.status === 'concluido'
                            ? 'Executado'
                            : jobAtualCategorizacao.status === 'erro'
                            ? 'Erro'
                            : 'Em execução'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Área de Logs */}
                {jobAtualCategorizacao && jobAtualCategorizacao.logs && jobAtualCategorizacao.logs.length > 0 && (
                  <div style={{
                    marginBottom: '25px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setLogsExpandedCategorizacao(!logsExpandedCategorizacao)}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        background: '#f8f9fa',
                        border: 'none',
                        borderBottom: logsExpandedCategorizacao ? '1px solid #e0e0e0' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#2c3e50'
                      }}
                    >
                      <span>
                        <FontAwesomeIcon icon={faClockRotateLeft} style={{marginRight: '8px'}} />
                        Logs de Execução ({jobAtualCategorizacao.logs.length})
                      </span>
                      <FontAwesomeIcon icon={logsExpandedCategorizacao ? faChevronUp : faChevronDown} />
                    </button>

                    {logsExpandedCategorizacao && (
                      <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: '15px',
                        background: '#fafafa'
                      }}>
                        {jobAtualCategorizacao.logs.map((log, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '10px',
                              marginBottom: '8px',
                              background: 'white',
                              borderRadius: '4px',
                              borderLeft: `3px solid ${getLogColor(log.tipo)}`,
                              fontSize: '13px',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start'
                            }}
                          >
                            <FontAwesomeIcon
                              icon={getLogIcon(log.tipo)}
                              style={{
                                color: getLogColor(log.tipo),
                                marginTop: '2px',
                                flexShrink: 0
                              }}
                            />
                            <div style={{flex: 1}}>
                              <div style={{
                                fontSize: '11px',
                                color: '#95a5a6',
                                marginBottom: '4px'
                              }}>
                                {formatarTimestamp(log.timestamp)}
                              </div>
                              <div style={{color: '#2c3e50'}}>
                                {log.mensagem}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={logsEndRefCategorizacao} />
                      </div>
                    )}
                  </div>
                )}

                {/* Rodapé com Botão de Ação */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  {/* Botão Executar - Esquerda */}
                  <button
                    onClick={executarRotinaCategorizacao}
                    disabled={!podeExecutarCategorizacao()}
                    style={{
                      padding: '12px 24px',
                      background: !podeExecutarCategorizacao()
                        ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)'
                        : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: !podeExecutarCategorizacao() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '140px',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => podeExecutarCategorizacao() && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <FontAwesomeIcon icon={executandoCategorizacao ? faSpinner : faPlay} spin={executandoCategorizacao} />
                    {executandoCategorizacao ? 'Executando...' : 'Executar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CARD DE FROP PACOTE */}
          {mostrarRotinaFropPacote && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0'
            }}>
              {/* Header do Card */}
              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                padding: '20px 30px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px'
                  }}>
                    <FontAwesomeIcon icon={faBox} />
                  </div>
                  <h3 style={{margin: 0, fontSize: '22px', fontWeight: 600, color: '#2c3e50'}}>
                    Rotina Frop Pacote
                  </h3>
                </div>
              </div>

              {/* Conteúdo do Card */}
              <div style={{padding: '30px'}}>
                {/* Descrição */}
                <div style={{
                  marginBottom: '25px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3498db'
                }}>
                  <h4 style={{
                    margin: '0 0 10px 0',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#2c3e50'
                  }}>
                    Descrição da Rotina
                  </h4>
                  <p style={{margin: 0, color: '#7f8c8d', fontSize: '14px', lineHeight: '1.6'}}>
                    Rotina automatizada que realiza a comparação entre pacotes planejados (BP) e pacotes no SIA.
                    A rotina busca dados de unidades do tipo PACOTE, calcula métricas (planejado, SIA, ausentes)
                    e grava os resultados na tabela TMP_FROP_PACOTE para monitoramento.
                  </p>
                </div>

                {/* Informações do Projeto e Job */}
                {filtros.projeto_id && (
                  <div style={{
                    marginBottom: '25px',
                    padding: '15px 20px',
                    background: '#e8f4f8',
                    borderRadius: '6px',
                    border: '1px solid #b8dce8'
                  }}>
                    <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                      Projeto Selecionado:
                    </div>
                    <div style={{fontSize: '16px', fontWeight: 600, color: '#2c3e50', marginBottom: '15px'}}>
                      {projetos.find(p => p.id === parseInt(filtros.projeto_id))?.subprograma} - {projetos.find(p => p.id === parseInt(filtros.projeto_id))?.nome}
                    </div>

                    {/* Informações da Execução */}
                    {jobAtualFropPacote && (
                      <div style={{borderTop: '1px solid #b8dce8', paddingTop: '12px'}}>
                        <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                          <strong>Início:</strong> {formatarTimestamp(jobAtualFropPacote.inicio)}
                          {' | '}
                          <strong>Fim:</strong> {jobAtualFropPacote?.fim ? formatarTimestamp(jobAtualFropPacote.fim) : '-'}
                        </div>
                        <div style={{fontSize: '13px', marginTop: '8px'}}>
                          <strong>Status:</strong>{' '}
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: !jobAtualFropPacote
                              ? '#95a5a6'
                              : jobAtualFropPacote.status === 'concluido'
                              ? '#27ae60'
                              : jobAtualFropPacote.status === 'erro'
                              ? '#e74c3c'
                              : '#f39c12',
                            color: 'white'
                          }}>
                            {!jobAtualFropPacote
                              ? 'Não executado'
                              : jobAtualFropPacote.status === 'concluido'
                              ? 'Executado'
                              : jobAtualFropPacote.status === 'erro'
                              ? 'Erro'
                              : 'Em execução'}
                          </span>
                          {jobAtualFropPacote?.status === 'em_andamento' && (
                            <span style={{marginLeft: '10px', color: '#7f8c8d'}}>
                              {jobAtualFropPacote.progresso}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Área de Logs */}
                {jobAtualFropPacote && jobAtualFropPacote.logs && jobAtualFropPacote.logs.length > 0 && (
                  <div style={{
                    marginBottom: '25px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setLogsExpandedFropPacote(!logsExpandedFropPacote)}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        background: '#f8f9fa',
                        border: 'none',
                        borderBottom: logsExpandedFropPacote ? '1px solid #e0e0e0' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#2c3e50'
                      }}
                    >
                      <span>
                        <FontAwesomeIcon icon={faClockRotateLeft} style={{marginRight: '8px'}} />
                        Logs de Execução ({jobAtualFropPacote.logs.length})
                      </span>
                      <FontAwesomeIcon icon={logsExpandedFropPacote ? faChevronUp : faChevronDown} />
                    </button>

                    {logsExpandedFropPacote && (
                      <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: '15px',
                        background: '#fafafa'
                      }}>
                        {jobAtualFropPacote.logs.map((log, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '8px 12px',
                              marginBottom: '6px',
                              background: 'white',
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: '#2c3e50',
                              fontFamily: 'monospace'
                            }}
                          >
                            {log}
                          </div>
                        ))}
                        <div ref={logsEndRefFropPacote} />
                      </div>
                    )}
                  </div>
                )}

                {/* Rodapé com Botão de Ação */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <button
                    onClick={executarRotinaFropPacote}
                    disabled={!podeExecutarFropPacote()}
                    style={{
                      padding: '12px 24px',
                      background: !podeExecutarFropPacote()
                        ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)'
                        : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: !podeExecutarFropPacote() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '140px',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => podeExecutarFropPacote() && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <FontAwesomeIcon icon={executandoFropPacote ? faSpinner : faPlay} spin={executandoFropPacote} />
                    {executandoFropPacote ? 'Executando...' : 'Executar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CARD DE FROP DIGITALIZAÇÃO */}
          {mostrarRotinaFropDigitalizacao && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
              marginTop: '20px'
            }}>
              {/* Header do Card */}
              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                padding: '20px 30px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px'
                  }}>
                    <FontAwesomeIcon icon={faFile} />
                  </div>
                  <h3 style={{margin: 0, fontSize: '22px', fontWeight: 600, color: '#2c3e50'}}>
                    Rotina Frop Digitalização
                  </h3>
                </div>
              </div>

              {/* Conteúdo do Card */}
              <div style={{padding: '30px'}}>
                {/* Descrição */}
                <div style={{
                  marginBottom: '25px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3498db'
                }}>
                  <h4 style={{
                    margin: '0 0 10px 0',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#2c3e50'
                  }}>
                    Descrição da Rotina
                  </h4>
                  <p style={{margin: 0, color: '#7f8c8d', fontSize: '14px', lineHeight: '1.6'}}>
                    Rotina automatizada de monitoramento de digitalização de instrumentos avaliativos.
                    Compara instrumentos previstos com instrumentos digitalizados através de consultas
                    aos repositórios CENTRAL e BR, calculando métricas e sincronizando com TMP_FROP_DIGITALIZACAO.
                  </p>
                </div>

                {/* Informações do Projeto e Job */}
                {filtros.projeto_id && (
                  <div style={{
                    marginBottom: '25px',
                    padding: '15px 20px',
                    background: '#e8f4f8',
                    borderRadius: '6px',
                    border: '1px solid #b8dce8'
                  }}>
                    <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                      Projeto Selecionado:
                    </div>
                    <div style={{fontSize: '16px', fontWeight: 600, color: '#2c3e50', marginBottom: '15px'}}>
                      {projetos.find(p => p.id === parseInt(filtros.projeto_id))?.subprograma} - {projetos.find(p => p.id === parseInt(filtros.projeto_id))?.nome}
                    </div>

                    {/* Informações da Execução */}
                    {jobAtualFropDigitalizacao && (
                      <div style={{borderTop: '1px solid #b8dce8', paddingTop: '12px'}}>
                        <div style={{fontSize: '13px', color: '#5a6c7d', marginBottom: '5px'}}>
                          <strong>Início:</strong> {formatarTimestamp(jobAtualFropDigitalizacao.inicio)}
                          {' | '}
                          <strong>Fim:</strong> {jobAtualFropDigitalizacao?.fim ? formatarTimestamp(jobAtualFropDigitalizacao.fim) : '-'}
                        </div>
                        <div style={{fontSize: '13px', marginTop: '8px'}}>
                          <strong>Status:</strong>{' '}
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: !jobAtualFropDigitalizacao
                              ? '#95a5a6'
                              : jobAtualFropDigitalizacao.status === 'concluido'
                              ? '#27ae60'
                              : jobAtualFropDigitalizacao.status === 'erro'
                              ? '#e74c3c'
                              : '#f39c12',
                            color: 'white'
                          }}>
                            {!jobAtualFropDigitalizacao
                              ? 'Não executado'
                              : jobAtualFropDigitalizacao.status === 'concluido'
                              ? 'Executado'
                              : jobAtualFropDigitalizacao.status === 'erro'
                              ? 'Erro'
                              : 'Em execução'}
                          </span>
                          {jobAtualFropDigitalizacao?.status === 'em_andamento' && (
                            <span style={{marginLeft: '10px', color: '#7f8c8d'}}>
                              {jobAtualFropDigitalizacao.progresso}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Área de Logs */}
                {jobAtualFropDigitalizacao && jobAtualFropDigitalizacao.logs && jobAtualFropDigitalizacao.logs.length > 0 && (
                  <div style={{
                    marginBottom: '25px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setLogsExpandedFropDigitalizacao(!logsExpandedFropDigitalizacao)}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        background: '#f8f9fa',
                        border: 'none',
                        borderBottom: logsExpandedFropDigitalizacao ? '1px solid #e0e0e0' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#2c3e50'
                      }}
                    >
                      <span>
                        <FontAwesomeIcon icon={faClockRotateLeft} style={{marginRight: '8px'}} />
                        Logs de Execução ({jobAtualFropDigitalizacao.logs.length})
                      </span>
                      <FontAwesomeIcon icon={logsExpandedFropDigitalizacao ? faChevronUp : faChevronDown} />
                    </button>

                    {logsExpandedFropDigitalizacao && (
                      <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: '15px',
                        background: '#fafafa'
                      }}>
                        {jobAtualFropDigitalizacao.logs.map((log, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '8px 12px',
                              marginBottom: '6px',
                              background: 'white',
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: '#2c3e50',
                              fontFamily: 'monospace'
                            }}
                          >
                            {log}
                          </div>
                        ))}
                        <div ref={logsEndRefFropDigitalizacao} />
                      </div>
                    )}
                  </div>
                )}

                {/* Rodapé com Botão de Ação */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <button
                    onClick={executarRotinaFropDigitalizacao}
                    disabled={!podeExecutarFropDigitalizacao()}
                    style={{
                      padding: '12px 24px',
                      background: !podeExecutarFropDigitalizacao()
                        ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)'
                        : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: !podeExecutarFropDigitalizacao() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '140px',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => podeExecutarFropDigitalizacao() && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <FontAwesomeIcon icon={executandoFropDigitalizacao ? faSpinner : faPlay} spin={executandoFropDigitalizacao} />
                    {executandoFropDigitalizacao ? 'Executando...' : 'Executar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mensagem se não houver rotina disponível */}
          {!mostrarRotinaRecodificacao && !mostrarRotinaCategorizacao && !mostrarRotinaFropPacote && !mostrarRotinaFropDigitalizacao && (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#95a5a6'
            }}>
              <FontAwesomeIcon icon={faListCheck} style={{fontSize: '64px', marginBottom: '20px', opacity: 0.3}} />
              <h3 style={{fontSize: '22px', marginBottom: '10px', color: '#7f8c8d'}}>
                Nenhuma rotina disponível
              </h3>
              <p style={{fontSize: '15px'}}>
                Selecione uma Squad e um Projeto para visualizar as rotinas disponíveis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rotinas;
