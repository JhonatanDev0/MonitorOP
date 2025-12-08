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
  faFileExcel
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import '../styles/Dashboard.css';
import { useAuth } from '../contexts/AuthContext';

const Rotinas = () => {
  const { user, canEdit } = useAuth();  // ← Pegar 'user', não 'currentUser'
  const currentUser = user;  // ← Criar alias para manter compatibilidade
  const [squads, setSquads] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [filtros, setFiltros] = useState({ squad_id: '', projeto_id: '' });
  const [projetoSearch, setProjetoSearch] = useState('');
  const [projetosFiltrados, setProjetosFiltrados] = useState([]);
  const [showProjetoDropdown, setShowProjetoDropdown] = useState(false);
  
  // Estados para upload e execução
  const [arquivos, setArquivos] = useState([]);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [executando, setExecutando] = useState(false);
  
  // Estados para logs
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const eventSourceRef = useRef(null);
  const logsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Função auxiliar que verifica permissão (aceita função ou booleano)
  const temPermissao = () => {
    if (typeof canEdit === 'function') {
      return canEdit();  // ← Chamar canEdit(), não temPermissao()
    }
    return Boolean(canEdit);
  };

  // Debug: Monitorar user (não currentUser)
  useEffect(() => {
    console.log('=== DEBUG ROTINAS ===');
    console.log('user:', user);
    console.log('user.username:', user?.username);
    console.log('user.role:', user?.role);
    console.log('Tipo de canEdit:', typeof canEdit);
    
    // Se canEdit é função, ver o que ela retorna
    if (typeof canEdit === 'function') {
      console.log('canEdit() retorna:', canEdit());
    }
    
    try {
      console.log('temPermissao():', temPermissao());
    } catch (e) {
      console.error('Erro ao chamar temPermissao:', e);
    }
    console.log('====================');
  }, [user]);

  // Carregar squads e projetos
  useEffect(() => {
    fetch('http://localhost:5000/api/squads')
      .then(res => res.json())
      .then(data => setSquads(data))
      .catch(err => console.error('Erro ao carregar squads:', err));

    fetch('http://localhost:5000/api/projetos')
      .then(res => res.json())
      .then(data => setProjetos(data))
      .catch(err => console.error('Erro ao carregar projetos:', err));
    
    carregarArquivos();
  }, []);

  // Carregar arquivos disponíveis
  const carregarArquivos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auditoria/arquivos');
      
      // Verificar se a resposta é OK
      if (!response.ok) {
        console.error('Erro HTTP:', response.status, response.statusText);
        
        // Se for 404, endpoint não existe ainda
        if (response.status === 404) {
          console.warn('⚠️ Endpoint /api/auditoria/arquivos não encontrado');
          setArquivos([]);
          return;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Verificar se é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Resposta não é JSON:', text.substring(0, 200));
        throw new Error('Resposta do servidor não é JSON');
      }
      
      const data = await response.json();
      setArquivos(data.arquivos || []);
      
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      // Não mostrar toast aqui para não poluir a interface
      // O componente ainda funciona, só não mostra arquivos
      setArquivos([]);
    }
  };

  // Auto-scroll dos logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadArquivo(file);
    }
  };

  const uploadArquivo = async (file) => {
    if (!temPermissao()) {
      toast.error('Você não tem permissão para fazer upload de arquivos');
      return;
    }

    // Validar extensão
    const extensao = file.name.split('.').pop().toLowerCase();
    if (!['xlsm', 'xlsx'].includes(extensao)) {
      toast.error('Apenas arquivos .xlsm ou .xlsx são permitidos');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('arquivo', file);

    try {
      const response = await fetch('http://localhost:5000/api/auditoria/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.erro || 'Erro ao fazer upload');
      }

      const data = await response.json();
      toast.success(`Arquivo ${data.arquivo} enviado com sucesso!`);
      
      // Recarregar lista de arquivos
      await carregarArquivos();
      
      // Selecionar automaticamente o arquivo enviado
      setArquivoSelecionado(data.arquivo);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deletarArquivo = async (nomeArquivo) => {
    if (!temPermissao()) {
      toast.error('Você não tem permissão para deletar arquivos');
      return;
    }

    if (!window.confirm(`Deseja realmente deletar o arquivo ${nomeArquivo}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/auditoria/arquivo/${nomeArquivo}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.erro || 'Erro ao deletar arquivo');
      }

      toast.success('Arquivo deletado com sucesso');
      
      // Se era o arquivo selecionado, desmarcar
      if (arquivoSelecionado === nomeArquivo) {
        setArquivoSelecionado(null);
      }
      
      // Recarregar lista
      await carregarArquivos();
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  const executarRotina = async () => {
    if (!temPermissao()) {
      toast.error('Você não tem permissão para executar rotinas');
      return;
    }

    if (!filtros.squad_id || !filtros.projeto_id) {
      toast.warning('Selecione Squad e Projeto para executar a rotina');
      return;
    }

    if (!arquivoSelecionado) {
      toast.warning('Selecione um arquivo Excel para processar');
      return;
    }

    // Verificar se user existe e tem username
    if (!currentUser) {
      toast.error('Erro: Usuário não identificado. Faça login novamente.');
      return;
    }

    const nomeUsuario = currentUser.username || currentUser.login || 'Sistema';
    console.log('Executando rotina como usuário:', nomeUsuario);

    setExecutando(true);
    setLogs([]);
    setLogsOpen(true);

    try {
      // Iniciar execução
      const response = await fetch('http://localhost:5000/api/auditoria/executar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: nomeUsuario,
          squad_id: filtros.squad_id,
          projeto_id: filtros.projeto_id,
          arquivo: arquivoSelecionado
        })
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.erro || 'Erro ao iniciar rotina');
      }

      // Conectar ao stream de logs
      eventSourceRef.current = new EventSource('http://localhost:5000/api/auditoria/logs');
      
      eventSourceRef.current.onmessage = (event) => {
        const log = JSON.parse(event.data);
        setLogs(prev => [...prev, log]);
      };

      eventSourceRef.current.onerror = () => {
        eventSourceRef.current?.close();
        setExecutando(false);
        
        // Recarregar lista de arquivos (o arquivo foi deletado)
        carregarArquivos();
        setArquivoSelecionado(null);
      };

      toast.success('Rotina iniciada com sucesso!');

    } catch (error) {
      toast.error(error.message);
      setExecutando(false);
      setLogsOpen(false);
    }
  };

  const fecharLogs = () => {
    eventSourceRef.current?.close();
    setLogsOpen(false);
  };

  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  const podeExecutar = () => {
    return temPermissao() && 
           filtros.squad_id && 
           filtros.projeto_id && 
           arquivoSelecionado && 
           !executando;
  };

  // Verificar se squad selecionada é Auditoria
  const squadSelecionada = squads.find(s => s.id === parseInt(filtros.squad_id));
  const mostrarRotina = squadSelecionada && squadSelecionada.nome === 'Auditoria' && filtros.projeto_id;

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
                Faça upload de um arquivo Excel, selecione os parâmetros e execute a rotina de auditoria
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
              <FontAwesomeIcon icon={faCog} style={{fontSize: '20px', color: '#3498db'}} />
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
                  disabled={executando}
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
                    disabled={!filtros.squad_id || executando}
                    style={{width: '100%', paddingRight: filtros.projeto_id ? '40px' : '10px'}}
                  />
                  {filtros.projeto_id && (
                    <button
                      onClick={limparProjeto}
                      disabled={executando}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#95a5a6',
                        cursor: executando ? 'not-allowed' : 'pointer',
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
          </div>

          {/* UPLOAD DE ARQUIVO */}
          {mostrarRotina && (
            <div style={{
              background: 'white',
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              padding: '25px',
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
                <FontAwesomeIcon icon={faFileExcel} style={{fontSize: '20px', color: '#27ae60'}} />
                Arquivo Excel
              </h3>

              {/* Botão de Upload */}
              <div style={{marginBottom: '20px'}}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsm,.xlsx"
                  style={{display: 'none'}}
                  disabled={!temPermissao() || executando}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!temPermissao() || uploading || executando}
                  style={{
                    opacity: (!temPermissao() || uploading || executando) ? 0.5 : 1,
                    cursor: (!temPermissao() || uploading || executando) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FontAwesomeIcon icon={uploading ? faSpinner : faUpload} spin={uploading} />
                  {uploading ? ' Enviando...' : ' Fazer Upload de Arquivo'}
                </button>
                <span style={{marginLeft: '10px', color: '#7f8c8d', fontSize: '14px'}}>
                  Formatos: .xlsm, .xlsx
                </span>
              </div>

              {/* Lista de Arquivos */}
              {arquivos.length > 0 ? (
                <div>
                  <h4 style={{fontSize: '15px', marginBottom: '10px', color: '#2c3e50'}}>
                    Arquivos Disponíveis:
                  </h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    {arquivos.map(arquivo => (
                      <div
                        key={arquivo.nome}
                        onClick={() => !executando && setArquivoSelecionado(arquivo.nome)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 15px',
                          background: arquivoSelecionado === arquivo.nome ? '#e3f2fd' : '#f8f9fa',
                          border: `2px solid ${arquivoSelecionado === arquivo.nome ? '#2196f3' : '#e0e0e0'}`,
                          borderRadius: '8px',
                          cursor: executando ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: executando ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => !executando && (e.currentTarget.style.borderColor = '#2196f3')}
                        onMouseLeave={(e) => arquivoSelecionado !== arquivo.nome && !executando && (e.currentTarget.style.borderColor = '#e0e0e0')}
                      >
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          <FontAwesomeIcon 
                            icon={faFileExcel} 
                            style={{
                              fontSize: '24px', 
                              color: arquivoSelecionado === arquivo.nome ? '#2196f3' : '#27ae60'
                            }} 
                          />
                          <div>
                            <div style={{fontWeight: 600, color: '#2c3e50'}}>
                              {arquivo.nome}
                            </div>
                            <div style={{fontSize: '13px', color: '#7f8c8d'}}>
                              {formatarTamanho(arquivo.tamanho)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletarArquivo(arquivo.nome);
                          }}
                          disabled={!temPermissao() || executando}
                          className="btn btn-danger"
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            opacity: (!temPermissao() || executando) ? 0.5 : 1,
                            cursor: (!temPermissao() || executando) ? 'not-allowed' : 'pointer'
                          }}
                          title="Deletar arquivo"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#95a5a6',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <FontAwesomeIcon icon={faFileExcel} style={{fontSize: '48px', marginBottom: '15px', opacity: 0.3}} />
                  <p style={{margin: 0}}>Nenhum arquivo disponível. Faça upload para começar.</p>
                </div>
              )}

              {/* Botão Executar */}
              <div style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0'}}>
                <button
                  className="btn btn-primary"
                  onClick={executarRotina}
                  disabled={!podeExecutar()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    opacity: !podeExecutar() ? 0.5 : 1,
                    cursor: !podeExecutar() ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FontAwesomeIcon icon={executando ? faSpinner : faPlay} spin={executando} />
                  {executando ? ' Executando Rotina...' : ' Executar Rotina de Auditoria'}
                </button>
                {!arquivoSelecionado && (
                  <div style={{marginTop: '10px', textAlign: 'center', color: '#f39c12', fontSize: '14px'}}>
                    <FontAwesomeIcon icon={faExclamationTriangle} /> Selecione um arquivo para executar
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mensagem se não for squad Auditoria */}
          {!mostrarRotina && (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#95a5a6'
            }}>
              <FontAwesomeIcon icon={faCog} style={{fontSize: '64px', marginBottom: '20px', opacity: 0.3}} />
              <h3 style={{fontSize: '22px', marginBottom: '10px', color: '#7f8c8d'}}>
                Nenhuma rotina disponível
              </h3>
              <p style={{fontSize: '15px'}}>
                Selecione a Squad "Auditoria" e um Projeto para visualizar as rotinas disponíveis
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE LOGS */}
      {logsOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
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
            maxWidth: '900px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 25px',
              borderBottom: '2px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px 12px 0 0'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FontAwesomeIcon icon={faSpinner} spin={executando} />
                Logs de Execução {executando && '(Em andamento)'}
              </h3>
              <button
                onClick={fecharLogs}
                disabled={executando}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: executando ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  opacity: executando ? 0.5 : 1
                }}
                onMouseEnter={(e) => !executando && (e.target.style.background = 'rgba(255,255,255,0.3)')}
                onMouseLeave={(e) => (e.target.style.background = 'rgba(255,255,255,0.2)')}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Logs Container */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              background: '#1e1e1e',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '14px'
            }}>
              {logs.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#888'
                }}>
                  <FontAwesomeIcon icon={faSpinner} spin style={{fontSize: '32px', marginBottom: '15px'}} />
                  <div>Aguardando início da execução...</div>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      lineHeight: '1.6'
                    }}
                  >
                    <span style={{
                      color: '#666',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      flexShrink: 0
                    }}>
                      [{log.timestamp}]
                    </span>
                    <FontAwesomeIcon
                      icon={getLogIcon(log.tipo)}
                      style={{
                        color: getLogColor(log.tipo),
                        flexShrink: 0,
                        marginTop: '3px'
                      }}
                    />
                    <span style={{
                      color: getLogColor(log.tipo),
                      wordBreak: 'break-word'
                    }}>
                      {log.mensagem}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Footer */}
            <div style={{
              padding: '15px 25px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8f9fa'
            }}>
              <span style={{fontSize: '13px', color: '#7f8c8d'}}>
                {logs.length} {logs.length === 1 ? 'log' : 'logs'} registrados
              </span>
              <button
                onClick={fecharLogs}
                disabled={executando}
                className="btn btn-secondary"
                style={{
                  opacity: executando ? 0.5 : 1,
                  cursor: executando ? 'not-allowed' : 'pointer'
                }}
              >
                {executando ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Aguardar Conclusão
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTimes} /> Fechar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rotinas;