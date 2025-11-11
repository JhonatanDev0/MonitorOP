from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from config import config
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='development'):
    """Factory para criar a aplicação Flask"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Inicializar extensões
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    
    # Registrar blueprints
    from app.routes import main_bp
    app.register_blueprint(main_bp)
    
    # Criar diretório instance se não existir
    instance_path = app.instance_path
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
    
    # Criar tabelas do banco
    with app.app_context():
        db.create_all()
    
    return app