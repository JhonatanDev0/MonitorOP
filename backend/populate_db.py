"""
Script para popular o banco de dados com dados de exemplo
Execute após criar as migrations: python populate_db.py
"""
from app import create_app, db
from app.models import Projeto, Squad, Atividade
from datetime import datetime, timedelta

app = create_app('development')

with app.app_context():
    # Limpar dados existentes (cuidado em produção!)
    print("Limpando banco de dados...")
    db.drop_all()
    db.create_all()
    
    # Criar Squads
    print("Criando squads...")
    squad1 = Squad(nome="Squad Alpha", descricao="Equipe de desenvolvimento frontend")
    squad2 = Squad(nome="Squad Beta", descricao="Equipe de desenvolvimento backend")
    squad3 = Squad(nome="Squad Gamma", descricao="Equipe de infraestrutura")
    
    db.session.add_all([squad1, squad2, squad3])
    db.session.commit()
    
    # Criar Projetos
    print("Criando projetos (avaliações)...")
    projeto1 = Projeto(
        subprograma="SAEB-2023",
        nome="Avaliação SAEB Ensino Fundamental",
        ordem_producao="OP10",
        data_aplicacao=datetime(2025, 3, 15).date(),
        data_termino=datetime(2025, 3, 20).date(),
        etapas="5º ano, 9º ano",
        disciplinas="Língua Portuguesa, Matemática",
        tipos_processamento="Destaque, Transcrição",
        observacao="Avaliação nacional de larga escala"
    )
    projeto1.squads = [squad1, squad2]
    
    projeto2 = Projeto(
        subprograma="ENEM-2025",
        nome="Exame Nacional do Ensino Médio",
        ordem_producao="OP10",
        data_aplicacao=datetime(2025, 11, 5).date(),
        data_termino=datetime(2025, 11, 12).date(),
        etapas="1º dia, 2º dia",
        disciplinas="Linguagens, Matemática, Ciências Humanas, Ciências da Natureza, Redação",
        tipos_processamento="Transcrição",
        observacao="Aplicação em dois domingos consecutivos"
    )
    projeto2.squads = [squad1]
    
    projeto3 = Projeto(
        subprograma="PISA-2025",
        nome="Avaliação Internacional PISA",
        ordem_producao="OP10",
        data_aplicacao=datetime(2025, 5, 10).date(),
        data_termino=datetime(2025, 5, 15).date(),
        etapas="Etapa única",
        disciplinas="Leitura, Matemática, Ciências",
        tipos_processamento="Destaque",
        observacao="Avaliação aplicada em escolas selecionadas"
    )
    projeto3.squads = [squad3]
    
    db.session.add_all([projeto1, projeto2, projeto3])
    db.session.commit()
    
    # Criar Atividades
    print("Criando atividades...")
    
    # Atividades do Projeto 1
    atividades = [
        Atividade(
            titulo="Implementar autenticação",
            descricao="Criar sistema de login e autenticação JWT",
            prazo=(datetime.now() + timedelta(days=15)).date(),
            prioridade="alta",
            status="em_andamento",
            projeto_id=projeto1.id,
            squad_id=squad2.id
        ),
        Atividade(
            titulo="Criar interface de usuário",
            descricao="Desenvolver telas principais do sistema",
            prazo=(datetime.now() + timedelta(days=20)).date(),
            prioridade="alta",
            status="em_andamento",
            projeto_id=projeto1.id,
            squad_id=squad1.id
        ),
        Atividade(
            titulo="Configurar banco de dados",
            descricao="Setup inicial do PostgreSQL",
            prazo=(datetime.now() + timedelta(days=5)).date(),
            prioridade="media",
            status="concluida",
            projeto_id=projeto1.id,
            squad_id=squad2.id
        ),
        
        # Atividades do Projeto 2
        Atividade(
            titulo="Design do app",
            descricao="Criar protótipos e layouts das telas",
            prazo=(datetime.now() + timedelta(days=10)).date(),
            prioridade="alta",
            status="pendente",
            projeto_id=projeto2.id,
            squad_id=squad1.id
        ),
        Atividade(
            titulo="Integração com API",
            descricao="Conectar app mobile com backend",
            prazo=(datetime.now() + timedelta(days=30)).date(),
            prioridade="media",
            status="pendente",
            projeto_id=projeto2.id,
            squad_id=squad1.id
        ),
        
        # Atividades do Projeto 3
        Atividade(
            titulo="Análise de requisitos cloud",
            descricao="Levantar requisitos para migração",
            prazo=(datetime.now() + timedelta(days=7)).date(),
            prioridade="alta",
            status="concluida",
            projeto_id=projeto3.id,
            squad_id=squad3.id
        ),
        Atividade(
            titulo="Setup AWS",
            descricao="Configurar ambiente na AWS",
            prazo=(datetime.now() + timedelta(days=25)).date(),
            prioridade="alta",
            status="em_andamento",
            projeto_id=projeto3.id,
            squad_id=squad3.id
        ),
        Atividade(
            titulo="Migração de dados",
            descricao="Transferir dados para cloud",
            prazo=(datetime.now() + timedelta(days=60)).date(),
            prioridade="media",
            status="pendente",
            projeto_id=projeto3.id,
            squad_id=squad3.id
        ),
    ]
    
    db.session.add_all(atividades)
    db.session.commit()
    
    print("\n✅ Banco de dados populado com sucesso!")
    print(f"\n📊 Resumo:")
    print(f"   - {Squad.query.count()} squads criadas")
    print(f"   - {Projeto.query.count()} projetos criados")
    print(f"   - {Atividade.query.count()} atividades criadas")
    print("\n🚀 Você pode iniciar a aplicação com: python run.py")
