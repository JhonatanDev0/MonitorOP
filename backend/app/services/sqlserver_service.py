"""
Serviço para conexão com SQL Server e obtenção de dados de auditoria e recodificação
"""
import pyodbc
import os
from datetime import datetime


class SQLServerService:
    """Serviço para gerenciar conexão com SQL Server"""
    
    def __init__(self):
        # Possíveis hosts (prioridade da esquerda para a direita)
        self.candidate_servers = [
            os.environ.get('SQLSERVER_HOST_PRIMARY', '192.168.250.8,61433'),
            os.environ.get('SQLSERVER_HOST_SECONDARY', 'localhost\\SQLEXPRESS'),
        ]

        # Configurações gerais
        self.database = os.environ.get('SQLSERVER_DATABASE', 'DB_MONITORAMENTO_OP')
        self.username = os.environ.get('SQLSERVER_USER','SDV')
        self.password = os.environ.get('SQLSERVER_PASSWORD','SDV_COA')
        self.trusted_connection = os.environ.get('SQLSERVER_TRUSTED_CONNECTION', 'yes').lower() in ('yes', 'true', '1')
        self.driver = os.environ.get('SQLSERVER_DRIVER', '{ODBC Driver 17 for SQL Server}')

        # Escolher o primeiro servidor que aceitar conexão
        self.server = None
        for candidate in self.candidate_servers:
            try:
                conn_str = (
                    f'DRIVER={self.driver};'
                    f'SERVER={candidate};'
                    f'DATABASE={self.database};'
                    f'Trusted_Connection={"Yes" if self.trusted_connection else "No"}'
                )
                if not self.trusted_connection and self.username and self.password:
                    conn_str += f';UID={self.username};PWD={self.password}'

                # tentativa rápida para validar o servidor
                conn = pyodbc.connect(conn_str, timeout=5)
                conn.close()
                self.server = candidate
                break
            except Exception:
                continue

        # Se nenhum candidato respondeu, usa o primeiro como fallback
        if not self.server:
            self.server = self.candidate_servers[0]
        
    def get_connection(self):
        """Retorna uma conexão com o SQL Server"""
        try:
            conn_str = (
                f'DRIVER={self.driver};'
                f'SERVER={self.server};'
                f'DATABASE={self.database};'
                f'Trusted_Connection={"Yes" if self.trusted_connection else "No"}'
            )
            if not self.trusted_connection and self.username and self.password:
                conn_str += f';UID={self.username};PWD={self.password}'
            
            return pyodbc.connect(conn_str)
        except Exception as e:
            print(f"Erro ao conectar no SQL Server: {str(e)}")
            raise
    
    # ==================== MÉTODOS DE AUDITORIA ====================
    
    def fetch_auditoria_data(self, cd_projeto=None):
        """
        Busca dados de auditoria do SQL Server
        
        Args:
            cd_projeto: Código do projeto (opcional)
            
        Returns:
            Lista de dicionários com os dados
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Query base
            query = """
                SELECT 
                    CD_PROJETO,
                    DT_EXPORTACAO,
                    QT_PACOTE_METRICA,
                    QT_PACOTE_PREVISTO_TRANSCRICAO,
                    QT_PACOTE_TRANSCRICAO,
                    PCT_PACOTE_TRANSCRICAO
                FROM TMP_AUDITORIA
            """
            
            # Adicionar filtro se necessário
            if cd_projeto:
                query += " WHERE CD_PROJETO = ?"
                cursor.execute(query, (cd_projeto,))
            else:
                cursor.execute(query)
            
            # Buscar colunas
            columns = [column[0] for column in cursor.description]
            
            # Converter resultados para lista de dicionários
            results = []
            for row in cursor.fetchall():
                row_dict = {}
                for i, value in enumerate(row):
                    # Converter data para ISO format se for datetime
                    if isinstance(value, datetime):
                        row_dict[columns[i]] = value.strftime('%Y-%m-%d')
                    # Converter porcentagem para float se necessário
                    elif columns[i].startswith('PCT_') and isinstance(value, str):
                        row_dict[columns[i]] = float(value.replace('%', '').replace(',', '.'))
                    else:
                        row_dict[columns[i]] = value
                
                results.append(row_dict)
            
            cursor.close()
            conn.close()
            
            return results
            
        except Exception as e:
            print(f"Erro ao buscar dados de auditoria: {str(e)}")
            raise
    
    def fetch_auditoria_historico(self, cd_projeto):
        """
        Busca histórico de auditoria por projeto (todas as datas de exportação)
        
        Args:
            cd_projeto: Código do projeto
            
        Returns:
            Lista de dicionários ordenados por data
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT 
                    CD_PROJETO,
                    DT_EXPORTACAO,
                    QT_PACOTE_METRICA,
                    QT_PACOTE_PREVISTO_TRANSCRICAO,
                    QT_PACOTE_TRANSCRICAO,
                    PCT_PACOTE_TRANSCRICAO
                FROM TMP_AUDITORIA
                WHERE CD_PROJETO = ?
                ORDER BY DT_EXPORTACAO ASC
            """
            
            cursor.execute(query, (cd_projeto,))
            
            columns = [column[0] for column in cursor.description]
            
            results = []
            for row in cursor.fetchall():
                row_dict = {}
                for i, value in enumerate(row):
                    if isinstance(value, datetime):
                        row_dict[columns[i]] = value.strftime('%Y-%m-%d')
                    elif columns[i].startswith('PCT_') and isinstance(value, str):
                        row_dict[columns[i]] = float(value.replace('%', '').replace(',', '.'))
                    else:
                        row_dict[columns[i]] = value
                
                results.append(row_dict)
            
            cursor.close()
            conn.close()
            
            return results
            
        except Exception as e:
            print(f"Erro ao buscar histórico de auditoria: {str(e)}")
            raise
    
    # ==================== MÉTODOS DE RECODIFICAÇÃO ====================
    
    def fetch_reserva_data(self, cd_projeto=None):
        """
        Busca dados de reserva (recodificação) do SQL Server
        
        Args:
            cd_projeto: Código do projeto (opcional)
            
        Returns:
            Lista de dicionários com os dados
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Query base
            query = """
                SELECT 
                    CD_PROJETO,
                    DT_CRIACAO,
                    INDICADOR AS TP_RESERVA,
                    PREVISTO AS QT_PREVISTO,
                    EFETIVO AS QT_EFETIVO
                FROM TMP_RESERVA
            """
            
            # Adicionar filtro se necessário
            if cd_projeto:
                query += " WHERE CD_PROJETO = ?"
                cursor.execute(query, (cd_projeto,))
            else:
                cursor.execute(query)
            
            # Buscar colunas
            columns = [column[0] for column in cursor.description]
            
            # Converter resultados para lista de dicionários
            results = []
            for row in cursor.fetchall():
                row_dict = {}
                for i, value in enumerate(row):
                    # Converter data para ISO format se for datetime
                    if isinstance(value, datetime):
                        row_dict[columns[i]] = value.strftime('%Y-%m-%d')
                    # Converter None para 0 em valores numéricos
                    elif columns[i] in ['QT_PREVISTO'] and value is None:
                        row_dict[columns[i]] = 0
                    # Manter QT_EFETIVO como string (pode ter barra "/")
                    elif columns[i] == 'QT_EFETIVO' and value is None:
                        row_dict[columns[i]] = '0'
                    else:
                        row_dict[columns[i]] = value
                
                results.append(row_dict)
            
            cursor.close()
            conn.close()
            
            return results
            
        except Exception as e:
            print(f"Erro ao buscar dados de reserva: {str(e)}")
            raise
    
    def fetch_reserva_historico(self, cd_projeto):
        """
        Busca histórico de reserva por projeto (todas as datas de criação)
        
        Args:
            cd_projeto: Código do projeto
            
        Returns:
            Lista de dicionários ordenados por data
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT 
                    CD_PROJETO,
                    DT_CRIACAO,
                    INDICADOR AS TP_RESERVA,
                    PREVISTO AS QT_PREVISTO,
                    EFETIVO AS QT_EFETIVO
                FROM TMP_RESERVA
                WHERE CD_PROJETO = ?
                ORDER BY DT_CRIACAO ASC, INDICADOR ASC
            """
            
            cursor.execute(query, (cd_projeto,))
            
            columns = [column[0] for column in cursor.description]
            
            results = []
            for row in cursor.fetchall():
                row_dict = {}
                for i, value in enumerate(row):
                    if isinstance(value, datetime):
                        row_dict[columns[i]] = value.strftime('%Y-%m-%d')
                    elif columns[i] in ['QT_PREVISTO'] and value is None:
                        row_dict[columns[i]] = 0
                    elif columns[i] == 'QT_EFETIVO' and value is None:
                        row_dict[columns[i]] = '0'
                    else:
                        row_dict[columns[i]] = value
                
                results.append(row_dict)
            
            cursor.close()
            conn.close()
            
            return results
            
        except Exception as e:
            print(f"Erro ao buscar histórico de reserva: {str(e)}")
            raise


# Instância global do serviço
sqlserver_service = SQLServerService()