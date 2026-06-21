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
- Ao adicionar componentes interativos:
  - garantir foco visivel
  - preservar navegacao por teclado quando aplicavel
  - tratar estados `disabled` e `loading` quando fizer sentido
  - preferir composicao a props excessivamente genericas
- Subcomponentes compostos devem seguir convencoes previsiveis no estilo shadcn, como `Dialog`, `DialogContent`, `DialogTrigger`.

## Convencoes de styling

- O `apps/web` deve continuar escaneando `packages/ui/src` para classes Tailwind usadas no pacote compartilhado.
- Estilos compartilhados de componentes devem permanecer no proprio `packages/ui`, nao replicados pagina a pagina.
- Tokens globais continuam centralizados no frontend em `apps/web/src/styles/tokens.css` ate existir uma camada compartilhada formal para design tokens.

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
- Se uma decisao contradizer o `README.md` ou `docs/architecture.md`, alinhar os arquivos no mesmo ciclo de trabalho.

## Referencias externas aprovadas

- Componentes e patterns do shadcn:
  - https://ui.shadcn.com/docs/components
- Instalacao e configuracao de shadcn para Next.js:
  - https://ui.shadcn.com/docs/installation/next
