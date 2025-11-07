from flask import Blueprint, request, jsonify
from app import db
from app.models import Atividade, Projeto, Squad
from datetime import datetime

bp = Blueprint('atividades', __name__, url_prefix='/api/atividades')


@bp.route('', methods=['GET'])
def listar_atividades():
    """Lista todas as atividades com filtros opcionais"""
    try:
        query = Atividade.query
        
        # Filtros opcionais via query params
        projeto_id = request.args.get('projeto_id', type=int)
        squad_id = request.args.get('squad_id', type=int)
        status = request.args.get('status')
        prioridade = request.args.get('prioridade')
        
        if projeto_id:
            query = query.filter_by(projeto_id=projeto_id)
        if squad_id:
            query = query.filter_by(squad_id=squad_id)
        if status:
            query = query.filter_by(status=status)
        if prioridade:
            query = query.filter_by(prioridade=prioridade)
        
        atividades = query.all()
        return jsonify([atividade.to_dict() for atividade in atividades]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['GET'])
def buscar_atividade(id):
    """Busca uma atividade por ID"""
    try:
        atividade = Atividade.query.get_or_404(id)
        return jsonify(atividade.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@bp.route('', methods=['POST'])
def criar_atividade():
    """Cria uma nova atividade"""
    try:
        data = request.get_json()
        
        # Validações básicas
        if not data.get('titulo'):
            return jsonify({'error': 'Título é obrigatório'}), 400
        if not data.get('projeto_id'):
            return jsonify({'error': 'Projeto é obrigatório'}), 400
        if not data.get('squad_id'):
            return jsonify({'error': 'Squad é obrigatória'}), 400
        
        # Verificar se projeto existe
        projeto = Projeto.query.get(data['projeto_id'])
        if not projeto:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        # Verificar se squad existe
        squad = Squad.query.get(data['squad_id'])
        if not squad:
            return jsonify({'error': 'Squad não encontrada'}), 404
        
        atividade = Atividade(
            titulo=data['titulo'],
            descricao=data.get('descricao', ''),
            prioridade=data.get('prioridade', 'media'),
            status=data.get('status', 'pendente'),
            projeto_id=data['projeto_id'],
            squad_id=data['squad_id']
        )
        
        # Prazo opcional
        if data.get('prazo'):
            atividade.prazo = datetime.strptime(data['prazo'], '%Y-%m-%d').date()
        
        db.session.add(atividade)
        db.session.commit()
        
        return jsonify(atividade.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['PUT'])
def atualizar_atividade(id):
    """Atualiza uma atividade existente"""
    try:
        atividade = Atividade.query.get_or_404(id)
        data = request.get_json()
        
        # Atualizar campos
        if 'titulo' in data:
            atividade.titulo = data['titulo']
        if 'descricao' in data:
            atividade.descricao = data['descricao']
        if 'prioridade' in data:
            if data['prioridade'] not in ['baixa', 'media', 'alta']:
                return jsonify({'error': 'Prioridade inválida. Use: baixa, media ou alta'}), 400
            atividade.prioridade = data['prioridade']
        if 'status' in data:
            if data['status'] not in ['pendente', 'em_andamento', 'concluida']:
                return jsonify({'error': 'Status inválido. Use: pendente, em_andamento ou concluida'}), 400
            atividade.status = data['status']
        if 'prazo' in data:
            atividade.prazo = datetime.strptime(data['prazo'], '%Y-%m-%d').date() if data['prazo'] else None
        if 'projeto_id' in data:
            projeto = Projeto.query.get(data['projeto_id'])
            if not projeto:
                return jsonify({'error': 'Projeto não encontrado'}), 404
            atividade.projeto_id = data['projeto_id']
        if 'squad_id' in data:
            squad = Squad.query.get(data['squad_id'])
            if not squad:
                return jsonify({'error': 'Squad não encontrada'}), 404
            atividade.squad_id = data['squad_id']
        
        db.session.commit()
        
        return jsonify(atividade.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:id>', methods=['DELETE'])
def deletar_atividade(id):
    """Deleta uma atividade"""
    try:
        atividade = Atividade.query.get_or_404(id)
        db.session.delete(atividade)
        db.session.commit()
        
        return jsonify({'message': 'Atividade deletada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/estatisticas', methods=['GET'])
def estatisticas():
    """Retorna estatísticas gerais das atividades"""
    try:
        total = Atividade.query.count()
        pendentes = Atividade.query.filter_by(status='pendente').count()
        em_andamento = Atividade.query.filter_by(status='em_andamento').count()
        concluidas = Atividade.query.filter_by(status='concluida').count()
        
        por_prioridade = {
            'baixa': Atividade.query.filter_by(prioridade='baixa').count(),
            'media': Atividade.query.filter_by(prioridade='media').count(),
            'alta': Atividade.query.filter_by(prioridade='alta').count()
        }
        
        return jsonify({
            'total': total,
            'por_status': {
                'pendente': pendentes,
                'em_andamento': em_andamento,
                'concluida': concluidas
            },
            'por_prioridade': por_prioridade
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
