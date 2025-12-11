# 🔧 Configuração de Ambiente - Frontend

Este projeto suporta múltiplos ambientes de execução. Escolha o ambiente apropriado antes de iniciar o projeto.

## 📋 Ambientes Disponíveis

### 1️⃣ **Local (Desenvolvimento)**
- **URL da API**: `http://localhost:5000/api`
- **Quando usar**: Desenvolvendo na própria máquina com backend rodando localmente
- **Arquivo**: `.env.localhost`

### 2️⃣ **Produção/Rede**
- **URL da API**: `http://192.168.6.31:5000/api`
- **Quando usar**: Acessando a aplicação de qualquer máquina na rede
- **Arquivo**: `.env.production`

### 3️⃣ **Trabalho**
- **URL da API**: `http://192.168.1.3:5000/api`
- **Quando usar**: Ambiente específico de trabalho
- **Arquivo**: `.env.trabalho`

## 🚀 Como Usar

### Método 1: Scripts npm (Recomendado)

#### Configurar ambiente:
```bash
# Para desenvolvimento local (localhost)
npm run env:local

# Para acesso via rede (192.168.6.31)
npm run env:production

# Para ambiente de trabalho
npm run env:trabalho
```

#### Iniciar aplicação:
```bash
# Usando ambiente configurado (padrão - lê o arquivo .env)
npm start

# OU iniciar diretamente com ambiente específico:
npm run start:local       # localhost
npm run start:production  # rede
npm run start:trabalho    # trabalho
```

#### Build para produção:
```bash
# Build usando ambiente configurado
npm run build

# OU build diretamente com ambiente específico:
npm run build:local       # localhost
npm run build:production  # rede
npm run build:trabalho    # trabalho
```

### Método 2: Manual

Copie o arquivo de ambiente desejado para `.env`:

```bash
# Para localhost
cp .env.localhost .env

# Para rede
cp .env.production .env

# Para trabalho
cp .env.trabalho .env
```

Depois execute:
```bash
npm start
```

## 📝 Arquivo Atual

Para verificar qual ambiente está ativo:
```bash
cat .env
```

## ⚙️ Customizar

Para criar um ambiente customizado:

1. Crie um novo arquivo `.env.meunome`
2. Adicione a configuração:
   ```
   REACT_APP_API_URL=http://seu-ip-aqui:5000/api
   ```
3. (Opcional) Adicione scripts no `package.json`:
   ```json
   "start:meunome": "env-cmd -f .env.meunome react-scripts start",
   "env:meunome": "cp .env.meunome .env && echo '✅ Ambiente configurado'"
   ```

## 🎯 Resumo Rápido

| Comando | Descrição |
|---------|-----------|
| `npm run env:local` | Configura para localhost |
| `npm run env:production` | Configura para rede (192.168.6.31) |
| `npm run env:trabalho` | Configura para trabalho |
| `npm start` | Inicia com ambiente configurado |
| `npm run start:local` | Inicia direto em localhost |
| `npm run start:production` | Inicia direto na rede |

## ❗ Importante

- O arquivo `.env` é ignorado pelo Git (`.gitignore`)
- Os arquivos de template (`.env.localhost`, `.env.production`, etc) são versionados
- Sempre configure o ambiente antes de fazer build de produção
