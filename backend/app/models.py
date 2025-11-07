from datetime import datetime
from app import db


# Tabela associativa para relacionamento N:N entre Projeto e Squad
projeto_squad = db.Table('projeto_squad',
    db.Column('projeto_id', db.Integer, db.ForeignKey('projeto.id'), primary_key=True),
    db.Column('squad_id', db.Integer, db.ForeignKey('squad.id'), primary_key=True),
    db.Column('data_associacao', db.DateTime, default=datetime.utcnow)
)


class Projeto(db.Model):
    """Model para representar um Projeto (Avaliação)"""
    id = db.Column(db.Integer, primary_key=True)
    subprograma = db.Column(db.String(50))  # Código identificador
    nome = db.Column(db.String(200), nullable=False)
    data_aplicacao = db.Column(db.Date)  # Data de aplicação da avaliação
    data_termino = db.Column(db.Date)  # Data de término da aplicação
    etapas = db.Column(db.Text)  # Etapas envolvidas na avaliação
    disciplinas = db.Column(db.Text)  # Disciplinas envolvidas
    tipos_processamento = db.Column(db.String(100))  # Destaque e/ou Transcrição
    observacao = db.Column(db.Text)  # Observações sobre o projeto
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    atividades = db.relationship('Atividade', backref='projeto', lazy=True, cascade='all, delete-orphan')
    squads = db.relationship('Squad', secondary=projeto_squad, backref=db.backref('projetos', lazy='dynamic'))
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'subprograma': self.subprograma,
            'nome': self.nome,
            'data_aplicacao': self.data_aplicacao.isoformat() if self.data_aplicacao else None,
            'data_termino': self.data_termino.isoformat() if self.data_termino else None,
            'etapas': self.etapas,
            'disciplinas': self.disciplinas,
            'tipos_processamento': self.tipos_processamento,
            'observacao': self.observacao,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'squads': [{'id': s.id, 'nome': s.nome} for s in self.squads],
            'total_atividades': len(self.atividades)
        }
    
    def __repr__(self):
        return f'<Projeto {self.nome}>'


class Squad(db.Model):
    """Model para representar uma Squad (equipe)"""
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False, unique=True)
    descricao = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    atividades = db.relationship('Atividade', backref='squad', lazy=True)
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'total_projetos': self.projetos.count(),
            'total_atividades': len(self.atividades)
        }
    
    def __repr__(self):
        return f'<Squad {self.nome}>'


class Atividade(db.Model):
    """Model para representar uma Atividade"""
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text)
    prazo = db.Column(db.Date)
    prioridade = db.Column(db.String(20), default='media')  # baixa, media, alta
    status = db.Column(db.String(20), default='pendente')  # pendente, em_andamento, concluida
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Chaves estrangeiras
    projeto_id = db.Column(db.Integer, db.ForeignKey('projeto.id'), nullable=False)
    squad_id = db.Column(db.Integer, db.ForeignKey('squad.id'), nullable=False)
    
    def to_dict(self):
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'prazo': self.prazo.isoformat() if self.prazo else None,
            'prioridade': self.prioridade,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'projeto': {
                'id': self.projeto.id,
                'nome': self.projeto.nome
            } if self.projeto else None,
            'squad': {
                'id': self.squad.id,
                'nome': self.squad.nome
            } if self.squad else None
        }
    
    def __repr__(self):
        return f'<Atividade {self.titulo}>'
