import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faClipboardList, faUsers, faListCheck, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-confirm-alert/src/react-confirm-alert.css';
import './App.css';

import Dashboard from './pages/Dashboard';
import Projetos from './pages/Projetos';
import Squads from './pages/Squads';
import Atividades from './pages/Atividades';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="App">
      {isAuthenticated() && (
        <header className="header">
          <div className="header-container">
            <div className="header-logo">
              <img src="/logo.png" alt="Logo" className="logo-img" />
              <h1>Monitoramento de Atividades da Ordem de Produção</h1>
            </div>
            
            <nav className="nav">
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? 'active' : ''}
                end
              >
                <FontAwesomeIcon icon={faChartLine} />
                Dashboard
              </NavLink>
              <NavLink 
                to="/projetos" 
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FontAwesomeIcon icon={faClipboardList} />
                Avaliações
              </NavLink>
              <NavLink 
                to="/squads" 
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FontAwesomeIcon icon={faUsers} />
                Squads
              </NavLink>
              <NavLink 
                to="/atividades" 
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <FontAwesomeIcon icon={faListCheck} />
                Atividades
              </NavLink>
              
              <button 
                className="btn-logout"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                Sair
              </button>
            </nav>
          </div>
        </header>
      )}

      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/projetos" element={
            <PrivateRoute>
              <Projetos />
            </PrivateRoute>
          } />
          
          <Route path="/squads" element={
            <PrivateRoute>
              <Squads />
            </PrivateRoute>
          } />
          
          <Route path="/atividades" element={
            <PrivateRoute>
              <Atividades />
            </PrivateRoute>
          } />
        </Routes>
      </main>

      <footer style={{textAlign: 'center', padding: '40px 20px', color: '#7f8c8d'}}>
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