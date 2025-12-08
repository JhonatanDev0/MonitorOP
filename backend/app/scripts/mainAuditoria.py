import pandas as pd
import sqlalchemy as sa
import unidecode
import re
import sys
import warnings
from pathlib import Path
from datetime import datetime

# Suprimir warnings do openpyxl sobre datas inválidas
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')

# =============================
# CONFIGURACAO DE ENCODING
# =============================
# Forcar encoding ANSI seguro para Windows
sys.stdout.reconfigure(line_buffering=True, encoding='utf-8', errors='replace')
sys.stderr.reconfigure(line_buffering=True, encoding='utf-8', errors='replace')

# =============================
# RECEBER ARQUIVO COMO ARGUMENTO
# =============================
print(">>> INICIANDO SCRIPT DE AUDITORIA", flush=True)

if len(sys.argv) < 2:
    print("[ERRO] Caminho do arquivo nao fornecido", flush=True)
    print("Uso: python mainAuditoria.py <caminho_arquivo.xlsm> [codigo_projeto]", flush=True)
    sys.exit(1)

ARQUIVO_EXCEL = sys.argv[1]
CODIGO_PROJETO_FILTRO = sys.argv[2] if len(sys.argv) > 2 else None

print(f"[ARQUIVO] Recebido: {ARQUIVO_EXCEL}", flush=True)
if CODIGO_PROJETO_FILTRO:
    print(f"[FILTRO] Codigo do projeto: {CODIGO_PROJETO_FILTRO}", flush=True)

if not Path(ARQUIVO_EXCEL).exists():
    print(f"[ERRO] Arquivo nao encontrado: {ARQUIVO_EXCEL}", flush=True)
    sys.exit(1)

print("[OK] Arquivo verificado e pronto para processar", flush=True)
print("=" * 50, flush=True)

# =============================
# CONEXAO SQL SERVER
# =============================
servidor = '192.168.250.8,61433'
banco_de_dados = 'DB_MONITORAMENTO_OP'

connection_string = (
    f'mssql+pyodbc://{servidor}/{banco_de_dados}?'
    f'driver=ODBC+Driver+17+for+SQL+Server&'
    f'trusted_connection=yes'
)

print("[INFO] Conectando ao SQL Server...", flush=True)
print(f"[INFO] Servidor: {servidor}", flush=True)
print(f"[INFO] Banco: {banco_de_dados}", flush=True)

try:
    engine = sa.create_engine(
        connection_string,
        fast_executemany=True
    )
    
    # Testar conexao
    with engine.connect() as conn:
        conn.execute(sa.text("SELECT 1"))
    print("[OK] Conexao estabelecida com sucesso", flush=True)
except Exception as e:
    print(f"[ERRO] Falha ao conectar: {str(e)}", flush=True)
    sys.exit(1)

# Configuracao por aba
abas_config = {
    "Metrica": {"skiprows": 9},
    "Transcricao": {"skiprows": 4},
}

# =============================
# FUNCOES AUXILIARES
# =============================

def encontrar_aba(xls, nomes_possiveis):
    """Encontra aba ignorando acentos e case"""
    abas_disponiveis = xls.sheet_names
    
    for nome in nomes_possiveis:
        # Normalizar nome procurado
        nome_norm = normalizar_nome(nome)
        
        # Procurar em abas disponíveis
        for aba in abas_disponiveis:
            aba_norm = normalizar_nome(aba)
            if nome_norm == aba_norm:
                return aba  # Retorna nome original da aba
    
    return None

def normalizar_nome(texto):
    texto = unidecode.unidecode(str(texto)).lower()
    texto = re.sub(r"[^a-z0-9_]+", "_", texto)
    texto = re.sub(r"_+", "_", texto).strip("_")
    return texto

def normalizar_colunas(df):
    df.columns = [normalizar_nome(c) for c in df.columns]
    return df

def limpar_dataframe(df):
    df = df.dropna(how='all')
    df = df[~df.apply(lambda row: row.astype(str).str.strip().eq('').all(), axis=1)]
    df = df.replace(r'^\s*$', pd.NA, regex=True)
    df = df.dropna(axis=1, how='all')
    return df

