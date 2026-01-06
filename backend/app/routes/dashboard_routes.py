from flask import Blueprint, request, jsonify
from datetime import datetime
from app.services.sqlserver_service import sqlserver_service

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


def parse_date(date_value):
    """
    Converte diferentes formatos de data para datetime object
    Suporta: ISO format, YYYY-MM-DD HH:MM:SS, DD/MM/YYYY, DD/MM/YYYY HH:MM:SS
    """
    if date_value is None:
        return datetime.min
    
    if isinstance(date_value, datetime):
        return date_value
    
    if isinstance(date_value, (int, float)):
        return datetime.min
    
    if isinstance(date_value, str):
        date_str = str(date_value).strip()
        
        if not date_str:
            return datetime.min
        
        # Tenta ISO format
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            pass
        
        # Tenta YYYY-MM-DD HH:MM:SS
        try:
            return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        except:
            pass
        
        # Tenta DD/MM/YYYY HH:MM:SS
        try:
            return datetime.strptime(date_str, '%d/%m/%Y %H:%M:%S')
        except:
            pass
        
        # Tenta DD/MM/YYYY
        try:
            return datetime.strptime(date_str, '%d/%m/%Y')
        except:
            pass
        
        return datetime.min
    
    return datetime.min


# ==================== ROTAS DE RECODIFICAÇÃO ====================

@bp.route('/recodificacao', methods=['GET'])
def get_recodificacao_data():
    """
    Retorna dados de recodificação (reserva) do SQL Server
    Query params opcionais:
    - cd_projeto: Filtrar por código do projeto
    """
    try:
        cd_projeto = request.args.get('cd_projeto')
        
        data = sqlserver_service.fetch_reserva_data(cd_projeto)
        
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


@bp.route('/recodificacao/historico/<cd_projeto>', methods=['GET'])
def get_recodificacao_historico(cd_projeto):
    """
    Retorna histórico completo de recodificação para um projeto específico
    (todas as datas de criação)
    """
    try:
        data = sqlserver_service.fetch_reserva_historico(cd_projeto)
        
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


@bp.route('/recodificacao/metricas/<cd_projeto>', methods=['GET'])
def get_recodificacao_metricas(cd_projeto):
    """
    Retorna métricas calculadas de recodificação para um projeto específico
    Agrupa por tipo de reserva com data mais recente
    """
    try:
        data = sqlserver_service.fetch_reserva_historico(cd_projeto)
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Nenhum dado encontrado para este projeto'
            }), 404
        
        # Agrupar por tipo de reserva mantendo apenas o registro mais recente
        # Usando tupla (item, datetime_obj) para separar dados de comparação
        metricas_por_tipo = {}
        
        for item in data:
            tp_reserva = item['TP_RESERVA']
            dt_criacao = parse_date(item['DT_CRIACAO'])
            
            # Se não existe ou a data é mais recente, atualizar
            if tp_reserva not in metricas_por_tipo or dt_criacao > metricas_por_tipo[tp_reserva][1]:
                metricas_por_tipo[tp_reserva] = (item, dt_criacao)
        
        # Processar os dados agrupados
        resultado = []
        for tp_reserva, (item, dt_criacao_obj) in metricas_por_tipo.items():
            # Processar QT_EFETIVO (pode ter barra "/")
            qt_efetivo_str = str(item['QT_EFETIVO']) if item['QT_EFETIVO'] else '0'
            
            if '/' in qt_efetivo_str:
                partes = qt_efetivo_str.split('/')
                qt_realizado = int(partes[0].strip()) if partes[0].strip().isdigit() else 0
                qt_indevido = int(partes[1].strip()) if len(partes) > 1 and partes[1].strip().isdigit() else 0
            else:
                qt_realizado = int(qt_efetivo_str) if qt_efetivo_str.isdigit() else 0
                qt_indevido = 0
            
            # Converter QT_PREVISTO para int
            qt_previsto_str = str(item['QT_PREVISTO']) if item['QT_PREVISTO'] else '0'
            qt_previsto = int(qt_previsto_str) if qt_previsto_str.isdigit() else 0
            
            # Calcular percentual de conclusão
            if qt_previsto > 0:
                if qt_realizado >= qt_previsto:
                    percentual = 100.0
                else:
                    percentual = round((qt_realizado / qt_previsto) * 100, 2)
            else:
                percentual = 0.0
            
            resultado.append({
                'tipo': tp_reserva,
                'dt_criacao': item['DT_CRIACAO'],
                'qt_previsto': qt_previsto,
                'qt_realizado': qt_realizado,
                'qt_indevido': qt_indevido,
                'percentual_conclusao': percentual
            })
        
        return jsonify({
            'success': True,
            'data': {
                'cd_projeto': cd_projeto,
                'metricas': resultado
            }
        }), 200
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


# ==================== ROTAS DE PARTICIPAÇÃO ====================

@bp.route('/participacao', methods=['GET'])
def get_participacao_data():
    """
    Retorna dados de participação do SQL Server
    Query params opcionais:
    - cd_projeto: Filtrar por código do projeto
    """
    try:
        cd_projeto = request.args.get('cd_projeto')

        data = sqlserver_service.fetch_participacao_data(cd_projeto)

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


@bp.route('/participacao/<cd_projeto>', methods=['GET'])
def get_participacao_by_projeto(cd_projeto):
    """
    Retorna dados de participação para um projeto específico
    Retorna o registro mais recente por projeto
    """
    try:
        import json

        data = sqlserver_service.fetch_participacao_data(cd_projeto)

        if not data:
            return jsonify({
                'success': False,
                'message': 'Nenhum dado encontrado para este projeto'
            }), 404

        # Pegar o registro mais recente (último registro por DT_REGISTRO)
        latest_record = max(data, key=lambda x: x.get('DT_REGISTRO', ''))

        # Parse do JSON DADO_PARTICIPACAO
        if latest_record.get('DADO_PARTICIPACAO'):
            dado_participacao = latest_record.get('DADO_PARTICIPACAO')

            # Log para debug
            print(f"Tipo de DADO_PARTICIPACAO: {type(dado_participacao)}")
            print(f"Conteúdo de DADO_PARTICIPACAO (primeiros 200 chars): {str(dado_participacao)[:200]}")

            # Se já for uma lista, manter como está
            if isinstance(dado_participacao, list):
                latest_record['DADO_PARTICIPACAO'] = dado_participacao
            # Se for string, fazer parse
            elif isinstance(dado_participacao, str):
                try:
                    # Limpar possíveis espaços e quebras de linha
                    dado_participacao_limpo = dado_participacao.strip()
                    latest_record['DADO_PARTICIPACAO'] = json.loads(dado_participacao_limpo)
                    print(f"Parse JSON bem-sucedido! {len(latest_record['DADO_PARTICIPACAO'])} itens")
                except json.JSONDecodeError as e:
                    print(f"Erro ao fazer parse do JSON: {str(e)}")
                    print(f"Conteúdo que causou erro: {dado_participacao}")
                    latest_record['DADO_PARTICIPACAO'] = []
            else:
                print(f"Tipo inesperado para DADO_PARTICIPACAO: {type(dado_participacao)}")
                latest_record['DADO_PARTICIPACAO'] = []
        else:
            print("DADO_PARTICIPACAO está vazio ou None")
            latest_record['DADO_PARTICIPACAO'] = []

        print(f"Dados finais a serem retornados: {len(latest_record.get('DADO_PARTICIPACAO', []))} itens")

        return jsonify({
            'success': True,
            'data': latest_record
        }), 200

    except Exception as e:
        import traceback
        print(f"Erro no endpoint de participação: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500