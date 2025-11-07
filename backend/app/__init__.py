from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import config

# Inicialização das extensões
db = SQLAlchemy()
migrate = Migrate()


def create_app(config_name='default'):
    """Factory function para criar a aplicação Flask"""
    app = Flask(__name__)
    
    # Carregar configurações
    app.config.from_object(config[config_name])
    
    # Inicializar extensões
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Registrar blueprints (rotas)
    from app.routes import projetos, squads, atividades
    
    app.register_blueprint(projetos.bp)
    app.register_blueprint(squads.bp)
    app.register_blueprint(atividades.bp)
    
    # Criar diretório instance se não existir
    import os
    instance_path = os.path.join(app.root_path, '..', 'instance')
    os.makedirs(instance_path, exist_ok=True)
    
    return app
