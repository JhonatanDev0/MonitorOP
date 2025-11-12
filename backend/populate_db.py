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
    squad1 = Squad(nome="Auditoria", descricao="Squad de auditoria")
    squad2 = Squad(nome="Recodificação", descricao="Squad de Recodificação")
    squad3 = Squad(nome="Processamento", descricao="Squad de Processamento")
    squad4 = Squad(nome="Categorização", descricao="Squad de Categorização")
    squad5 = Squad(nome="Medidas", descricao="Squad de Medidas")
    squad6 = Squad(nome="Cálculo", descricao="Squad de Cálculo")
    squad7 = Squad(nome="Validação", descricao="Squad de Validação")
    squad8 = Squad(nome="Recursos", descricao="Squad de Recursos")
    
    
    db.session.add_all([squad1, squad2, squad3, squad5, squad6, squad7, squad8])
    db.session.commit()
    
    # Criar Projetos
    print("Criando projetos (avaliações)...")
    projeto1 = Projeto(
        subprograma="2026",
        nome="MG BELO HORIZONTE - 3ª AV.SOMATIVA 2025 (SIMULADO)",
        ordem_producao="OP10",
        data_aplicacao=datetime(2025, 10, 20).date(),
        data_termino=datetime(2025, 10, 24).date(),
        etapas="2º ano EF",
        disciplinas="Escrita e Matemática",
        tipos_processamento="Transcrição",
        observacao=""
    )
    projeto1.squads = [squad1, squad2, squad3, squad4, squad5, squad6, squad7, squad8]
    
    projeto2 = Projeto(
        subprograma="2075",
        nome="CE CEARÁ - AV. SOMATIVA EM 2025 (SPAECE EM)",
        ordem_producao="OP10",
        data_aplicacao=datetime(2025, 10, 22).date(),
        data_termino=datetime(2025, 10, 23).date(),
        etapas="2ª série EM, 3ª série EM e EJA EM",
        disciplinas="Língua Portuguesa/Matemática",
        tipos_processamento="Destaque",
        observacao=""
    )
    projeto2.squads = [squad1, squad2, squad3, squad4, squad5, squad6, squad7, squad8]
    
    projeto3 = Projeto(
        subprograma="2132",
        nome="PI PIAUÍ - AV. SOMATIVA 2025 EF EM (SAEPI)",
        ordem_producao="OP10",
        data_aplicacao=datetime(2025, 10, 6).date(),
        data_termino=datetime(2025, 10, 17).date(),
        etapas="5º ano EF, 6º ano EF, 7º ano EF, 8º ano EF, 9º ano EF, 1ª série EM, 2ª série EM e 3ª série EM",
        disciplinas="Língua Portuguesa/Matemática",
        tipos_processamento="Destaque",
        observacao=""
    )
    projeto3.squads = [squad1, squad2, squad3, squad4, squad5, squad6, squad7, squad8]
    
    projeto4 = Projeto(
        subprograma="2085",
        nome="MT MATO GROSSO - AV.SOMATIVA 2025 (AVALIAMT)",
        ordem_producao="OP10",
        data_aplicacao=datetime(2025, 10, 6).date(),
        data_termino=datetime(2025, 10, 17).date(),
        etapas="3º ano EF, 4º ano EF, 5º ano EF, 6º ano EF, 7º ano EF, 8º ano EF, 9º ano EF, 1ª série EM, 2ª série EM, 3ª série EM e 4ª série EM",
        disciplinas="Língua Portuguesa/Matemática",
        tipos_processamento="Destaque e Transcrição",
        observacao=""
    )
    projeto4.squads = [squad1, squad2, squad3, squad4, squad5, squad6, squad7, squad8]    
    
    projeto5 = Projeto(
        subprograma="2087",
        nome="MG BELO HORIZONTE - 5a AV.FORMATIVA 2025 (NOVEMBRO)",
        ordem_producao="OP10",
        data_aplicacao=datetime(2025, 10, 20).date(),
        data_termino=datetime(2025, 10, 24).date(),
        etapas="1º ano EF, 3º ano EF, 4º ano EF, EJA EPA, 6º ano EF, 7º ano EF e 8º ano EF",
        disciplinas="Língua Portuguesa/Matemática, Escrita, Produção Textual e Matemática",
        tipos_processamento="Destaque",
        observacao="Serão processados apenas Escrita e Produção Textual. As Objetivas são de tecnologia 5."
    )
    projeto5.squads = [squad1, squad2, squad3, squad4, squad5, squad6, squad7, squad8]       
    
    projeto6 = Projeto(
        subprograma="2070",
        nome="GO GOIÁS - AV. SOMATIVA EF EM 2025 (SAEGO)",
        ordem_producao="OP09",
        data_aplicacao=datetime(2025, 10, 1).date(),
        data_termino=datetime(2025, 10, 1).date(),
        etapas="9º ano EF e 3ª série EM",
        disciplinas="Língua Portuguesa/Matemática",
        tipos_processamento="Destaque",
        observacao=""
    )
    projeto6.squads = [squad1, squad2, squad3, squad4, squad5, squad6, squad7, squad8]           
    
    db.session.add_all([projeto1, projeto2, projeto3, projeto4, projeto5, projeto6])
    db.session.commit()
    
    # Criar Atividades
    print("Criando atividades...")
    
    # Atividades do Projeto 1

    atividades = [

        # squad1
        Atividade(titulo="Destaque", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad1.id),
        Atividade(titulo="Transcrição", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad1.id),

        # squad2
        Atividade(titulo="CR Reserva", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad2.id),
        Atividade(titulo="CR Anulado", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad2.id),
        Atividade(titulo="CR Duplicado", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad2.id),
        Atividade(titulo="CR Genérico", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad2.id),
        Atividade(titulo="Sujeito C1", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad2.id),
        Atividade(titulo="Sujeito C2", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad2.id),
        Atividade(titulo="Público Alvo", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad2.id),

        # squad3
        Atividade(titulo="Frop Pac", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),
        Atividade(titulo="Frop Dig", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),
        Atividade(titulo="Digitalização", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),
        Atividade(titulo="Decodificação", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),
        Atividade(titulo="Verificação", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),
        Atividade(titulo="Recuperação", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),
        Atividade(titulo="Recuperação Extra", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),
        Atividade(titulo="Certificação", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),
        Atividade(titulo="Correção", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),
        Atividade(titulo="Medida", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad3.id),

        # squad4
        Atividade(titulo="T1", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad4.id),
        Atividade(titulo="T2", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad4.id),
        Atividade(titulo="T3", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad4.id),
        Atividade(titulo="T4 Sujeito", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad4.id),
        Atividade(titulo="T4 Dedução", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad4.id),
        Atividade(titulo="T4 Recuperação", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad4.id),
        Atividade(titulo="T5 Participação", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad4.id),

        # squad5
        Atividade(titulo="ADC", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad5.id),
        Atividade(titulo="NAP", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad5.id),
        Atividade(titulo="MCA", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad5.id),

        # squad6
        Atividade(titulo="Previsto", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad6.id),
        Atividade(titulo="Jira", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad6.id),
        Atividade(titulo="Participação", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad6.id),
        Atividade(titulo="Valor", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad6.id),

        # squad7
        Atividade(titulo="Plano", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad7.id),

        # squad8
        Atividade(titulo="Monitoramento", descricao="", prazo=(datetime.now() + timedelta(days=15)).date(),
                prioridade="alta", status="concluida", projeto_id=projeto1.id, squad_id=squad8.id)
    ]
    db.session.add_all(atividades)
    db.session.commit()
    
    print("\n✅ Banco de dados populado com sucesso!")
    print(f"\n📊 Resumo:")
    print(f"   - {Squad.query.count()} squads criadas")
    print(f"   - {Projeto.query.count()} projetos criados")
    print(f"   - {Atividade.query.count()} atividades criadas")
    print("\n🚀 Você pode iniciar a aplicação com: python run.py")
