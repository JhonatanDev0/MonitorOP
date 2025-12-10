# Migração: Sistema de Execuções e Logs de Rotina

## Descrição

Esta migração adiciona suporte para persistência de execuções de rotinas e seus logs no banco de dados.

## Novas Tabelas

### 1. `execucoes_rotina`
Armazena informações sobre cada execução de rotina.

**Campos:**
- `id` - Identificador único
- `usuario_id` - Usuário que executou (FK para `usuarios`)
- `projeto_id` - Projeto vinculado (FK para `projetos`)
- `squad_id` - Squad responsável (FK para `squads`)
- `arquivo_nome` - Nome do arquivo processado
- `tipo_rotina` - Tipo de rotina executada (default: 'auditoria')
- `status` - Status da execução ('em_andamento', 'concluido', 'erro', 'cancelado')
- `inicio` - Data/hora de início
- `fim` - Data/hora de término
- `resultado` - Mensagem final de sucesso ou erro

### 2. `logs_execucao`
Armazena logs individuais de cada execução.

**Campos:**
- `id` - Identificador único
- `execucao_id` - Execução vinculada (FK para `execucoes_rotina`)
- `timestamp` - Data/hora do log
- `tipo` - Tipo de log ('info', 'success', 'warning', 'error')
- `mensagem` - Mensagem do log

## Como Executar a Migração

### Opção 1: Script de Migração
```bash
cd backend
python migrate_execucoes_rotina.py
```

### Opção 2: Shell do Flask
```bash
cd backend
flask shell

>>> from app import db
>>> db.create_all()
>>> exit()
```

### Opção 3: Python Interativo
```python
from app import create_app, db

app = create_app('development')
with app.app_context():
    db.create_all()
```

## Novos Endpoints da API

### Execuções por Projeto
- `GET /api/auditoria/execucoes/projeto/<projeto_id>` - Lista todas as execuções de um projeto
- `GET /api/auditoria/execucoes/ativa/projeto/<projeto_id>` - Verifica execução ativa de um projeto
- `GET /api/auditoria/execucoes/ultima/projeto/<projeto_id>` - Retorna última execução de um projeto

### Detalhes de Execução
- `GET /api/auditoria/execucoes/<execucao_id>` - Detalhes completos incluindo logs
- `GET /api/auditoria/execucoes/<execucao_id>/logs` - Apenas os logs de uma execução

### Histórico Geral
- `GET /api/auditoria/historico` - Histórico geral com filtros opcionais
  - Parâmetros: `limit`, `offset`, `projeto_id`, `usuario_id`, `status`

## Funcionalidades Implementadas

### Backend
1. ✅ Persistência de execuções e logs no banco de dados
2. ✅ Logs incluem timestamp completo (data e hora)
3. ✅ Vinculação de execuções por projeto
4. ✅ Múltiplas execuções podem existir (uma por projeto)
5. ✅ Histórico completo de execuções preservado

### Frontend
1. ✅ Reconexão automática a execuções ativas ao trocar de projeto
2. ✅ Exibição de usuário e data/hora nos logs
3. ✅ Logs persistem mesmo ao sair da página
4. ✅ Rotina continua em segundo plano no servidor
5. ✅ Execuções separadas por projeto

## Notas Importantes

- As tabelas existentes **NÃO** são modificadas
- Apenas as novas tabelas (`execucoes_rotina` e `logs_execucao`) são criadas
- O sistema é retrocompatível - execuções antigas não serão afetadas
- Logs de execuções são permanentes (considere implementar limpeza periódica futuramente)

## Testes Recomendados

1. Execute a migração
2. Reinicie o backend
3. Execute uma rotina de auditoria
4. Verifique se os logs aparecem corretamente com usuário e data/hora
5. Saia da página e retorne - os logs devem persistir
6. Troque de projeto - cada projeto deve ter sua própria execução
