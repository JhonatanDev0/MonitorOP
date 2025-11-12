import React, { useState, useEffect } from 'react';
import { usuarioService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faUserShield, faUser, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';

function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    login: '',
    senha: '',
    role: 'analista',
    ativo: true
  });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await usuarioService.listar();
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
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
        // Garantir que os dados estão no formato correto
        const dataToSend = {
            nome: formData.nome.trim(),
            login: formData.login.trim(),
            role: formData.role,
            ativo: Boolean(formData.ativo) // Garantir que é boolean
        };

        if (editando) {
            // Só adiciona senha se foi preenchida
            if (formData.senha && formData.senha.trim()) {
            dataToSend.senha = formData.senha;
            }
            
            console.log('Atualizando usuário:', dataToSend);
            await usuarioService.atualizar(editando.id, dataToSend);
            toast.success('Usuário atualizado com sucesso!');
        } else {
            // Ao criar, senha é obrigatória
            dataToSend.senha = formData.senha;
            
            console.log('Criando novo usuário:', dataToSend);
            await usuarioService.criar(dataToSend);
            toast.success('Usuário criado com sucesso!');
        }
        
        resetForm();
        carregarUsuarios();
        } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        console.error('Response:', error.response?.data);
        toast.error(error.response?.data?.error || 'Erro ao salvar usuário');
        }
    };

  const handleEdit = (usuario) => {
    setEditando(usuario);
    setFormData({
      nome: usuario.nome,
      login: usuario.login,
      senha: '',
      role: usuario.role,
      ativo: usuario.ativo
    });
    setShowForm(true);
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

  if (loading) {
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

        {showForm && (
          <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
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
              <label>Senha {editando && '(deixe em branco para manter a atual)'}</label>
              <input
                type="password"
                className="form-control"
                value={formData.senha}
                onChange={(e) => setFormData({...formData, senha: e.target.value})}
                placeholder={editando ? "Digite para alterar a senha" : "Digite uma senha segura"}
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
                  <option value="analista">Analista</option>
                  <option value="admin">Administrador</option>
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

            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
              <button type="submit" className="btn btn-success">
                <FontAwesomeIcon icon={faSave} /> {editando ? 'Atualizar' : 'Criar'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                <FontAwesomeIcon icon={faTimes} /> Cancelar
              </button>
            </div>
          </form>
        )}

        {usuarios.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum usuário cadastrado</h3>
            <p>Clique em "+ Novo Usuário" para começar</p>
          </div>
        ) : (
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
                <tr key={usuario.id}>
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
                        onClick={() => handleEdit(usuario)}
                      >
                        <FontAwesomeIcon icon={faEdit} /> Editar
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Usuarios;