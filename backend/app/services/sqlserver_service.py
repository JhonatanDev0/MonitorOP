"""
Serviço para conexão com SQL Server e obtenção de dados de auditoria
"""
import pyodbc
import os
from datetime import datetime


class SQLServerService:
    """Serviço para gerenciar conexão com SQL Server"""
    
    def __init__(self):
        # Configurações de conexão (ajuste conforme seu ambiente)
        self.server = os.environ.get('SQLSERVER_HOST', 'localhost\\SQLEXPRESS')
        self.database = os.environ.get('SQLSERVER_DATABASE', 'DB_MONITORAMENTO_OP')
        # self.username = os.environ.get('SQLSERVER_USER', 'seu_usuario')
        # self.password = os.environ.get('SQLSERVER_PASSWORD', 'sua_senha')
        self.trusted_connection = os.environ.get('SQLSERVER_TRUSTED_CONNECTION', 'yes').lower() == 'yes'
        self.driver = '{ODBC Driver 17 for SQL Server}'  # ou '{SQL Server}'
        
    def get_connection(self):
        """Retorna uma conexão com o SQL Server"""
        try:
            conn_str = (
                f'DRIVER={self.driver};'
                f'SERVER={self.server};'
                f'DATABASE={self.database};'
                # f'UID={self.username};'
                # f'PWD={self.password}'
                f'Trusted_Connection={"Yes" if self.trusted_connection else "No"}'
            )
            return pyodbc.connect(conn_str)
        except Exception as e:
            print(f"Erro ao conectar no SQL Server: {str(e)}")
            raise
    
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
                        # Remover o símbolo % e converter para float
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


# Instância global do serviço
sqlserver_service = SQLServerService()