from datetime import datetime
from app import db


class Projeto(db.Model):
    __tablename__ = 'projetos'
    
    id = db.Column(db.Integer, primary_key=True)
    subprograma = db.Column(db.String(100))
    nome = db.Column(db.String(200), nullable=False)
    ordem_producao = db.Column(db.String(100))
    data_aplicacao = db.Column(db.Date)
    data_termino = db.Column(db.Date)
    etapas = db.Column(db.String(200))
    disciplinas = db.Column(db.String(200))
    tipos_processamento = db.Column(db.String(200))
    observacao = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    squads = db.relationship('Squad', secondary='projeto_squad', back_populates='projetos')
    atividades = db.relationship('Atividade', back_populates='projeto', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'subprograma': self.subprograma,
            'nome': self.nome,
            'ordem_producao': self.ordem_producao,
            'data_aplicacao': self.data_aplicacao.isoformat() if self.data_aplicacao else None,
            'data_termino': self.data_termino.isoformat() if self.data_termino else None,
            'etapas': self.etapas,
            'disciplinas': self.disciplinas,
            'tipos_processamento': self.tipos_processamento,
            'observacao': self.observacao,
            'squads': [{'id': s.id, 'nome': s.nome} for s in self.squads],
            'total_atividades': len(self.atividades),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Squad(db.Model):
    __tablename__ = 'squads'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    projetos = db.relationship('Projeto', secondary='projeto_squad', back_populates='squads')
    atividades = db.relationship('Atividade', back_populates='squad')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'total_projetos': len(self.projetos),
            'total_atividades': len(self.atividades),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# Tabela associativa muitos-para-muitos
projeto_squad = db.Table('projeto_squad',
    db.Column('projeto_id', db.Integer, db.ForeignKey('projetos.id'), primary_key=True),
    db.Column('squad_id', db.Integer, db.ForeignKey('squads.id'), primary_key=True)
)


class Atividade(db.Model):
    __tablename__ = 'atividades'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    observacao = db.Column(db.Text)
    inicio_programado = db.Column(db.Date)
    inicio_realizado = db.Column(db.Date)
    fim_programado = db.Column(db.Date)
    fim_realizado = db.Column(db.Date)
    prioridade = db.Column(db.String(20), default='media')  # baixa, media, alta
    status = db.Column(db.String(20), default='pendente')  # pendente, em_andamento, concluida
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id'), nullable=False)
    squad_id = db.Column(db.Integer, db.ForeignKey('squads.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    projeto = db.relationship('Projeto', back_populates='atividades')
    squad = db.relationship('Squad', back_populates='atividades')
    
    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'observacao': self.observacao,
            'inicio_programado': self.inicio_programado.isoformat() if self.inicio_programado else None,
            'inicio_realizado': self.inicio_realizado.isoformat() if self.inicio_realizado else None,
            'fim_programado': self.fim_programado.isoformat() if self.fim_programado else None,
            'fim_realizado': self.fim_realizado.isoformat() if self.fim_realizado else None,
            'prioridade': self.prioridade,
            'status': self.status,
            'projeto': {'id': self.projeto.id, 'nome': self.projeto.nome},
            'squad': {'id': self.squad.id, 'nome': self.squad.nome},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Usuario(db.Model):
    __tablename__ = 'usuarios'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    login = db.Column(db.String(50), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='analista')  # 'admin', 'gestor' ou 'analista'
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos
    execucoes_rotina = db.relationship('ExecucaoRotina', back_populates='usuario')

    def set_senha(self, senha):
        """Criptografa e salva a senha"""
        import bcrypt
        self.senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_senha(self, senha):
        """Verifica se a senha está correta"""
        import bcrypt
        return bcrypt.checkpw(senha.encode('utf-8'), self.senha_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'login': self.login,
            'role': self.role,
            'ativo': self.ativo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ExecucaoRotina(db.Model):
    __tablename__ = 'execucoes_rotina'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id'), nullable=False)
    squad_id = db.Column(db.Integer, db.ForeignKey('squads.id'), nullable=False)

    # Informações da execução
    arquivo_nome = db.Column(db.String(255), nullable=False)
    tipo_rotina = db.Column(db.String(50), default='auditoria')  # 'auditoria', 'processamento', etc
    status = db.Column(db.String(20), default='em_andamento')  # 'em_andamento', 'concluido', 'erro', 'cancelado'

    # Timestamps
    inicio = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    fim = db.Column(db.DateTime)

    # Resultado
    resultado = db.Column(db.Text)  # Mensagem final de sucesso ou erro

    # Relacionamentos
    usuario = db.relationship('Usuario', back_populates='execucoes_rotina')
    projeto = db.relationship('Projeto')
    squad = db.relationship('Squad')
    logs = db.relationship('LogExecucao', back_populates='execucao', cascade='all, delete-orphan', order_by='LogExecucao.timestamp')

    def to_dict(self):
        return {
            'id': self.id,
            'usuario': {
                'id': self.usuario.id,
                'nome': self.usuario.nome,
                'login': self.usuario.login
            },
            'projeto': {
                'id': self.projeto.id,
                'nome': self.projeto.nome,
                'subprograma': self.projeto.subprograma
            },
            'squad': {
                'id': self.squad.id,
                'nome': self.squad.nome
            },
            'arquivo_nome': self.arquivo_nome,
            'tipo_rotina': self.tipo_rotina,
            'status': self.status,
            'inicio': self.inicio.isoformat() if self.inicio else None,
            'fim': self.fim.isoformat() if self.fim else None,
            'resultado': self.resultado,
            'total_logs': len(self.logs)
        }

    def to_dict_completo(self):
        """Inclui todos os logs"""
        data = self.to_dict()
        data['logs'] = [log.to_dict() for log in self.logs]
        return data


class LogExecucao(db.Model):
    __tablename__ = 'logs_execucao'

    id = db.Column(db.Integer, primary_key=True)
    execucao_id = db.Column(db.Integer, db.ForeignKey('execucoes_rotina.id'), nullable=False)

    # Dados do log
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # 'info', 'success', 'warning', 'error'
    mensagem = db.Column(db.Text, nullable=False)

    # Relacionamentos
    execucao = db.relationship('ExecucaoRotina', back_populates='logs')

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'tipo': self.tipo,
            'mensagem': self.mensagem
        }