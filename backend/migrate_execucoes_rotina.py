"""
Script de migração para adicionar tabelas de execuções de rotina e logs
Executa: python migrate_execucoes_rotina.py
"""

from app import create_app, db
from app.models import ExecucaoRotina, LogExecucao

def migrate():
    """Cria as novas tabelas no banco de dados"""
    app = create_app('development')

    with app.app_context():
        print("🔄 Iniciando migração...")
        print("📋 Criando tabelas: execucoes_rotina e logs_execucao")

        try:
            # Criar todas as tabelas (apenas as novas serão criadas)
            db.create_all()
            print("✅ Migração concluída com sucesso!")
            print("\nTabelas criadas:")
            print("  - execucoes_rotina")
            print("  - logs_execucao")
            print("\nAs tabelas existentes não foram modificadas.")

        except Exception as e:
            print(f"❌ Erro durante a migração: {str(e)}")
            return False

    return True

if __name__ == '__main__':
    migrate()
