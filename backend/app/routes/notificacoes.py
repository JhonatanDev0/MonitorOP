from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Notificacao, Usuario
from datetime import datetime, timedelta

bp = Blueprint('notificacoes', __name__, url_prefix='/api/notificacoes')


@bp.route('', methods=['GET'])
@jwt_required()
def listar_notificacoes():
    """Lista notificações do usuário logado"""
    try:
        usuario_id = get_jwt_identity()

        # Filtros opcionais
        apenas_nao_lidas = request.args.get('nao_lidas', 'false').lower() == 'true'
        limit = request.args.get('limit', type=int, default=50)

        query = Notificacao.query.filter_by(usuario_id=usuario_id)

        if apenas_nao_lidas:
            query = query.filter_by(lida=False)

        # Ordenar por data de criação (mais recentes primeiro)
        notificacoes = query.order_by(Notificacao.data_criacao.desc()).limit(limit).all()

        # Contar não lidas
        nao_lidas = Notificacao.query.filter_by(usuario_id=usuario_id, lida=False).count()

        return jsonify({
            'notificacoes': [n.to_dict() for n in notificacoes],
            'total_nao_lidas': nao_lidas
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>/marcar-lida', methods=['PUT'])
@jwt_required()
def marcar_como_lida(id):
    """Marca uma notificação como lida"""
    try:
        usuario_id = get_jwt_identity()

        notificacao = Notificacao.query.filter_by(id=id, usuario_id=usuario_id).first_or_404()
        notificacao.lida = True

        db.session.commit()

        return jsonify({
            'message': 'Notificação marcada como lida',
            'notificacao': notificacao.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>/marcar-nao-lida', methods=['PUT'])
@jwt_required()
def marcar_como_nao_lida(id):
    """Marca uma notificação como não lida"""
    try:
        usuario_id = get_jwt_identity()

        notificacao = Notificacao.query.filter_by(id=id, usuario_id=usuario_id).first_or_404()
        notificacao.lida = False

        db.session.commit()

        return jsonify({
            'message': 'Notificação marcada como não lida',
            'notificacao': notificacao.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/marcar-todas-lidas', methods=['PUT'])
@jwt_required()
def marcar_todas_lidas():
    """Marca todas as notificações como lidas"""
    try:
        usuario_id = get_jwt_identity()

        Notificacao.query.filter_by(usuario_id=usuario_id, lida=False).update({'lida': True})
        db.session.commit()

        return jsonify({'message': 'Todas as notificações foram marcadas como lidas'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_notificacao(id):
    """Deleta uma notificação"""
    try:
        usuario_id = get_jwt_identity()

        notificacao = Notificacao.query.filter_by(id=id, usuario_id=usuario_id).first_or_404()
        db.session.delete(notificacao)
        db.session.commit()

        return jsonify({'message': 'Notificação deletada com sucesso'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/verificar-atividades-vencidas', methods=['POST'])
@jwt_required()
def verificar_atividades_vencidas():
    """Cria notificações para atividades vencidas ou próximas do vencimento"""
    try:
        from app.models import Atividade

        hoje = datetime.now().date()
        proximo_vencimento = hoje + timedelta(days=3)  # 3 dias

        # Buscar atividades pendentes ou em andamento com prazo
        atividades = Atividade.query.filter(
            Atividade.status.in_(['pendente', 'em_andamento']),
            Atividade.fim_programado.isnot(None)
        ).all()

        notificacoes_criadas = 0

        for atividade in atividades:
            # Verificar se já existe notificação para esta atividade
            existe = Notificacao.query.filter_by(
                referencia_tipo='atividade',
                referencia_id=atividade.id,
                lida=False
            ).first()

            if existe:
                continue

            # Atividade vencida
            if atividade.fim_programado < hoje:
                dias_vencida = (hoje - atividade.fim_programado).days

                notificacao = Notificacao(
                    usuario_id=get_jwt_identity(),
                    tipo='atividade',
                    titulo='Atividade Vencida',
                    mensagem=f'A atividade "{atividade.titulo}" está vencida há {dias_vencida} dia(s)',
                    prioridade='critico',
                    link=f'/atividades',
                    referencia_tipo='atividade',
                    referencia_id=atividade.id
                )
                db.session.add(notificacao)
                notificacoes_criadas += 1

            # Atividade próxima do vencimento
            elif atividade.fim_programado <= proximo_vencimento:
                dias_restantes = (atividade.fim_programado - hoje).days

                notificacao = Notificacao(
                    usuario_id=get_jwt_identity(),
                    tipo='atividade',
                    titulo='Atividade Próxima do Vencimento',
                    mensagem=f'A atividade "{atividade.titulo}" vence em {dias_restantes} dia(s)',
                    prioridade='aviso',
                    link=f'/atividades',
                    referencia_tipo='atividade',
                    referencia_id=atividade.id
                )
                db.session.add(notificacao)
                notificacoes_criadas += 1

        db.session.commit()

        return jsonify({
            'message': f'{notificacoes_criadas} notificação(ões) criada(s)',
            'quantidade': notificacoes_criadas
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
