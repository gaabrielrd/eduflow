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
- MinIO bucket inicial em `eduflow-media` por default

Credenciais locais de desenvolvimento:

- PostgreSQL: usuario `eduflow`, senha `eduflow`, database `eduflow`
- MinIO: usuario `eduflow`, senha `eduflow123`

O compose tambem sobe um passo de inicializacao que cria o bucket configurado em `STORAGE_BUCKET_NAME` caso ele nao exista e aplica policy de leitura publica no ambiente local. Isso deixa o fluxo de upload assinado e leitura publica reproduzivel sem passos manuais extras.

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
- `JWT_SECRET`
- `JWT_ACCESS_TOKEN_EXPIRES_IN`
- `JWT_REFRESH_TOKEN_EXPIRES_IN`
- `STORAGE_ENDPOINT`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `STORAGE_BUCKET_NAME`
- `STORAGE_REGION`
- `STORAGE_PUBLIC_BASE_URL`
- `LLM_API_KEY`

Valores esperados para a infraestrutura local:

```bash
DATABASE_URL=postgresql://eduflow:eduflow@localhost:5432/eduflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me
JWT_ACCESS_TOKEN_EXPIRES_IN=1h
JWT_REFRESH_TOKEN_EXPIRES_IN=30d
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=eduflow
STORAGE_SECRET_KEY=eduflow123
STORAGE_BUCKET_NAME=eduflow-media
STORAGE_REGION=us-east-1
STORAGE_PUBLIC_BASE_URL=http://localhost:9000
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

Para subir a vitrine tecnica do design system localmente:

```bash
pnpm storybook
```

Para gerar a build estatica do Storybook:

```bash
pnpm build-storybook
```

Os comandos acima delegam para `packages/ui`, onde o Storybook inicial dos componentes compartilhados esta hospedado.

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

Para os testes de integracao da API, garanta antes:

```bash
docker compose up -d
pnpm api:prisma:generate
pnpm api:prisma:migrate:deploy
pnpm api:test
```

A suite cobre fluxos criticos de autenticacao, organizacoes, autorizacao e isolamento multi-tenant usando PostgreSQL real com Prisma. Os testes limpam explicitamente as tabelas de `authSession`, `membership`, `invitation`, `organization` e `user` entre os casos para evitar dependencia de dados manuais e interferencia entre execucoes.

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

### Storage local

A API agora possui um `StorageModule` interno para encapsular upload assinado, URL publica de leitura, delecao e validacao de bucket em provedores S3-compatible. No setup local, o compose entrega:

- endpoint interno para a API em `http://localhost:9000`
- bucket configuravel por `STORAGE_BUCKET_NAME`
- leitura publica via `STORAGE_PUBLIC_BASE_URL`
- validacao fail-fast do bucket ao subir a API

No v1, a leitura usa URL publica montada a partir de `STORAGE_PUBLIC_BASE_URL` e do bucket configurado. Caso o produto migre depois para leitura privada, a mudanca deve ficar atras da mesma interface do modulo de storage.

Para a sprint inicial de autenticacao, a API usa JWT com transporte `Bearer` em JSON. O default local previsto e `1h` para access token e `30d` para refresh token.

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
