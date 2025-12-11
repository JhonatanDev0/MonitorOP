"""
Script para criar a tabela de histórico de observações
Execute: python create_historico_table.py
"""
from app import create_app, db
from app.models import HistoricoObservacao

app = create_app('development')

with app.app_context():
    # Criar apenas a nova tabela (não afeta dados existentes)
    print("Criando tabela historico_observacoes...")
    db.create_all()
    print("✅ Tabela criada com sucesso!")
    print("Modelo HistoricoObservacao registrado.")
