from app import create_app, db
from app.models import Usuario
from app.utils.notificacao_utils import criar_notificacao

app = create_app('development')

with app.app_context():
    print("Criando notificações de teste...")

    # Buscar o primeiro usuário do sistema
    usuario = Usuario.query.first()

    if not usuario:
        print("❌ Nenhum usuário encontrado no sistema!")
        print("Crie um usuário antes de executar este script.")
        exit(1)

    print(f"✓ Criando notificações para o usuário: {usuario.nome} (ID: {usuario.id})")

    # Notificação 1: Atividade vencida (crítico)
    criar_notificacao(
        usuario_id=usuario.id,
        tipo='atividade',
        titulo='Atividade Vencida',
        mensagem='A atividade "Implementar sistema de autenticação" está vencida há 5 dias',
        prioridade='critico',
        link='/atividades',
        referencia_tipo='atividade',
        referencia_id=1
    )
    print("✓ Notificação criada: Atividade Vencida (crítico)")

    # Notificação 2: Atividade próxima do vencimento (aviso)
    criar_notificacao(
        usuario_id=usuario.id,
        tipo='atividade',
        titulo='Atividade Próxima do Vencimento',
        mensagem='A atividade "Criar relatórios de dashboard" vence em 2 dias',
        prioridade='aviso',
        link='/atividades',
        referencia_tipo='atividade',
        referencia_id=2
    )
    print("✓ Notificação criada: Atividade Próxima do Vencimento (aviso)")

    # Notificação 3: Novo projeto criado (info)
    criar_notificacao(
        usuario_id=usuario.id,
        tipo='projeto',
        titulo='Novo Projeto Criado',
        mensagem='O projeto "Sistema de Monitoramento v2.0" foi criado no sistema',
        prioridade='info',
        link='/projetos'
    )
    print("✓ Notificação criada: Novo Projeto Criado (info)")

    # Notificação 4: Atividade atualizada (info)
    criar_notificacao(
        usuario_id=usuario.id,
        tipo='atividade',
        titulo='Atividade Atualizada',
        mensagem='A atividade "Revisar código da API" teve seu status alterado para Em Andamento',
        prioridade='info',
        link='/atividades'
    )
    print("✓ Notificação criada: Atividade Atualizada (info)")

    # Notificação 5: Manutenção programada (aviso)
    criar_notificacao(
        usuario_id=usuario.id,
        tipo='sistema',
        titulo='Manutenção Programada',
        mensagem='O sistema passará por manutenção no dia 15/12/2025 das 02h às 04h',
        prioridade='aviso'
    )
    print("✓ Notificação criada: Manutenção Programada (aviso)")

    # Notificação 6: Sistema atualizado (info)
    criar_notificacao(
        usuario_id=usuario.id,
        tipo='sistema',
        titulo='Sistema Atualizado',
        mensagem='Nova funcionalidade de notificações foi adicionada ao sistema!',
        prioridade='info'
    )
    print("✓ Notificação criada: Sistema Atualizado (info)")

    print("\n✅ 6 notificações de teste criadas com sucesso!")
    print(f"   Usuário: {usuario.nome} (ID: {usuario.id})")
    print("\nAcesse o sistema para visualizar as notificações no sino 🔔")
