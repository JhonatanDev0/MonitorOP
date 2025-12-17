from flask import Blueprint, request, jsonify
import threading
import time
from datetime import datetime
import json
import os
from sqlalchemy import create_engine, text
import pandas as pd

bp = Blueprint('categorizacao', __name__, url_prefix='/api/categorizacao')

# Caminho do arquivo de persistência
JOBS_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'jobs_categorizacao.json')

# Armazenamento em memória dos jobs (será carregado do arquivo)
jobs_storage = {}


def carregar_jobs():
    """Carrega os jobs do arquivo JSON"""
    global jobs_storage
    try:
        os.makedirs(os.path.dirname(JOBS_FILE_PATH), exist_ok=True)
        if os.path.exists(JOBS_FILE_PATH):
            with open(JOBS_FILE_PATH, 'r', encoding='utf-8') as f:
                jobs_storage = json.load(f)
                print(f"Jobs de categorização carregados: {len(jobs_storage)} job(s)")
        else:
            jobs_storage = {}
            print("Nenhum job de categorização encontrado, iniciando vazio")
    except Exception as e:
        print(f"Erro ao carregar jobs de categorização: {e}")
        jobs_storage = {}


def salvar_jobs():
    """Salva os jobs no arquivo JSON"""
    try:
        os.makedirs(os.path.dirname(JOBS_FILE_PATH), exist_ok=True)
        with open(JOBS_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(jobs_storage, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar jobs de categorização: {e}")


# Carregar jobs ao inicializar o módulo
carregar_jobs()


def executar_categorizacao(usuario, squad_id, projeto_id, cd_projeto):
    """
    Executa a rotina de categorização em background
    """
    job_id = f"{projeto_id}_{int(time.time())}"

    # Criar job
    jobs_storage[str(projeto_id)] = {
        'id': job_id,
        'usuario': usuario,
        'squad_id': squad_id,
        'projeto_id': projeto_id,
        'cd_projeto': cd_projeto,
        'status': 'em_andamento',
        'data_inicio': datetime.now().isoformat(),
        'data_fim': None,
        'logs': []
    }
    salvar_jobs()

    def adicionar_log(mensagem, tipo='info'):
        """Adiciona log ao job"""
        jobs_storage[str(projeto_id)]['logs'].append({
            'timestamp': datetime.now().isoformat(),
            'mensagem': mensagem,
            'tipo': tipo
        })
        salvar_jobs()

    try:
        adicionar_log(f"Iniciando rotina de categorização para projeto {cd_projeto}", 'info')

        # Configurações de conexão
        ORIGEM = {
            "server": "10.0.10.12,61433",
            "database": "master",
            "user": "jhonatan.oliveira",
            "password": "jHo240400"
        }

        DESTINO = {
            "server": "192.168.250.8,61433",
            "database": "DB_MONITORAMENTO_OP",
            "user": "SDV",
            "password": "SDV_COA"
        }

        adicionar_log("Conectando ao banco de origem...", 'info')

        # Criar engines SQLAlchemy
        engine_origem = create_engine(
            f"mssql+pyodbc://{ORIGEM['user']}:{ORIGEM['password']}"
            f"@{ORIGEM['server']}/{ORIGEM['database']}"
            "?driver=ODBC+Driver+17+for+SQL+Server",
            fast_executemany=True
        )

        engine_destino = create_engine(
            f"mssql+pyodbc://{DESTINO['user']}:{DESTINO['password']}"
            f"@{DESTINO['server']}/{DESTINO['database']}"
            "?driver=ODBC+Driver+17+for+SQL+Server",
            fast_executemany=True
        )

        adicionar_log("Conexões estabelecidas", 'success')
        adicionar_log("Executando query de origem...", 'info')

        # Query de origem
        query_origem = f"""
        WITH P_T1 AS (
            SELECT COUNT(DISTINCT NU_SEQUENCIAL) PREVISTO_T1
            FROM [REPOSITORIO_CENTRAL].[REPOSITORIO_DADO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_005_{cd_projeto}]
            WHERE CD_INSTRUMENTO_CAED IN (
                SELECT DISTINCT CD_INSTRUMENTO_CAED
                FROM [REPOSITORIO_CENTRAL].[REPOSITORIO_INSTRUMENTO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_204]
                WHERE DC_INSTRUMENTO_TIPO = 'ATA DE SALA'
            )
            AND CD_PAGINA_DOCUMENTO_CAED = '02'
            AND LEFT(CD_AVALIACAO,4) = '{cd_projeto}'
        ),
        E_T1 AS (
            SELECT COUNT(*) EFETIVO_T1
            FROM [REPOSITORIO_BR].[REPOSITORIO_DADO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_008_{cd_projeto}]
            WHERE CD_MASCARA IN (
                SELECT CD_MASCARA
                FROM [REPOSITORIO_CENTRAL].[REPOSITORIO_INSTRUMENTO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_204]
                WHERE DC_INSTRUMENTO_TIPO = 'ATA DE SALA'
                AND RIGHT(CD_REGISTRO_CAED,2) = '02'
                AND LEFT(CD_AVALIACAO,4) = '{cd_projeto}'
            )
        ),
        P_T2 AS (
            SELECT COUNT(*) PREVISTO_T2
            FROM [REPOSITORIO_BR].[REPOSITORIO_DADO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_008_{cd_projeto}]
            WHERE CD_MASCARA IN (
                SELECT CD_MASCARA
                FROM [REPOSITORIO_CENTRAL].[REPOSITORIO_INSTRUMENTO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_204]
                WHERE DC_INSTRUMENTO_TIPO = 'ATA DE SALA'
                AND RIGHT(CD_REGISTRO_CAED,2) = '02'
                AND LEFT(CD_AVALIACAO,4) = '{cd_projeto}'
            )
        ),
        E_T2 AS (
            SELECT COUNT(*) EFETIVO_T2
            FROM [REPOSITORIO_BR].[REPOSITORIO_SOLICITACAO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_021]
            WHERE DC_SOLICITACAO = 'VERIFICAÇÃO DE PREENCHIMENTO - OCORRÊNCIAS'
            AND CD_PROGRAMA_REGISTRO = '{cd_projeto}'
        ),
        P_T3 AS (
            SELECT COUNT(*) PREVISTO_T3
            FROM [REPOSITORIO_BR].[REPOSITORIO_SOLICITACAO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_021]
            WHERE DC_SOLICITACAO = 'VERIFICAÇÃO DE PREENCHIMENTO - OCORRÊNCIAS'
            AND VL_CAMPO_RETORNO = '1'
            AND CD_PROGRAMA_REGISTRO = '{cd_projeto}'
        ),
        E_T3 AS (
            SELECT COUNT(*) EFETIVO_T3
            FROM [REPOSITORIO_BR].[REPOSITORIO_SOLICITACAO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_021]
            WHERE DC_SOLICITACAO = 'CATEGORIZAÇÃO DA ATA DE SALA - VERSO'
            AND TP_STATUS = '6'
            AND CD_PROGRAMA_REGISTRO = '{cd_projeto}'
        ),
        P_T4 AS (
            SELECT COUNT(*) PREVISTO_T4 FROM (
                SELECT NU_SEQUENCIAL PREVISTO_T4 FROM [REPOSITORIO_BR].[REPOSITORIO_SOLICITACAO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_021] WHERE DC_SOLICITACAO = 'CATEGORIZAÇÃO DA ATA DE SALA - VERSO' AND (VL_CAMPO_RETORNO <> '7' AND ISNULL(VL_CAMPO_RETORNO,'') <> '') AND CD_PROGRAMA_REGISTRO = '{cd_projeto}'
                UNION SELECT NU_SEQUENCIAL PREVISTO_T4 FROM [REPOSITORIO_BR].[REPOSITORIO_DADO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_008_{cd_projeto}] WHERE CD_MASCARA IN (SELECT CD_MASCARA FROM [REPOSITORIO_CENTRAL].[REPOSITORIO_INSTRUMENTO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_204] WHERE DC_INSTRUMENTO_TIPO = 'ATA DE SALA' AND RIGHT(CD_REGISTRO_CAED,2) = '02' AND LEFT(CD_AVALIACAO,4) = '{cd_projeto}') AND VL_CAMPO_001 NOT IN ('F','')
                ) AS T4
        ),
        E_T41 AS (
            SELECT COUNT(*) EFETIVO_T4_1
            FROM [REPOSITORIO_BR].[REPOSITORIO_SOLICITACAO].[dbo].[TB_RESULTADO_LEIAUTE_ARQUIVO_010]
            WHERE DC_SOLICITANTE = 'PDA'
            AND CD_PROGRAMA_REGISTRO = '{cd_projeto}'
        )
        SELECT
            '{cd_projeto}' AS CD_PROJETO,
            PREVISTO_T1, EFETIVO_T1,
            PREVISTO_T2, EFETIVO_T2,
            PREVISTO_T3, EFETIVO_T3,
            PREVISTO_T4,
            EFETIVO_T4_1,
            0 AS EFETIVO_T4_2,
            0 AS EFETIVO_T4_3,
            CONVERT(VARCHAR(10), GETDATE(), 103) + ' às ' +
            CONVERT(VARCHAR(5), GETDATE(), 108) AS DT_EXPORTACAO
        FROM P_T1, E_T1, P_T2, E_T2, P_T3, E_T3, P_T4, E_T41
        """

        # Executar query
        df = pd.read_sql(query_origem, engine_origem)

        if df.empty:
            adicionar_log("Query não retornou dados", 'error')
            raise Exception("Query não retornou dados")

        adicionar_log(f"Dados obtidos: {len(df)} registro(s)", 'success')
        adicionar_log("Executando MERGE no banco de destino...", 'info')

        # MERGE no destino
        merge_sql = text("""
        MERGE TMP_CATEGORIZACAO AS T
        USING (
            SELECT
                :CD_PROJETO AS CD_PROJETO,
                :PREVISTO_T1 AS PREVISTO_T1,
                :EFETIVO_T1 AS EFETIVO_T1,
                :PREVISTO_T2 AS PREVISTO_T2,
                :EFETIVO_T2 AS EFETIVO_T2,
                :PREVISTO_T3 AS PREVISTO_T3,
                :EFETIVO_T3 AS EFETIVO_T3,
                :PREVISTO_T4 AS PREVISTO_T4,
                :EFETIVO_T4_1 AS EFETIVO_T4_1,
                :EFETIVO_T4_2 AS EFETIVO_T4_2,
                :EFETIVO_T4_3 AS EFETIVO_T4_3,
                :DT_EXPORTACAO AS DT_EXPORTACAO
        ) AS S
        ON T.CD_PROJETO = S.CD_PROJETO
        WHEN MATCHED THEN
            UPDATE SET
                PREVISTO_T1   = S.PREVISTO_T1,
                EFETIVO_T1    = S.EFETIVO_T1,
                PREVISTO_T2   = S.PREVISTO_T2,
                EFETIVO_T2    = S.EFETIVO_T2,
                PREVISTO_T3   = S.PREVISTO_T3,
                EFETIVO_T3    = S.EFETIVO_T3,
                PREVISTO_T4   = S.PREVISTO_T4,
                EFETIVO_T4_1  = S.EFETIVO_T4_1,
                EFETIVO_T4_2  = S.EFETIVO_T4_2,
                EFETIVO_T4_3  = S.EFETIVO_T4_3,
                DT_EXPORTACAO = S.DT_EXPORTACAO
        WHEN NOT MATCHED THEN
            INSERT (
                CD_PROJETO,
                PREVISTO_T1, EFETIVO_T1,
                PREVISTO_T2, EFETIVO_T2,
                PREVISTO_T3, EFETIVO_T3,
                PREVISTO_T4,
                EFETIVO_T4_1,
                EFETIVO_T4_2,
                EFETIVO_T4_3,
                DT_EXPORTACAO
            )
            VALUES (
                S.CD_PROJETO,
                S.PREVISTO_T1, S.EFETIVO_T1,
                S.PREVISTO_T2, S.EFETIVO_T2,
                S.PREVISTO_T3, S.EFETIVO_T3,
                S.PREVISTO_T4,
                S.EFETIVO_T4_1,
                S.EFETIVO_T4_2,
                S.EFETIVO_T4_3,
                S.DT_EXPORTACAO
            );
        """)

        # Executar MERGE
        with engine_destino.begin() as conn:
            conn.execute(merge_sql, df.iloc[0].to_dict())

        adicionar_log("MERGE executado com sucesso", 'success')
        adicionar_log(f"Rotina de categorização concluída para o projeto {cd_projeto}", 'success')

        # Atualizar status do job
        jobs_storage[str(projeto_id)]['status'] = 'concluido'
        jobs_storage[str(projeto_id)]['data_fim'] = datetime.now().isoformat()
        salvar_jobs()

    except Exception as e:
        adicionar_log(f"Erro: {str(e)}", 'error')
        jobs_storage[str(projeto_id)]['status'] = 'erro'
        jobs_storage[str(projeto_id)]['data_fim'] = datetime.now().isoformat()
        salvar_jobs()


@bp.route('/executar', methods=['POST'])
def executar():
    """Executa a rotina de categorização em background"""
    try:
        data = request.get_json()
        usuario = data.get('usuario')
        squad_id = data.get('squad_id')
        projeto_id = data.get('projeto_id')
        cd_projeto = data.get('cd_projeto')

        if not all([usuario, squad_id, projeto_id, cd_projeto]):
            return jsonify({'erro': 'Dados incompletos'}), 400

        # Verificar se já existe job em andamento para este projeto
        job_existente = jobs_storage.get(str(projeto_id))
        if job_existente and job_existente['status'] == 'em_andamento':
            return jsonify({'erro': 'Já existe uma execução em andamento para este projeto'}), 400

        # Executar em thread separada
        thread = threading.Thread(
            target=executar_categorizacao,
            args=(usuario, squad_id, projeto_id, cd_projeto)
        )
        thread.daemon = True
        thread.start()

        return jsonify({
            'sucesso': True,
            'mensagem': 'Rotina de categorização iniciada em background'
        }), 200

    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@bp.route('/job/projeto/<int:projeto_id>', methods=['GET'])
def buscar_job(projeto_id):
    """Busca o job de um projeto específico"""
    try:
        job = jobs_storage.get(str(projeto_id))

        if not job:
            return jsonify({'success': False, 'message': 'Job não encontrado'}), 404

        return jsonify({
            'success': True,
            'job': job
        }), 200

    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@bp.route('/metricas/<cd_projeto>', methods=['GET'])
def buscar_metricas(cd_projeto):
    """Busca as métricas de categorização de um projeto específico"""
    import pyodbc

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

        # Buscar dados da TMP_CATEGORIZACAO
        query = """
            SELECT
                CD_PROJETO,
                PREVISTO_T1, EFETIVO_T1,
                PREVISTO_T2, EFETIVO_T2,
                PREVISTO_T3, EFETIVO_T3,
                PREVISTO_T4, EFETIVO_T4_1, EFETIVO_T4_2, EFETIVO_T4_3,
                DT_EXPORTACAO
            FROM TMP_CATEGORIZACAO
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
            'PREVISTO_T1': row.PREVISTO_T1 or 0,
            'EFETIVO_T1': row.EFETIVO_T1 or 0,
            'PREVISTO_T2': row.PREVISTO_T2 or 0,
            'EFETIVO_T2': row.EFETIVO_T2 or 0,
            'PREVISTO_T3': row.PREVISTO_T3 or 0,
            'EFETIVO_T3': row.EFETIVO_T3 or 0,
            'PREVISTO_T4': row.PREVISTO_T4 or 0,
            'EFETIVO_T4_1': row.EFETIVO_T4_1 or 0,
            'EFETIVO_T4_2': row.EFETIVO_T4_2 or 0,
            'EFETIVO_T4_3': row.EFETIVO_T4_3 or 0,
            'DT_EXPORTACAO': dt_exportacao
        }

        return jsonify({
            'success': True,
            'metricas': metricas
        }), 200

    except pyodbc.Error as e:
        print(f"Erro de banco de dados ao buscar métricas de categorização: {str(e)}")
        return jsonify({
            'success': False,
            'erro': 'Erro ao conectar ao banco de dados',
            'detalhes': str(e)
        }), 500
    except Exception as e:
        print(f"Erro ao buscar métricas de categorização: {str(e)}")
        return jsonify({
            'success': False,
            'erro': str(e)
        }), 500
