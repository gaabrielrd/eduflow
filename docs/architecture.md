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

No repositorio, as rotas autenticadas publicas sob `/app/*` ficam materializadas em `apps/web/src/app/app/*`. O primeiro `app` e o segmento de URL; o segundo e a pasta raiz do App Router dentro de `src/app`.

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
- `prisma/schema.prisma` com identidade, tenancy inicial e os primeiros modelos de autoria de cursos (`Course`, `CourseModule`, `Lesson`)
- infraestrutura de autorizacao baseada em `JwtAuthGuard`, `CurrentUser`, `OrganizationContextGuard`, `Roles` e `RolesGuard`

Para autenticacao local do MVP, a estrategia prevista e:

- JWT com `access token` e `refresh token`
- transporte via `Bearer` tokens em JSON
- `refresh token` persistido por sessao em tabela propria
- suporte a multiplas sessoes por usuario
- `GET /auth/me` protegido por guard JWT
- no frontend web, os tokens passam a ser persistidos em cookies `HttpOnly` no dominio do app, gravados por route handlers do Next.js
- a web usa um BFF fino em `/api/auth/*` para login, refresh, logout, bootstrap da sessao e sincronizacao da organizacao ativa
- o bootstrap da sessao web usa `GET /auth/me` enriquecido com `user`, `organizations` e `activeOrganizationId`

Para autorizacao organizacional do MVP, a estrategia adotada e:

- `JwtAuthGuard` valida `Bearer access token` e carrega o usuario atual
- `CurrentUser` expõe o usuario autenticado nos controllers
- `OrganizationContextGuard` resolve a organizacao atual via header `X-Organization-Id`
- membership e `role` sempre sao validados no backend antes de liberar acesso organizacional
- `RolesGuard` usa metadata declarada por `@Roles(...)` e consome o contexto organizacional ja resolvido, sem nova query de membership
- o frontend persiste `activeOrganizationId` em cookie proprio e o reenvia para a API via header `X-Organization-Id`

Para membros e convites no MVP, a estrategia atual passa a assumir:

- `OWNER` e `ADMIN` podem listar membros, listar convites e criar convites na organizacao ativa
- convites aceitam apenas roles operacionais definidas pelo backend e nao permitem `OWNER` sem decisao explicita posterior
- cada convite gera um `token` unico com expiracao fixa e status derivado por `acceptedAt` e `expiresAt`
- o link compartilhado do convite aponta para uma rota publica da web, sem envio de email automatico nesta fase
- ao abrir o link sem sessao, a web mostra um modal de login ou cadastro na propria tela do convite
- o aceite do convite exige usuario autenticado e validacao do email da conta contra o email persistido no convite

## Packages

- `packages/ui`: ponto de partida para componentes reutilizaveis.
- `packages/types`: tipos compartilhados entre apps e futuros jobs, incluindo o contrato versionado de conteudo editavel usado por editor e renderer.
- `packages/config`: constantes e helpers compartilhaveis sem segredos.
- `packages/eslint-config`: presets flat config para lint de web e API.
- `packages/tsconfig`: bases TypeScript compartilhadas para apps e pacotes.

## Storybook do design system

O Storybook inicial do EduFlow vive em `packages/ui`, e nao em `apps/web`, para reforcar que a vitrine tecnica do design system pertence ao pacote de componentes compartilhados e nao ao app consumidor.

As convencoes iniciais sao:

- stories ficam proximas aos componentes compartilhados em `packages/ui/src`
- o Storybook documenta primitives e patterns reutilizaveis, nao telas ou fluxos de rota
- os design tokens iniciais vivem em `packages/ui/src/styles/tokens.css` e sao consumidos por `apps/web` e pelo Storybook via Tailwind v4 em modo CSS-first
- o contrato visual compartilhado passa a privilegiar classes semanticas como `bg-background`, `text-foreground`, `border-border` e `ring-ring`
- estados assincros compartilhados como loading, error, empty e skeleton devem ser documentados primeiro no Storybook e reutilizados pelas telas do `apps/web`
- erro de campo permanece acoplado ao formulario e ao proprio input; erro de pagina deve usar pattern contextual como `ErrorState`

O guia operacional de interface e experiencia desta base vive em `docs/ui.md`. Ele e a referencia primaria para layout, formularios, estados assincronos, modais e acessibilidade minima no frontend.

## Banco de dados

PostgreSQL e o banco principal planejado e o Prisma e a camada de acesso escolhida. Nesta fase, o schema Prisma ja cobre identidade, tenancy e a estrutura inicial de autoria de cursos, com `Course`, `CourseModule` e `Lesson`. A decisao de publicacao continua separando a entidade editavel `Course` do futuro `CourseVersion`, que entrara em sprint posterior para snapshots publicados e imutaveis.

### Estrutura atual de cursos e lessons

O curriculo autoravel atual segue esta hierarquia:

- `Course` pertence a uma `Organization` e concentra metadados editaveis do curso
- `CourseModule` pertence a um `Course` e organiza o curriculo em secoes ordenadas
- `Lesson` pertence a um `CourseModule` e representa a unidade ordenada consumivel do curriculo

As regras importantes do modelo atual sao:

- `Course.slug` e unico por organizacao
- `CourseModule.position` e unico por curso
- `Lesson.position` e unico por modulo
- modulos e lessons usam arquivamento logico por `status` em vez de delete fisico como fluxo principal

Cada lesson tambem possui:

- `contentType`: tipo funcional da lesson em `TEXT`, `VIDEO`, `QUIZ` ou `FILE`
- `contentJson`: payload JSON do conteudo editavel
- `estimatedDurationMinutes`: duracao estimada opcional
- `isPreview`: indicador para acesso de preview

O contrato do campo `contentJson` fica em `@eduflow/types` e esta descrito em [docs/content-contract.md](/E:/OneDrive/Dev/eduflow/docs/content-contract.md). Hoje esse documento e independente do transporte HTTP e do banco: Nest valida a presenca de um objeto JSON, enquanto o schema versionado compartilhado define a estrutura esperada pelo editor e pelo renderer. Na iteracao atual do editor de lessons, os blocos textuais de `contentJson.version = 1` continuam com `props.text` como `string`, mas o frontend passa a aceitar tanto texto simples legado quanto HTML rico persistido pelo editor inline.

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

- modelo `CourseVersion` no banco
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
