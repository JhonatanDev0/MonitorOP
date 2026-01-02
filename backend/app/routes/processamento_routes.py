from flask import Blueprint, request, jsonify
import os
import pyodbc

bp = Blueprint('processamento', __name__, url_prefix='/api/processamento')

@bp.route('/metricas/<cd_projeto>', methods=['GET'])
def buscar_metricas(cd_projeto):
    """Busca as métricas de Processamento de um projeto específico"""
    try:
        # Configuração do SQL Server
        SQLSERVER_HOST = os.environ.get('SQLSERVER_HOST_PRIMARY', '192.168.250.8,61433')
        SQLSERVER_DATABASE = os.environ.get('SQLSERVER_DATABASE', 'DB_MONITORAMENTO_OP')
        SQLSERVER_USER = os.environ.get('SQLSERVER_USER', 'SDV')
        SQLSERVER_PASSWORD = os.environ.get('SQLSERVER_PASSWORD', 'SDV_COA')
        SQLSERVER_DRIVER = os.environ.get('SQLSERVER_DRIVER', '{ODBC Driver 17 for SQL Server}')

        # Conectar ao SQL Server
        conn_str = (
            f'DRIVER={SQLSERVER_DRIVER};'
            f'SERVER={SQLSERVER_HOST};'
            f'DATABASE={SQLSERVER_DATABASE};'
            f'UID={SQLSERVER_USER};'
            f'PWD={SQLSERVER_PASSWORD}'
        )

        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        # Buscar dados da TMP_PROCESSAMENTO
        query = """
            SELECT
                CD_PROJETO,
                DT_EXPORTACAO,
                QT_REGISTROS_PREVISTOS,
                QT_REGISTROS_DIGITALIZADOS,
                PCT_REGISTROS_DIGITALIZADOS,
                QT_REGISTROS_DECODIFICADOS,
                QT_REGISTROS_PROCESSADOS,
                PCT_REGISTROS_PROCESSADOS,
                QT_REGISTROS_NAO_PROCESSADOS
            FROM TMP_PROCESSAMENTO
            WHERE CD_PROJETO = ?
        """

        cursor.execute(query, (cd_projeto,))
        row = cursor.fetchone()

        cursor.close()
        conn.close()

        if not row:
            return jsonify({
                'success': False,
                'message': 'Nenhum dado encontrado para este projeto'
            }), 404

        # Formatar data de exportação
        dt_exportacao = None
        if row.DT_EXPORTACAO:
            try:
                dt_exportacao = row.DT_EXPORTACAO.strftime('%d/%m/%Y às %H:%M')
            except:
                dt_exportacao = str(row.DT_EXPORTACAO)

        # Montar resposta
        metricas = {
            'CD_PROJETO': row.CD_PROJETO,
            'DT_EXPORTACAO': dt_exportacao,
            'QT_REGISTROS_PREVISTOS': row.QT_REGISTROS_PREVISTOS or 0,
            'QT_REGISTROS_DIGITALIZADOS': row.QT_REGISTROS_DIGITALIZADOS or 0,
            'PCT_REGISTROS_DIGITALIZADOS': row.PCT_REGISTROS_DIGITALIZADOS or '0%',
            'QT_REGISTROS_DECODIFICADOS': row.QT_REGISTROS_DECODIFICADOS or 0,
            'QT_REGISTROS_PROCESSADOS': row.QT_REGISTROS_PROCESSADOS or 0,
            'PCT_REGISTROS_PROCESSADOS': row.PCT_REGISTROS_PROCESSADOS or '0%',
            'QT_REGISTROS_NAO_PROCESSADOS': row.QT_REGISTROS_NAO_PROCESSADOS or 0
        }

        return jsonify({
            'success': True,
            'metricas': metricas
        }), 200

    except pyodbc.Error as e:
        print(f"Erro de banco de dados ao buscar métricas de Processamento: {str(e)}")
        return jsonify({
            'success': False,
            'erro': 'Erro ao conectar ao banco de dados',
            'detalhes': str(e)
        }), 500
    except Exception as e:
        print(f"Erro ao buscar métricas de Processamento: {str(e)}")
        return jsonify({
            'success': False,
            'erro': str(e)
        }), 500
