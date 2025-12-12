from app import create_app, db
from app.models import Notificacao

app = create_app('development')

with app.app_context():
    print("Criando tabela de notificações...")
    db.create_all()
    print("✅ Tabela 'notificacoes' criada com sucesso!")
    print("\nEstrutura da tabela:")
    print("- id: Integer (Primary Key)")
    print("- usuario_id: Integer (Foreign Key -> usuarios)")
    print("- tipo: String(50) - Tipo da notificação (atividade, projeto, sistema)")
    print("- titulo: String(200) - Título da notificação")
    print("- mensagem: Text - Mensagem detalhada")
    print("- prioridade: String(20) - Prioridade (critico, aviso, info)")
    print("- lida: Boolean - Se foi lida ou não")
    print("- link: String(200) - URL para o item relacionado")
    print("- referencia_tipo: String(50) - Tipo do item relacionado")
    print("- referencia_id: Integer - ID do item relacionado")
    print("- data_criacao: DateTime - Data de criação")
