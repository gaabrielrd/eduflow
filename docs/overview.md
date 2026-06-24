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
- Prisma esta configurado para PostgreSQL com identidade, tenancy e os primeiros modelos de autoria de cursos
- a CI inicial roda lint, typecheck, testes temporarios e build em PRs e pushes para `main`

## Dominio educacional atual

O repositorio ja possui a primeira modelagem operacional de autoria:

- `Course`: raiz do curso editavel dentro de uma organizacao
- `CourseModule`: agrupador de lessons dentro do curso, com ordenacao por `position`
- `Lesson`: item do curriculo dentro do modulo, tambem ordenado por `position`

Cada lesson combina dois eixos distintos:

- `contentType`: classificacao funcional da aula em `TEXT`, `VIDEO`, `QUIZ` ou `FILE`
- `contentJson`: documento versionado com o conteudo editavel renderizavel

Isso significa que a documentacao do monorepo ja precisa considerar nao so a existencia de cursos, mas tambem a estrutura de curriculo e o contrato de conteudo associado a lessons.

## Proximos passos

- implementar autenticacao e autorizacao
- modelar organizacoes, memberships e tenancy
- introduzir `CourseVersion` e o fluxo de publicacao imutavel sobre o dominio educacional ja existente
- evoluir `packages/ui` e `packages/types` conforme os fluxos reais surgirem
- adicionar Redis, BullMQ, MinIO e IA quando as sprints correspondentes comecarem
