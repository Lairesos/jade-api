# Jade Core

Backend profissional para a **Diretora de Operações IA — Jade**.

Orquestra operações, tarefas, agenda e conhecimento organizacional via IA, integrando OpenAI, Notion, Google Calendar e Make.com em uma arquitetura serverless na Vercel.

## Stack

| Tecnologia | Uso |
|-----------|-----|
| TypeScript | Linguagem principal |
| Node.js 20+ | Runtime |
| Vercel | Deploy serverless |
| OpenAI API | Agente IA com function calling |
| Notion API | Tarefas e base de conhecimento |
| Google Calendar API | Agendamento e eventos |
| Make.com | Automações bidirecionais |
| Zod | Validação de env e requests |

## Início Rápido

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Desenvolvimento local
npm run dev

# Type check
npm run typecheck

# Testes
npm test
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check (público) |
| POST | `/api/jade/chat` | Conversa com Jade |
| POST | `/api/jade/execute` | Executar operação com intent |
| GET | `/api/jade/status` | Status detalhado de Jade |
| POST | `/api/webhook/make` | Webhook Make.com (entrada) |
| GET/POST/PATCH | `/api/notion/tasks` | CRUD de tarefas |
| GET | `/api/notion/knowledge` | Busca na base de conhecimento |
| GET/POST/DELETE | `/api/calendar/events` | Eventos do calendário |

## Autenticação

```bash
curl -X POST https://your-app.vercel.app/api/jade/chat \
  -H "Authorization: Bearer YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"message": "Crie uma tarefa para revisar o relatório Q2"}'
```

## Estrutura

```
jade-core/
├── api/                  # Endpoints Vercel serverless
├── lib/                  # Utilitários compartilhados (loadPrompt, etc.)
├── prompts/              # Templates de prompts em Markdown
├── src/
│   ├── config/           # Env validation + constants
│   ├── core/jade/        # AI agent, prompts, tools
│   ├── integrations/     # OpenAI, Notion, Calendar, Make
│   ├── middleware/       # Auth, CORS, rate limit
│   ├── services/         # Business logic
│   ├── types/            # TypeScript interfaces
│   └── utils/            # Logger, validation, response
├── tests/                # Vitest unit tests
└── docs/                 # Architecture documentation
```

Documentação completa em [docs/architecture.md](docs/architecture.md).

## Deploy

```bash
vercel --prod
```

Configure todas as variáveis de `.env.example` no dashboard Vercel.

## Licença

Private — uso interno.
