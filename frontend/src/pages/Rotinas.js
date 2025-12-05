import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCog, 
  faPlay, 
  faStop, 
  faSync, 
  faCheckCircle, 
  faExclamationCircle,
  faSpinner,
  faClock,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

function Rotinas() {
  const { canEdit } = useAuth();
  const [executando, setExecutando] = useState(null);

  // Lista de rotinas disponíveis
  const rotinas = [
    {
      id: 1,
      nome: 'Atualizar Indicadores de Produtividade',
      descricao: 'Calcula e atualiza os indicadores de produtividade de todas as equipes',
      icone: faChartLine,
      cor: '#3498db',
      status: 'idle' // idle, running, success, error
    },
    {
      id: 2,
      nome: 'Processar Dados de Atividades',
      descricao: 'Processa e consolida os dados de atividades para o dashboard',
      icone: faSync,
      cor: '#2ecc71',
      status: 'idle'
    },
    {
      id: 3,
      nome: 'Gerar Relatórios Mensais',
      descricao: 'Gera os relatórios mensais de desempenho por projeto e squad',
      icone: faClock,
      cor: '#e67e22',
      status: 'idle'
    }
  ];

  const [listaRotinas, setListaRotinas] = useState(rotinas);

  const executarRotina = async (rotinaId) => {
    if (!canEdit()) {
      toast.error('Você não tem permissão para executar rotinas');
      return;
    }

    setExecutando(rotinaId);
    
    // Atualizar status para "running"
    setListaRotinas(prev => prev.map(r => 
      r.id === rotinaId ? { ...r, status: 'running' } : r
    ));

    try {
      // TODO: Aqui será implementada a chamada real para o backend
      // await rotinaService.executar(rotinaId);
      
      // Simulação de execução (remover depois)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Atualizar status para "success"
      setListaRotinas(prev => prev.map(r => 
        r.id === rotinaId ? { ...r, status: 'success' } : r
      ));

      toast.success('Rotina executada com sucesso!');
    } catch (error) {
      console.error('Erro ao executar rotina:', error);
      
      // Atualizar status para "error"
      setListaRotinas(prev => prev.map(r => 
        r.id === rotinaId ? { ...r, status: 'error' } : r
      ));

      toast.error('Erro ao executar rotina: ' + (error.response?.data?.error || error.message));
    } finally {
      setExecutando(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      idle: { text: 'Aguardando', icon: faClock, color: '#95a5a6' },
      running: { text: 'Executando...', icon: faSpinner, color: '#3498db' },
      success: { text: 'Concluído', icon: faCheckCircle, color: '#2ecc71' },
      error: { text: 'Erro', icon: faExclamationCircle, color: '#e74c3c' }
    };

    const badge = badges[status] || badges.idle;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 600,
        background: badge.color,
        color: 'white'
      }}>
        <FontAwesomeIcon 
          icon={badge.icon} 
          spin={status === 'running'}
        />
        {badge.text}
      </span>
    );
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FontAwesomeIcon icon={faCog} /> Rotinas Automatizadas
          </h2>
        </div>

        <div style={{padding: '20px'}}>
          <div style={{
            background: '#ecf0f1',
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FontAwesomeIcon icon={faCog} style={{fontSize: '24px', color: '#7f8c8d'}} />
            <div>
              <strong style={{display: 'block', marginBottom: '5px', color: '#2c3e50'}}>
                Painel de Controle de Rotinas
              </strong>
              <span style={{color: '#7f8c8d', fontSize: '14px'}}>
                Execute scripts automatizados para atualizar os indicadores e relatórios do dashboard
              </span>
            </div>
          </div>

          {!canEdit() && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#856404'
            }}>
              <FontAwesomeIcon icon={faExclamationCircle} /> 
              {' '}Você não tem permissão para executar rotinas. Apenas Gestores e Administradores podem executar.
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
            marginTop: '20px'
          }}>
            {listaRotinas.map(rotina => (
              <div
                key={rotina.id}
                style={{
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'white',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  cursor: executando === rotina.id ? 'not-allowed' : 'default'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    background: `${rotina.cor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FontAwesomeIcon 
                      icon={rotina.icone} 
                      style={{fontSize: '24px', color: rotina.cor}}
                    />
                  </div>

                  <div style={{flex: 1}}>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>
                      {rotina.nome}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#7f8c8d',
                      lineHeight: '1.5'
                    }}>
                      {rotina.descricao}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '15px',
                  borderTop: '1px solid #e9ecef'
                }}>
                  {getStatusBadge(rotina.status)}

                  <button
                    className="btn btn-primary"
                    onClick={() => executarRotina(rotina.id)}
                    disabled={!canEdit() || executando !== null}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: (!canEdit() || executando !== null) ? 0.5 : 1,
                      cursor: (!canEdit() || executando !== null) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <FontAwesomeIcon icon={executando === rotina.id ? faSpinner : faPlay} spin={executando === rotina.id} />
                    {executando === rotina.id ? 'Executando...' : 'Executar'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {listaRotinas.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#95a5a6'
            }}>
              <FontAwesomeIcon icon={faCog} style={{fontSize: '48px', marginBottom: '15px'}} />
              <h3 style={{fontSize: '20px', marginBottom: '8px', color: '#7f8c8d'}}>
                Nenhuma rotina disponível
              </h3>
              <p style={{fontSize: '14px'}}>
                As rotinas automatizadas aparecerão aqui quando forem configuradas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Rotinas;