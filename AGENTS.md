# AGENTS.md

## Objetivo

Este arquivo registra as convencoes operacionais do repositorio para agentes e colaboradores automatizados. Ele deve permanecer consistente com `README.md`, `docs/architecture.md` e com as decisoes tecnicas em `docs/adr/`.

## Stack e estrutura

- O repositorio e um monorepo `pnpm` com workspaces em `apps/*` e `packages/*`.
- Pacotes internos usam o namespace `@eduflow/*`.
- Aplicacoes principais:
  - `apps/web`: Next.js App Router, React, TypeScript strict e Tailwind CSS
  - `apps/api`: NestJS, TypeScript strict e Prisma
- Pacotes compartilhados:
  - `packages/ui`: componentes e utilitarios visuais compartilhados
  - `packages/types`: tipos compartilhados
  - `packages/config`: constantes e helpers sem segredos
  - `packages/eslint-config`: configuracoes compartilhadas de lint
  - `packages/tsconfig`: bases compartilhadas de TypeScript

## Convencoes de import e ownership

- Imports entre workspaces devem usar nomes de pacote, por exemplo `@eduflow/ui`, `@eduflow/types` e `@eduflow/config`.
- No `apps/web`, o alias `@/*` deve ser usado apenas para codigo interno de `apps/web/src`.
- Componentes reutilizaveis de interface devem viver em `packages/ui`.
- Evitar duplicar primitives visuais no `apps/web` quando fizer sentido compartilhamento.
- Componentes de dominio ou acoplados a rotas especificas devem permanecer no app consumidor ate existir necessidade real de compartilhamento.

## Convencoes do pacote UI

- O `packages/ui` e a fonte unica dos componentes compartilhados de interface.
- O pacote deve expor componentes e utilitarios pela raiz de `@eduflow/ui`.
- A fundacao visual do pacote UI usa Tailwind e padroes do ecossistema shadcn/Radix.
- O pacote tambem centraliza a fundacao visual reutilizavel:
  - tokens em `packages/ui/src/styles/tokens.css`
  - primitives compartilhados como `Button`, `Input`, `Select`, `Dialog`, `Skeleton`
  - patterns compartilhados como `PageHeader`, `LoadingState`, `ErrorState` e `EmptyState`
- Ao adicionar componentes interativos:
  - garantir foco visivel
  - preservar navegacao por teclado quando aplicavel
  - tratar estados `disabled` e `loading` quando fizer sentido
  - preferir composicao a props excessivamente genericas
- Subcomponentes compostos devem seguir convencoes previsiveis no estilo shadcn, como `Dialog`, `DialogContent`, `DialogTrigger`.

## Convencoes de styling

- O `apps/web` deve continuar escaneando `packages/ui/src` para classes Tailwind usadas no pacote compartilhado.
- Estilos compartilhados de componentes devem permanecer no proprio `packages/ui`, nao replicados pagina a pagina.
- Os tokens visuais iniciais vivem em `packages/ui/src/styles/tokens.css` e devem ser consumidos por `apps/web` e pelo Storybook.
- O arquivo `apps/web/src/styles/tokens.css` existe apenas como ponte de import para a fonte de verdade em `packages/ui`.
- Em componentes e paginas, preferir classes semanticas como:
  - `bg-background`, `bg-card`, `bg-muted`
  - `text-foreground`, `text-card-foreground`, `text-muted-foreground`
  - `border-border`, `border-input`
  - `ring-ring`
- Evitar hardcode de cores utilitarias de dominio visual como `bg-white`, `text-slate-*`, `border-slate-*`, `ring-sky-*` e equivalentes quando existir token semantico adequado.
- Quando um estado precisar de cor contextual, preferir tokens semanticos como `primary`, `destructive`, `success` e `warning` em vez de paletas visuais arbitrarias.
- Skeletons, banners e superficies de feedback tambem devem seguir os tokens semanticos do tema.

## Convencoes de composicao no web

- O shell autenticado de `apps/web` deve continuar estruturado sobre componentes reutilizaveis e landmarks semanticos:
  - `AppShell` como orquestrador
  - `Sidebar`
  - `Topbar`
  - `Breadcrumb`
  - `OrganizationMenu`
  - `UserMenu`
  - `main` para conteudo principal
