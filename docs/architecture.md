# Arquitetura Tecnica

## Estado atual

O EduFlow esta estruturado como um monorepo `pnpm` com workspaces em `apps/*` e `packages/*`. A decisao inicial e manter aplicacoes, pacotes compartilhados e configuracoes reutilizaveis no mesmo repositorio, usando o namespace interno `@eduflow/*`.

O repositorio ja possui:

- aplicacao web em `apps/web`
- API em `apps/api`
- pacotes compartilhados em `packages/*`
- documentacao tecnica em `docs/`
- pipeline inicial de CI em GitHub Actions

## Apps

### `apps/web`

A aplicacao web usa Next.js com App Router, React, TypeScript strict e Tailwind CSS. Ela e a base para a experiencia de autores, administradores, gestores e alunos.

Rotas ja existentes:

- `/`: landing temporaria publica
- `/status`: pagina visual de status da web
- `/app`: shell inicial da area de aplicacao
- `/app/dashboard`: tela inicial temporaria do dashboard

O app usa alias local `@/*` para imports internos em `src/`. Imports entre workspaces devem usar nomes de pacote, como `@eduflow/ui`, `@eduflow/types` e `@eduflow/config`.

### `apps/api`

A API usa NestJS com Express, TypeScript strict e Prisma configurado para PostgreSQL. Ela concentra a futura camada de autenticacao, organizacoes, cursos, matriculas, progresso, avaliacoes, certificados, relatorios e IA.

O estado atual inclui:

- `GET /health` retornando `{ "status": "ok", "service": "eduflow-api" }`
- `ConfigModule` global com validacao de ambiente
- porta padrao `4000`
- `ValidationPipe` global
- filtro global de excecoes com `statusCode`, `message`, `error`, `path` e `timestamp`
- `DatabaseModule` com `PrismaService`
- `prisma/schema.prisma` inicial para PostgreSQL, ainda sem modelos de dominio

## Packages

- `packages/ui`: ponto de partida para componentes reutilizaveis.
- `packages/types`: tipos compartilhados entre apps e futuros jobs.
- `packages/config`: constantes e helpers compartilhaveis sem segredos.
- `packages/eslint-config`: presets flat config para lint de web e API.
- `packages/tsconfig`: bases TypeScript compartilhadas para apps e pacotes.

## Banco de dados

PostgreSQL e o banco principal planejado e o Prisma e a camada de acesso escolhida. Nesta fase, o Prisma esta instalado e configurado, mas o schema ainda nao possui entidades de dominio. Migrations reais devem ser adicionadas quando os primeiros modelos forem implementados.

## Tenancy inicial

A base inicial de identidade e tenancy do EduFlow deve assumir:

- `User` pode pertencer a uma ou mais `Organization`
- a relacao entre usuario e organizacao acontece por `Membership`
- permissoes derivam do `role` do membership dentro da organizacao ativa
- `Invitation` pertence sempre a uma organizacao e antecede o aceite de um usuario
- delecoes relacionais ficam restritas no banco nesta fase para evitar cascade delete perigoso antes de existir regra clara de lifecycle

## Qualidade e CI

A CI inicial roda em `pull_request` e em `push` para `main`. O workflow usa Node.js 22, pnpm 11.8.0 e executa:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Os testes ainda sao comandos temporarios nos apps. A etapa existe desde ja para manter a interface de qualidade estavel enquanto a cobertura real cresce.

## Limites atuais

Ainda nao existem:

- autenticacao e autorizacao
- modelos de dominio educacional
- modelo `CourseVersion` no banco
- multi-tenancy implementado
- Redis, BullMQ e jobs assincronos
- MinIO ou armazenamento S3-compatible
- integracao real com LLM
- relatorios e certificados
- testes automatizados de dominio ou e2e

Esses itens fazem parte do roadmap do MVP e devem ser implementados nas sprints correspondentes.

## Decisoes registradas

As decisoes arquiteturais iniciais estao documentadas em:

- [ADR-001 - Uso de monorepo](/E:/OneDrive/Dev/eduflow/docs/adr/001-uso-de-monorepo.md)
- [ADR-002 - Separacao frontend/backend](/E:/OneDrive/Dev/eduflow/docs/adr/002-separacao-frontend-backend.md)
- [ADR-003 - CourseVersion para cursos publicados](/E:/OneDrive/Dev/eduflow/docs/adr/003-course-version-para-cursos-publicados.md)
- [ADR-004 - PostgreSQL como banco principal](/E:/OneDrive/Dev/eduflow/docs/adr/004-postgresql-como-banco-principal.md)
- [ADR-005 - Autenticacao inicial com JWT](/E:/OneDrive/Dev/eduflow/docs/adr/005-autenticacao-inicial-com-jwt.md)
