import React, { useState, useEffect } from 'react';
import { usuarioService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faUserShield, faUser, faUserTie, faToggleOn, faToggleOff, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import Pagination from '../components/Pagination';
import '../styles/EditarEmLinha.css';

function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [pagination, setPagination] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    login: '',
    senha: '',
    role: 'analista',
    ativo: true
  });

  useEffect(() => {
    carregarUsuarios();
  }, [currentPage, perPage]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await usuarioService.listar(currentPage, perPage);
      
      if (response.data.items) {
        // Com paginação
        setUsuarios(response.data.items);
        setPagination(response.data.pagination);
      } else {
        // Sem paginação (fallback)
        setUsuarios(response.data);
        setPagination(null);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
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
    
    if (!formData.nome || !formData.login) {
      toast.error('Nome e login são obrigatórios');
      return;
    }

    if (!editando && !formData.senha) {
      toast.error('Senha é obrigatória para novos usuários');
      return;
    }

    try {
      const dataToSend = {
        nome: formData.nome.trim(),
        login: formData.login.trim(),
        role: formData.role,
        ativo: Boolean(formData.ativo)
      };

      if (editando) {
        if (formData.senha && formData.senha.trim()) {
          dataToSend.senha = formData.senha;
        }
        
        await usuarioService.atualizar(editando.id, dataToSend);
        toast.success('Usuário atualizado com sucesso!');
        setEditandoId(null);
      } else {
        dataToSend.senha = formData.senha;
        
        await usuarioService.criar(dataToSend);
        toast.success('Usuário criado com sucesso!');
      }
      
      resetForm();
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (usuario) => {
    setEditando(usuario);
    setEditandoId(usuario.id);
    setFormData({
      nome: usuario.nome,
      login: usuario.login,
      senha: '',
      role: usuario.role,
      ativo: usuario.ativo
    });
  };

  const handleDelete = async (id, nome) => {
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
            Tem certeza que deseja deletar o usuário <strong>{nome}</strong>? Esta ação não pode ser desfeita.
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
                  await usuarioService.deletar(id);
                  toast.success('Usuário deletado com sucesso!');
                  carregarUsuarios();
                } catch (error) {
                  console.error('Erro ao deletar usuário:', error);
                  toast.error(error.response?.data?.error || 'Erro ao deletar usuário');
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
      nome: '',
      login: '',
      senha: '',
      role: 'analista',
      ativo: true
    });
    setEditando(null);
    setEditandoId(null);
    setShowForm(false);
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="badge badge-role-admin">
          <FontAwesomeIcon icon={faUserShield} /> Admin
        </span>
      );
    }
    if (role === 'gestor') {
      return (
        <span className="badge badge-role-gestor">
          <FontAwesomeIcon icon={faUserTie} /> Gestor
        </span>
      );
    }
    return (
      <span className="badge badge-role-analista">
        <FontAwesomeIcon icon={faUser} /> Analista
      </span>
    );
  };

  const getStatusBadge = (ativo) => {
    if (ativo) {
      return (
        <span className="badge badge-status-ativo">
          <FontAwesomeIcon icon={faToggleOn} /> Ativo
        </span>
      );
    }
    return (
      <span className="badge badge-status-inativo">
        <FontAwesomeIcon icon={faToggleOff} /> Inativo
      </span>
    );
  };

  if (loading && usuarios.length === 0) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Gestão de Usuários</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            <FontAwesomeIcon icon={showForm ? faTimes : faPlus} />
            {showForm ? ' Cancelar' : ' Novo Usuário'}
          </button>
        </div>

        {/* FORMULÁRIO DE CADASTRO - TELA CHEIA */}
        {showForm && (
          <div className="form-fullscreen">
            <div className="form-fullscreen-header">
              <h3>
                <FontAwesomeIcon icon={faPlus} /> Novo Usuário
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="form-fullscreen-content">
              <div className="form-group">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: João da Silva"
                  required
                />
              </div>

              <div className="form-group">
                <label>Login *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.login}
                  onChange={(e) => setFormData({...formData, login: e.target.value})}
                  placeholder="Ex: joao.silva"
                  required
                />
              </div>

              <div className="form-group">
                <label>Senha *</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.senha}
                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                  placeholder="Digite uma senha segura"
                  required
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div className="form-group">
                  <label>Perfil *</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="analista">Analista (Apenas Visualização)</option>
                    <option value="gestor">Gestor (Edição de Dados)</option>
                    <option value="admin">Administrador (Acesso Total)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={formData.ativo.toString()}
                    onChange={(e) => setFormData({...formData, ativo: e.target.value === 'true'})}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="form-fullscreen-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  <FontAwesomeIcon icon={faTimes} /> Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <FontAwesomeIcon icon={faSave} /> Criar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABELA - OCULTA QUANDO SHOWFORM ESTÁ ATIVO */}
        {!showForm && (
          <>
            {usuarios.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhum usuário cadastrado</h3>
                <p>Clique em "+ Novo Usuário" para começar</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Login</th>
                        <th>Perfil</th>
                        <th>Status</th>
                        <th>Cadastro</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map(usuario => (
                        <React.Fragment key={usuario.id}>
                          <tr>
                            <td><strong>{usuario.nome}</strong></td>
                            <td>{usuario.login}</td>
                            <td>{getRoleBadge(usuario.role)}</td>
                            <td>{getStatusBadge(usuario.ativo)}</td>
                            <td>
                              {usuario.created_at 
                                ? new Date(usuario.created_at).toLocaleDateString('pt-BR')
                                : '-'}
                            </td>
                            <td>
                              <div style={{display: 'flex', gap: '5px'}}>
                                <button 
                                  className="btn btn-primary btn-small" 
                                  onClick={() => editandoId === usuario.id ? setEditandoId(null) : handleEdit(usuario)}
                                >
                                  <FontAwesomeIcon icon={editandoId === usuario.id ? faChevronUp : faChevronDown} /> 
                                  {editandoId === usuario.id ? ' Fechar' : ' Editar'}
                                </button>
                                {usuario.id !== user.id && (
                                  <button 
                                    className="btn btn-danger btn-small" 
                                    onClick={() => handleDelete(usuario.id, usuario.nome)}
                                  >
                                    <FontAwesomeIcon icon={faTrash} /> Deletar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          
                          {/* LINHA DE EDIÇÃO EM SANFONA */}
                          {editandoId === usuario.id && (
                            <tr className="edit-row">
                              <td colSpan="6">
                                <div className="edit-form-wrapper">
                                  <div className="edit-form-header">
                                    <h4>
                                      <FontAwesomeIcon icon={faEdit} /> Editando: {usuario.nome}
                                    </h4>
                                  </div>
                                  
                                  <form onSubmit={handleSubmit} className="edit-form-content">
                                    <div className="form-row">
                                      <div className="form-group">
                                        <label>Nome Completo *</label>
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={formData.nome}
                                          onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                          placeholder="Ex: João da Silva"
                                          required
                                        />
                                      </div>

                                      <div className="form-group">
                                        <label>Login *</label>
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={formData.login}
                                          onChange={(e) => setFormData({...formData, login: e.target.value})}
                                          placeholder="Ex: joao.silva"
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="form-group">
                                      <label>Senha (deixe em branco para manter a atual)</label>
                                      <input
                                        type="password"
                                        className="form-control"
                                        value={formData.senha}
                                        onChange={(e) => setFormData({...formData, senha: e.target.value})}
                                        placeholder="Digite para alterar a senha"
                                      />
                                    </div>

                                    <div className="form-row">
                                      <div className="form-group">
                                        <label>Perfil *</label>
                                        <select
                                          className="form-control"
                                          value={formData.role}
                                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                                          required
                                        >
                                          <option value="analista">Analista (Apenas Visualização)</option>
                                          <option value="gestor">Gestor (Edição de Dados)</option>
                                          <option value="admin">Administrador (Acesso Total)</option>
                                        </select>
                                      </div>

                                      <div className="form-group">
                                        <label>Status</label>
                                        <select
                                          className="form-control"
                                          value={formData.ativo.toString()}
                                          onChange={(e) => setFormData({...formData, ativo: e.target.value === 'true'})}
                                        >
                                          <option value="true">Ativo</option>
                                          <option value="false">Inativo</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="edit-form-actions">
                                      <button type="button" className="btn btn-secondary" onClick={() => setEditandoId(null)}>
                                        <FontAwesomeIcon icon={faTimes} /> Cancelar
                                      </button>
                                      <button type="submit" className="btn btn-success">
                                        <FontAwesomeIcon icon={faSave} /> Atualizar
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Componente de Paginação */}
                <Pagination 
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Usuarios;