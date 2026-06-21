# Monorepo Overview

## Visao geral

O EduFlow comeca como um monorepo `pnpm` para manter apps e pacotes compartilhados no mesmo ciclo de desenvolvimento, com separacao clara de responsabilidades.

## Organizacao do workspace

- `apps/web`: aplicacao Next.js com App Router, React, TypeScript strict e Tailwind CSS
- `apps/api`: API NestJS com healthcheck, configuracao validada, Prisma e tratamento inicial de erros
- `packages/ui`: biblioteca compartilhada de componentes e primitives de interface
- `packages/types`: tipos comuns usados entre frontend, backend e jobs
- `packages/config`: constantes, nomes de eventos e helpers de configuracao sem segredos
- `packages/eslint-config`: presets de lint reaproveitaveis entre workspaces
- `packages/tsconfig`: configuracoes base de TypeScript para apps e pacotes

## Estado atual

- o workspace usa `pnpm` puro, sem Turborepo ou Nx nesta fase
- a web possui rotas iniciais `/`, `/status`, `/app` e `/app/dashboard`
- a API possui `GET /health`, validacao global e filtro global de excecoes
- Prisma esta configurado para PostgreSQL, ainda sem modelos de dominio
- a CI inicial roda lint, typecheck, testes temporarios e build em PRs e pushes para `main`

## Proximos passos

- implementar autenticacao e autorizacao
- modelar organizacoes, memberships e tenancy
- introduzir o dominio educacional, incluindo `Course` e `CourseVersion`
- evoluir `packages/ui` e `packages/types` conforme os fluxos reais surgirem
- adicionar Redis, BullMQ, MinIO e IA quando as sprints correspondentes comecarem
