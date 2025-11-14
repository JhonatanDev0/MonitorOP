import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { atividadeService, projetoService, squadService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faFilterCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import Pagination from '../components/Pagination';
import '../styles/Dashboard.css';

function Atividades() {
  const { isAdmin } = useAuth();
  const [atividades, setAtividades] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [pagination, setPagination] = useState(null);
  
  const [filtros, setFiltros] = useState({
    projeto_id: '',
    squad_id: '',
    status: '',
    prioridade: ''
  });
  
  const [formData, setFormData] = useState({
    titulo: '',
    observacao: '',
    inicio_programado: '',
    inicio_realizado: '',
    fim_programado: '',
    fim_realizado: '',
    prioridade: 'media',
    status: 'pendente',
    projeto_id: '',
    squad_id: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    carregarAtividades();
  }, [currentPage, perPage, filtros]);

  const carregarDados = async () => {
    try {
      const [projetosRes, squadsRes] = await Promise.all([
        projetoService.listar(),
        squadService.listar()
      ]);
      setProjetos(projetosRes.data.items || projetosRes.data);
      setSquads(squadsRes.data.items || squadsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const carregarAtividades = async () => {
    try {
      setLoading(true);
      const filtrosLimpos = Object.fromEntries(
        Object.entries(filtros).filter(([_, v]) => v !== '')
      );
      const response = await atividadeService.listar(filtrosLimpos, currentPage, perPage);
      
      if (response.data.items) {
        setAtividades(response.data.items);
        setPagination(response.data.pagination);
      } else {
        setAtividades(response.data);
        setPagination(null);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      toast.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage, newPerPage = perPage) => {
    setCurrentPage(newPage);
    if (newPerPage !== perPage) {
      setPerPage(newPerPage);
      setCurrentPage(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await atividadeService.atualizar(editando.id, formData);
        toast.success('Atividade atualizada com sucesso!');
      } else {
        await atividadeService.criar(formData);
        toast.success('Atividade criada com sucesso!');
      }
      resetForm();
      carregarAtividades();
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
      toast.error('Erro ao salvar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (atividade) => {
    setEditando(atividade);
    setFormData({
      titulo: atividade.titulo,
      observacao: atividade.observacao || '',
      inicio_programado: atividade.inicio_programado || '',
      inicio_realizado: atividade.inicio_realizado || '',
      fim_programado: atividade.fim_programado || '',
      fim_realizado: atividade.fim_realizado || '',
      prioridade: atividade.prioridade,
      status: atividade.status,
      projeto_id: atividade.projeto.id,
      squad_id: atividade.squad.id
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
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
            Tem certeza que deseja deletar esta atividade? Esta ação não pode ser desfeita.
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
                  await atividadeService.deletar(id);
                  toast.success('Atividade deletada com sucesso!');
                  carregarAtividades();
                } catch (error) {
                  console.error('Erro ao deletar atividade:', error);
                  toast.error('Erro ao deletar: ' + (error.response?.data?.error || error.message));
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

  const resetForm = () => {
    setFormData({
      titulo: '',
      observacao: '',
      inicio_programado: '',
      inicio_realizado: '',
      fim_programado: '',
      fim_realizado: '',
      prioridade: 'media',
      status: 'pendente',
      projeto_id: '',
      squad_id: ''
    });
    setEditando(null);
    setShowForm(false);
  };

  const limparFiltros = () => {
    setFiltros({
      projeto_id: '',
      squad_id: '',
      status: '',
      prioridade: ''
    });
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    return <span className={`badge badge-status-${status}`}>
      {status === 'pendente' ? 'Pendente' : 
       status === 'em_andamento' ? 'Em Andamento' : 'Concluída'}
    </span>;
  };

  const getPrioridadeBadge = (prioridade) => {
    return <span className={`badge badge-prioridade-${prioridade}`}>
      {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
    </span>;
  };

  if (loading && atividades.length === 0) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Atividades</h2>
          {isAdmin() && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowForm(!showForm)}
            >
              <FontAwesomeIcon icon={showForm ? faTimes : faPlus} />
              {showForm ? ' Cancelar' : ' Nova Atividade'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
            <div className="form-group">
              <label>Título *</label>
              <input
                type="text"
                className="form-control"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Observação</label>
              <textarea
                className="form-control"
                value={formData.observacao}
                onChange={(e) => setFormData({...formData, observacao: e.target.value})}
              />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <div className="form-group">
                <label>Projeto *</label>
                <select
                  className="form-control"
                  value={formData.projeto_id}
                  onChange={(e) => setFormData({...formData, projeto_id: e.target.value})}
                  required
                >
                  <option value="">Selecione um projeto</option>
                  {projetos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Squad *</label>
                <select
                  className="form-control"
                  value={formData.squad_id}
                  onChange={(e) => setFormData({...formData, squad_id: e.target.value})}
                  required
                >
                  <option value="">Selecione uma squad</option>
                  {squads.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px'}}>
              <div className="form-group">
                <label>Início Programado</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.inicio_programado}
                  onChange={(e) => setFormData({...formData, inicio_programado: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Início Realizado</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.inicio_realizado}
                  onChange={(e) => setFormData({...formData, inicio_realizado: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Fim Programado</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fim_programado}
                  onChange={(e) => setFormData({...formData, fim_programado: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Fim Realizado</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.fim_realizado}
                  onChange={(e) => setFormData({...formData, fim_realizado: e.target.value})}
                />
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <div className="form-group">
                <label>Prioridade</label>
                <select
                  className="form-control"
                  value={formData.prioridade}
                  onChange={(e) => setFormData({...formData, prioridade: e.target.value})}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                </select>
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px'}}>
              <button type="submit" className="btn btn-success">
                <FontAwesomeIcon icon={faSave} /> {editando ? 'Atualizar' : 'Criar'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                <FontAwesomeIcon icon={faTimes} /> Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Filtros com estilo do Dashboard */}
        <div className="dashboard-filters" style={{marginTop: '20px'}}>
          <div className="filter-row">
            <div className="filter-item">
              <label>Filtrar por Projeto</label>
              <select
                className="form-control"
                value={filtros.projeto_id}
                onChange={(e) => {
                  setFiltros({...filtros, projeto_id: e.target.value});
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos</option>
                {projetos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Filtrar por Squad</label>
              <select
                className="form-control"
                value={filtros.squad_id}
                onChange={(e) => {
                  setFiltros({...filtros, squad_id: e.target.value});
                  setCurrentPage(1);
                }}
              >
                <option value="">Todas</option>
                {squads.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Filtrar por Status</label>
              <select
                className="form-control"
                value={filtros.status}
                onChange={(e) => {
                  setFiltros({...filtros, status: e.target.value});
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Filtrar por Prioridade</label>
              <select
                className="form-control"
                value={filtros.prioridade}
                onChange={(e) => {
                  setFiltros({...filtros, prioridade: e.target.value});
                  setCurrentPage(1);
                }}
              >
                <option value="">Todas</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          {(filtros.projeto_id || filtros.squad_id || filtros.status || filtros.prioridade) && (
            <div className="filter-actions">
              <button className="btn btn-secondary btn-small" onClick={limparFiltros}>
                <FontAwesomeIcon icon={faFilterCircleXmark} /> Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {atividades.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma atividade encontrada</h3>
            <p>
              {Object.values(filtros).some(v => v) 
                ? 'Tente ajustar os filtros ou criar uma nova atividade'
                : 'Clique em "Nova Atividade" para começar'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Projeto</th>
                    <th>Squad</th>
                    <th>Início Prog.</th>
                    <th>Início Real.</th>
                    <th>Fim Prog.</th>
                    <th>Fim Real.</th>
                    <th>Status</th>
                    <th>Prioridade</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {atividades.map(atividade => (
                    <tr key={atividade.id}>
                      <td><strong>{atividade.titulo}</strong></td>
                      <td>{atividade.projeto.nome}</td>
                      <td>{atividade.squad.nome}</td>
                      <td>
                        {atividade.inicio_programado 
                          ? new Date(atividade.inicio_programado).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {atividade.inicio_realizado 
                          ? new Date(atividade.inicio_realizado).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {atividade.fim_programado 
                          ? new Date(atividade.fim_programado).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {atividade.fim_realizado 
                          ? new Date(atividade.fim_realizado).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>{getStatusBadge(atividade.status)}</td>
                      <td>{getPrioridadeBadge(atividade.prioridade)}</td>
                      <td>
                        {isAdmin() ? (
                          <div style={{display: 'flex', gap: '5px'}}>
                            <button 
                              className="btn btn-primary btn-small" 
                              onClick={() => handleEdit(atividade)}
                            >
                              <FontAwesomeIcon icon={faEdit} /> Editar
                            </button>
                            <button 
                              className="btn btn-danger btn-small" 
                              onClick={() => handleDelete(atividade.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} /> Deletar
                            </button>
                          </div>
                        ) : (
                          <span style={{color: '#95a5a6', fontSize: '13px'}}>Sem permissão</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Atividades;