def encontrar_coluna(df, termos_possiveis):
    for termo in termos_possiveis:
        termo_norm = normalizar_nome(termo)
        for c in df.columns:
            if termo_norm in c:
                return c
    return None

# =============================
# MODULO 1: IMPORTAR DADOS DO EXCEL
# =============================

def processar_arquivo(excel_path):
    print(f"\n{'='*80}", flush=True)
    print(f"[PROCESSANDO] {excel_path.name}", flush=True)
    print(f"{'='*80}", flush=True)

    try:
        print("[INFO] Abrindo arquivo Excel...", flush=True)
        xls = pd.ExcelFile(excel_path)
        print(f"[OK] Arquivo aberto. Abas: {xls.sheet_names}", flush=True)

        # Buscar aba Metrica (ignorando acentos)
        aba_metrica = encontrar_aba(xls, ["Metrica", "Métrica"])
        if not aba_metrica:
            print("[AVISO] Arquivo sem aba Metrica. Pulando...", flush=True)
            return False

        # --- Le Metrica ---
        print(f"[INFO] Lendo aba '{aba_metrica}'...", flush=True)
        
        # Ler TODAS as colunas primeiro
        metrica = pd.read_excel(
            xls,
            sheet_name=aba_metrica,
            skiprows=abas_config["Metrica"]["skiprows"]
        )
        
        print(f"[OK] Aba '{aba_metrica}' lida. Linhas: {len(metrica)}", flush=True)
        print(f"[INFO] Colunas encontradas: {list(metrica.columns)[:10]}...", flush=True)

        # Limpar e normalizar
        metrica = limpar_dataframe(metrica)
        metrica = normalizar_colunas(metrica)
        
        # Verificar quais colunas necessárias existem
        colunas_necessarias = {
            'codigo_do_subprograma': encontrar_coluna(metrica, [
                'codigo_do_subprograma', 'codigo_subprograma', 'cod_subprograma', 
                'codigo_projeto', 'cod_projeto', 'subprograma'
            ]),
            'nome_do_subprograma': encontrar_coluna(metrica, [
                'nome_do_subprograma', 'nome_subprograma', 'nome_projeto', 'projeto'
            ]),
            'tipo_de_pacote': encontrar_coluna(metrica, [
                'tipo_de_pacote', 'tipo_pacote', 'pacote_tipo', 'tipo'
            ]),
            'pacote_indicado_na_metrica': encontrar_coluna(metrica, [
                'pacote_indicado_na_metrica', 'pacote_metrica', 'pacote_indicado',
                'numero_pacote', 'num_pacote', 'pacote'
            ])
        }
        
        # Verificar se encontrou as colunas essenciais
        if not colunas_necessarias['codigo_do_subprograma']:
            print(f"[ERRO] Coluna 'codigo_do_subprograma' nao encontrada!", flush=True)
            print(f"[INFO] Colunas disponiveis: {list(metrica.columns)}", flush=True)
            return False
        
        # Renomear colunas para nomes padronizados
        rename_map = {}
        for nome_padrao, nome_real in colunas_necessarias.items():
            if nome_real and nome_real in metrica.columns:
                rename_map[nome_real] = nome_padrao
        
        metrica = metrica.rename(columns=rename_map)
        
        # Selecionar apenas colunas que existem
        colunas_finais = [c for c in colunas_necessarias.keys() if c in metrica.columns]
        metrica = metrica[colunas_finais]
        
        print(f"[OK] Colunas mapeadas: {colunas_finais}", flush=True)
        print(f"[OK] Colunas mapeadas: {colunas_finais}", flush=True)
        
        # Validar dados
        print("[INFO] Validando dados...", flush=True)
        if 'codigo_do_subprograma' in metrica.columns:
            metrica = metrica.dropna(subset=['codigo_do_subprograma'])
            metrica = metrica[metrica['codigo_do_subprograma'].astype(str).str.strip() != '']
        
        metrica = metrica.drop_duplicates()
        print(f"[OK] Dados validados. Linhas validas: {len(metrica)}", flush=True)

        if metrica.empty:
            print("[AVISO] Aba Metrica vazia apos limpeza.", flush=True)
            return False

        # --- Le Transcricao ---
        transcricao = None
        aba_transcricao = encontrar_aba(xls, ["Transcricao", "Transcrição"])
        
        if aba_transcricao:
            print(f"[INFO] Lendo aba '{aba_transcricao}'...", flush=True)
            temp = pd.read_excel(
                xls,
                sheet_name=aba_transcricao,  # Usar nome real da aba
                skiprows=abas_config["Transcricao"]["skiprows"],
            )
            print(f"[OK] Aba '{aba_transcricao}' lida. Linhas: {len(temp)}", flush=True)
            
            temp = limpar_dataframe(temp)
            temp = normalizar_colunas(temp)

            col_pacote = encontrar_coluna(temp, ["numero_de_pacote", "numero_do_pacote"])
            if col_pacote:
                temp = temp.dropna(subset=[col_pacote])
                temp = temp[temp[col_pacote].astype(str).str.strip() != '']

                if not temp.empty:
                    transcricao = temp[[col_pacote]].drop_duplicates().rename(
                        columns={col_pacote: "numero_de_pacote"}
                    )
                    print(f"[OK] Transcricao processada. Linhas: {len(transcricao)}", flush=True)
                else:
                    print("[AVISO] Transcricao sem dados validos.", flush=True)
        else:
            print("[INFO] Aba 'Transcricao' nao encontrada", flush=True)

        # --- Criacao das tabelas no banco ---
        print("[INFO] Criando tabelas no banco de dados...", flush=True)
        tabelas_criadas = 0

        for idx, row in metrica.iterrows():
            cod = normalizar_nome(row["codigo_do_subprograma"])
            if not cod:
                continue

            nome_tabela_metrica = f"auditoria_metrica_{cod}"
            nome_tabela_transcricao = f"auditoria_transcricao_{cod}"

            print(f"[INFO] Salvando: {nome_tabela_metrica}", flush=True)
            df_m = metrica[metrica["codigo_do_subprograma"] == row["codigo_do_subprograma"]]
            df_m.to_sql(nome_tabela_metrica, con=engine, if_exists="replace", index=False)
            tabelas_criadas += 1
            print(f"[OK] Criada: {nome_tabela_metrica}", flush=True)

            if transcricao is not None:
                print(f"[INFO] Salvando: {nome_tabela_transcricao}", flush=True)
                transcricao.to_sql(nome_tabela_transcricao, con=engine, if_exists="replace", index=False)
                tabelas_criadas += 1
                print(f"[OK] Criada: {nome_tabela_transcricao}", flush=True)

        print(f"[INFO] Total: {tabelas_criadas} tabelas criadas no banco", flush=True)
        return True

    except Exception as e:
        print(f"[ERRO] Erro ao processar arquivo: {str(e)}", flush=True)
        import traceback
        print(f"[ERRO] Traceback: {traceback.format_exc()}", flush=True)
        return False


