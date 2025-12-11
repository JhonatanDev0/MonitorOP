"""
Rotas para execução de rotinas de Recodificação com sistema de jobs em background
"""
from flask import Blueprint, request, jsonify
import pyodbc
import os
from datetime import datetime
import threading
import uuid
import json

bp = Blueprint('recodificacao', __name__, url_prefix='/api/recodificacao')

# Configurações do SQL Server
SQLSERVER_HOST = os.environ.get('SQLSERVER_HOST_PRIMARY', '192.168.250.8,61433')
SQLSERVER_DATABASE = os.environ.get('SQLSERVER_DATABASE', 'DB_MONITORAMENTO_OP')
SQLSERVER_USER = os.environ.get('SQLSERVER_USER', 'SDV')
SQLSERVER_PASSWORD = os.environ.get('SQLSERVER_PASSWORD', 'SDV_COA')
SQLSERVER_DRIVER = os.environ.get('SQLSERVER_DRIVER', '{ODBC Driver 17 for SQL Server}')

# Caminho do arquivo de persistência
JOBS_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'jobs_recodificacao.json')

# Armazenamento em memória dos jobs
# Chave: job_id (baseado em projeto_id)
# Valor: dict com informações do job
jobs_storage = {}


def carregar_jobs():
    """Carrega os jobs do arquivo JSON"""
    global jobs_storage
    try:
        # Criar diretório se não existir
        os.makedirs(os.path.dirname(JOBS_FILE_PATH), exist_ok=True)

        if os.path.exists(JOBS_FILE_PATH):
            with open(JOBS_FILE_PATH, 'r', encoding='utf-8') as f:
                jobs_storage = json.load(f)
            print(f"[{datetime.now()}] Jobs carregados do arquivo: {len(jobs_storage)} jobs")
        else:
            jobs_storage = {}
            print(f"[{datetime.now()}] Nenhum arquivo de jobs encontrado, iniciando vazio")
    except Exception as e:
        print(f"[{datetime.now()}] Erro ao carregar jobs: {str(e)}")
        jobs_storage = {}


