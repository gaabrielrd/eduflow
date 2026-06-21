# Setup Local

## Requisitos

- Node.js `>=22`
- pnpm `11.8.0`

O gerenciador de pacotes oficial esta travado em `packageManager` no `package.json` raiz.

## Instalacao

```bash
pnpm install
```

O workspace reconhece `apps/*` e `packages/*` via `pnpm-workspace.yaml`.

## Ambiente

Copie os valores de referencia de `.env.example` para o ambiente local usado pela API. Nesta fase, a API exige pelo menos:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`

Valores previstos para o MVP tambem ja aparecem no exemplo:

- `REDIS_URL`
- `JWT_SECRET`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `LLM_API_KEY`

A porta padrao da API e `4000`. A web usa o padrao do Next.js, normalmente `3000`, salvo configuracao externa.

## Scripts raiz

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Os scripts raiz executam os workspaces recursivamente com `--if-present`.

## Web

```bash
pnpm web:dev
pnpm web:build
pnpm web:lint
pnpm web:typecheck
pnpm web:test
```

Com o servidor local ativo, as rotas iniciais da web sao:

- `http://localhost:3000/`
- `http://localhost:3000/status`
- `http://localhost:3000/app`
- `http://localhost:3000/app/dashboard`

Tambem e possivel usar o filtro explicito do workspace:

```bash
pnpm --filter @eduflow/web dev
```

## API

```bash
pnpm api:dev
pnpm api:build
pnpm api:lint
pnpm api:typecheck
pnpm api:test
```

Com a API ativa, o endpoint inicial e:

```bash
GET http://localhost:4000/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "eduflow-api"
}
```

Tambem e possivel usar o filtro explicito do workspace:

```bash
pnpm --filter @eduflow/api dev
```

## Prisma

O Prisma esta configurado no app da API para PostgreSQL.

```bash
pnpm api:prisma:generate
pnpm api:prisma:migrate:dev
pnpm api:prisma:studio
```

O schema atual ainda nao possui modelos de dominio. As primeiras migrations devem ser criadas quando o modelo de organizacoes, usuarios e cursos for implementado.

## CI

A pipeline inicial de GitHub Actions roda em pull requests e pushes para `main`, executando instalacao, lint, typecheck, testes e build com Node.js 22 e pnpm 11.8.0.
