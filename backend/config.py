import os
from pathlib import Path

basedir = Path(__file__).parent


class Config:
    """Configurações base da aplicação"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f'sqlite:///{basedir / "instance" / "atividades.db"}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')


class DevelopmentConfig(Config):
    """Configurações de desenvolvimento"""
    DEBUG = True
    # Permitir CORS de qualquer origem em desenvolvimento
    CORS_ORIGINS = '*'


class ProductionConfig(Config):
    """Configurações de produção"""
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
