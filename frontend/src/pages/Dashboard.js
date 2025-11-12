import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faUsers, faListCheck } from '@fortawesome/free-solid-svg-icons';
import { atividadeService, projetoService, squadService } from '../services/api';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { isAdmin } = useAuth();
  const [estatisticas, setEstatisticas] = useState(null);
  const [resumo, setResumo] = useState({ projetos: 0, squads: 0, atividades: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [statsRes, projetosRes, squadsRes] = await Promise.all([
        atividadeService.estatisticas(),
        projetoService.listar(),
        squadService.listar()
      ]);

      setEstatisticas(statsRes.data);
      setResumo({
        projetos: projetosRes.data.length,
        squads: squadsRes.data.length,
        atividades: statsRes.data.total
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Dashboard - Visão Geral</h2>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total de Avaliações</div>
            <div className="stat-value">{resumo.projetos}</div>
            <Link to="/projetos" className="btn btn-primary btn-small">
              <FontAwesomeIcon icon={faClipboardList} /> Ver Avaliações
            </Link>
          </div>

          <div className="stat-card">
            <div className="stat-label">Total de Squads</div>
            <div className="stat-value">{resumo.squads}</div>
              <Link to="/squads" className="btn btn-primary btn-small">
                <FontAwesomeIcon icon={faUsers} /> Ver Squads
              </Link>
          </div>

          <div className="stat-card">
            <div className="stat-label">Total de Atividades</div>
            <div className="stat-value">{resumo.atividades}</div>
              <Link to="/atividades" className="btn btn-primary btn-small">
                <FontAwesomeIcon icon={faListCheck} /> Ver Atividades
              </Link>
          </div>
        </div>
      </div>

      {estatisticas && (
        <>
          <div className="card">
            <h3 className="card-title">Atividades por Status</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Pendentes</div>
                <div className="stat-value" style={{color: '#d63031'}}>
                  {estatisticas.por_status.pendente}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Em Andamento</div>
                <div className="stat-value" style={{color: '#0984e3'}}>
                  {estatisticas.por_status.em_andamento}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Concluídas</div>
                <div className="stat-value" style={{color: '#00b894'}}>
                  {estatisticas.por_status.concluida}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Atividades por Prioridade</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Baixa</div>
                <div className="stat-value" style={{color: '#636e72'}}>
                  {estatisticas.por_prioridade.baixa}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Média</div>
                <div className="stat-value" style={{color: '#fdcb6e'}}>
                  {estatisticas.por_prioridade.media}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Alta</div>
                <div className="stat-value" style={{color: '#e17055'}}>
                  {estatisticas.por_prioridade.alta}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
