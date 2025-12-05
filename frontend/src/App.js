import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faClipboardList, faUsers, faListCheck, faSignOutAlt, faUserShield, faBars, faTimes, faUser, faKey, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-confirm-alert/src/react-confirm-alert.css';
import './App.css';

import Dashboard from './pages/Dashboard';
import Projetos from './pages/Projetos';
import Squads from './pages/Squads';
import Atividades from './pages/Atividades';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function HeaderNav({ sidebarOpen, setSidebarOpen }) {
  const { isAuthenticated, canEdit, canAccessUsers, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const rotasValidas = ['/', '/projetos', '/squads', '/atividades', '/usuarios', '/login'];
  const ehRotaValida = rotasValidas.some(rota => 
    location.pathname === rota || location.pathname.startsWith(rota + '/')
  );
  
  if (!ehRotaValida) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: faChartLine,
      show: true,
    },
    {
      label: 'Avaliações',
      path: '/projetos',
      icon: faClipboardList,
      show: canEdit(),
    },
    {
      label: 'Squads',
      path: '/squads',
      icon: faUsers,
      show: canEdit(),
    },
    {
      label: 'Atividades',
      path: '/atividades',
      icon: faListCheck,
      show: canEdit(),
    },
    {
      label: 'Usuários',
      path: '/usuarios',
      icon: faUserShield,
      show: canAccessUsers(),
    },
  ];

  const filteredItems = menuItems.filter(item => item.show);

  return isAuthenticated() ? (
    <>
      <header className="header">
        <div className="header-content">
          {/* Botão Hamburger à esquerda */}
          <button 
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
            title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
          </button>

          {/* Logo e Título */}
          <div className="header-logo">
            <img src="/logo.png" alt="Logo" className="logo-img" />
            <h1 className="header-title">Monitoramento de Atividades</h1>
          </div>

          {/* Spacer para ocupar espaço */}
          <div className="header-spacer" />

          {/* User Menu (direita do header) */}
          <div className="header-user-menu">
            <button 
              className="header-user-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              title={user?.name || 'Usuário'}
            >
              <div className="header-user-avatar">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <span className="header-user-name">
                {user?.nome || user?.name || user?.username || user?.email?.split('@')[0] || 'Usuário'}
              </span>
              <FontAwesomeIcon icon={faChevronDown} className={`header-chevron-icon ${userMenuOpen ? 'open' : ''}`} />
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div className="header-user-dropdown">
                <button 
                  className="header-dropdown-item"
                  onClick={() => {
                    navigate('/trocar-senha');
                    setUserMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faKey} />
                  <span>Trocar Senha</span>
                </button>
                <div className="header-dropdown-divider" />
                <button 
                  className="header-dropdown-item logout"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Overlay quando sidebar está aberta - clica para fechar */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Menu Lateral */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {filteredItems.map((item) => (
            <NavLink 
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                isActive ? 'nav-item active' : 'nav-item'
              }
              end={item.path === '/'}
            >
              <span className="nav-item-icon">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <span className="nav-item-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  ) : null;
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const rotasValidas = ['/', '/projetos', '/squads', '/atividades', '/usuarios', '/login'];
  const ehRotaValida = rotasValidas.some(rota => 
    location.pathname === rota || location.pathname.startsWith(rota + '/')
  );

  return (
    <div className="App">
      <HeaderNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={!ehRotaValida || !isAuthenticated() ? 'container-fullscreen' : `container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/projetos" element={
            <PrivateRoute requireEdit={true}>
              <Projetos />
            </PrivateRoute>
          } />
          
          <Route path="/squads" element={
            <PrivateRoute requireEdit={true}>
              <Squads />
            </PrivateRoute>
          } />
          
          <Route path="/atividades" element={
            <PrivateRoute requireEdit={true}>
              <Atividades />
            </PrivateRoute>
          } />
          
          <Route path="/usuarios" element={
            <PrivateRoute adminOnly={true}>
              <Usuarios />
            </PrivateRoute>
          } />

          <Route path="/trocar-senha" element={
            <PrivateRoute>
              <div style={{ padding: '20px' }}>
                <h2>Trocar Senha</h2>
                <p>Página em desenvolvimento...</p>
              </div>
            </PrivateRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer>
        <p>Desenvolvido pela Squad de Ordem de Produção</p>
      </footer>
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;