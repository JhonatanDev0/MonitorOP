import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    login: '',
    senha: '',
    lembrar: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.login || !formData.senha) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      await login(formData.login, formData.senha, formData.lembrar);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/fundacao.png" alt="CAEd UFJF" className="login-logo" />
          <h1>Monitoramento de Atividades da Ordem de Produção</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login">Login</label>
            <input
              id="login"
              type="text"
              className="form-control"
              value={formData.login}
              onChange={(e) => setFormData({...formData, login: e.target.value})}
              placeholder="Digite seu login"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="form-control"
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              placeholder="Digite sua senha"
              disabled={loading}
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.lembrar}
                onChange={(e) => setFormData({...formData, lembrar: e.target.checked})}
                disabled={loading}
              />
              <span>Lembrar-me</span>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
      </div>
    </div>
  );
}

export default Login;