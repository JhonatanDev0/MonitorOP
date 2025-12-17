from flask import Blueprint, request, jsonify
import threading
import json
import os
from datetime import datetime
import pandas as pd
import sqlalchemy as sa
from sqlalchemy import text
import traceback
import time
import pyodbc

bp = Blueprint('frop_digitalizacao', __name__, url_prefix='/api/frop-digitalizacao')

# Arquivo para persistir jobs
JOBS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'jobs_frop_digitalizacao.json')

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

def executar_frop_digitalizacao(usuario, squad_id, projeto_id, cd_projeto):
    """Executa a rotina de Frop Digitalização em background"""
    logs = []

    try:
        print(f"[FROP DIGITALIZACAO] Iniciando para projeto {cd_projeto} (ID: {projeto_id})")
        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando rotina Frop Digitalização para projeto {cd_projeto}")
        atualizar_job(projeto_id, 'em_andamento', 10, logs)

        # Configurações de conexão ORIGEM
        origem_server = '10.0.10.12,61433'
        origem_database = 'master'
        origem_user = 'jhonatan.oliveira'
        origem_password = 'jHo240400'

        # Configurações de conexão DESTINO
        destino_server = '192.168.250.8,61433'
        destino_database = 'DB_MONITORAMENTO_OP'
        destino_user = 'SDV'
        destino_password = 'SDV_COA'

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Configurando conexões com bancos de dados...")
        atualizar_job(projeto_id, 'em_andamento', 20, logs)

        # Engine ORIGEM
        try:
            engine_origem = sa.create_engine(
                f"mssql+pyodbc://{origem_user}:{origem_password}"
                f"@{origem_server}/{origem_database}"
                "?driver=ODBC+Driver+17+for+SQL+Server&timeout=300",
                fast_executemany=True,
                pool_pre_ping=True,
                connect_args={'timeout': 300}
            )
            logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Conexão ORIGEM criada")
            atualizar_job(projeto_id, 'em_andamento', 25, logs)
        except Exception as e:
            raise Exception(f"Erro ao criar engine ORIGEM: {str(e)}")

        # Engine DESTINO
        try:
            engine_destino = sa.create_engine(
                f"mssql+pyodbc://{destino_user}:{destino_password}"
                f"@{destino_server}/{destino_database}"
                "?driver=ODBC+Driver+17+for+SQL+Server",
                fast_executemany=True
            )
            logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Conexão DESTINO criada")
            atualizar_job(projeto_id, 'em_andamento', 30, logs)
        except Exception as e:
            raise Exception(f"Erro ao criar engine DESTINO: {str(e)}")

        # Query ORIGEM
        query_origem = f"""
        WITH INSTRUMENTO_PREVISTO AS (
            SELECT DISTINCT L005.CD_REGISTRO_CAED
            FROM [REPOSITORIO_CENTRAL].[REPOSITORIO_DADO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_005_{cd_projeto}] L005
            INNER JOIN [REPOSITORIO_CENTRAL].[REPOSITORIO_INSTRUMENTO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_204] L204
                ON L005.CD_INSTRUMENTO_CAED = L204.CD_INSTRUMENTO_CAED
                AND L005.CD_PAGINA_INSTRUMENTO_CAED = L204.CD_REGISTRO_CAED
                AND L204.CD_AVALIACAO = L005.CD_AVALIACAO
                AND L204.DC_INSTRUMENTO_TIPO IN (
                    'PROVA OBJETIVA',
                    'QUESTAO ABERTA',
                    'QUESTÃO ABERTA',
                    'REDACAO',
                    'REDAÇÃO'
                )
                AND LEN(L005.CD_REGISTRO_CAED) = 16
                AND LEFT(L005.CD_REGISTRO_CAED, 3) != '363'
        )
        SELECT
            '{cd_projeto}' AS CD_PROJETO,
            COUNT(DISTINCT PREV.CD_REGISTRO_CAED) AS QT_INSTRUMENTO_PREVISTO,
            COUNT(DISTINCT L008.NU_SEQUENCIAL) AS QT_INSTRUMENTO_DIGITALIZADO,
            CASE
                WHEN COUNT(DISTINCT PREV.CD_REGISTRO_CAED) = 0 THEN '0,00%'
                ELSE
                    CONCAT(
                        FORMAT(
                            (CAST(COUNT(DISTINCT L008.NU_SEQUENCIAL) AS DECIMAL(10,2)) /
                             CAST(COUNT(DISTINCT PREV.CD_REGISTRO_CAED) AS DECIMAL(10,2))) * 100,
                        'N2'
                        ),
                    '%'
                    )
            END AS PCT_INSTRUMENTO_DIGITALIZADO,
            CONVERT(VARCHAR(10), GETDATE(), 103) + ' às ' +
            CONVERT(VARCHAR(5), GETDATE(), 108) AS DT_EXPORTACAO
        FROM INSTRUMENTO_PREVISTO PREV
        LEFT JOIN [REPOSITORIO_BR].[REPOSITORIO_DADO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_008_{cd_projeto}] L008
            ON L008.NU_SEQUENCIAL = PREV.CD_REGISTRO_CAED
        """

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Consultando dados de digitalização...")
        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Aguarde, esta consulta pode demorar alguns minutos...")
        atualizar_job(projeto_id, 'em_andamento', 50, logs)

        try:
            print(f"[FROP DIGITALIZACAO] Executando query para projeto {cd_projeto}...")
            inicio_query = time.time()

            # Usar pyodbc diretamente para melhor performance
            print(f"[FROP DIGITALIZACAO] Criando conexão pyodbc direta...")
            conn_str = (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={origem_server};"
                f"DATABASE={origem_database};"
                f"UID={origem_user};"
                f"PWD={origem_password};"
                f"Connection Timeout=30;"
            )

            conn = pyodbc.connect(conn_str, timeout=30)
            cursor = conn.cursor()

            # Configurar timeout do comando para 10 minutos (600 segundos)
            cursor.execute("SET LOCK_TIMEOUT 600000")  # 10 minutos em milissegundos

            print(f"[FROP DIGITALIZACAO] Executando query SQL (timeout: 10 minutos)...")

            # Executar a query com timeout explícito no cursor
            cursor.execute(query_origem)
            cursor.timeout = 600  # 10 minutos

            print(f"[FROP DIGITALIZACAO] Query submetida ao servidor, aguardando resposta...")
            logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Processando consulta no servidor SQL...")
            atualizar_job(projeto_id, 'em_andamento', 55, logs)

            print(f"[FROP DIGITALIZACAO] Buscando resultados...")
            rows = cursor.fetchall()
            columns = [column[0] for column in cursor.description]

            print(f"[FROP DIGITALIZACAO] Resultados recebidos, {len(rows)} linhas")
            logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Dados recebidos do servidor")
            atualizar_job(projeto_id, 'em_andamento', 58, logs)

            print(f"[FROP DIGITALIZACAO] Convertendo para DataFrame...")
            df = pd.DataFrame.from_records(rows, columns=columns)

            cursor.close()
            conn.close()

            print(f"[FROP DIGITALIZACAO] Dados lidos com sucesso!")

            tempo_query = time.time() - inicio_query
            print(f"[FROP DIGITALIZACAO] Query executada em {tempo_query:.2f} segundos")

            logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Query executada em {tempo_query:.2f}s, {len(df)} registro(s) retornado(s)")
            atualizar_job(projeto_id, 'em_andamento', 60, logs)
        except Exception as e:
            print(f"[FROP DIGITALIZACAO] ERRO na query: {str(e)}")
            traceback.print_exc()
            raise Exception(f"Erro ao executar query ORIGEM: {str(e)}")

        if df.empty:
            raise Exception("Query não retornou dados.")

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Dados coletados com sucesso")
        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Previsto: {df.iloc[0]['QT_INSTRUMENTO_PREVISTO']}, Digitalizado: {df.iloc[0]['QT_INSTRUMENTO_DIGITALIZADO']}")
        atualizar_job(projeto_id, 'em_andamento', 70, logs)

        # MERGE no destino
        merge_sql = text("""
        MERGE TMP_FROP_DIGITALIZACAO AS T
        USING (
            SELECT
                :CD_PROJETO AS CD_PROJETO,
                :DT_EXPORTACAO AS DT_EXPORTACAO,
                :QT_INSTRUMENTO_PREVISTO AS QT_INSTRUMENTO_PREVISTO,
                :QT_INSTRUMENTO_DIGITALIZADO AS QT_INSTRUMENTO_DIGITALIZADO,
                :PCT_INSTRUMENTO_DIGITALIZADO AS PCT_INSTRUMENTO_DIGITALIZADO
        ) AS S
        ON T.CD_PROJETO = S.CD_PROJETO
        WHEN MATCHED THEN
            UPDATE SET
                DT_EXPORTACAO = S.DT_EXPORTACAO,
                QT_INSTRUMENTO_PREVISTO = S.QT_INSTRUMENTO_PREVISTO,
                QT_INSTRUMENTO_DIGITALIZADO = S.QT_INSTRUMENTO_DIGITALIZADO,
                PCT_INSTRUMENTO_DIGITALIZADO = S.PCT_INSTRUMENTO_DIGITALIZADO
        WHEN NOT MATCHED THEN
            INSERT (
                CD_PROJETO,
                DT_EXPORTACAO,
                QT_INSTRUMENTO_PREVISTO,
                QT_INSTRUMENTO_DIGITALIZADO,
                PCT_INSTRUMENTO_DIGITALIZADO
            )
            VALUES (
                S.CD_PROJETO,
                S.DT_EXPORTACAO,
                S.QT_INSTRUMENTO_PREVISTO,
                S.QT_INSTRUMENTO_DIGITALIZADO,
                S.PCT_INSTRUMENTO_DIGITALIZADO
            );
        """)

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] Executando MERGE na tabela TMP_FROP_DIGITALIZACAO...")
        atualizar_job(projeto_id, 'em_andamento', 85, logs)

        try:
            with engine_destino.begin() as conn:
                conn.execute(merge_sql, df.iloc[0].to_dict())
            logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] MERGE executado com sucesso")
            atualizar_job(projeto_id, 'em_andamento', 95, logs)
        except Exception as e:
            raise Exception(f"Erro ao executar MERGE: {str(e)}")

        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Rotina Frop Digitalização concluída com sucesso!")
        atualizar_job(projeto_id, 'concluido', 100, logs)
        print(f"[FROP DIGITALIZACAO] Concluído para projeto {cd_projeto} (ID: {projeto_id})")

    except Exception as e:
        print(f"[FROP DIGITALIZACAO] ERRO para projeto {cd_projeto} (ID: {projeto_id}): {str(e)}")
        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Erro: {str(e)}")
        atualizar_job(projeto_id, 'erro', 0, logs)

@bp.route('/executar', methods=['POST'])
def executar():
    """Executa a rotina de Frop Digitalização em background"""
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
            target=executar_frop_digitalizacao,
            args=(usuario, squad_id, projeto_id, cd_projeto)
        )
        thread.daemon = True
        thread.start()

        return jsonify({
            'success': True,
            'message': 'Rotina Frop Digitalização iniciada em background'
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
        print(f"[FROP DIGITALIZACAO] Buscando job para projeto_id: {projeto_id}")
        print(f"[FROP DIGITALIZACAO] JOBS_FILE path: {JOBS_FILE}")

        jobs = carregar_jobs()
        print(f"[FROP DIGITALIZACAO] Jobs carregados: {list(jobs.keys())}")

        job = jobs.get(str(projeto_id))

        if not job:
            print(f"[FROP DIGITALIZACAO] Job não encontrado para projeto_id: {projeto_id}")
            return jsonify({
                'success': False,
                'message': 'Job não encontrado'
            }), 404

        print(f"[FROP DIGITALIZACAO] Job encontrado: {job}")
        return jsonify({
            'success': True,
            'job': job
        })

    except Exception as e:
        print(f"[FROP DIGITALIZACAO] ERRO ao obter job: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
