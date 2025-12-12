import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheck,
  faCheckDouble,
  faTimes,
  faExclamationTriangle,
  faInfoCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/NotificationBell.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.6.31:5000/api';

const NotificationBell = () => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregar notificações periodicamente
  useEffect(() => {
    carregarNotificacoes();

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      carregarNotificacoes(true); // true = silencioso (não mostrar loading)
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const carregarNotificacoes = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/notificacoes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotificacoes(response.data.notificacoes);
      setTotalNaoLidas(response.data.total_nao_lidas);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const marcarComoLida = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/notificacoes/${id}/marcar-lida`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await carregarNotificacoes(true);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const marcarTodasLidas = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/notificacoes/marcar-todas-lidas`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await carregarNotificacoes(true);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deletarNotificacao = async (id, event) => {
    event.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/notificacoes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await carregarNotificacoes(true);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const handleNotificacaoClick = async (notificacao) => {
    // Marcar como lida se não estiver
    if (!notificacao.lida) {
      await marcarComoLida(notificacao.id);
    }

    // Navegar para o link se existir
    if (notificacao.link) {
      navigate(notificacao.link);
      setDropdownAberto(false);
    }
  };

  const getPrioridadeIcon = (prioridade) => {
    switch (prioridade) {
      case 'critico':
        return faExclamationCircle;
      case 'aviso':
        return faExclamationTriangle;
      default:
        return faInfoCircle;
    }
  };

  const getPrioridadeCor = (prioridade) => {
    switch (prioridade) {
      case 'critico':
        return '#e74c3c';
      case 'aviso':
        return '#f39c12';
      default:
        return '#3498db';
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    const agora = new Date();
    const diff = Math.floor((agora - data) / 1000); // diferença em segundos

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;

    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setDropdownAberto(!dropdownAberto)}
      >
        <FontAwesomeIcon icon={faBell} />
        {totalNaoLidas > 0 && (
          <span className="notification-badge">{totalNaoLidas > 99 ? '99+' : totalNaoLidas}</span>
        )}
      </button>

      {dropdownAberto && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notificações</h4>
            {totalNaoLidas > 0 && (
              <button
                className="btn-marcar-todas"
                onClick={marcarTodasLidas}
                title="Marcar todas como lidas"
              >
                <FontAwesomeIcon icon={faCheckDouble} />
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Carregando...</div>
            ) : notificacoes.length === 0 ? (
              <div className="notification-empty">
                <FontAwesomeIcon icon={faBell} style={{ fontSize: '40px', opacity: 0.3, marginBottom: '10px' }} />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className={`notification-item ${!notificacao.lida ? 'nao-lida' : ''}`}
                  onClick={() => handleNotificacaoClick(notificacao)}
                >
                  <div className="notification-icon" style={{ color: getPrioridadeCor(notificacao.prioridade) }}>
                    <FontAwesomeIcon icon={getPrioridadeIcon(notificacao.prioridade)} />
                  </div>

                  <div className="notification-content">
                    <div className="notification-titulo">{notificacao.titulo}</div>
                    <div className="notification-mensagem">{notificacao.mensagem}</div>
                    <div className="notification-data">{formatarData(notificacao.data_criacao)}</div>
                  </div>

                  <div className="notification-actions">
                    {!notificacao.lida && (
                      <button
                        className="btn-marcar-lida"
                        onClick={(e) => {
                          e.stopPropagation();
                          marcarComoLida(notificacao.id);
                        }}
                        title="Marcar como lida"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    )}
                    <button
                      className="btn-deletar"
                      onClick={(e) => deletarNotificacao(notificacao.id, e)}
                      title="Deletar"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
