import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChartLine, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import '../styles/NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <div className="notfound-icon">
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </div>
        
        <div className="notfound-code">404</div>
        
        <h1 className="notfound-title">Página Não Encontrada</h1>
        
        <p className="notfound-message">
          Desculpe, a página que você está procurando não existe.
        </p>

        <div className="notfound-illustration">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="#e9ecef" />
            <text x="100" y="120" fontSize="80" textAnchor="middle" fill="#95a5a6">?</text>
          </svg>
        </div>

        <div className="notfound-actions">
          <button 
            className="btn btn-primary btn-large" 
            onClick={() => navigate('/')}
          >
            <FontAwesomeIcon icon={faHome} style={{ marginRight: '10px' }} />
            Voltar ao Início
          </button>
          
          <button 
            className="btn btn-secondary btn-large" 
            onClick={() => navigate(-1)}
          >
            <FontAwesomeIcon icon={faChartLine} style={{ marginRight: '10px' }} />
            Página Anterior
          </button>
        </div>

        <div className="notfound-help">
          <p>Se você acredita que isso é um erro, entre em contato com o suporte.</p>
        </div>
      </div>
    </div>
  );
}

export default NotFound;