def importar_dados_excel():
    print("\n" + "="*80, flush=True)
    print(">>> MODULO 1: IMPORTACAO", flush=True)
    print("="*80, flush=True)

    # Processar o arquivo especifico recebido como argumento
    arquivo = Path(ARQUIVO_EXCEL)
    
    if processar_arquivo(arquivo):
        print("[OK] Arquivo processado com sucesso!", flush=True)
        return True
    else:
        print("[ERRO] Falha ao processar arquivo", flush=True)
        return False

# =============================
# MODULO 2: EXPORTACAO E COMPARACAO
# =============================

def buscar_codigos_subprograma():
    query = """
    SELECT DISTINCT SUBSTRING(TABLE_NAME, LEN('auditoria_metrica_') + 1, LEN(TABLE_NAME)) AS codigo
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME LIKE 'auditoria_metrica_%'
    ORDER BY codigo
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(sa.text(query))
            codigos = [row[0] for row in result if row[0]]
            return codigos
    except Exception as e:
        print(f"[ERRO] Erro ao buscar codigos: {str(e)}", flush=True)
        return []

def verificar_tabela_existe(codigo, tipo):
    tabela = f"auditoria_{tipo}_{codigo}"
    query = f"""
        SELECT COUNT(*) AS existe FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = '{tabela}'
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(sa.text(query))
            existe = result.fetchone()[0]
            return existe > 0
    except Exception as e:
        print(f"[ERRO] Erro ao verificar tabela {tabela}: {str(e)}", flush=True)
        return False

