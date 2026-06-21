# EduFlow

Plataforma educacional modular para criacao, publicacao e acompanhamento de cursos digitais, com recursos de IA para acelerar a autoria de conteudo.

## Monorepo base

Este repositorio usa `pnpm` workspaces para separar aplicacoes, pacotes compartilhados e configuracoes reutilizaveis desde o inicio. A estrutura foi pensada para permitir o crescimento do EduFlow sem acoplamento excessivo entre frontend, backend, tipos e tooling.

### Estrutura

- `apps/web`: placeholder da aplicacao web em Next.js/React
- `apps/api`: placeholder da API em NestJS/Node
- `packages/ui`: componentes e utilitarios visuais compartilhados
- `packages/types`: tipos compartilhados do dominio e contratos internos
- `packages/config`: constantes e helpers de configuracao compartilhaveis
- `packages/eslint-config`: presets reutilizaveis de ESLint
- `packages/tsconfig`: bases compartilhadas de TypeScript
- `docs`: documentacao operacional e guias internos

## Requisitos

- Node.js `>=22`
- pnpm `11.8.0`

## Como instalar

```bash
pnpm install
```

## Scripts raiz

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Os scripts da raiz usam `pnpm -r --if-present` para permitir bootstrap incremental sem exigir que todos os workspaces tenham a mesma maturidade desde o primeiro dia.

## Convencoes internas

- Pacotes internos usam o namespace `@eduflow/*`
- Configuracoes TypeScript compartilhadas vivem em `@eduflow/tsconfig`
- Regras de lint compartilhadas vivem em `@eduflow/eslint-config`
- Comandos canonicos do web usam `pnpm --filter @eduflow/web <script>`
- Comandos canonicos da API usam `pnpm --filter @eduflow/api <script>`
- A documentacao geral do monorepo comeca em [docs/overview.md](/E:/OneDrive/Dev/eduflow/docs/overview.md)

## Produto

O roadmap detalhado do MVP esta em [roadmap.md](/E:/OneDrive/Dev/eduflow/roadmap.md).
