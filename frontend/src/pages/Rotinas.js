import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projetoService, squadService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCog, 
  faPlay, 
  faSync, 
  faCheckCircle, 
  faExclamationCircle,
  faSpinner,
  faClock,
  faChartLine,
  faFilterCircleXmark,
  faHistory,
  faUser,
  faCalendar,
  faTimes,
  faListOl,
  faScrewdriverWrench,
  faX
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import '../styles/Dashboard.css';

function Rotinas() {
  const { canEdit, user } = useAuth();
  const [executando, setExecutando] = useState(null);
  const [projetos, setProjetos] = useState([]);
  const [squads, setSquads] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rotinaDetalhes, setRotinaDetalhes] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    projeto_id: '',
    squad_id: ''
  });

  // Estados para autocomplete de projeto
  const [projetoSearch, setProjetoSearch] = useState('');
  const [projetosFiltrados, setProjetosFiltrados] = useState([]);
  const [showProjetoDropdown, setShowProjetoDropdown] = useState(false);

  // Lista de rotinas disponíveis
  const rotinasDisponiveis = [
    {
      id: 1,
      nome: 'Atualizar Indicadores de Transcrição',
      descricao: 'Importa relatório e atualiza os indicadores de transcrição no dashboard',
      icone: faChartLine,
      cor: '#3498db',
      requerProjeto: true,  // ✅ MODIFICADO: Agora requer projeto também
      requerSquad: true,
      squadEspecifica: 'Auditoria',
      categoria: 'auditoria'
    }
  ];

  // Estado das rotinas com histórico
  const [rotinas, setRotinas] = useState(
    rotinasDisponiveis.map(r => ({
      ...r,
      status: 'nao_iniciado',
      logs: [],
      ultimaExecucao: null,
      usuario: null
    }))
  );

  useEffect(() => {
    carregarDados();
  }, []);

  // Filtrar projetos baseado na busca
  useEffect(() => {
    if (projetoSearch.trim() === '') {
      setProjetosFiltrados([]);
    } else {
      const filtered = projetos.filter(p => {
        const searchLower = projetoSearch.toLowerCase();
        return (
          p.nome?.toLowerCase().includes(searchLower) ||
          p.subprograma?.toLowerCase().includes(searchLower)
        );
      });
      setProjetosFiltrados(filtered.slice(0, 10)); // Limitar a 10 resultados
    }
  }, [projetoSearch, projetos]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProjetoDropdown && !event.target.closest('.projeto-autocomplete')) {
        setShowProjetoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProjetoDropdown]);

  const carregarDados = async () => {
    try {
      const [projetosRes, squadsRes] = await Promise.all([
        projetoService.listar(),
        squadService.listar()
      ]);
      const projetosData = projetosRes.data.items || projetosRes.data;
      const squadsData = squadsRes.data.items || squadsRes.data;
      
      setProjetos(projetosData);
      setSquads(squadsData);
      
      // Debug: ver estrutura dos projetos
      if (projetosData.length > 0) {
        console.log('📊 Exemplo de projeto:', projetosData[0]);
        console.log('📋 Campos disponíveis:', Object.keys(projetosData[0]));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar projetos e squads');
    }
  };

  const limparFiltros = () => {
    setFiltros({
      projeto_id: '',
      squad_id: ''
    });
    setProjetoSearch('');
    setShowProjetoDropdown(false);
  };

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

  const podeExecutarRotina = (rotina) => {
    if (rotina.requerProjeto && !filtros.projeto_id) return false;
    if (rotina.requerSquad && !filtros.squad_id) return false;
    return true;
  };

  const executarRotina = async (rotinaId) => {
    if (!canEdit()) {
      toast.error('Você não tem permissão para executar rotinas');
      return;
    }

    const rotina = rotinas.find(r => r.id === rotinaId);
    
    if (!podeExecutarRotina(rotina)) {
      if (rotina.requerProjeto && !filtros.projeto_id) {
        toast.warning('Selecione um projeto para executar esta rotina');
        return;
      }
      if (rotina.requerSquad && !filtros.squad_id) {
        toast.warning('Selecione uma squad para executar esta rotina');
        return;
      }
    }

    setExecutando(rotinaId);
    
    // Capturar informações de projeto e squad
    const projetoSelecionado = filtros.projeto_id ? projetos.find(p => p.id === parseInt(filtros.projeto_id)) : null;
    const squadSelecionada = filtros.squad_id ? squads.find(s => s.id === parseInt(filtros.squad_id)) : null;
    
    // Atualizar status para "em_andamento"
    setRotinas(prev => prev.map(r => 
      r.id === rotinaId 
        ? { 
            ...r, 
            status: 'em_andamento',
            logs: [{
              timestamp: new Date().toISOString(),
              mensagem: 'Iniciando execução da rotina...',
              tipo: 'info'
            }],
            ultimaExecucao: new Date().toISOString(),
            usuario: user?.nome || user?.name || 'Usuário',
            projetoSubprograma: projetoSelecionado?.subprograma || null,
            projetoNome: projetoSelecionado?.nome || null,
            squadNome: squadSelecionada?.nome || null
          }
        : r
    ));

    try {
      // TODO: Aqui será implementada a chamada real para o backend
      // const response = await rotinaService.executar(rotinaId, {
      //   projeto_id: filtros.projeto_id,
      //   squad_id: filtros.squad_id
      // });
      
      // Simulação de execução com logs progressivos
      const logs = [
        { mensagem: 'Iniciando execução da rotina...', tipo: 'info', delay: 0 },
        { mensagem: 'Carregando dados do banco...', tipo: 'info', delay: 1000 },
        { mensagem: 'Processando informações...', tipo: 'info', delay: 2000 },
        { mensagem: 'Calculando indicadores...', tipo: 'info', delay: 3000 },
        { mensagem: 'Gerando relatórios...', tipo: 'info', delay: 4000 },
        { mensagem: 'Salvando resultados...', tipo: 'success', delay: 5000 },
        { mensagem: 'Rotina executada com sucesso!', tipo: 'success', delay: 6000 }
      ];

      for (const log of logs) {
        await new Promise(resolve => setTimeout(resolve, log.delay === 0 ? 0 : 1000));
        
        setRotinas(prev => prev.map(r => 
          r.id === rotinaId 
            ? { 
                ...r, 
                logs: [
                  ...r.logs,
                  {
                    timestamp: new Date().toISOString(),
                    mensagem: log.mensagem,
                    tipo: log.tipo
                  }
                ]
              }
            : r
        ));
      }

      // Atualizar status para "concluido"
      setRotinas(prev => prev.map(r => 
        r.id === rotinaId ? { ...r, status: 'concluido' } : r
      ));

      toast.success('Rotina executada com sucesso!');
    } catch (error) {
      console.error('Erro ao executar rotina:', error);
      
      // Adicionar log de erro
      setRotinas(prev => prev.map(r => 
        r.id === rotinaId 
          ? { 
              ...r, 
              status: 'erro',
              logs: [
                ...r.logs,
                {
                  timestamp: new Date().toISOString(),
                  mensagem: `Erro ao executar: ${error.message}`,
                  tipo: 'error'
                }
              ]
            }
          : r
      ));

      toast.error('Erro ao executar rotina: ' + (error.response?.data?.error || error.message));
    } finally {
      setExecutando(null);
    }
  };

  const abrirDetalhes = (rotina) => {
    setRotinaDetalhes(rotina);
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setRotinaDetalhes(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      nao_iniciado: { text: 'Não Iniciado', icon: faClock, color: '#95a5a6' },
      em_andamento: { text: 'Em andamento...', icon: faSpinner, color: '#3498db' },
      concluido: { text: 'Concluído', icon: faCheckCircle, color: '#2ecc71' },
      erro: { text: 'Erro', icon: faExclamationCircle, color: '#e74c3c' }
    };

    const badge = badges[status] || badges.nao_iniciado;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 600,
        background: badge.color,
        color: 'white'
      }}>
        <FontAwesomeIcon 
          icon={badge.icon} 
          spin={status === 'em_andamento'}
        />
        {badge.text}
      </span>
    );
  };

  const formatarData = (isoString) => {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ MODIFICADO: Filtrar rotinas visíveis baseado nos filtros
  // Agora exige AMBOS os parâmetros preenchidos simultaneamente
  const rotinasVisiveis = rotinas.filter(rotina => {
    // ⚠️ VALIDAÇÃO PRINCIPAL: Ambos os parâmetros devem estar preenchidos
    if (rotina.requerProjeto && rotina.requerSquad) {
      // Se a rotina requer ambos, verificar se AMBOS estão preenchidos
      if (!filtros.projeto_id || !filtros.squad_id) return false;
    } else {
      // Se a rotina requer apenas projeto, verificar se está preenchido
      if (rotina.requerProjeto && !filtros.projeto_id) return false;
      
      // Se a rotina requer apenas squad, verificar se está preenchido
      if (rotina.requerSquad && !filtros.squad_id) return false;
    }

    // Se rotina requer Squad específica, verificar se é a correta
    if (rotina.squadEspecifica) {
      const squadSelecionada = squads.find(s => s.id === parseInt(filtros.squad_id));
      if (!squadSelecionada || squadSelecionada.nome !== rotina.squadEspecifica) {
        return false;
      }
    }

    return true;
  });

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
                Execute scripts automatizados para atualizar os indicadores e relatórios do dashboard
              </span>
            </div>
          </div>

          {!canEdit() && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#856404'
            }}>
              <FontAwesomeIcon icon={faExclamationCircle} /> 
              {' '}Você não tem permissão para executar rotinas. Apenas Gestores e Administradores podem executar.
            </div>
          )}

          {/* PARÂMETROS */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '30px'
          }}>
            <div style={{width: '100%', maxWidth: '900px'}}>
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
                    Parâmetro: Squad *
                  </label>
                  <select
                    className="form-control"
                    value={filtros.squad_id}
                    onChange={(e) => {
                      setFiltros({...filtros, squad_id: e.target.value, projeto_id: ''});
                      setProjetoSearch('');
                    }}
                    style={{width: '100%'}}
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
                    Parâmetro: Projeto *
                  </label>
                  <div style={{position: 'relative'}}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={!filtros.squad_id ? "Selecione uma Squad primeiro" : "Digite para buscar por nome ou subprograma..."}
                      value={projetoSearch}
                      onChange={(e) => {
                        setProjetoSearch(e.target.value);
                        setShowProjetoDropdown(true);
                      }}
                      onFocus={() => setShowProjetoDropdown(true)}
                      disabled={!filtros.squad_id}
                      style={{width: '100%', paddingRight: filtros.projeto_id ? '40px' : '10px'}}
                    />
                    {filtros.projeto_id && (
                      <button
                        onClick={limparProjeto}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#95a5a6',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '0',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Limpar projeto"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown de resultados */}
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
                          onClick={() => selecionarProjeto(projeto)}
                          style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
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

              {(filtros.projeto_id || filtros.squad_id) && (
                <div style={{display: 'flex', justifyContent: 'center'}}>
                  <button className="btn btn-secondary btn-small" onClick={limparFiltros}>
                    <FontAwesomeIcon icon={faFilterCircleXmark} /> Limpar Parâmetros
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CARDS DE ROTINAS */}
          {rotinasVisiveis.length > 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              marginTop: '20px'
            }}>
              {rotinasVisiveis.map(rotina => (
                <div
                  key={rotina.id}
                  style={{
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    padding: '30px',
                    background: 'white',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    width: '100%',
                    maxWidth: '900px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: `${rotina.cor}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FontAwesomeIcon 
                        icon={rotina.icone} 
                        style={{fontSize: '28px', color: rotina.cor}}
                      />
                    </div>

                    <div style={{flex: 1}}>
                      <h3 style={{
                        margin: '0 0 10px 0',
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#2c3e50'
                      }}>
                        {rotina.nome}
                      </h3>
                      <p style={{
                        margin: 0,
                        fontSize: '15px',
                        color: '#7f8c8d',
                        lineHeight: '1.6'
                      }}>
                        {rotina.descricao}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '20px',
                    borderTop: '1px solid #e9ecef'
                  }}>
                    {getStatusBadge(rotina.status)}

                    <div style={{display: 'flex', gap: '10px'}}>
                      {rotina.ultimaExecucao && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => abrirDetalhes(rotina)}
                          title="Ver detalhes"
                        >
                          <FontAwesomeIcon icon={faHistory} /> Detalhes
                        </button>
                      )}
                      
                      <button
                        className="btn btn-primary"
                        onClick={() => executarRotina(rotina.id)}
                        disabled={!canEdit() || executando !== null || !podeExecutarRotina(rotina)}
                        style={{
                          opacity: (!canEdit() || executando !== null || !podeExecutarRotina(rotina)) ? 0.5 : 1,
                          cursor: (!canEdit() || executando !== null || !podeExecutarRotina(rotina)) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <FontAwesomeIcon icon={executando === rotina.id ? faSpinner : faPlay} spin={executando === rotina.id} />
                        {executando === rotina.id ? ' Executando...' : ' Executar Rotina'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#95a5a6'
            }}>
              <FontAwesomeIcon icon={faX} style={{fontSize: '64px', marginBottom: '20px', opacity: 0.3}} />
              <h3 style={{fontSize: '22px', marginBottom: '10px', color: '#7f8c8d'}}>
                Nenhuma rotina disponível
              </h3>
              <p style={{fontSize: '15px', marginBottom: '20px'}}>
                {/* ✅ MODIFICADO: Mensagem atualizada */}
                Selecione uma Squad e um Projeto para visualizar as rotinas disponíveis
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      {modalOpen && rotinaDetalhes && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Header do Modal */}
            <div style={{
              padding: '20px 25px',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: rotinaDetalhes.cor,
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              color: 'white'
            }}>
              <div>
                <h3 style={{margin: '0 0 5px 0', fontSize: '18px', fontWeight: 600}}>
                  <FontAwesomeIcon icon={rotinaDetalhes.icone} /> {rotinaDetalhes.nome}
                </h3>
                <p style={{margin: 0, fontSize: '13px', opacity: 0.9}}>
                  Detalhes da Execução
                </p>
              </div>
              <button
                onClick={fecharModal}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div style={{
              padding: '25px',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Informações Gerais */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '25px'
              }}>
                <div style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <FontAwesomeIcon icon={faClock} />
                    Status
                  </div>
                  <div>{getStatusBadge(rotinaDetalhes.status)}</div>
                </div>

                <div style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <FontAwesomeIcon icon={faCalendar} />
                    Última Execução
                  </div>
                  <div style={{fontSize: '14px', fontWeight: 600, color: '#2c3e50'}}>
                    {formatarData(rotinaDetalhes.ultimaExecucao)}
                  </div>
                </div>

                <div style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <FontAwesomeIcon icon={faUser} />
                    Executado por
                  </div>
                  <div style={{fontSize: '14px', fontWeight: 600, color: '#2c3e50'}}>
                    {rotinaDetalhes.usuario || '-'}
                  </div>
                </div>

                {rotinaDetalhes.squadNome && (
                  <div style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#7f8c8d',
                      marginBottom: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FontAwesomeIcon icon={faUser} />
                      Squad
                    </div>
                    <div style={{fontSize: '14px', fontWeight: 600, color: '#2c3e50'}}>
                      {rotinaDetalhes.squadNome}
                    </div>
                  </div>
                )}

                {rotinaDetalhes.projetoSubprograma && (
                  <div style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#7f8c8d',
                      marginBottom: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FontAwesomeIcon icon={faCog} />
                      Projeto
                    </div>
                    <div style={{fontSize: '14px', fontWeight: 600, color: '#2c3e50'}}>
                      {rotinaDetalhes.projetoSubprograma}
                    </div>
                  </div>
                )}
              </div>

              {/* Logs */}
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FontAwesomeIcon icon={faListOl} />
                  Logs de Execução ({rotinaDetalhes.logs.length})
                </h4>

                <div style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  background: '#f8f9fa'
                }}>
                  {rotinaDetalhes.logs.length === 0 ? (
                    <div style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#95a5a6',
                      fontSize: '14px'
                    }}>
                      Nenhum log disponível
                    </div>
                  ) : (
                    rotinaDetalhes.logs.map((log, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px 15px',
                          borderBottom: index < rotinaDetalhes.logs.length - 1 ? '1px solid #e9ecef' : 'none',
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start'
                        }}
                      >
                        <div style={{
                          fontSize: '11px',
                          color: '#95a5a6',
                          minWidth: '50px',
                          fontFamily: 'monospace'
                        }}>
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                        
                        <div style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: log.tipo === 'error' ? '#e74c3c' : log.tipo === 'success' ? '#2ecc71' : '#3498db',
                          marginTop: '6px',
                          flexShrink: 0
                        }} />
                        
                        <div style={{
                          flex: 1,
                          fontSize: '13px',
                          color: log.tipo === 'error' ? '#e74c3c' : '#2c3e50',
                          lineHeight: '1.5'
                        }}>
                          {log.mensagem}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div style={{
              padding: '15px 25px',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                className="btn btn-secondary"
                onClick={fecharModal}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rotinas;