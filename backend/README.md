# Sistema de Acompanhamento de Atividades - Backend

API REST desenvolvida com Flask para gerenciar projetos, squads e atividades.

## Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py          # Inicialização do Flask
│   ├── models.py            # Models do banco de dados
│   ├── routes/              # Rotas da API
│   │   ├── __init__.py
│   │   ├── projetos.py
│   │   ├── squads.py
│   │   └── atividades.py
│   └── utils/               # Utilitários
├── instance/                # Banco de dados SQLite (criado automaticamente)
├── config.py                # Configurações
├── run.py                   # Arquivo principal
├── requirements.txt         # Dependências
└── .env.example            # Exemplo de variáveis de ambiente
```

## Instalação

### 1. Criar ambiente virtual

```bash
python -m venv venv
```

### 2. Ativar ambiente virtual

**Linux/Mac:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

### 5. Inicializar o banco de dados

```bash
flask db init
flask db migrate -m "Criação inicial das tabelas"
flask db upgrade
```

### 6. Executar a aplicação

```bash
python run.py
```

A API estará disponível em: `http://localhost:5000`

## Modelos de Dados

### Projeto
- id, nome, descrição, data_inicio, data_fim
- Relacionamento N:N com Squads
- Relacionamento 1:N com Atividades

### Squad
- id, nome, descrição
- Relacionamento N:N com Projetos
- Relacionamento 1:N com Atividades

### Atividade
- id, título, descrição, prazo, prioridade, status
- Relacionamento N:1 com Projeto
- Relacionamento N:1 com Squad

## Próximos Passos

- [x] Implementar rotas da API (Parte 2) ✅
- [ ] Desenvolver Frontend React (Parte 3)
- [ ] Testes
- [ ] Documentação completa

## Endpoints da API

### Projetos

#### Listar todos os projetos
```http
GET /api/projetos
```

#### Buscar projeto por ID
```http
GET /api/projetos/{id}
```

#### Criar novo projeto
```http
POST /api/projetos
Content-Type: application/json

{
  "nome": "Nome do Projeto",
  "descricao": "Descrição do projeto",
  "data_inicio": "2025-01-01",
  "data_fim": "2025-12-31",
  "squad_ids": [1, 2]
}
```

#### Atualizar projeto
```http
PUT /api/projetos/{id}
Content-Type: application/json

{
  "nome": "Nome Atualizado",
  "descricao": "Nova descrição"
}
```

#### Deletar projeto
```http
DELETE /api/projetos/{id}
```

#### Listar atividades de um projeto
```http
GET /api/projetos/{id}/atividades
```

---

### Squads

#### Listar todas as squads
```http
GET /api/squads
```

#### Buscar squad por ID
```http
GET /api/squads/{id}
```

#### Criar nova squad
```http
POST /api/squads
Content-Type: application/json

{
  "nome": "Nome da Squad",
  "descricao": "Descrição da squad"
}
```

#### Atualizar squad
```http
PUT /api/squads/{id}
Content-Type: application/json

{
  "nome": "Nome Atualizado"
}
```

#### Deletar squad
```http
DELETE /api/squads/{id}
```

#### Listar projetos de uma squad
```http
GET /api/squads/{id}/projetos
```

#### Listar atividades de uma squad
```http
GET /api/squads/{id}/atividades
```

---

### Atividades

#### Listar todas as atividades
```http
GET /api/atividades

# Com filtros opcionais:
GET /api/atividades?projeto_id=1&squad_id=2&status=em_andamento&prioridade=alta
```

#### Buscar atividade por ID
```http
GET /api/atividades/{id}
```

#### Criar nova atividade
```http
POST /api/atividades
Content-Type: application/json

{
  "titulo": "Título da Atividade",
  "descricao": "Descrição da atividade",
  "prazo": "2025-12-31",
  "prioridade": "alta",
  "status": "pendente",
  "projeto_id": 1,
  "squad_id": 1
}
```

**Valores válidos:**
- `prioridade`: `baixa`, `media`, `alta`
- `status`: `pendente`, `em_andamento`, `concluida`

#### Atualizar atividade
```http
PUT /api/atividades/{id}
Content-Type: application/json

{
  "status": "em_andamento",
  "prioridade": "alta"
}
```

#### Deletar atividade
```http
DELETE /api/atividades/{id}
```

#### Estatísticas gerais
```http
GET /api/atividades/estatisticas
```

Retorna:
```json
{
  "total": 50,
  "por_status": {
    "pendente": 20,
    "em_andamento": 15,
    "concluida": 15
  },
  "por_prioridade": {
    "baixa": 10,
    "media": 25,
    "alta": 15
  }
}
```
