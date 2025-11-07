import React, { useState, useEffect } from 'react';
import { squadService } from '../services/api';

function Squads() {
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
      alert('Erro ao carregar squads');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await squadService.atualizar(editando.id, formData);
        alert('Squad atualizada com sucesso!');
      } else {
        await squadService.criar(formData);
        alert('Squad criada com sucesso!');
      }
      resetForm();
      carregarSquads();
    } catch (error) {
      console.error('Erro ao salvar squad:', error);
      alert('Erro ao salvar squad: ' + (error.response?.data?.error || error.message));
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
    if (window.confirm('Tem certeza que deseja deletar esta squad?')) {
      try {
        await squadService.deletar(id);
        alert('Squad deletada com sucesso!');
        carregarSquads();
      } catch (error) {
        console.error('Erro ao deletar squad:', error);
        alert('Erro ao deletar squad: ' + (error.response?.data?.error || error.message));
      }
    }
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
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : '+ Nova Squad'}
          </button>
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
                {editando ? 'Atualizar' : 'Criar'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancelar
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
                    <button 
                      className="btn btn-primary btn-small" 
                      onClick={() => handleEdit(squad)}
                      style={{marginRight: '5px'}}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-danger btn-small" 
                      onClick={() => handleDelete(squad.id)}
                    >
                      Deletar
                    </button>
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

export default Squads;
