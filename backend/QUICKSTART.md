# 🚀 Guia Rápido de Início

## Primeiros Passos

### 1. Instale as dependências

```bash
pip install -r requirements.txt
```

### 2. Configure o ambiente

```bash
cp .env.example .env
```

### 3. Inicialize o banco de dados

```bash
# Criar estrutura do banco
python populate_db.py
```

Esse script vai:
- Criar as tabelas automaticamente
- Popular com dados de exemplo (3 squads, 3 projetos, 8 atividades)

### 4. Execute a aplicação

```bash
python run.py
```

A API estará rodando em: **http://localhost:5000**

## ✅ Testando a API

### Verificar se está funcionando
```bash
curl http://localhost:5000/
```

### Listar todos os projetos
```bash
curl http://localhost:5000/api/projetos
```

### Listar todas as squads
```bash
curl http://localhost:5000/api/squads
```

### Listar todas as atividades
```bash
curl http://localhost:5000/api/atividades
```

### Ver estatísticas
```bash
curl http://localhost:5000/api/atividades/estatisticas
```

## 📝 Exemplos de Uso

### Criar uma nova squad
```bash
curl -X POST http://localhost:5000/api/squads \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Squad Delta",
    "descricao": "Nova equipe"
  }'
```

### Criar um novo projeto
```bash
curl -X POST http://localhost:5000/api/projetos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Projeto",
    "descricao": "Descrição do projeto",
    "data_inicio": "2025-11-01",
    "data_fim": "2025-12-31",
    "squad_ids": [1, 2]
  }'
```

### Criar uma nova atividade
```bash
curl -X POST http://localhost:5000/api/atividades \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Nova Atividade",
    "descricao": "Descrição da atividade",
    "prazo": "2025-12-01",
    "prioridade": "alta",
    "status": "pendente",
    "projeto_id": 1,
    "squad_id": 1
  }'
```

### Atualizar status de uma atividade
```bash
curl -X PUT http://localhost:5000/api/atividades/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "concluida"
  }'
```

## 🎯 Próximos Passos

1. **Frontend React**: Desenvolver interface web
2. **Filtros avançados**: Adicionar mais opções de busca
3. **Dashboard**: Criar visualizações e gráficos
4. **Relatórios**: Exportar dados em PDF/Excel

## 💡 Dicas

- Use o **Postman** ou **Insomnia** para testar a API visualmente
- Consulte o `README.md` para documentação completa dos endpoints
- Os dados de exemplo já incluem diferentes status e prioridades para teste
