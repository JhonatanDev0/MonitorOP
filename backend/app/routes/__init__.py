from flask import Blueprint
from app.routes.projetos import bp as projetos_bp
from app.routes.squads import bp as squads_bp
from app.routes.atividades import bp as atividades_bp
from app.routes.auth import auth_bp
from app.routes.usuarios import usuarios_bp
from app.routes.dashboard_routes import bp as dashboard_bp
from app.routes.recodificacao_routes import bp as recodificacao_bp
from app.routes.categorizacao_routes import bp as categorizacao_bp
from app.routes.frop_pacote_routes import bp as frop_pacote_bp
from app.routes.notificacoes import bp as notificacoes_bp

main_bp = Blueprint('main', __name__)

# Registrar sub-blueprints
main_bp.register_blueprint(projetos_bp)
main_bp.register_blueprint(squads_bp)
main_bp.register_blueprint(atividades_bp)
main_bp.register_blueprint(auth_bp)
main_bp.register_blueprint(usuarios_bp)
main_bp.register_blueprint(dashboard_bp)
main_bp.register_blueprint(recodificacao_bp)
main_bp.register_blueprint(categorizacao_bp)
main_bp.register_blueprint(frop_pacote_bp)
main_bp.register_blueprint(notificacoes_bp)