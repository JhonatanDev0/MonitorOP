from app import create_app, db
from app.models import Projeto, Squad, Atividade, Usuario

app = create_app('development')


@app.shell_context_processor
def make_shell_context():
    """Disponibiliza objetos no shell do Flask"""
    return {
        'db': db,
        'Projeto': Projeto,
        'Squad': Squad,
        'Atividade': Atividade,
        'Usuario': Usuario
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
            'atividades': '/api/atividades',
            'auth': '/api/auth/login',
            'usuarios': '/api/usuarios'
        }
    }


if __name__ == '__main__':
    # host='0.0.0.0' permite acesso de outros computadores na rede
    app.run(debug=True, host='0.0.0.0', port=5000)