def executar_comparacao(codigo):
    print(f"\n{'='*80}", flush=True)
    print(f"[COMPARANDO] Codigo: {codigo}", flush=True)
    print(f"{'='*80}", flush=True)

    tem_m = verificar_tabela_existe(codigo, 'metrica')
    tem_t = verificar_tabela_existe(codigo, 'transcricao')

    if not tem_m and not tem_t:
        print("[AVISO] Nada encontrado para este codigo.", flush=True)
        return None

    try:
        qt_metrica = qt_prev_t = qt_t = 0
        codigo_sub = codigo

        if tem_m:
            query = f"""
            SELECT DISTINCT A.*, { 'C.numero_de_pacote AS pacote_transcricao' if tem_t else 'NULL AS pacote_transcricao' }
            FROM auditoria_metrica_{codigo} A
            { f'LEFT JOIN auditoria_transcricao_{codigo} C ON A.pacote_indicado_na_metrica = C.numero_de_pacote' if tem_t else '' }
            """
            
            print(f"[INFO] Lendo dados da metrica_{codigo}...", flush=True)
            with engine.connect() as conn:
                result = conn.execute(sa.text(query))
                rows = result.fetchall()
                
                if rows:
                    # Converter para DataFrame de forma segura
                    columns = result.keys()
                    df = pd.DataFrame(rows, columns=columns)
                    print(f"[OK] {len(df)} linhas lidas", flush=True)
                else:
                    df = pd.DataFrame()

            if not df.empty:
                codigo_sub = df['codigo_do_subprograma'].iloc[0]
                qt_metrica = df[df['tipo_de_pacote'].str.upper().str.contains('TRANSCRICAO', na=False)]['pacote_indicado_na_metrica'].nunique()
                qt_prev_t = df[df['tipo_de_pacote'].str.upper().str.contains('TRANSCRI', na=False)][
                    'pacote_indicado_na_metrica'
                ].nunique()
                if tem_t:
                    qt_t = df['pacote_transcricao'].dropna().nunique()

        elif tem_t:
            query = f"SELECT COUNT(DISTINCT numero_de_pacote) as qt FROM auditoria_transcricao_{codigo}"
            try:
                with engine.connect() as conn:
                    result = conn.execute(sa.text(query))
                    qt_t = result.fetchone()[0]
            except Exception as e:
                print(f"[ERRO] Erro ao contar transcricao: {str(e)}", flush=True)
                qt_t = 0

        pct_t = f"{round(qt_t / qt_prev_t * 100, 2) if qt_prev_t > 0 else 0}%"
        
        print(f"[OK] {codigo_sub} | Metrica: {qt_metrica} | Transcricao: {qt_t}/{qt_prev_t} ({pct_t})", flush=True)

        return {
            'CD_PROJETO': codigo_sub,
            'DT_EXPORTACAO': datetime.now().strftime('%d/%m/%Y'),
            'QT_PACOTE_METRICA': qt_metrica,
            'QT_PACOTE_PREVISTO_TRANSCRICAO': qt_prev_t,
            'QT_PACOTE_TRANSCRICAO': qt_t,
            'PCT_PACOTE_TRANSCRICAO': pct_t,
        }

    except Exception as e:
        print(f"[ERRO] Erro na comparacao: {str(e)}", flush=True)
        import traceback
        print(f"[ERRO] Traceback: {traceback.format_exc()}", flush=True)
        return None

