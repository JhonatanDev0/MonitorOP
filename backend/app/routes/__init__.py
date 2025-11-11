from flask import Blueprint
from app.routes.projetos import bp as projetos_bp
from app.routes.squads import bp as squads_bp
from app.routes.atividades import bp as atividades_bp
from app.routes.auth import auth_bp
from app.routes.usuarios import usuarios_bp

main_bp = Blueprint('main', __name__)

# Registrar sub-blueprints
main_bp.register_blueprint(projetos_bp)
main_bp.register_blueprint(squads_bp)
main_bp.register_blueprint(atividades_bp)
main_bp.register_blueprint(auth_bp)
main_bp.register_blueprint(usuarios_bp)