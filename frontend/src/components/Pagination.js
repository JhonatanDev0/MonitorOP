import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';
import '../styles/Pagination.css';

function Pagination({ pagination, onPageChange }) {
  // ⚠️ FIX: Sempre mostrar paginação se houver dados (mesmo que caiba em 1 página)
  // Isso ajuda o usuário a ter controle sobre quantos itens ver
  if (!pagination || pagination.total === 0) {
    return null;
  }

  const { page, pages, has_prev, has_next, total, per_page } = pagination;

  // Calcular range de itens
  const startItem = (page - 1) * per_page + 1;
  const endItem = Math.min(page * per_page, total);

  // Gerar números de páginas para exibir
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (pages <= maxPagesToShow) {
      // Mostrar todas as páginas se houver poucas
      for (let i = 1; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Lógica para mostrar páginas com reticências
      if (page <= 3) {
        // Início: 1 2 3 4 ... último
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(pages);
      } else if (page >= pages - 2) {
        // Fim: 1 ... antepenúltimo penúltimo último
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = pages - 3; i <= pages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Meio: 1 ... página-1 página página+1 ... último
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(page - 1);
        pageNumbers.push(page);
        pageNumbers.push(page + 1);
        pageNumbers.push('...');
        pageNumbers.push(pages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Mostrando <strong>{startItem}</strong> a <strong>{endItem}</strong> de <strong>{total}</strong> resultados
      </div>

      <div className="pagination-controls">
        {/* Primeira página */}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={!has_prev}
          title="Primeira página"
        >
          <FontAwesomeIcon icon={faAnglesLeft} />
        </button>

        {/* Página anterior */}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={!has_prev}
          title="Página anterior"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        {/* Números das páginas */}
        {getPageNumbers().map((pageNum, index) => (
          pageNum === '...' ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          )
        ))}

        {/* Próxima página */}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={!has_next}
          title="Próxima página"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>

        {/* Última página */}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(pages)}
          disabled={!has_next}
          title="Última página"
        >
          <FontAwesomeIcon icon={faAnglesRight} />
        </button>
      </div>

      {/* Seletor de itens por página */}
      <div className="pagination-per-page">
        <label>
          Itens por página:
          <select
            value={per_page}
            onChange={(e) => onPageChange(1, parseInt(e.target.value))}
            className="pagination-select"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default Pagination;