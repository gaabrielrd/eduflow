# Padroes iniciais de UI do EduFlow

## Objetivo

Este guia registra os padroes iniciais de interface e experiencia do EduFlow para orientar as proximas telas reais de cursos, curriculo e autoria. Ele complementa `AGENTS.md`, `README.md`, `docs/architecture.md` e a revisao em `docs/accessibility-sprint-2-review.md`.

## Fonte de verdade atual

- `packages/ui` e a fonte unica dos componentes compartilhados de interface.
- O Storybook do `packages/ui` e a referencia principal para primitives e patterns reutilizaveis.
- O shell autenticado do `apps/web` e a referencia principal para composicao de layout autenticado fora do Storybook.
- Este documento descreve o que ja existe no repositorio. Nao cria novos patterns por si so.

## Estrutura de layout

### Shell autenticado

Rotas autenticadas devem continuar compostas sobre o `AppShell` do `apps/web`, mantendo a seguinte estrutura como base:

- `Sidebar` com navegacao principal derivada de `apps/web/src/lib/navigation.ts`
- `Topbar` com acesso a contexto e acoes de sessao
- `Breadcrumb` sincronizado com a rota atual
- `OrganizationMenu` para troca de organizacao ativa
- `UserMenu` para acoes do usuario autenticado
- `main` como landmark do conteudo principal
- `PageHeader` como cabecalho interno da pagina ou secao principal

Regras operacionais:

- Nao duplicar navegacao estrutural dentro de cada tela autenticada.
- Reutilizar `PageHeader` para titulo, descricao curta e acoes principais da pagina.
- Em mobile, a navegacao autenticada continua priorizando drawer na topbar em vez de sidebar fixa.
- O breadcrumb e os links ativos devem continuar usando a fonte de verdade compartilhada em `apps/web/src/lib/navigation.ts`.

## Componentes base

Os componentes compartilhados principais do `@eduflow/ui` para as proximas sprints sao:

- `Button`
- `Input`
- `Textarea`
- `Checkbox`
- `Select`
- `Dialog`
- `Skeleton`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `PageHeader`

Diretrizes de uso:

- Preferir composicao dos primitives existentes antes de criar wrappers novos no `apps/web`.
- Usar variantes semanticas e tokens do tema em vez de cores hardcoded.
- Manter foco visivel, estados `disabled` e `loading` quando o componente ja suporta esse contrato.
- Consultar os stories proximos aos componentes em `packages/ui/src` antes de introduzir nova variacao visual.

## Formularios

### Composicao de campo

O padrao atual de composicao de campos no `apps/web` e `AuthFormField`. Ele ainda e um pattern local do app e serve como referencia transitória para novos formularios.

Contrato minimo:

- todo campo deve ter `label` visivel;
- `Input`, `Textarea` e `Select` continuam neutros e dependem de wiring acessivel pelo consumidor;
- quando houver texto de apoio, associar o campo ao hint via `aria-describedby`;
- quando houver erro, associar o campo ao erro via `aria-describedby`;
- nao usar placeholder como substituto de label.

### Erro de campo vs erro de pagina

- Erro de campo permanece junto ao proprio campo, com mensagem curta e acionavel.
- Erro de pagina ou de secao deve usar `ErrorState` ou banner contextual equivalente.
- Nao misturar falha tecnica geral com mensagens de validacao local.

### Acoes de envio

- O botao principal de submit deve usar `Button` com estado `loading` quando houver submissao assincrona.
- Formularios devem manter labels claras para acao primaria, como `Salvar`, `Criar curso` ou `Convidar membro`.

## Loading, erro e empty state

O padrao oficial para estados assincronos no frontend e:

- `LoadingState`: carregamento de pagina ou secao com contexto textual.
- `Skeleton`: preservacao de layout enquanto os dados ainda nao chegaram.
- `ErrorState`: falha tecnica com mensagem clara e acao explicita de retry.
- `EmptyState`: ausencia de dados com proximo passo claro.

Regras de uso:

- Preferir `LoadingState` quando o usuario precisa entender o que esta sendo carregado.
- Preferir `Skeleton` quando a estrutura visual da tela ja e conhecida e vale preservar layout.
- Em `ErrorState`, expor CTA de retry visivel, normalmente com label `Tentar novamente`.
- Em `EmptyState`, explicar a ausencia de dados e expor CTA contextual quando houver proximo passo.
- Evitar spinner isolado sem contexto textual.

## Acoes destrutivas

Para acoes irreversiveis ou de alto impacto:

- usar `Button` com variante `destructive` para a confirmacao final;
- exigir confirmacao explicita em `Dialog`;
- descrever de forma objetiva o impacto da acao, incluindo o que sera removido, cancelado ou perdido;
- manter acao secundaria clara para cancelamento;
- evitar rotular a acao destrutiva com texto ambiguo como `OK` ou `Continuar`.

Este guia assume o primitive `Dialog` existente. Nao ha introducao de `AlertDialog` nesta etapa.

## Uso de modais

`Dialog` deve ser usado para:

- confirmacoes destrutivas;
- fluxos curtos de autenticacao, confirmacao ou complemento de contexto;
- tarefas que nao exigem navegacao longa nem grande volume de conteudo.

Evitar modal quando:

- o fluxo exige formulario extenso;
- o usuario precisa comparar muito conteudo da tela base;
- a tarefa se beneficia mais de rota dedicada.

Contrato minimo para modais:

- incluir `DialogTitle`;
- incluir `DialogDescription` quando o contexto nao for obvio apenas pelo titulo;
- preservar fechamento por `Escape`;
- devolver foco ao trigger ao fechar;
- manter a ordem de tabulacao restrita ao conteudo do dialog enquanto ele estiver aberto.

## Foco e navegacao por teclado

Padroes minimos de acessibilidade para novas telas:

- foco visivel em links, botoes, campos e triggers interativos;
- skip link para `#main-content` no shell autenticado;
- `aria-current="page"` na navegacao ativa;
- ordem de tabulacao estavel e previsivel;
- navegacao por teclado preservada em `Select`, `Dialog`, `DropdownMenu` e `Tabs`;
- landmarks semanticos consistentes, especialmente `nav`, `header`, `aside` e `main`.

Regras complementares:

- ao introduzir novos campos, manter label visivel e nome acessivel claro;
- ao introduzir novos atalhos ou interacoes por teclado, documentar o comportamento no Storybook quando o componente estiver em `packages/ui`;
- tratar a revisao em `docs/accessibility-sprint-2-review.md` como baseline do comportamento esperado.

## Referencias operacionais

- Storybook do design system em `packages/ui`
- Tokens compartilhados em `packages/ui/src/styles/tokens.css`
- Revisao de acessibilidade em `docs/accessibility-sprint-2-review.md`
- Shell autenticado em `apps/web/src/components/app-shell.tsx`
- Navegacao compartilhada em `apps/web/src/lib/navigation.ts`
