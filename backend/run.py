from app import create_app, db
from app.models import Projeto, Squad, Atividade

app = create_app('development')


@app.shell_context_processor
def make_shell_context():
    """Disponibiliza objetos no shell do Flask"""
    return {
        'db': db,
        'Projeto': Projeto,
        'Squad': Squad,
        'Atividade': Atividade
    }


@app.route('/')
def index():
    """Rota inicial para verificar se a API está funcionando"""
    return {
        'message': 'API de Acompanhamento de Atividades',
        'version': '1.0',
        'endpoints': {
            'projetos': '/api/projetos',
            'squads': '/api/squads',
            'atividades': '/api/atividades'
        }
    }


if __name__ == '__main__':
    app.run(debug=True, port=5000)
