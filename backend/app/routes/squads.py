from flask import Blueprint, request, jsonify
from app import db
from app.models import Squad, Projeto

bp = Blueprint('squads', __name__, url_prefix='/api/squads')


@bp.route('', methods=['GET'])
def listar_squads():
    """Lista todas as squads"""
    try:
        squads = Squad.query.all()
        return jsonify([squad.to_dict() for squad in squads]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['GET'])
def buscar_squad(id):
    """Busca uma squad por ID"""
    try:
        squad = Squad.query.get_or_404(id)
        return jsonify(squad.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@bp.route('', methods=['POST'])
def criar_squad():
    """Cria uma nova squad"""
    try:
        data = request.get_json()
        
        # Validações básicas
        if not data.get('nome'):
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        # Verificar se já existe squad com esse nome
        if Squad.query.filter_by(nome=data['nome']).first():
            return jsonify({'error': 'Já existe uma squad com esse nome'}), 400
        
        squad = Squad(
            nome=data['nome'],
            descricao=data.get('descricao', '')
        )
        
        db.session.add(squad)
        db.session.commit()
        
        return jsonify(squad.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['PUT'])
def atualizar_squad(id):
    """Atualiza uma squad existente"""
    try:
        squad = Squad.query.get_or_404(id)
        data = request.get_json()
        
        # Atualizar campos
        if 'nome' in data:
            # Verificar se o novo nome já existe (exceto para a própria squad)
            existing = Squad.query.filter_by(nome=data['nome']).first()
            if existing and existing.id != id:
                return jsonify({'error': 'Já existe uma squad com esse nome'}), 400
            squad.nome = data['nome']
        
        if 'descricao' in data:
            squad.descricao = data['descricao']
        
        db.session.commit()
        
        return jsonify(squad.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['DELETE'])
def deletar_squad(id):
    """Deleta uma squad"""
    try:
        squad = Squad.query.get_or_404(id)
        
        # Verificar se a squad tem atividades associadas
        if len(squad.atividades) > 0:
            return jsonify({'error': 'Não é possível deletar squad com atividades associadas'}), 400
        
        db.session.delete(squad)
        db.session.commit()
        
        return jsonify({'message': 'Squad deletada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>/projetos', methods=['GET'])
def listar_projetos_squad(id):
    """Lista todos os projetos de uma squad"""
    try:
        squad = Squad.query.get_or_404(id)
        projetos = [{'id': p.id, 'nome': p.nome} for p in squad.projetos]
        return jsonify(projetos), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@bp.route('/<int:id>/atividades', methods=['GET'])
def listar_atividades_squad(id):
    """Lista todas as atividades de uma squad"""
    try:
        squad = Squad.query.get_or_404(id)
        atividades = [atividade.to_dict() for atividade in squad.atividades]
        return jsonify(atividades), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404
