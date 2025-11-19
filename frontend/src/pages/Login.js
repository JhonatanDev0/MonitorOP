import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    login: '',
    senha: '',
    lembrar: false
  });
  const [loading, setLoading] = useState(false);

  // ✅ NOVO: Redirecionar se já está logado
  React.useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    console.log('🔵 handleLogin chamado!');
    
    if (loading) {
      console.log('⚠️ Já está processando...');
      return;
    }
    
    if (!formData.login || !formData.senha) {
      console.log('⚠️ Campos vazios');
      toast.error('Preencha todos os campos');
      return;
    }

    console.log('🟢 Iniciando login...');
    setLoading(true);

    try {
      console.log('📡 Chamando API de login...');
      await login(formData.login, formData.senha, formData.lembrar);
      console.log('✅ Login bem-sucedido!');
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.log('❌ ========== ERRO NO LOGIN ==========');
      console.log('Error completo:', error);
      console.log('Response:', error.response);
      console.log('Data:', error.response?.data);
      console.log('=====================================');
      
      const errorMessage = error.response?.data?.error || 'Credenciais inválidas';
      console.log('🔴 Mensagem de erro:', errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "colored",
      });
      
      console.log('📢 Toast de erro exibido!');
    } finally {
      console.log('🏁 Finalizando...');
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      console.log('⌨️ Enter pressionado!');
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/fundacao.png" alt="CAEd UFJF" className="login-logo" />
          <h1>Monitoramento de Atividades da Ordem de Produção</h1>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label htmlFor="login">Login</label>
            <input
              id="login"
              name="login"
              type="text"
              className="form-control"
              value={formData.login}
              onChange={(e) => setFormData({...formData, login: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Digite seu login"
              disabled={loading}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              className="form-control"
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua senha"
              disabled={loading}
              autoComplete="current-password"
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
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
        
      </div>
    </div>
  );
}

export default Login;