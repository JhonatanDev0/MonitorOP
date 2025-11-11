from app import create_app, db
from app.models import Usuario

def criar_admin():
    """Cria o usuário admin inicial se não existir"""
    app = create_app('development')
    
    with app.app_context():
        # Criar todas as tabelas
        db.create_all()
        
        # Verificar se admin já existe
        admin = Usuario.query.filter_by(login='admin').first()
        
        if admin:
            print("❌ Usuário admin já existe!")
            print(f"   Nome: {admin.nome}")
            print(f"   Login: {admin.login}")
            print(f"   Role: {admin.role}")
            return
        
        # Criar admin
        admin = Usuario(
            nome='Administrador',
            login='admin',
            role='admin',
            ativo=True
        )
        admin.set_senha('adminOP')
        
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Usuário admin criado com sucesso!")
        print("   Login: admin")
        print("   Senha: adminOP")
        print("   Role: admin")

if __name__ == '__main__':
    criar_admin()