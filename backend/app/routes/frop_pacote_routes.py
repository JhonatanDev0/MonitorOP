from flask import Blueprint, request, jsonify
import threading
import json
import os
from datetime import datetime
import pandas as pd
import sqlalchemy as sa
import pyodbc
import urllib

bp = Blueprint('frop_pacote', __name__, url_prefix='/api/frop-pacote')

# Arquivo para persistir jobs
JOBS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'jobs_frop_pacote.json')

def carregar_jobs():
    """Carrega jobs do arquivo JSON"""
    if os.path.exists(JOBS_FILE):
        with open(JOBS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def salvar_jobs(jobs):
    """Salva jobs no arquivo JSON"""
    os.makedirs(os.path.dirname(JOBS_FILE), exist_ok=True)
    with open(JOBS_FILE, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)

def atualizar_job(projeto_id, status, progresso, logs):
    """Atualiza o status de um job"""
    jobs = carregar_jobs()

    if str(projeto_id) not in jobs:
        jobs[str(projeto_id)] = {
            'status': status,
            'progresso': progresso,
            'logs': logs,
            'inicio': datetime.now().isoformat(),
            'fim': None
        }
    else:
        jobs[str(projeto_id)]['status'] = status
        jobs[str(projeto_id)]['progresso'] = progresso
        jobs[str(projeto_id)]['logs'] = logs

        if status in ['concluido', 'erro']:
            jobs[str(projeto_id)]['fim'] = datetime.now().isoformat()

    salvar_jobs(jobs)

def executar_frop_pacote(usuario, squad_id, projeto_id, cd_projeto):
    """Executa a rotina de Frop Pacote em background"""
    logs = []

    try:
        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando rotina Frop Pacote para projeto {cd_projeto}")
        atualizar_job(projeto_id, 'em_andamento', 10, logs)

        # Configurações de conexão
        servidor_sia = '10.0.10.12,61433'
        banco_sia = 'SIA_CPD'
        usuario_sia = 'jhonatan.oliveira'
        senha_sia = 'jHo240400'

        servidor_monitor = '192.168.250.8,61433'
        banco_monitor = 'DB_MONITORAMENTO_OP'
        usuario_monitor = 'SDV'
        senha_monitor = 'SDV_COA'

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Configurando conexões com bancos de dados...")
        atualizar_job(projeto_id, 'em_andamento', 20, logs)

        # Conexão SIA_CPD
        params_sia = urllib.parse.quote_plus(
            f"DRIVER=ODBC Driver 17 for SQL Server;"
            f"SERVER={servidor_sia};"
            f"DATABASE={banco_sia};"
            f"UID={usuario_sia};"
            f"PWD={senha_sia};"
        )
        engine_sia = sa.create_engine(f"mssql+pyodbc:///?odbc_connect={params_sia}")

        # Conexão DB_MONITORAMENTO_OP
        params_monitor = urllib.parse.quote_plus(
            f"DRIVER=ODBC Driver 17 for SQL Server;"
            f"SERVER={servidor_monitor};"
            f"DATABASE={banco_monitor};"
            f"UID={usuario_monitor};"
            f"PWD={senha_monitor};"
        )
        engine_monitor = sa.create_engine(f"mssql+pyodbc:///?odbc_connect={params_monitor}")

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Conexões estabelecidas com sucesso")
        atualizar_job(projeto_id, 'em_andamento', 30, logs)

        # Query principal
        query = f"""
        DECLARE @CD_PROJETO VARCHAR(4) = '{cd_projeto}';

        WITH datas AS (
            SELECT
                U.CD_UNIDADE AS codigo_da_unidade,
                FORMAT(TRY_CAST(R.DT_RASTREAMENTO AS DATETIME), 'dd/MM/yyyy', 'pt-BR') AS data_rastreamento,
                ROW_NUMBER() OVER (
                    PARTITION BY U.CD_UNIDADE
                    ORDER BY R.DT_RASTREAMENTO
                ) AS rn
            FROM TB_UNIDADE U (NOLOCK)
            JOIN TB_TIPO_UNIDADE TU (NOLOCK)
                ON TU.ID_TIPO_UNIDADE = U.ID_TIPO_UNIDADE
            LEFT JOIN TB_RASTREAMENTO R (NOLOCK)
                ON R.ID_UNIDADE = U.ID_UNIDADE
            WHERE
                TU.DC_TIPO_GRUPO_UNIDADE = 'PACOTE'
                AND LEFT(U.CD_UNIDADE,4) = @CD_PROJETO
        )
        SELECT
            codigo_da_unidade,
            MIN(CASE WHEN rn = 1 THEN data_rastreamento END) AS data,
            MIN(CASE WHEN rn = 2 THEN data_rastreamento END) AS data_1
        FROM datas
        GROUP BY codigo_da_unidade
        ORDER BY codigo_da_unidade;
        """

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Consultando dados no SIA_CPD...")
        atualizar_job(projeto_id, 'em_andamento', 40, logs)

        df_final = pd.read_sql(query, engine_sia)

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Registros obtidos: {len(df_final)}")
        atualizar_job(projeto_id, 'em_andamento', 50, logs)

        # Grava tabela temporária
        nome_tabela = f"relatorioHistoricoUnidades{cd_projeto}"
        df_final.to_sql(nome_tabela, con=engine_monitor, if_exists="replace", index=False)

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Tabela '{nome_tabela}' criada com {len(df_final)} registros")
        atualizar_job(projeto_id, 'em_andamento', 60, logs)

        # Executa script SQL final
        sql_script_path = os.path.join(
            os.path.dirname(__file__),
            '..',
            'scripts',
            'processamento',
            'frop_pacote',
            'ScriptFropT1.sql'
        )

        if not os.path.exists(sql_script_path):
            raise FileNotFoundError(f"Script SQL não encontrado: {sql_script_path}")

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Executando ScriptFropT1.sql...")
        atualizar_job(projeto_id, 'em_andamento', 70, logs)

        with open(sql_script_path, "r", encoding="ANSI") as f:
            sql_script = f.read()

        sql_script = sql_script.replace(
            "@CD_PROJETO VARCHAR(255) = '2070';",
            f"@CD_PROJETO VARCHAR(255) = '{cd_projeto}';"
        )

        # Conexão pyodbc para executar script
        conn = pyodbc.connect(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={servidor_monitor};"
            f"DATABASE={banco_monitor};"
            f"UID={usuario_monitor};"
            f"PWD={senha_monitor};"
        )
        cursor = conn.cursor()

        sql_commands = [cmd.strip() for cmd in sql_script.split("GO") if cmd.strip()]

        total_cmds = len(sql_commands)
        for idx, cmd in enumerate(sql_commands):
            try:
                cursor.execute(cmd)
                conn.commit()
                progresso_atual = 70 + int((idx / total_cmds) * 20)
                atualizar_job(projeto_id, 'em_andamento', progresso_atual, logs)
            except Exception as e:
                logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] ⚠️ Aviso: {str(e)[:100]}")

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Script SQL executado com sucesso")
        atualizar_job(projeto_id, 'em_andamento', 90, logs)

        # Fechar conexões
        cursor.close()
        conn.close()

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Rotina Frop Pacote concluída com sucesso!")
        atualizar_job(projeto_id, 'concluido', 100, logs)

    except Exception as e:
        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Erro: {str(e)}")
        atualizar_job(projeto_id, 'erro', 0, logs)

@bp.route('/executar', methods=['POST'])
def executar():
    """Executa a rotina de Frop Pacote em background"""
    try:
        data = request.get_json()
        usuario = data.get('usuario')
        squad_id = data.get('squad_id')
        projeto_id = data.get('projeto_id')
        cd_projeto = data.get('cd_projeto')

        if not all([usuario, squad_id, projeto_id, cd_projeto]):
            return jsonify({
                'success': False,
                'message': 'Dados incompletos'
            }), 400

        # Inicia execução em background
        thread = threading.Thread(
            target=executar_frop_pacote,
            args=(usuario, squad_id, projeto_id, cd_projeto)
        )
        thread.daemon = True
        thread.start()

        return jsonify({
            'success': True,
            'message': 'Rotina Frop Pacote iniciada em background'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@bp.route('/job/projeto/<int:projeto_id>', methods=['GET'])
def obter_job(projeto_id):
    """Retorna o status do job de um projeto"""
    try:
        jobs = carregar_jobs()
        job = jobs.get(str(projeto_id))

        if not job:
            return jsonify({
                'success': False,
                'message': 'Job não encontrado'
            }), 404

        return jsonify({
            'success': True,
            'job': job
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
