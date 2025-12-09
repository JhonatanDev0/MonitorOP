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
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
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
  const [logsInlineOpen, setLogsInlineOpen] = useState(false);
  const [statusExecucao, setStatusExecucao] = useState('nao-iniciado'); // 'nao-iniciado', 'em-andamento', 'concluido'

  // Função auxiliar que verifica permissão (aceita função ou booleano)
  const temPermissao = () => {
    if (typeof canEdit === 'function') {
      return canEdit();  // ← Chamar canEdit(), não temPermissao()
    }
    return Boolean(canEdit);
  };

  // Carregar squads e projetos
  useEffect(() => {
    fetch('http://localhost:5000/api/squads')
      .then(res => res.json())
      .then(data => setSquads(data))
      .catch(err => toast.error('Erro ao carregar squads'));

    fetch('http://localhost:5000/api/projetos')
      .then(res => res.json())
      .then(data => setProjetos(data))
      .catch(err => toast.error('Erro ao carregar projetos'));
    
    carregarArquivos();
  }, []);

  // Carregar arquivos disponíveis
  const carregarArquivos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auditoria/arquivos');
      
      // Verificar se a resposta é OK
      if (!response.ok) {
        // Se for 404, endpoint não existe ainda
        if (response.status === 404) {
          setArquivos([]);
          return;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Verificar se é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Resposta do servidor não é JSON');
      }
      
      const data = await response.json();
      setArquivos(data.arquivos || []);
      
    } catch (error) {
      // Falha silenciosa - não mostrar erro para não poluir interface
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

    confirmAlert({
      customUI: ({ onClose }) => (
        <div style={{
          fontFamily: 'inherit',
          width: '480px',
          maxWidth: '90vw',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          background: 'white',
          overflow: 'hidden'
        }}>
          <h1 style={{
            margin: 0,
            padding: '20px 25px',
            background: '#e74c3c',
            color: 'white',
            fontSize: '18px',
            fontWeight: 600,
            textAlign: 'center'
          }}>
            Confirmar Exclusão
          </h1>
          <div style={{
            padding: '45px 35px',
            textAlign: 'center',
            fontSize: '15px',
            color: '#2c3e50',
            lineHeight: '1.8'
          }}>
            Tem certeza que deseja deletar o arquivo <strong>{nomeArquivo}</strong>? Esta ação não pode ser desfeita.
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            padding: '0 25px 25px 25px',
            justifyContent: 'center'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: '120px',
                background: '#95a5a6',
                color: 'white',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#7f8c8d'}
              onMouseLeave={(e) => e.target.style.background = '#95a5a6'}
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                onClose();
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
              }}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: '120px',
                background: '#e74c3c',
                color: 'white',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#c0392b'}
              onMouseLeave={(e) => e.target.style.background = '#e74c3c'}
            >
              Sim, deletar
            </button>
          </div>
        </div>
      ),
      closeOnEscape: true,
      closeOnClickOutside: true
    });
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

    setExecutando(true);
    setLogs([]);
    setStatusExecucao('em-andamento');
    setLogsInlineOpen(true);

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
        setStatusExecucao('concluido');
        
        // Recarregar lista de arquivos (o arquivo foi deletado)
        carregarArquivos();
        setArquivoSelecionado(null);
      };

      toast.success('Rotina iniciada com sucesso!');

    } catch (error) {
      toast.error(error.message);
      setExecutando(false);
      setStatusExecucao('concluido');
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
                Selecione os parâmetros e execute as rotina para atualização dos indicadores.
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


          {/* CARD DE AUDITORIA - Design Estruturado */}
          {mostrarRotina && (
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
                    Rotina de Auditoria
                  </h3>
                </div>
              </div>

              {/* Barra de Progresso/Status */}
              <div style={{
                height: '6px',
                background: '#e0e0e0',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: executando ? '100%' : (arquivoSelecionado ? '50%' : '0%'),
                  background: executando 
                    ? 'linear-gradient(90deg, #3498db 0%, #2980b9 50%, #3498db 100%)'
                    : 'linear-gradient(90deg, #3498db 0%, #2980b9 100%)',
                  backgroundSize: executando ? '200% 100%' : '100% 100%',
                  animation: executando ? 'progress 1.5s linear infinite' : 'none',
                  transition: 'width 0.3s ease'
                }}>
                  <style>
                    {`
                      @keyframes progress {
                        0% { background-position: 0% 0%; }
                        100% { background-position: 200% 0%; }
                      }
                    `}
                  </style>
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
                    Rotina automatizada de auditoria de dados. Faça upload do arquivo Excel (.xlsm ou .xlsx) 
                    para processar e validar as informações de acordo com as regras de negócio definidas.
                  </p>
                </div>

                {/* Área de Upload e Arquivo */}
                <div style={{marginBottom: '25px'}}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '20px',
                    background: arquivoSelecionado ? '#e3f2fd' : '#f8f9fa',
                    borderRadius: '8px',
                    border: arquivoSelecionado ? '2px solid #3498db' : '2px dashed #d0d0d0',
                    transition: 'all 0.3s'
                  }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsm,.xlsx"
                      onChange={handleFileSelect}
                      style={{display: 'none'}}
                      disabled={!temPermissao() || executando}
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!temPermissao() || uploading || executando}
                      style={{
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: (!temPermissao() || uploading || executando) ? 'not-allowed' : 'pointer',
                        opacity: (!temPermissao() || uploading || executando) ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                    >
                      <FontAwesomeIcon icon={uploading ? faSpinner : faUpload} spin={uploading} />
                      Upload file
                    </button>

                    <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <FontAwesomeIcon 
                        icon={faFileExcel} 
                        style={{
                          fontSize: '24px',
                          color: arquivoSelecionado ? '#3498db' : '#95a5a6'
                        }}
                      />
                      <span style={{
                        fontSize: '15px',
                        color: arquivoSelecionado ? '#2c3e50' : '#95a5a6',
                        fontWeight: arquivoSelecionado ? 600 : 400
                      }}>
                        {arquivoSelecionado || 'Nenhum arquivo selecionado'}
                      </span>
                      {arquivoSelecionado && (
                        <>
                          <FontAwesomeIcon 
                            icon={faCheckCircle} 
                            style={{color: '#2ecc71', fontSize: '18px', marginLeft: 'auto'}}
                          />
                          <button
                            onClick={() => deletarArquivo(arquivoSelecionado)}
                            disabled={!temPermissao() || executando}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#e74c3c',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontSize: '16px',
                              opacity: (!temPermissao() || executando) ? 0.3 : 1,
                              cursor: (!temPermissao() || executando) ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => !(!temPermissao() || executando) && (e.currentTarget.style.background = '#ffe6e6')}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Remover arquivo"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lista de Arquivos Disponíveis (Dropdown) */}
                  {arquivos.length > 1 && (
                    <details style={{marginTop: '15px'}}>
                      <summary style={{
                        cursor: 'pointer',
                        padding: '10px 15px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        color: '#7f8c8d',
                        fontSize: '14px',
                        fontWeight: 500,
                        userSelect: 'none',
                        listStyle: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <FontAwesomeIcon icon={faFileExcel} />
                        Ver outros arquivos disponíveis ({arquivos.length - 1})
                      </summary>
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {arquivos.filter(a => a.nome !== arquivoSelecionado).map((arquivo, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '10px',
                              background: 'white',
                              borderRadius: '4px',
                              marginBottom: '5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '14px',
                              color: '#7f8c8d',
                              border: '1px solid #e0e0e0',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => !executando && setArquivoSelecionado(arquivo.nome)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e3f2fd';
                              e.currentTarget.style.borderColor = '#3498db';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#e0e0e0';
                            }}
                          >
                            <FontAwesomeIcon icon={faFileExcel} style={{color: '#3498db'}} />
                            <span style={{flex: 1}}>{arquivo.nome}</span>
                            <span style={{fontSize: '12px', color: '#95a5a6'}}>
                              {formatarTamanho(arquivo.tamanho)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>

                {/* Rodapé com Botões de Ação */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '15px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  {/* Botão Status - Esquerda */}
                  <button
                    style={{
                      padding: '12px 20px',
                      background: statusExecucao === 'nao-iniciado' 
                        ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
                        : statusExecucao === 'em-andamento'
                        ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
                        : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      minWidth: '160px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    title={
                      statusExecucao === 'nao-iniciado' 
                        ? 'Rotina não iniciada'
                        : statusExecucao === 'em-andamento'
                        ? 'Rotina em execução'
                        : 'Rotina concluída'
                    }
                  >
                    <FontAwesomeIcon 
                      icon={
                        statusExecucao === 'nao-iniciado' 
                          ? faInfoCircle
                          : statusExecucao === 'em-andamento'
                          ? faSpinner
                          : faCheckCircle
                      } 
                      spin={statusExecucao === 'em-andamento'}
                    />
                    {statusExecucao === 'nao-iniciado' 
                      ? 'Não iniciado'
                      : statusExecucao === 'em-andamento'
                      ? 'Em andamento...'
                      : 'Concluído'
                    }
                  </button>

                  {/* Botões Log e Executar - Direita */}
                  <div style={{
                    display: 'flex',
                    gap: '10px'
                  }}>
                    {/* Botão Log */}
                    <button
                      onClick={() => setLogsInlineOpen(!logsInlineOpen)}
                      style={{
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        minWidth: '100px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      title={logsInlineOpen ? "Ocultar logs" : "Visualizar logs"}
                    >
                      <FontAwesomeIcon icon={faClockRotateLeft} />
                      Log
                    </button>

                    {/* Botão Executar */}
                    <button
                      onClick={executarRotina}
                      disabled={!podeExecutar()}
                      style={{
                        padding: '12px 24px',
                        background: !podeExecutar() 
                          ? '#e0e0e0' 
                          : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                        color: !podeExecutar() ? '#95a5a6' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: !podeExecutar() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        minWidth: '140px'
                      }}
                      onMouseEnter={(e) => podeExecutar() && (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      title={!arquivoSelecionado ? 'Selecione um arquivo para executar' : 'Executar rotina de auditoria'}
                    >
                      <FontAwesomeIcon icon={executando ? faSpinner : faPlay} spin={executando} />
                      {executando ? 'Executando...' : 'Executar'}
                    </button>
                  </div>
                </div>

                {/* Visualização Inline dos Logs */}
                {logsInlineOpen && (
                  <div style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '2px solid #e0e0e0'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <FontAwesomeIcon icon={faSpinner} spin={executando} style={{color: '#3498db'}} />
                        Logs de Execução
                        {executando && <span style={{fontSize: '14px', color: '#f39c12', fontWeight: 400}}>(Em andamento)</span>}
                      </h4>
                      <span style={{fontSize: '13px', color: '#7f8c8d'}}>
                        {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
                      </span>
                    </div>
                    
                    <div style={{
                      background: '#1e1e1e',
                      borderRadius: '8px',
                      padding: '15px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '13px',
                      border: '1px solid #e0e0e0'
                    }}>
                      {logs.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '30px',
                          color: '#888'
                        }}>
                          <FontAwesomeIcon icon={faInfoCircle} style={{fontSize: '28px', marginBottom: '10px'}} />
                          <div>Nenhum log disponível</div>
                          <div style={{fontSize: '12px', marginTop: '5px'}}>
                            {executando ? 'Aguardando início da execução...' : 'Execute a rotina para ver os logs aqui'}
                          </div>
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
                              fontSize: '11px',
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
                                marginTop: '3px',
                                fontSize: '12px'
                              }}
                            />
                            <span style={{
                              color: getLogColor(log.tipo),
                              wordBreak: 'break-word',
                              flex: 1
                            }}>
                              {log.mensagem}
                            </span>
                          </div>
                        ))
                      )}
                      <div ref={logsEndRef} />
                    </div>
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