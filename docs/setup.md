# Setup Local

## Requisitos

- Node.js `>=22`
- pnpm `11.8.0`
- Docker Desktop ou Docker Engine com `docker compose`

O gerenciador de pacotes oficial esta travado em `packageManager` no `package.json` raiz.

## Instalacao

```bash
pnpm install
```

O workspace reconhece `apps/*` e `packages/*` via `pnpm-workspace.yaml`.

## Infra local

Suba os servicos de infraestrutura do MVP a partir da raiz do repositorio:

```bash
docker compose up -d
```

Servicos disponiveis:

- PostgreSQL em `localhost:5432`
- Redis em `localhost:6379`
- MinIO API em `http://localhost:9000`
- MinIO Console em `http://localhost:9001`

Credenciais locais de desenvolvimento:

- PostgreSQL: usuario `eduflow`, senha `eduflow`, database `eduflow`
- MinIO: usuario `eduflow`, senha `eduflow123`

Para derrubar o ambiente:

```bash
docker compose down
```

Os dados persistem entre reinicios porque o compose usa volumes nomeados. Para remover tambem os dados locais, use `docker compose down -v` conscientemente.

## Ambiente

Copie os valores de referencia de `.env.example` para o ambiente local usado pela API. Nesta fase, a API valida:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `JWT_SECRET`
- `LLM_API_KEY`

Valores esperados para a infraestrutura local:

```bash
DATABASE_URL=postgresql://eduflow:eduflow@localhost:5432/eduflow
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=eduflow
S3_SECRET_KEY=eduflow123
```

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

Com a infraestrutura Docker ativa e o `.env` preenchido com o `DATABASE_URL` acima, a API fica alinhada com o PostgreSQL local sem ajustes extras de formato.

## Prisma

O Prisma esta configurado no app da API para PostgreSQL.

```bash
pnpm api:prisma:generate
pnpm api:prisma:migrate:dev
pnpm api:prisma:studio
```

Fluxo local recomendado com a infraestrutura Docker:

```bash
docker compose up -d
pnpm api:prisma:generate
pnpm api:dev
```

O schema atual ainda nao possui modelos de dominio. As primeiras migrations devem ser criadas quando o modelo de organizacoes, usuarios e cursos for implementado.

## CI

A pipeline inicial de GitHub Actions roda em pull requests e pushes para `main`, executando instalacao, lint, typecheck, testes e build com Node.js 22 e pnpm 11.8.0.
