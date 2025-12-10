"""
Rotas para execução de rotinas de Recodificação
"""
from flask import Blueprint, request, jsonify
import pyodbc
import os
from datetime import datetime

bp = Blueprint('recodificacao', __name__, url_prefix='/api/recodificacao')

# Configurações do SQL Server
SQLSERVER_HOST = os.environ.get('SQLSERVER_HOST_PRIMARY', '192.168.250.8,61433')
SQLSERVER_DATABASE = os.environ.get('SQLSERVER_DATABASE', 'DB_MONITORAMENTO_OP')
SQLSERVER_USER = os.environ.get('SQLSERVER_USER', 'SDV')
SQLSERVER_PASSWORD = os.environ.get('SQLSERVER_PASSWORD', 'SDV_COA')
SQLSERVER_DRIVER = os.environ.get('SQLSERVER_DRIVER', '{ODBC Driver 17 for SQL Server}')


def get_connection():
    """Retorna uma conexão com o SQL Server"""
    try:
        conn_str = (
            f'DRIVER={SQLSERVER_DRIVER};'
            f'SERVER={SQLSERVER_HOST};'
            f'DATABASE={SQLSERVER_DATABASE};'
            f'UID={SQLSERVER_USER};'
            f'PWD={SQLSERVER_PASSWORD}'
        )
        return pyodbc.connect(conn_str, timeout=30)
    except Exception as e:
        print(f"Erro ao conectar no SQL Server: {str(e)}")
        raise


@bp.route('/executar', methods=['POST'])
def executar_rotina():
    """
    Executa a rotina de monitoramento de recodificação

    Payload esperado:
    {
        "usuario": "nome_usuario",
        "squad_id": "2",
        "projeto_id": "1",
        "cd_projeto": "2075"
    }
    """
    try:
        data = request.get_json()

        # Validar dados recebidos
        usuario = data.get('usuario')
        squad_id = data.get('squad_id')
        projeto_id = data.get('projeto_id')
        cd_projeto = data.get('cd_projeto')

        if not all([usuario, squad_id, projeto_id, cd_projeto]):
            return jsonify({
                'success': False,
                'erro': 'Dados incompletos. Forneça usuario, squad_id, projeto_id e cd_projeto'
            }), 400

        # Conectar ao SQL Server
        conn = get_connection()
        cursor = conn.cursor()

        # Executar a stored procedure
        query = "EXEC DB_MONITORAMENTO_OP.dbo.sp_ExecutarMonitoramentoRecodificacao @CD_PROJETO = ?"

        # Log de execução
        print(f"[{datetime.now()}] Executando rotina de Recodificação")
        print(f"  Usuário: {usuario}")
        print(f"  Projeto: {cd_projeto}")
        print(f"  Query: {query}")

        cursor.execute(query, (cd_projeto,))

        # Commit da transação
        conn.commit()

        # Fechar conexão
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'mensagem': f'Rotina de Recodificação executada com sucesso para o projeto {cd_projeto}',
            'timestamp': datetime.now().isoformat()
        }), 200

    except pyodbc.Error as db_error:
        error_msg = str(db_error)
        print(f"[{datetime.now()}] Erro no banco de dados: {error_msg}")
        return jsonify({
            'success': False,
            'erro': f'Erro ao executar procedure: {error_msg}'
        }), 500

    except Exception as e:
        error_msg = str(e)
        print(f"[{datetime.now()}] Erro geral: {error_msg}")
        return jsonify({
            'success': False,
            'erro': f'Erro ao executar rotina: {error_msg}'
        }), 500


@bp.route('/status', methods=['GET'])
def get_status():
    """
    Retorna o status da conexão com o SQL Server
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'status': 'Conexão OK',
            'servidor': SQLSERVER_HOST,
            'database': SQLSERVER_DATABASE
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'Erro de conexão',
            'erro': str(e)
        }), 500