- Rotas autenticadas devem reutilizar o shell em `/app` e manter `PageHeader` como bloco de cabecalho de pagina interna, sem duplicar estrutura de navegacao dentro de cada tela.
- A navegacao autenticada e o breadcrumb devem usar a fonte de verdade compartilhada em `apps/web/src/lib/navigation.ts`.
- Links ativos no shell devem ser indicados visualmente com base na rota atual, incluindo subrotas como `settings/members`.
- O comportamento mobile basico do shell deve continuar privilegiando drawer na topbar em vez de duplicar uma sidebar fixa em telas pequenas.

## TypeScript e build

- Pacotes compartilhados com React devem configurar suporte explicito a `.tsx`.
- Em pacotes de UI React, preferir `moduleResolution: "Bundler"` para evitar atrito com imports internos em TS durante o desenvolvimento.
- Sempre que `apps/web` consumir codigo-fonte de um workspace package:
  - manter `transpilePackages` configurado no Next quando necessario
  - manter o `tsconfig` do app alinhado para resolver o pacote sem hacks locais desnecessarios
- Novas convencoes de compilacao devem permanecer coerentes com `packages/tsconfig`.

## Testes e validacao

- Antes de concluir alteracoes relevantes no frontend, validar no minimo:
  - typecheck do pacote alterado
  - build do `apps/web` quando houver impacto visual ou de imports compartilhados
  - testes do pacote alterado, quando existirem
- Para o pacote UI, preferir testes de comportamento com Testing Library e Vitest.
- Em ambientes Windows com OneDrive, podem ocorrer erros `EPERM` em arquivos temporarios ou caches de build.
- Quando isso acontecer:
  - distinguir erro de ambiente de erro real de codigo antes de alterar a implementacao
  - preferir reexecutar checks pontuais do workspace afetado
  - evitar concluir que o codigo falhou sem isolar locks em `.next`, arquivos `_tmp_*` ou workers do runner

## Convencoes para estados assincros

- Para loading, erro e ausencia de dados, reutilizar preferencialmente os patterns do `@eduflow/ui`:
  - `LoadingState`
  - `ErrorState`
  - `EmptyState`
  - `Skeleton`
- Evitar spinner isolado sem contexto textual. Loading deve preferir titulo e descricao curtos, e quando fizer sentido `srLabel` para leitor de tela.
- `ErrorState` deve ser tratado como erro de pagina ou secao, com mensagem clara e acionavel.
- O padrao de retry deve entrar como acao explicita visivel, normalmente via `action` em `ErrorState`, com label como `Tentar novamente` ou equivalente contextual.
- `EmptyState` deve comunicar ausencia de dados, nao falha tecnica. Quando houver proximo passo claro, expor CTA.
- `Skeleton` deve ser usado como primitive composavel para preservar layout durante carregamento, sem criar uma biblioteca extensa de placeholders especializados sem necessidade real.
- Erro de campo e erro de pagina devem permanecer distintos:
  - erro de campo continua junto ao proprio formulario/input, como em `AuthFormField`
  - erro de pagina ou secao deve usar `ErrorState` ou banner contextual equivalente
- Sempre que novos estados assincros forem introduzidos no frontend, adicionar ou atualizar stories no Storybook como referencia principal de uso.

## Comandos canonicos

- Usar scripts da raiz quando a intencao for validar o monorepo.
- Usar filtros por workspace para trabalho focado:
  - `pnpm --filter @eduflow/web <script>`
  - `pnpm --filter @eduflow/api <script>`
  - `pnpm --filter @eduflow/ui <script>`
- Sempre que possivel, manter scripts reais nos pacotes em vez de placeholders silenciosos.

## Consistencia documental

- Ao introduzir uma nova convencao estrutural, atualizar a documentacao correspondente se ela alterar a leitura de:
  - arquitetura do monorepo
  - ownership de codigo compartilhado
  - fluxo oficial de build, teste ou imports
- Convencoes de tokens, shell autenticado e estados assincros devem permanecer alinhadas entre `AGENTS.md`, `README.md` e `docs/architecture.md`.
- Se uma decisao contradizer o `README.md` ou `docs/architecture.md`, alinhar os arquivos no mesmo ciclo de trabalho.

## Referencias externas aprovadas

- Componentes e patterns do shadcn:
  - https://ui.shadcn.com/docs/components
- Instalacao e configuracao de shadcn para Next.js:
  - https://ui.shadcn.com/docs/installation/next
