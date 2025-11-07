import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Projetos from './pages/Projetos';
import Squads from './pages/Squads';
import Atividades from './pages/Atividades';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="container">
            <h1>Monitoramento de Atividades da Ordem de Produção</h1>
            <nav className="nav">
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? 'active' : ''}
                end
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/projetos" 
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                Projetos
              </NavLink>
              <NavLink 
                to="/squads" 
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                Squads
              </NavLink>
              <NavLink 
                to="/atividades" 
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                Atividades
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="container" style={{marginTop: '30px'}}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/squads" element={<Squads />} />
            <Route path="/atividades" element={<Atividades />} />
          </Routes>
        </main>

        <footer style={{textAlign: 'center', padding: '40px 20px', color: '#7f8c8d'}}>
          <p>Desenvolvido pela Squad Ordem de Produção</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
