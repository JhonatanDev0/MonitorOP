from app import db
from app.models import Notificacao, Usuario
from datetime import datetime


def criar_notificacao(usuario_id, tipo, titulo, mensagem, prioridade='info', link=None, referencia_tipo=None, referencia_id=None):
    """
    Cria uma nova notificação no sistema

    Args:
        usuario_id: ID do usuário que receberá a notificação
        tipo: Tipo da notificação ('atividade', 'projeto', 'sistema')
        titulo: Título da notificação
        mensagem: Mensagem detalhada
        prioridade: Prioridade ('critico', 'aviso', 'info')
        link: URL para o item relacionado
        referencia_tipo: Tipo do item relacionado ('atividade', 'projeto')
        referencia_id: ID do item relacionado

    Returns:
        Notificacao: A notificação criada
    """
    try:
        notificacao = Notificacao(
            usuario_id=usuario_id,
            tipo=tipo,
            titulo=titulo,
            mensagem=mensagem,
            prioridade=prioridade,
            link=link,
            referencia_tipo=referencia_tipo,
            referencia_id=referencia_id
        )

        db.session.add(notificacao)
        db.session.commit()

        return notificacao
    except Exception as e:
        db.session.rollback()
        raise e


def notificar_todos_gestores(tipo, titulo, mensagem, prioridade='info', link=None):
    """
    Cria notificações para todos os gestores e admins

    Args:
        tipo: Tipo da notificação
        titulo: Título da notificação
        mensagem: Mensagem detalhada
        prioridade: Prioridade da notificação
        link: URL para o item relacionado
    """
    try:
        # Buscar todos os gestores e admins
        gestores = Usuario.query.filter(Usuario.role.in_(['admin', 'gestor']), Usuario.ativo == True).all()

        notificacoes_criadas = 0
        for gestor in gestores:
            criar_notificacao(
                usuario_id=gestor.id,
                tipo=tipo,
                titulo=titulo,
                mensagem=mensagem,
                prioridade=prioridade,
                link=link
            )
            notificacoes_criadas += 1

        return notificacoes_criadas
    except Exception as e:
        db.session.rollback()
        raise e


def notificar_novo_projeto(projeto):
    """
    Notifica gestores e admins sobre um novo projeto criado

    Args:
        projeto: Objeto do projeto criado
    """
    titulo = 'Novo Projeto Criado'
    mensagem = f'O projeto "{projeto.nome}" foi criado no sistema'

    return notificar_todos_gestores(
        tipo='projeto',
        titulo=titulo,
        mensagem=mensagem,
        prioridade='info',
        link='/projetos'
    )


def notificar_atividade_atualizada(atividade, usuario_responsavel_id=None):
    """
    Notifica sobre atualização em uma atividade

    Args:
        atividade: Objeto da atividade atualizada
        usuario_responsavel_id: ID do usuário responsável pela atividade
    """
    titulo = 'Atividade Atualizada'
    mensagem = f'A atividade "{atividade.titulo}" foi atualizada'

    if usuario_responsavel_id:
        return criar_notificacao(
            usuario_id=usuario_responsavel_id,
            tipo='atividade',
            titulo=titulo,
            mensagem=mensagem,
            prioridade='info',
            link='/atividades',
            referencia_tipo='atividade',
            referencia_id=atividade.id
        )

    return None


def notificar_manutencao_sistema(titulo, mensagem, prioridade='aviso'):
    """
    Notifica todos os usuários sobre manutenção do sistema

    Args:
        titulo: Título da notificação
        mensagem: Mensagem sobre a manutenção
        prioridade: Prioridade da notificação
    """
    try:
        usuarios = Usuario.query.filter_by(ativo=True).all()

        notificacoes_criadas = 0
        for usuario in usuarios:
            criar_notificacao(
                usuario_id=usuario.id,
                tipo='sistema',
                titulo=titulo,
                mensagem=mensagem,
                prioridade=prioridade
            )
            notificacoes_criadas += 1

        return notificacoes_criadas
    except Exception as e:
        db.session.rollback()
        raise e
