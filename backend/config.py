import os
from pathlib import Path
from datetime import timedelta

basedir = Path(__file__).parent


class Config:
    """Configurações base da aplicação"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f'sqlite:///{basedir / "instance" / "atividades.db"}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = False  # Sessão do navegador (não expira automaticamente)


class DevelopmentConfig(Config):
    """Configurações de desenvolvimento"""
    DEBUG = True
    # Permitir CORS de qualquer origem em desenvolvimento
    CORS_ORIGINS = '*'


class ProductionConfig(Config):
    """Configurações de produção"""
    DEBUG = False
    # Em produção, definir JWT_SECRET_KEY diferente via variável de ambiente
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'change-this-in-production-to-random-string'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}