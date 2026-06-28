# Jade Core — Arquitetura

## Visão Geral

Jade Core é o backend serverless da **Diretora de Operações IA (Jade)**, construído para rodar na Vercel com integrações nativas a OpenAI, Notion, Google Calendar e Make.com.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clientes / Make.com                       │
└────────────┬───────────────────────────────┬────────────────────┘
             │ REST API                       │ Webhooks
             ▼                                ▼
┌──────────────────────────── Vercel ─────────────────────────────┐
│  api/                                                            │
│  ├── health.ts          GET  /api/health                        │
│  ├── jade/chat.ts       POST /api/jade/chat                     │
│  ├── jade/execute.ts    POST /api/jade/execute                  │
│  ├── jade/status.ts     GET  /api/jade/status                   │
│  ├── webhook/make.ts    POST /api/webhook/make                  │
│  ├── notion/tasks.ts    CRUD /api/notion/tasks                  │
│  ├── notion/knowledge.ts GET /api/notion/knowledge              │
│  └── calendar/events.ts CRUD /api/calendar/events               │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────── src/ ─────────────────────────────────┐
│  middleware/   auth · cors · rateLimit                          │
│  core/jade/    agent · prompts · tools                          │
│  services/     operations · scheduling · knowledge · automation  │
│  integrations/ openai · notion · google-calendar · make         │
│  config/       env (zod) · constants                            │
│  types/        jade · notion · calendar · make · common         │
│  utils/        logger · validation · response                   │
└────────────┬──────────────┬──────────────┬──────────────┬─────────┘
             │              │              │              │
             ▼              ▼              ▼              ▼
         OpenAI API     Notion API    Google Calendar   Make.com
```

## Camadas

### 1. API Layer (`api/`)

Endpoints serverless Vercel. Cada arquivo exporta um handler default compatível com `@vercel/node`. Responsabilidades:

- Roteamento HTTP
- Autenticação e rate limiting
- Validação de entrada (Zod)
- Formatação de resposta padronizada

### 2. Middleware (`src/middleware/`)

Cross-cutting concerns aplicados nos handlers:

| Arquivo | Função |
|---------|--------|
| `auth.ts` | Bearer token (API) e signature (webhooks) |
| `cors.ts` | CORS para origens permitidas |
| `rateLimit.ts` | Rate limiting in-memory por IP/user |

### 3. Core — Jade Agent (`src/core/jade/`)

Cérebro da IA operacional:

| Arquivo | Função |
|---------|--------|
| `agent.ts` | Orquestrador: recebe mensagem, chama OpenAI, executa tools em loop |
| `prompts.ts` | System prompts e contexto de sessão |
| `tools.ts` | Definições de function calling (OpenAI tools) |

Fluxo do agent:
1. Recebe `JadeRequest` com mensagem e contexto
2. Monta conversa com system prompt + contexto
3. Chama OpenAI com tools habilitadas
4. Executa tool calls via services (até 5 iterações)
5. Retorna `JadeResponse` com mensagem, ações executadas e intent

### 4. Services (`src/services/`)

Lógica de negócio desacoplada das integrações:

| Service | Responsabilidade |
|---------|-----------------|
| `operations.service.ts` | CRUD de tarefas no Notion + triggers Make |
| `scheduling.service.ts` | Agenda, lista, cancela eventos no Calendar |
| `knowledge.service.ts` | Busca na base de conhecimento Notion |
| `automation.service.ts` | Webhooks Make (entrada/saída) |
| `health.service.ts` | Health check de todas integrações |

### 5. Integrations (`src/integrations/`)

Clientes tipados para APIs externas:

| Integração | Arquivos | SDK/API |
|-----------|----------|---------|
| OpenAI | `client.ts`, `completion.ts` | `openai` npm |
| Notion | `client.ts`, `databases.ts`, `pages.ts` | `@notionhq/client` |
| Google Calendar | `client.ts`, `events.ts` | `googleapis` |
| Make | `webhook.ts`, `triggers.ts` | fetch nativo |

### 6. Config & Types

- `config/env.ts` — Validação Zod de todas variáveis de ambiente
- `config/constants.ts` — Constantes globais (identidade Jade, rate limits, defaults)
- `types/` — Interfaces TypeScript para todas entidades do domínio

## Autenticação

- **API endpoints**: Header `Authorization: Bearer <JADE_API_SECRET>`
- **Webhooks Make**: Header `X-Jade-Signature: <JADE_WEBHOOK_SECRET>`
- **User context**: Header opcional `X-User-Id`

## Resposta Padrão

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "jade_1234567890_abc123",
    "timestamp": "2026-06-27T12:00:00.000Z",
    "version": "v1"
  }
}
```

## Deploy

```bash
vercel --prod
```

Variáveis de ambiente configuradas no dashboard Vercel (ver `.env.example`).

## Fluxo Make.com ↔ Jade

```
Make Scenario → POST /api/webhook/make → automationService
                                              ↓
Jade Action → triggerTaskCreated() → POST Make Webhook URL
```

Eventos suportados: `task.*`, `meeting.*`, `alert.*`, `operation.*`