def salvar_jobs():
    """Salva os jobs no arquivo JSON"""
    try:
        # Criar diretório se não existir
        os.makedirs(os.path.dirname(JOBS_FILE_PATH), exist_ok=True)

        with open(JOBS_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(jobs_storage, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[{datetime.now()}] Erro ao salvar jobs: {str(e)}")


# Carregar jobs ao inicializar o módulo
carregar_jobs()


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


def adicionar_log(job_id, tipo, mensagem):
    """Adiciona um log ao job"""
    if job_id in jobs_storage:
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'tipo': tipo,  # 'info', 'success', 'warning', 'error'
            'mensagem': mensagem
        }
        jobs_storage[job_id]['logs'].append(log_entry)
        print(f"[{log_entry['timestamp']}] [{tipo.upper()}] {mensagem}")
        salvar_jobs()  # Persistir após adicionar log


def executar_rotina_background(job_id, usuario, cd_projeto):
    """Executa a rotina em background (thread separada)"""
    try:
        adicionar_log(job_id, 'info', f'Usuário {usuario} iniciou a execução')
        adicionar_log(job_id, 'info', f'Conectando ao SQL Server {SQLSERVER_HOST}...')

        # Conectar ao SQL Server
        conn = get_connection()
        cursor = conn.cursor()

        adicionar_log(job_id, 'success', 'Conexão estabelecida com sucesso')
        adicionar_log(job_id, 'info', f'Executando procedure para o projeto {cd_projeto}...')

        # Executar a stored procedure
        query = "EXEC DB_MONITORAMENTO_OP.dbo.sp_ExecutarMonitoramentoRecodificacao @CD_PROJETO = ?"
        cursor.execute(query, (cd_projeto,))

        adicionar_log(job_id, 'info', 'Procedure executada, processando commit...')

        # Commit da transação
        conn.commit()

        adicionar_log(job_id, 'success', 'Commit realizado com sucesso')
        adicionar_log(job_id, 'success', f'Rotina finalizada com sucesso para o projeto {cd_projeto}')

        # Fechar conexão
        cursor.close()
        conn.close()

        # Atualizar status do job
        jobs_storage[job_id]['status'] = 'concluido'
        jobs_storage[job_id]['data_fim'] = datetime.now().isoformat()
        salvar_jobs()  # Persistir após conclusão

    except pyodbc.Error as db_error:
        error_msg = str(db_error)
        adicionar_log(job_id, 'error', f'Erro no banco de dados: {error_msg}')
        jobs_storage[job_id]['status'] = 'erro'
        jobs_storage[job_id]['erro'] = error_msg
        jobs_storage[job_id]['data_fim'] = datetime.now().isoformat()
        salvar_jobs()  # Persistir após erro

    except Exception as e:
        error_msg = str(e)
        adicionar_log(job_id, 'error', f'Erro ao executar rotina: {error_msg}')
        jobs_storage[job_id]['status'] = 'erro'
        jobs_storage[job_id]['erro'] = error_msg
        jobs_storage[job_id]['data_fim'] = datetime.now().isoformat()
        salvar_jobs()  # Persistir após erro


@bp.route('/executar', methods=['POST'])
def executar_rotina():
    """
    Inicia a execução da rotina de monitoramento de recodificação em background

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

        # Criar job_id baseado no projeto
        job_id = f'recodificacao_projeto_{projeto_id}'

        # Verificar se já existe um job em andamento para este projeto
        if job_id in jobs_storage and jobs_storage[job_id]['status'] == 'em_andamento':
            return jsonify({
                'success': False,
                'erro': 'Já existe uma execução em andamento para este projeto',
                'job_id': job_id,
                'status': jobs_storage[job_id]['status']
            }), 409

        # Criar novo job
        jobs_storage[job_id] = {
            'job_id': job_id,
            'projeto_id': projeto_id,
            'cd_projeto': cd_projeto,
            'usuario': usuario,
            'status': 'em_andamento',
            'data_inicio': datetime.now().isoformat(),
            'data_fim': None,
            'logs': [],
            'erro': None
        }
        salvar_jobs()  # Persistir após criar job

        # Iniciar thread de execução
        thread = threading.Thread(
            target=executar_rotina_background,
            args=(job_id, usuario, cd_projeto),
            daemon=True
        )
        thread.start()

        return jsonify({
            'success': True,
            'mensagem': f'Rotina iniciada em background para o projeto {cd_projeto}',
            'job_id': job_id,
            'status': 'em_andamento'
        }), 200

    except Exception as e:
        error_msg = str(e)
        print(f"[{datetime.now()}] Erro ao iniciar rotina: {error_msg}")
        return jsonify({
            'success': False,
            'erro': f'Erro ao iniciar rotina: {error_msg}'
        }), 500


@bp.route('/job/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """
    Retorna o status e logs de um job específico
    """
    if job_id not in jobs_storage:
        return jsonify({
            'success': False,
            'erro': 'Job não encontrado'
        }), 404

    job = jobs_storage[job_id]

    return jsonify({
        'success': True,
        'job': job
    }), 200


@bp.route('/job/projeto/<projeto_id>', methods=['GET'])
def get_job_by_projeto(projeto_id):
    """
    Retorna o status e logs do job de um projeto específico
    """
    job_id = f'recodificacao_projeto_{projeto_id}'

    if job_id not in jobs_storage:
        return jsonify({
            'success': False,
            'erro': 'Nenhuma execução encontrada para este projeto',
            'job_id': job_id
        }), 404

    job = jobs_storage[job_id]

    return jsonify({
        'success': True,
        'job': job
    }), 200


@bp.route('/jobs', methods=['GET'])
def get_all_jobs():
    """
    Retorna todos os jobs armazenados
    """
    return jsonify({
        'success': True,
        'jobs': list(jobs_storage.values()),
        'total': len(jobs_storage)
    }), 200


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
