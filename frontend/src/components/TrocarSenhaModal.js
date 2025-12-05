import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faKey } from '@fortawesome/free-solid-svg-icons';
import '../styles/TrocarSenhaModal.css';

function TrocarSenhaModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    senhaAtual: false,
    senhaNova: false,
    confirmarSenha: false
  });

  const [formData, setFormData] = useState({
    senhaAtual: '',
    senhaNova: '',
    confirmarSenha: ''
  });

  const [errors, setErrors] = useState({});

  // Validar formulário
  const validarFormulario = () => {
    const novoErrors = {};

    // Validar senha atual
    if (!formData.senhaAtual.trim()) {
      novoErrors.senhaAtual = 'Senha atual é obrigatória';
    }

    // Validar nova senha
    if (!formData.senhaNova.trim()) {
      novoErrors.senhaNova = 'Nova senha é obrigatória';
    } else if (formData.senhaNova.length < 6) {
      novoErrors.senhaNova = 'Senha deve ter no mínimo 6 caracteres';
    } else if (formData.senhaNova === formData.senhaAtual) {
      novoErrors.senhaNova = 'Nova senha não pode ser igual à senha atual';
    }

    // Validar confirmação de senha
    if (!formData.confirmarSenha.trim()) {
      novoErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.confirmarSenha !== formData.senhaNova) {
      novoErrors.confirmarSenha = 'As senhas não coincidem';
    }

    setErrors(novoErrors);
    return Object.keys(novoErrors).length === 0;
  };

  // Alternar visibilidade da senha
  const toggleShowPassword = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error('Por favor, corrija os erros antes de continuar');
      return;
    }

    setLoading(true);

    try {
      // Chamar API de trocar senha
      const response = await authService.trocarSenha(
        formData.senhaAtual,
        formData.senhaNova
      );

      if (response.success) {
        toast.success('✅ Senha alterada com sucesso! Redirecionando para login...');
        
        // Aguardar um momento antes de redirecionar
        setTimeout(() => {
          logout();
          navigate('/login');
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao trocar senha:', error);
      
      let mensagemErro = 'Erro ao alterar senha';
      
      if (error.response?.status === 401) {
        mensagemErro = '❌ Senha atual incorreta';
      } else if (error.response?.status === 400) {
        mensagemErro = error.response.data?.error || mensagemErro;
      } else if (error.response?.data?.error) {
        mensagemErro = error.response.data.error;
      }
      
      toast.error(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  // Lidar com mudanças no formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro deste campo ao usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Lidar com Enter para submeter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  // Fechar ao apertar ESC
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  // Componente de campo de senha com toggle
  const PasswordInput = ({ name, label, value, placeholder }) => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <div className="password-input-wrapper">
        <input
          id={name}
          name={name}
          type={showPassword[name] ? 'text' : 'password'}
          className={`form-control ${errors[name] ? 'error' : ''}`}
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={loading}
          autoComplete="off"
        />
        <button
          type="button"
          className="toggle-password"
          onClick={() => toggleShowPassword(name)}
          disabled={loading}
          title={showPassword[name] ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword[name] ? '👁‍🗨' : '👁'}
        </button>
      </div>
      {errors[name] && (
        <div className="error-message">{errors[name]}</div>
      )}
    </div>
  );

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className="modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="modal-container">
        <div className="modal-content">
          {/* Header do Modal */}
          <div className="modal-header">
            <div className="modal-title-section">
              <FontAwesomeIcon icon={faKey} className="modal-icon" />
              <h2 className="modal-title">Alteração de Senha</h2>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              disabled={loading}
              title="Fechar"
              aria-label="Fechar modal"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Aviso importante */}
          <div className="modal-warning">
            <strong>⚠️</strong> Ao trocar de senha você será redirecionado para fazer login novamente.
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="modal-form">
            {/* Senha Atual */}
            <PasswordInput
              name="senhaAtual"
              label="Senha Atual *"
              value={formData.senhaAtual}
              placeholder="Digite sua senha atual"
            />

            {/* Nova Senha */}
            <PasswordInput
              name="senhaNova"
              label="Nova Senha *"
              value={formData.senhaNova}
              placeholder="Digite uma nova senha"
            />
            {!errors.senhaNova && (
              <div className="password-hint">
                ℹ️ Mínimo 6 caracteres
              </div>
            )}

            {/* Confirmar Senha */}
            <PasswordInput
              name="confirmarSenha"
              label="Confirmar Nova Senha *"
              value={formData.confirmarSenha}
              placeholder="Confirme a nova senha"
            />

            {/* Botões de ação */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default TrocarSenhaModal;