def criar_tabela_se_nao_existe():
    query = """
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TMP_AUDITORIA')
    BEGIN
        CREATE TABLE TMP_AUDITORIA (
            CD_PROJETO VARCHAR(50),
            DT_EXPORTACAO VARCHAR(10),
            QT_PACOTE_METRICA INT,
            QT_PACOTE_PREVISTO_TRANSCRICAO INT,
            QT_PACOTE_TRANSCRICAO INT,
            PCT_PACOTE_TRANSCRICAO VARCHAR(10)
        );
    END
    """
    try:
        with engine.connect() as conn:
            conn.execute(sa.text(query))
            conn.commit()
        print("[OK] Tabela TMP_AUDITORIA verificada/criada", flush=True)
    except Exception as e:
        print(f"[ERRO] Erro ao criar tabela: {str(e)}", flush=True)


def salvar_resultados(resultados):
    if not resultados:
        print("[AVISO] Nenhum resultado para salvar.", flush=True)
        return

    print(f"[INFO] Salvando {len(resultados)} resultados...", flush=True)
    df = pd.DataFrame(resultados)
    criar_tabela_se_nao_existe()

    codigos = df['CD_PROJETO'].tolist()
    codigos_sql = "','".join(str(c) for c in codigos)

    try:
        with engine.connect() as conn:
            print(f"[INFO] Limpando registros antigos...", flush=True)
            conn.execute(sa.text(f"DELETE FROM TMP_AUDITORIA WHERE CD_PROJETO IN ('{codigos_sql}')"))
            conn.commit()

        print(f"[INFO] Inserindo novos registros...", flush=True)
        df.to_sql('TMP_AUDITORIA', con=engine, if_exists='append', index=False)
        print(f"[OK] {len(resultados)} registros salvos em TMP_AUDITORIA", flush=True)
    except Exception as e:
        print(f"[ERRO] Erro ao salvar resultados: {str(e)}", flush=True)


def exportar_comparacao():
    print("\n" + "="*80, flush=True)
    print(">>> MODULO 2: EXPORTACAO E COMPARACAO", flush=True)
    print("="*80, flush=True)

    # Buscar todos os códigos criados
    codigos = buscar_codigos_subprograma()
    if not codigos:
        print("[AVISO] Nenhum codigo encontrado.", flush=True)
        return False

    # Se foi especificado um código de projeto, filtrar
    if CODIGO_PROJETO_FILTRO:
        print(f"[FILTRO] Aplicando filtro: {CODIGO_PROJETO_FILTRO}", flush=True)
        # Normalizar código do filtro
        codigo_filtro_norm = normalizar_nome(CODIGO_PROJETO_FILTRO)
        
        # Filtrar códigos que correspondem
        codigos_filtrados = [c for c in codigos if normalizar_nome(c) == codigo_filtro_norm]
        
        if not codigos_filtrados:
            print(f"[AVISO] Nenhum codigo encontrado correspondente ao filtro: {CODIGO_PROJETO_FILTRO}", flush=True)
            print(f"[INFO] Codigos disponiveis: {codigos}", flush=True)
            return False
        
        codigos = codigos_filtrados
        print(f"[OK] Codigo filtrado: {codigos}", flush=True)

    print(f"[INFO] Encontrados {len(codigos)} codigos para processar", flush=True)
    
    resultados = []
    for i, codigo in enumerate(codigos, 1):
        print(f"\n[PROGRESSO] Processando {i}/{len(codigos)}", flush=True)
        res = executar_comparacao(codigo)
        if res:
            resultados.append(res)

    print(f"\n[INFO] Comparacoes concluidas: {len(resultados)} de {len(codigos)}", flush=True)
    salvar_resultados(resultados)
    return True

# =============================
# EXECUCAO COMPLETA
# =============================

if __name__ == "__main__":
    print("\n" + "="*80, flush=True)
    print(">>> INICIANDO AUDITORIA COMPLETA", flush=True)
    print("="*80, flush=True)

    # Modulo 1
    if not importar_dados_excel():
        print("\n[ERRO] Falha no Modulo 1. Abortando.", flush=True)
        sys.exit(1)

    # Modulo 2
    if not exportar_comparacao():
        print("\n[ERRO] Falha no Modulo 2. Abortando.", flush=True)
        sys.exit(1)

    print("\n" + "="*80, flush=True)
    print("[SUCESSO] Auditoria concluida com sucesso!", flush=True)
    print("="*80, flush=True)
    sys.exit(0)