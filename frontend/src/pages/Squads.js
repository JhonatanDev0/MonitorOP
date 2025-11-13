import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { squadService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';

function Squads() {
  const { isAdmin } = useAuth();
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  });

  useEffect(() => {
    carregarSquads();
  }, []);

  const carregarSquads = async () => {
    try {
      setLoading(true);
      const response = await squadService.listar();
      setSquads(response.data);
    } catch (error) {
      console.error('Erro ao carregar squads:', error);
      toast.error('Erro ao carregar squads');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await squadService.atualizar(editando.id, formData);
        toast.success('Squad atualizada com sucesso!');
      } else {
        await squadService.criar(formData);
        toast.success('Squad criada com sucesso!');
      }
      resetForm();
      carregarSquads();
    } catch (error) {
      console.error('Erro ao salvar squad:', error);
      toast.error('Erro ao salvar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (squad) => {
    setEditando(squad);
    setFormData({
      nome: squad.nome,
      descricao: squad.descricao || ''
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
            Tem certeza que deseja deletar esta squad? Esta ação não pode ser desfeita.
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
                  await squadService.deletar(id);
                  toast.success('Squad deletada com sucesso!');
                  carregarSquads();
                } catch (error) {
                  console.error('Erro ao deletar squad:', error);
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
    setFormData({ nome: '', descricao: '' });
    setEditando(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Squads</h2>
          {isAdmin() && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowForm(!showForm)}
            >
              <FontAwesomeIcon icon={showForm ? faTimes : faPlus} />
              {showForm ? ' Cancelar' : ' Nova Squad'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                className="form-control"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
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

        {squads.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma squad cadastrada</h3>
            <p>Clique em "Nova Squad" para começar</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Projetos</th>
                  <th>Atividades</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {squads.map(squad => (
                  <tr key={squad.id}>
                    <td><strong>{squad.nome}</strong></td>
                    <td>{squad.descricao || '-'}</td>
                    <td>{squad.total_projetos}</td>
                    <td>{squad.total_atividades}</td>
                    <td>
                      {isAdmin() ? (
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button 
                            className="btn btn-primary btn-small" 
                            onClick={() => handleEdit(squad)}
                          >
                            <FontAwesomeIcon icon={faEdit} /> Editar
                          </button>
                          <button 
                            className="btn btn-danger btn-small" 
                            onClick={() => handleDelete(squad.id)}
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
        )}
      </div>
    </div>
  );
}

export default Squads;