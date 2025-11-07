# Sistema de Acompanhamento de Atividades - Frontend

Interface web desenvolvida com React para gerenciar projetos, squads e atividades.

## Estrutura do Projeto

```
frontend/
├── public/
│   └── index.html              # HTML base
├── src/
│   ├── components/             # Componentes reutilizáveis
│   ├── pages/                  # Páginas da aplicação
│   │   ├── Dashboard.js        # Dashboard com estatísticas
│   │   ├── Projetos.js         # Gerenciamento de projetos
│   │   ├── Squads.js          # Gerenciamento de squads
│   │   └── Atividades.js      # Gerenciamento de atividades
│   ├── services/
│   │   └── api.js             # Serviço de API (axios)
│   ├── App.js                 # Componente principal com rotas
│   ├── App.css                # Estilos globais
│   └── index.js               # Entry point
├── package.json               # Dependências
└── README.md                  # Este arquivo
```

## Funcionalidades

### Dashboard
- ✅ Visão geral do sistema
- ✅ Estatísticas gerais (total de projetos, squads e atividades)
- ✅ Atividades por status (pendente, em andamento, concluída)
- ✅ Atividades por prioridade (baixa, média, alta)

### Projetos
- ✅ Listagem de todos os projetos
- ✅ Criar novo projeto
- ✅ Editar projeto existente
- ✅ Deletar projeto
- ✅ Associar múltiplas squads a um projeto
- ✅ Visualizar número de atividades por projeto

### Squads
- ✅ Listagem de todas as squads
- ✅ Criar nova squad
- ✅ Editar squad existente
- ✅ Deletar squad
- ✅ Visualizar número de projetos e atividades por squad

### Atividades
- ✅ Listagem de todas as atividades
- ✅ Criar nova atividade
- ✅ Editar atividade existente
- ✅ Deletar atividade
- ✅ Filtros por projeto, squad, status e prioridade
- ✅ Badges coloridos para status e prioridade
- ✅ Visualização de prazo formatado

## Instalação e Execução

### Pré-requisitos
- Node.js (v14 ou superior)
- npm ou yarn
- Backend rodando em http://localhost:5000

### 1. Instalar dependências

```bash
npm install
```

ou

```bash
yarn install
```

### 2. Configurar variáveis de ambiente (opcional)

Crie um arquivo `.env` na raiz do frontend (se necessário):

```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Executar em modo de desenvolvimento

```bash
npm start
```

ou

```bash
yarn start
```

A aplicação estará disponível em: **http://localhost:3000**

### 4. Build para produção

```bash
npm run build
```

ou

```bash
yarn build
```

## Tecnologias Utilizadas

- **React 18** - Biblioteca para construção de interfaces
- **React Router DOM** - Roteamento
- **Axios** - Cliente HTTP para consumir a API
- **CSS puro** - Estilização responsiva

## Estrutura de Componentes

### Páginas

**Dashboard** (`pages/Dashboard.js`)
- Exibe estatísticas gerais do sistema
- Cards com totais e métricas
- Links rápidos para outras páginas

**Projetos** (`pages/Projetos.js`)
- CRUD completo de projetos
- Formulário com validação
- Seleção múltipla de squads
- Tabela responsiva

**Squads** (`pages/Squads.js`)
- CRUD completo de squads
- Formulário simples
- Listagem com contadores

**Atividades** (`pages/Atividades.js`)
- CRUD completo de atividades
- Sistema de filtros avançado
- Badges coloridos
- Formulário completo com todas as opções

### Serviços

**API Service** (`services/api.js`)
- Configuração centralizada do axios
- Métodos para todas as entidades
- Tratamento de parâmetros de filtro

## Design e UX

### Paleta de Cores
- **Primária**: #3498db (Azul)
- **Sucesso**: #2ecc71 (Verde)
- **Perigo**: #e74c3c (Vermelho)
- **Secundária**: #95a5a6 (Cinza)
- **Background**: #f5f5f5

### Status
- **Pendente**: Amarelo (#ffeaa7)
- **Em Andamento**: Azul (#74b9ff)
- **Concluída**: Verde (#55efc4)

### Prioridade
- **Baixa**: Cinza (#dfe6e9)
- **Média**: Amarelo (#ffeaa7)
- **Alta**: Vermelho/Laranja (#fab1a0)

### Responsividade
- Layout adaptável para mobile, tablet e desktop
- Navegação otimizada para telas pequenas
- Tabelas com scroll horizontal em mobile

## Fluxo de Uso

1. **Primeiro acesso**: Dashboard mostra visão geral vazia
2. **Criar Squads**: Cadastrar as equipes do projeto
3. **Criar Projetos**: Cadastrar projetos e associar squads
4. **Criar Atividades**: Criar tarefas vinculadas a projetos e squads
5. **Acompanhar**: Usar filtros e dashboard para monitorar progresso

## Integração com Backend

A aplicação consome a API REST do backend Flask através do axios:
- Base URL: `http://localhost:5000/api`
- Todas as requisições incluem headers JSON
- Tratamento de erros com mensagens amigáveis
- Proxy configurado no package.json para desenvolvimento

## Melhorias Futuras

- [ ] Gráficos e visualizações (Chart.js)
- [ ] Ordenação de tabelas
- [ ] Paginação para listas grandes
- [ ] Busca/pesquisa em tempo real
- [ ] Notificações toast
- [ ] Modo escuro
- [ ] Exportação de relatórios
- [ ] Drag & drop para priorização
- [ ] Calendário de prazos
- [ ] Comentários em atividades

## Troubleshooting

### Erro de conexão com API
- Verifique se o backend está rodando em http://localhost:5000
- Confirme se o CORS está habilitado no backend
- Verifique o console do navegador para erros específicos

### Dependências não instaladas
```bash
rm -rf node_modules package-lock.json
npm install
```

### Porta 3000 já em uso
```bash
# Linux/Mac
PORT=3001 npm start

# Windows
set PORT=3001 && npm start
```

## Suporte

Para problemas ou dúvidas:
1. Verifique o console do navegador (F12)
2. Verifique os logs do backend
3. Confirme que todas as dependências estão instaladas
