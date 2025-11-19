import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faHome, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import '../styles/NotFound.css';

function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className={isAuthenticated() ? 'notfound-container notfound-authenticated' : 'notfound-container'}>
      {/* Logo no canto superior esquerdo */}
      <div className="notfound-logo-overlay">
        <img src="/logo.png" alt="Logo" className="notfound-logo-corner" />
      </div>

      {/* Main Content - Fullscreen */}
      <div className="notfound-content">
        <div className="notfound-left">
          <div className="notfound-text-section">
            <div className="notfound-code">404</div>
            <h1 className="notfound-title">Página Não Encontrada</h1>
            <p className="notfound-message">
              Desculpe, a página que você está procurando não existe ou foi movida.
            </p>
            
            <div className="notfound-actions">
              <button 
                className="btn btn-notfound btn-primary" 
                onClick={() => navigate('/')}
              >
                <FontAwesomeIcon icon={faHome} />
                Dashboard
              </button>
              
              <button 
                className="btn btn-notfound btn-secondary" 
                onClick={() => navigate(-1)}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Voltar
              </button>
            </div>
          </div>
        </div>

        <div className="notfound-right">
          <div className="notfound-graphic">
            <FontAwesomeIcon icon={faTriangleExclamation} className="error-icon" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;