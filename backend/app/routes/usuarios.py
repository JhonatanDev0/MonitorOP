from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import db, Usuario
from app.utils.pagination import paginate_query

usuarios_bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')

def admin_required():
    """Verifica se o usuário é admin"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True

@usuarios_bp.route('', methods=['GET'])
@jwt_required()
def listar_usuarios():
    """Lista todos os usuários (apenas Admin) com paginação opcional"""
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        query = Usuario.query.order_by(Usuario.nome)
        
        # Verificar se a paginação foi solicitada
        if request.args.get('page'):
            # Com paginação
            result = paginate_query(query, default_per_page=5)
            return jsonify({
                'items': [u.to_dict() for u in result['items']],
                'pagination': result['pagination']
            }), 200
        else:
            # Sem paginação (compatibilidade com código antigo)
            usuarios = query.all()
            return jsonify([u.to_dict() for u in usuarios]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@usuarios_bp.route('', methods=['POST'])
@jwt_required()
def criar_usuario():
    """Cria novo usuário (apenas Admin)"""
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        # Validações
        if not data.get('nome') or not data.get('login') or not data.get('senha'):
            return jsonify({'error': 'Nome, login e senha são obrigatórios'}), 400
        
        # Verificar se login já existe
        if Usuario.query.filter_by(login=data['login']).first():
            return jsonify({'error': 'Login já existe'}), 400
        
        # Criar usuário
        usuario = Usuario(
            nome=data['nome'],
            login=data['login'],
            role=data.get('role', 'analista'),
            ativo=data.get('ativo', True)
        )
        usuario.set_senha(data['senha'])
        
        db.session.add(usuario)
        db.session.commit()
        
        return jsonify(usuario.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar usuário: {str(e)}")
        return jsonify({'error': str(e)}), 500


@usuarios_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def atualizar_usuario(id):
    """Atualiza usuário (apenas Admin)"""
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        usuario = Usuario.query.get_or_404(id)
        data = request.get_json()
        
        # Atualizar campos
        if 'nome' in data:
            usuario.nome = data['nome']
        if 'login' in data:
            # Verificar se novo login já existe
            existing = Usuario.query.filter_by(login=data['login']).first()
            if existing and existing.id != id:
                return jsonify({'error': 'Login já existe'}), 400
            usuario.login = data['login']
        if 'role' in data:
            usuario.role = data['role']
        if 'ativo' in data:
            usuario.ativo = bool(data['ativo'])
        if 'senha' in data and data['senha']:
            usuario.set_senha(data['senha'])
        
        db.session.commit()
        return jsonify(usuario.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar usuário: {str(e)}")
        return jsonify({'error': str(e)}), 500


@usuarios_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_usuario(id):
    """Deleta usuário (apenas Admin)"""
    try:
        if not admin_required():
            return jsonify({'error': 'Acesso negado'}), 403
        
        usuario_logado_id = int(get_jwt_identity())
        if usuario_logado_id == id:
            return jsonify({'error': 'Não é possível deletar seu próprio usuário'}), 400
        
        usuario = Usuario.query.get_or_404(id)
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({'message': 'Usuário deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500