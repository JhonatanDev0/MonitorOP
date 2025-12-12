# Sistema de Notificações - MonitorOP

## 📋 Visão Geral

Sistema completo de notificações com suporte a diferentes tipos, prioridades e gerenciamento de leitura.

## 🗄️ Instalação

### 1. Criar a tabela no banco de dados

```bash
cd /home/user/MonitorOP/backend
python create_notificacoes_table.py
```

### 2. (Opcional) Criar notificações de teste

```bash
python criar_notificacoes_teste.py
```

## 🎯 Tipos de Notificações

### Atividades
- Atividades com prazo vencido
- Atividades próximas do vencimento (3 dias)
- Atualizações em atividades

### Projetos
- Novos projetos criados (apenas para gestores/admins)

### Sistema
- Alterações importantes no sistema
- Manutenções programadas
- Confirmações de ações importantes

## 🎨 Prioridades

### Crítico (Vermelho)
- Atividades vencidas
- Problemas urgentes do sistema

### Aviso (Amarelo)
- Atividades próximas do vencimento
- Manutenções programadas
- Alertas importantes

### Info (Azul)
- Novos projetos
- Atualizações em atividades
- Informações gerais do sistema

## 🔌 Endpoints da API

### Listar notificações
```
GET /api/notificacoes
Query params:
  - nao_lidas: true/false (listar apenas não lidas)
  - limit: número (padrão: 50)

Retorna:
  - notificacoes: array de notificações
  - total_nao_lidas: contador de não lidas
```

### Marcar como lida
```
PUT /api/notificacoes/{id}/marcar-lida
```

### Marcar como não lida
```
PUT /api/notificacoes/{id}/marcar-nao-lida
```

### Marcar todas como lidas
```
PUT /api/notificacoes/marcar-todas-lidas
```

### Deletar notificação
```
DELETE /api/notificacoes/{id}
```

### Verificar atividades vencidas
```
POST /api/notificacoes/verificar-atividades-vencidas
```

## 💻 Funções Utilitárias

### Criar notificação individual
```python
from app.utils.notificacao_utils import criar_notificacao

criar_notificacao(
    usuario_id=1,
    tipo='atividade',
    titulo='Atividade Vencida',
    mensagem='A atividade X está vencida',
    prioridade='critico',
    link='/atividades',
    referencia_tipo='atividade',
    referencia_id=10
)
```

### Notificar todos os gestores
```python
from app.utils.notificacao_utils import notificar_todos_gestores

notificar_todos_gestores(
    tipo='projeto',
    titulo='Novo Projeto',
    mensagem='Projeto X foi criado',
    prioridade='info',
    link='/projetos'
)
```

### Notificar novo projeto
```python
from app.utils.notificacao_utils import notificar_novo_projeto

notificar_novo_projeto(projeto)
```

### Notificar manutenção do sistema
```python
from app.utils.notificacao_utils import notificar_manutencao_sistema

notificar_manutencao_sistema(
    titulo='Manutenção Programada',
    mensagem='Sistema será atualizado em 15/12',
    prioridade='aviso'
)
```

## ⚙️ Integração com Rotas Existentes

### Exemplo: Criar notificação ao criar novo projeto

```python
# Em app/routes/projetos.py

from app.utils.notificacao_utils import notificar_novo_projeto

@bp.route('', methods=['POST'])
@jwt_required()
def criar_projeto():
    # ... código de criação do projeto ...

    # Notificar gestores sobre novo projeto
    notificar_novo_projeto(projeto)

    return jsonify(projeto.to_dict()), 201
```

### Exemplo: Criar notificação ao atualizar atividade

```python
# Em app/routes/atividades.py

from app.utils.notificacao_utils import notificar_atividade_atualizada

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def atualizar_atividade(id):
    # ... código de atualização ...

    # Notificar sobre atualização (exemplo com usuário específico)
    notificar_atividade_atualizada(atividade, usuario_responsavel_id=1)

    return jsonify(atividade.to_dict()), 200
```

## 🎯 Funcionalidades do Frontend

- ✅ Badge com contador de não lidas
- ✅ Cores por prioridade (vermelho, amarelo, azul)
- ✅ Marcar como lida/não lida
- ✅ Marcar todas como lidas
- ✅ Deletar notificação
- ✅ Link direto para item relacionado
- ✅ Atualização automática a cada 30 segundos
- ✅ Formatação de tempo relativo (ex: "5m atrás", "2h atrás")
- ✅ Dropdown responsivo

## 📱 Componente React

```jsx
import NotificationBell from './components/NotificationBell';

// No header
<NotificationBell />
```

## 🔄 Automação

Para verificar automaticamente atividades vencidas, você pode:

1. **Via API (recomendado para cron jobs)**:
```bash
curl -X POST http://localhost:5000/api/notificacoes/verificar-atividades-vencidas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Via Python script**:
```python
from app import create_app
from app.routes.notificacoes import verificar_atividades_vencidas

app = create_app('development')
with app.app_context():
    verificar_atividades_vencidas()
```

## 📊 Estrutura do Banco de Dados

```sql
CREATE TABLE notificacoes (
    id INTEGER PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    prioridade VARCHAR(20) DEFAULT 'info',
    lida BOOLEAN DEFAULT FALSE,
    link VARCHAR(200),
    referencia_tipo VARCHAR(50),
    referencia_id INTEGER,
    data_criacao DATETIME NOT NULL,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);
```

## 🎨 Customização

### Alterar intervalo de atualização
Em `NotificationBell.js`, linha 47:
```javascript
const interval = setInterval(() => {
  carregarNotificacoes(true);
}, 30000); // 30 segundos
```

### Alterar prazo de "próximo do vencimento"
Em `notificacoes.py`, linha 118:
```python
proximo_vencimento = hoje + timedelta(days=3)  # 3 dias
```

## 📝 Notas

- Notificações são individuais por usuário
- Apenas o usuário pode ver suas próprias notificações
- Gestores e admins recebem notificações sobre novos projetos
- O sistema não envia notificações duplicadas para a mesma atividade vencida
