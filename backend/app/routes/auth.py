from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    jwt_required, 
    get_jwt_identity, 
    get_jwt
)
from app.models import db, Usuario
from datetime import timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """Rota de login"""
    try:
        data = request.get_json()
        login = data.get('login')
        senha = data.get('senha')
        lembrar = data.get('lembrar', False)
        
        if not login or not senha:
            return jsonify({'error': 'Login e senha são obrigatórios'}), 400
        
        # Buscar usuário
        usuario = Usuario.query.filter_by(login=login).first()
        
        if not usuario:
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        if not usuario.ativo:
            return jsonify({'error': 'Usuário inativo'}), 401
        
        # Verificar senha
        if not usuario.check_senha(senha):
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Definir expiração do token baseado em "lembrar-me"
        if lembrar:
            expires = timedelta(days=30)
        else:
            expires = timedelta(hours=8)
        
        # Criar token JWT
        access_token = create_access_token(
            identity=usuario.id,
            additional_claims={'role': usuario.role},
            expires_delta=expires
        )
        
        return jsonify({
            'token': access_token,
            'usuario': usuario.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_usuario_logado():
    """Retorna dados do usuário logado"""
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        return jsonify(usuario.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/check', methods=['GET'])
@jwt_required()
def check_token():
    """Verifica se o token é válido"""
    try:
        usuario_id = get_jwt_identity()
        claims = get_jwt()
        
        return jsonify({
            'valid': True,
            'usuario_id': usuario_id,
            'role': claims.get('role')
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401