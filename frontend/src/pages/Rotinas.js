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
  const { user, canEdit } = useAuth();
  const currentUser = user;
  const [squads, setSquads] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [filtros, setFiltros] = useState({ squad_id: '', projeto_id: '' });
  const [projetoSearch, setProjetoSearch] = useState('');
  const [projetosFiltrados, setProjetosFiltrados] = useState([]);
  const [showProjetoDropdown, setShowProjetoDropdown] = useState(false);

  // Função auxiliar que verifica permissão
  const temPermissao = () => {
    if (typeof canEdit === 'function') {
      return canEdit();
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
  }, []);

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

          {/* Mensagem de nenhuma rotina disponível */}
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
        </div>
      </div>
    </div>
  );
};

export default Rotinas;
