import React, { useState, useEffect } from 'react';
import { projetoService, squadService } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';

function Projetos() {
  const [projetos, setProjetos] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    subprograma: '',
    nome: '',
    ordem_producao: '',
    data_aplicacao: '',
    data_termino: '',
    etapas: '',
    disciplinas: '',
    tipos_processamento: '',
    observacao: '',
    squad_ids: []
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [projetosRes, squadsRes] = await Promise.all([
        projetoService.listar(),
        squadService.listar()
      ]);
      setProjetos(projetosRes.data);
      setSquads(squadsRes.data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await projetoService.atualizar(editando.id, formData);
        toast.success('Avaliação atualizada com sucesso!');
      } else {
        await projetoService.criar(formData);
        toast.success('Avaliação criada com sucesso!');
      }
      resetForm();
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast.error('Erro ao salvar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (projeto) => {
    setEditando(projeto);
    setFormData({
      subprograma: projeto.subprograma || '',
      nome: projeto.nome,
      ordem_producao: projeto.ordem_producao || '',
      data_aplicacao: projeto.data_aplicacao || '',
      data_termino: projeto.data_termino || '',
      etapas: projeto.etapas || '',
      disciplinas: projeto.disciplinas || '',
      tipos_processamento: projeto.tipos_processamento || '',
      observacao: projeto.observacao || '',
      squad_ids: projeto.squads.map(s => s.id)
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
            Tem certeza que deseja deletar esta avaliação? Esta ação não pode ser desfeita.
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
                  await projetoService.deletar(id);
                  toast.success('Avaliação deletada com sucesso!');
                  carregarDados();
                } catch (error) {
                  console.error('Erro ao deletar projeto:', error);
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
      subprograma: '',
      nome: '',
      ordem_producao: '',
      data_aplicacao: '',
      data_termino: '',
      etapas: '',
      disciplinas: '',
      tipos_processamento: '',
      observacao: '',
      squad_ids: []
    });
    setEditando(null);
    setShowForm(false);
  };

  const handleSquadToggle = (squadId) => {
    setFormData(prev => ({
      ...prev,
      squad_ids: prev.squad_ids.includes(squadId)
        ? prev.squad_ids.filter(id => id !== squadId)
        : [...prev.squad_ids, squadId]
    }));
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Avaliações</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            <FontAwesomeIcon icon={showForm ? faTimes : faPlus} />
            {showForm ? ' Cancelar' : ' Nova Avaliação'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
            <div className="form-group">
              <label>Subprograma (Código Identificador)</label>
              <input
                type="text"
                className="form-control"
                value={formData.subprograma}
                onChange={(e) => setFormData({...formData, subprograma: e.target.value})}
                placeholder="Ex: SAEB-2023, ENEM-2025"
              />
            </div>

            <div className="form-group">
              <label>Nome da Avaliação *</label>
              <input
                type="text"
                className="form-control"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required
                placeholder="Ex: Avaliação SAEB Ensino Fundamental"
              />
            </div>

            <div className="form-group">
              <label>Ordem de Produção</label>
              <input
                type="text"
                className="form-control"
                value={formData.ordem_producao}
                onChange={(e) => setFormData({...formData, ordem_producao: e.target.value})}
                placeholder="Ex: OP-2025-001"
              />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <div className="form-group">
                <label>Data de Aplicação</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.data_aplicacao}
                  onChange={(e) => setFormData({...formData, data_aplicacao: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Data de Término da Aplicação</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.data_termino}
                  onChange={(e) => setFormData({...formData, data_termino: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Etapas</label>
              <input
                type="text"
                className="form-control"
                value={formData.etapas}
                onChange={(e) => setFormData({...formData, etapas: e.target.value})}
                placeholder="Ex: 5º ano, 9º ano"
              />
            </div>

            <div className="form-group">
              <label>Disciplinas</label>
              <input
                type="text"
                className="form-control"
                value={formData.disciplinas}
                onChange={(e) => setFormData({...formData, disciplinas: e.target.value})}
                placeholder="Ex: Língua Portuguesa, Matemática, Ciências"
              />
            </div>

            <div className="form-group">
              <label>Tipos de Processamento</label>
              <select
                className="form-control"
                value={formData.tipos_processamento}
                onChange={(e) => setFormData({...formData, tipos_processamento: e.target.value})}
              >
                <option value="">Selecione...</option>
                <option value="Destaque">Destaque</option>
                <option value="Transcrição">Transcrição</option>
                <option value="Destaque, Transcrição">Destaque e Transcrição</option>
              </select>
            </div>

            <div className="form-group">
              <label>Observação</label>
              <textarea
                className="form-control"
                value={formData.observacao}
                onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                placeholder="Observações gerais sobre a avaliação..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Equipes (Squads)</label>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
                {squads.map(squad => (
                  <label key={squad.id} style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                    <input
                      type="checkbox"
                      checked={formData.squad_ids.includes(squad.id)}
                      onChange={() => handleSquadToggle(squad.id)}
                    />
                    {squad.nome}
                  </label>
                ))}
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

        {projetos.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma avaliação cadastrada</h3>
            <p>Clique em "+ Nova Avaliação" para começar</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Subprograma</th>
                <th>Nome</th>
                <th>Ordem Produção</th>
                <th>Período de Aplicação</th>
                <th>Etapas</th>
                <th>Disciplinas</th>
                <th>Tipo Processamento</th>
                <th>Squads</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {projetos.map(projeto => (
                <tr key={projeto.id}>
                  <td><strong>{projeto.subprograma || '-'}</strong></td>
                  <td>{projeto.nome}</td>
                  <td>{projeto.ordem_producao || '-'}</td>
                  <td>
                    {projeto.data_aplicacao && projeto.data_termino
                      ? `${new Date(projeto.data_aplicacao).toLocaleDateString()} - ${new Date(projeto.data_termino).toLocaleDateString()}`
                      : projeto.data_aplicacao
                      ? new Date(projeto.data_aplicacao).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>{projeto.etapas || '-'}</td>
                  <td>{projeto.disciplinas || '-'}</td>
                  <td>{projeto.tipos_processamento || '-'}</td>
                  <td>
                    {projeto.squads.length > 0
                      ? projeto.squads.map(s => s.nome).join(', ')
                      : '-'}
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '5px'}}>
                      <button 
                        className="btn btn-primary btn-small" 
                        onClick={() => handleEdit(projeto)}
                      >
                        <FontAwesomeIcon icon={faEdit} /> Editar
                      </button>
                      <button 
                        className="btn btn-danger btn-small" 
                        onClick={() => handleDelete(projeto.id)}
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

export default Projetos;