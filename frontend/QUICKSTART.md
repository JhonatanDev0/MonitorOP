# 🚀 Guia Rápido - Frontend

## Setup Inicial (5 minutos)

### 1. Instalar Node.js
Certifique-se de ter o Node.js instalado (v14+):
```bash
node --version
```

### 2. Instalar dependências
```bash
cd frontend
npm install
```

### 3. Garantir que o backend está rodando
O backend deve estar rodando em `http://localhost:5000`

```bash
# Em outro terminal, na pasta backend:
cd backend
python run.py
```

### 4. Iniciar o frontend
```bash
npm start
```

Acesse: **http://localhost:3000** 🎉

## 📱 Navegação

### Dashboard (/)
- Visão geral do sistema
- Estatísticas e métricas
- Links rápidos

### Projetos (/projetos)
- Lista todos os projetos
- Botão "+ Novo Projeto"
- Editar/Deletar

### Squads (/squads)
- Lista todas as squads
- Botão "+ Nova Squad"
- Editar/Deletar

### Atividades (/atividades)
- Lista todas as atividades
- Filtros por projeto, squad, status, prioridade
- Botão "+ Nova Atividade"
- Editar/Deletar

## ✨ Fluxo Recomendado

### Primeiro Uso (com dados de exemplo):

1. **Dashboard** - Veja a visão geral
   - 3 projetos
   - 3 squads
   - 8 atividades

2. **Projetos** - Explore os projetos existentes
   - Sistema de Gestão
   - App Mobile
   - Migração Cloud

3. **Squads** - Conheça as equipes
   - Squad Alpha (Frontend)
   - Squad Beta (Backend)
   - Squad Gamma (Infraestrutura)

4. **Atividades** - Use os filtros
   - Filtre por projeto
   - Filtre por status
   - Filtre por prioridade

### Criando do Zero:

1. **Criar Squad**
   - Vá em "Squads"
   - Clique "+ Nova Squad"
   - Preencha nome e descrição
   - Salve

2. **Criar Projeto**
   - Vá em "Projetos"
   - Clique "+ Novo Projeto"
   - Preencha os dados
   - Selecione as squads
   - Salve

3. **Criar Atividade**
   - Vá em "Atividades"
   - Clique "+ Nova Atividade"
   - Preencha os dados
   - Selecione projeto e squad
   - Defina prioridade e status
   - Salve

## 🎨 Recursos da Interface

### Badges Coloridos
- **Status**: Pendente (amarelo), Em Andamento (azul), Concluída (verde)
- **Prioridade**: Baixa (cinza), Média (amarelo), Alta (vermelho)

### Filtros
- Combine múltiplos filtros
- Botão "Limpar Filtros" aparece quando há filtros ativos
- Filtros são aplicados em tempo real

### Formulários
- Validação inline
- Campos obrigatórios marcados com *
- Botões de ação claros

### Tabelas
- Responsivas em mobile
- Hover para destacar linha
- Ações rápidas (Editar/Deletar)

## 🔧 Comandos Úteis

```bash
# Iniciar desenvolvimento
npm start

# Build de produção
npm run build

# Executar testes
npm test

# Limpar cache
rm -rf node_modules package-lock.json
npm install
```

## ⚠️ Problemas Comuns

### Erro "Cannot connect to backend"
✅ Verifique se o backend está rodando
✅ Confirme a URL: http://localhost:5000

### Página em branco
✅ Abra o console do navegador (F12)
✅ Verifique erros de JavaScript
✅ Tente limpar o cache do navegador

### Dados não aparecem
✅ Verifique se o backend tem dados
✅ Use `python populate_db.py` no backend
✅ Verifique a aba Network no DevTools

## 💡 Dicas

1. **Use o DevTools** (F12) para debug
2. **Atalho de teclado**: Ctrl+R para recarregar
3. **Console útil**: Veja logs de requisições
4. **Responsive Design**: Teste em mobile (F12 > Toggle Device)

## 📊 Estatísticas da Interface

- **4 páginas** principais
- **12+ componentes** de formulário
- **Filtros avançados** em atividades
- **Design responsivo** completo
- **Navegação intuitiva**

## 🎯 Próximos Passos

Agora que você tem o sistema funcionando:

1. ✅ Explore todas as funcionalidades
2. ✅ Crie seus próprios projetos e atividades
3. ✅ Experimente os filtros
4. ✅ Teste a edição e deleção
5. ✅ Monitore o progresso no Dashboard

---

**Tudo pronto! Comece a gerenciar suas atividades! 🚀**
