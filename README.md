# EduFlow

Plataforma educacional modular para criacao, publicacao e acompanhamento de cursos digitais, com recursos de IA para acelerar a autoria de conteudo.

## Monorepo base

Este repositorio usa `pnpm` workspaces para separar aplicacoes, pacotes compartilhados e configuracoes reutilizaveis desde o inicio. A estrutura foi pensada para permitir o crescimento do EduFlow sem acoplamento excessivo entre frontend, backend, tipos e tooling.

### Estrutura

- `apps/web`: aplicacao web em Next.js, React, TypeScript e Tailwind CSS
- `apps/api`: API em NestJS, TypeScript e Prisma
- `packages/ui`: componentes e utilitarios visuais compartilhados
- `packages/types`: tipos compartilhados do dominio e contratos internos
- `packages/config`: constantes e helpers de configuracao compartilhaveis
- `packages/eslint-config`: presets reutilizaveis de ESLint
- `packages/tsconfig`: bases compartilhadas de TypeScript
- `docs`: documentacao operacional e guias internos

## Requisitos

- Node.js `>=22`
- pnpm `11.8.0`
- Docker Desktop ou Docker Engine com `docker compose`

## Como instalar

```bash
pnpm install
```

## Infra local

O ambiente local de infraestrutura do EduFlow usa `PostgreSQL`, `Redis` e `MinIO` via Docker Compose.

```bash
docker compose up -d
```

Servicos expostos localmente:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Credenciais locais previstas no compose e no `.env.example`:

- PostgreSQL: usuario `eduflow`, senha `eduflow`, database `eduflow`
- MinIO: usuario `eduflow`, senha `eduflow123`

Para derrubar o ambiente:

```bash
docker compose down
```

Os dados persistem entre reinicios porque o compose usa volumes nomeados. Depois de subir a infraestrutura, use o `DATABASE_URL` documentado no `.env.example` e rode a API localmente com Prisma apontando para `localhost:5432`.

## Scripts raiz

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Os scripts da raiz usam `pnpm -r --if-present` para permitir bootstrap incremental sem exigir que todos os workspaces tenham a mesma maturidade desde o primeiro dia.

### Scripts por app

```bash
pnpm web:dev
pnpm web:build
pnpm web:lint
pnpm api:dev
pnpm api:build
pnpm api:lint
pnpm api:prisma:generate
```

## Qualidade

O projeto possui uma pipeline inicial de qualidade em GitHub Actions que roda em `pull_request` e em `push` para `main`, cobrindo `pnpm install --frozen-lockfile`, `lint`, `typecheck`, `test` e `build`.

## Documentacao

- [Visao geral do monorepo](/E:/OneDrive/Dev/eduflow/docs/overview.md)
- [Arquitetura tecnica](/E:/OneDrive/Dev/eduflow/docs/architecture.md)
- [Setup local](/E:/OneDrive/Dev/eduflow/docs/setup.md)
- [Roadmap do MVP](/E:/OneDrive/Dev/eduflow/docs/roadmap.md)
- [ADRs](/E:/OneDrive/Dev/eduflow/docs/adr)

## Convencoes internas

- Pacotes internos usam o namespace `@eduflow/*`
- Configuracoes TypeScript compartilhadas vivem em `@eduflow/tsconfig`
- Regras de lint compartilhadas vivem em `@eduflow/eslint-config`
- Comandos canonicos do web usam `pnpm --filter @eduflow/web <script>`
- Comandos canonicos da API usam `pnpm --filter @eduflow/api <script>`

## Produto

O roadmap detalhado do MVP esta em [docs/roadmap.md](/E:/OneDrive/Dev/eduflow/docs/roadmap.md). O arquivo [roadmap.md](/E:/OneDrive/Dev/eduflow/roadmap.md) na raiz permanece por compatibilidade historica.
