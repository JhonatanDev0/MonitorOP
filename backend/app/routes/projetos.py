from flask import Blueprint, request, jsonify
from app import db
from app.models import Projeto, Squad
from datetime import datetime

bp = Blueprint('projetos', __name__, url_prefix='/api/projetos')


@bp.route('', methods=['GET'])
def listar_projetos():
    """Lista todos os projetos"""
    try:
        projetos = Projeto.query.all()
        return jsonify([projeto.to_dict() for projeto in projetos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['GET'])
def buscar_projeto(id):
    """Busca um projeto por ID"""
    try:
        projeto = Projeto.query.get_or_404(id)
        return jsonify(projeto.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@bp.route('', methods=['POST'])
def criar_projeto():
    """Cria um novo projeto (avaliação)"""
    try:
        data = request.get_json()
        
        # Validações básicas
        if not data.get('nome'):
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        projeto = Projeto(
            subprograma=data.get('subprograma', ''),
            nome=data['nome'],
            etapas=data.get('etapas', ''),
            disciplinas=data.get('disciplinas', ''),
            tipos_processamento=data.get('tipos_processamento', ''),
            observacao=data.get('observacao', '')
        )
        
        # Datas opcionais
        if data.get('data_aplicacao'):
            projeto.data_aplicacao = datetime.strptime(data['data_aplicacao'], '%Y-%m-%d').date()
        if data.get('data_termino'):
            projeto.data_termino = datetime.strptime(data['data_termino'], '%Y-%m-%d').date()
        
        # Associar squads se fornecidos
        if data.get('squad_ids'):
            squads = Squad.query.filter(Squad.id.in_(data['squad_ids'])).all()
            projeto.squads = squads
        
        db.session.add(projeto)
        db.session.commit()
        
        return jsonify(projeto.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['PUT'])
def atualizar_projeto(id):
    """Atualiza um projeto (avaliação) existente"""
    try:
        projeto = Projeto.query.get_or_404(id)
        data = request.get_json()
        
        # Atualizar campos
        if 'subprograma' in data:
            projeto.subprograma = data['subprograma']
        if 'nome' in data:
            projeto.nome = data['nome']
        if 'etapas' in data:
            projeto.etapas = data['etapas']
        if 'disciplinas' in data:
            projeto.disciplinas = data['disciplinas']
        if 'tipos_processamento' in data:
            projeto.tipos_processamento = data['tipos_processamento']
        if 'observacao' in data:
            projeto.observacao = data['observacao']
        if 'data_aplicacao' in data:
            projeto.data_aplicacao = datetime.strptime(data['data_aplicacao'], '%Y-%m-%d').date() if data['data_aplicacao'] else None
        if 'data_termino' in data:
            projeto.data_termino = datetime.strptime(data['data_termino'], '%Y-%m-%d').date() if data['data_termino'] else None
        
        # Atualizar squads se fornecidos
        if 'squad_ids' in data:
            squads = Squad.query.filter(Squad.id.in_(data['squad_ids'])).all()
            projeto.squads = squads
        
        db.session.commit()
        
        return jsonify(projeto.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['DELETE'])
def deletar_projeto(id):
    """Deleta um projeto"""
    try:
        projeto = Projeto.query.get_or_404(id)
        db.session.delete(projeto)
        db.session.commit()
        
        return jsonify({'message': 'Projeto deletado com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>/atividades', methods=['GET'])
def listar_atividades_projeto(id):
    """Lista todas as atividades de um projeto"""
    try:
        projeto = Projeto.query.get_or_404(id)
        atividades = [atividade.to_dict() for atividade in projeto.atividades]
        return jsonify(atividades), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404
