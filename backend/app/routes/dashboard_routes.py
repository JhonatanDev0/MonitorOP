from flask import Blueprint, request, jsonify
from app.services.sqlserver_service import sqlserver_service

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@bp.route('/auditoria', methods=['GET'])
def get_auditoria_data():
    """
    Retorna dados de auditoria do SQL Server
    Query params opcionais:
    - cd_projeto: Filtrar por código do projeto
    """
    try:
        cd_projeto = request.args.get('cd_projeto')
        
        data = sqlserver_service.fetch_auditoria_data(cd_projeto)
        
        return jsonify({
            'success': True,
            'data': data,
            'count': len(data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/auditoria/historico/<cd_projeto>', methods=['GET'])
def get_auditoria_historico(cd_projeto):
    """
    Retorna histórico completo de auditoria para um projeto específico
    (todas as datas de exportação)
    """
    try:
        data = sqlserver_service.fetch_auditoria_historico(cd_projeto)
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Nenhum dado encontrado para este projeto'
            }), 404
        
        return jsonify({
            'success': True,
            'data': data,
            'count': len(data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/auditoria/resumo', methods=['GET'])
def get_auditoria_resumo():
    """
    Retorna resumo consolidado dos dados de auditoria
    Agrupa por projeto com a última data de exportação
    """
    try:
        data = sqlserver_service.fetch_auditoria_data()
        
        # Agrupar por projeto e pegar a última exportação
        resumo = {}
        for item in data:
            cd_projeto = item['CD_PROJETO']
            dt_exportacao = item['DT_EXPORTACAO']
            
            # Se não existe ou a data é mais recente, atualizar
            if cd_projeto not in resumo or dt_exportacao > resumo[cd_projeto]['DT_EXPORTACAO']:
                resumo[cd_projeto] = item
        
        # Converter para lista
        resultado = list(resumo.values())
        
        return jsonify({
            'success': True,
            'data': resultado,
            'count': len(resultado)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/auditoria/metricas/<cd_projeto>', methods=['GET'])
def get_auditoria_metricas(cd_projeto):
    """
    Retorna métricas calculadas para um projeto específico
    """
    try:
        data = sqlserver_service.fetch_auditoria_data(cd_projeto)
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Nenhum dado encontrado para este projeto'
            }), 404
        
        # Pegar o registro mais recente
        registro_atual = max(data, key=lambda x: x['DT_EXPORTACAO'])
        
        # Calcular métricas
        metricas = {
            'cd_projeto': registro_atual['CD_PROJETO'],
            'dt_exportacao': registro_atual['DT_EXPORTACAO'],
            'pacotes': {
                'metrica': registro_atual['QT_PACOTE_METRICA'],
                'previsto_transcricao': registro_atual['QT_PACOTE_PREVISTO_TRANSCRICAO'],
                'transcricao': registro_atual['QT_PACOTE_TRANSCRICAO'],
                'percentual_transcricao': registro_atual['PCT_PACOTE_TRANSCRICAO']
            },
            'progresso': {
                'transcricao_realizado': registro_atual['QT_PACOTE_TRANSCRICAO'],
                'transcricao_previsto': registro_atual['QT_PACOTE_PREVISTO_TRANSCRICAO'],
                'transcricao_pendente': registro_atual['QT_PACOTE_PREVISTO_TRANSCRICAO'] - registro_atual['QT_PACOTE_TRANSCRICAO']
            }
        }
        
        return jsonify({
            'success': True,
            'data': metricas
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500