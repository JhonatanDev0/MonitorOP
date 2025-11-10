import React, { useState, useEffect } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import { toast } from 'react-toastify';
import { atividadeService, projetoService, squadService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faFilterCircleXmark } from '@fortawesome/free-solid-svg-icons';

function Atividades() {
  const [atividades, setAtividades] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtros, setFiltros] = useState({
    projeto_id: '',
    squad_id: '',
    status: '',
    prioridade: ''
  });
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prazo: '',
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
  }, [filtros]);

  const carregarDados = async () => {
    try {
      const [projetosRes, squadsRes] = await Promise.all([
        projetoService.listar(),
        squadService.listar()
      ]);
      setProjetos(projetosRes.data);
      setSquads(squadsRes.data);
      carregarAtividades();
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
      const response = await atividadeService.listar(filtrosLimpos);
      setAtividades(response.data);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      toast.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
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
      descricao: atividade.descricao || '',
      prazo: atividade.prazo || '',
      prioridade: atividade.prioridade,
      status: atividade.status,
      projeto_id: atividade.projeto.id,
      squad_id: atividade.squad.id
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    confirmAlert({
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja deletar esta atividade? Esta ação não pode ser desfeita.',
      buttons: [
        {
          label: 'Sim, deletar',
          onClick: async () => {
            try {
              await atividadeService.deletar(id);
              toast.success('Atividade deletada com sucesso!');
              carregarAtividades();
            } catch (error) {
              console.error('Erro ao deletar atividade:', error);
              toast.error('Erro ao deletar: ' + (error.response?.data?.error || error.message));
            }
          },
          className: 'custom-confirm-button-yes'
        },
        {
          label: 'Cancelar',
          onClick: () => {},
          className: 'custom-confirm-button-no'
        }
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
      overlayClassName: 'custom-confirm-overlay'
    });
  };
  
  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      prazo: '',
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
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            <FontAwesomeIcon icon={showForm ? faTimes : faPlus} />
            {showForm ? ' Cancelar' : ' Nova Atividade'}
          </button>
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
              <label>Descrição</label>
              <textarea
                className="form-control"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
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

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px'}}>
              <div className="form-group">
                <label>Prazo</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.prazo}
                  onChange={(e) => setFormData({...formData, prazo: e.target.value})}
                />
              </div>

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

        <div className="filters">
          <div className="filter-item">
            <label>Filtrar por Projeto</label>
            <select
              className="form-control"
              value={filtros.projeto_id}
              onChange={(e) => setFiltros({...filtros, projeto_id: e.target.value})}
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
              onChange={(e) => setFiltros({...filtros, squad_id: e.target.value})}
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
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
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
              onChange={(e) => setFiltros({...filtros, prioridade: e.target.value})}
            >
              <option value="">Todas</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>

        {(filtros.projeto_id || filtros.squad_id || filtros.status || filtros.prioridade) && (
          <button className="btn btn-secondary btn-small" onClick={limparFiltros}>
            <FontAwesomeIcon icon={faFilterCircleXmark} /> Limpar Filtros
          </button>
        )}

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
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Projeto</th>
                <th>Squad</th>
                <th>Prazo</th>
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
                    {atividade.prazo 
                      ? new Date(atividade.prazo).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>{getStatusBadge(atividade.status)}</td>
                  <td>{getPrioridadeBadge(atividade.prioridade)}</td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Atividades;