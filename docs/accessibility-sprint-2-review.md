# Revisao de acessibilidade da Sprint 2

Data da revisao: 2026-06-22

Objetivo: validar os componentes da Sprint 2 antes do reuso nas telas de cursos, com foco em labels, foco visivel, navegacao por teclado, HTML semantico e documentacao do comportamento esperado.

## Resultado geral

- `packages/ui`: stories de campos atualizadas para demonstrar label visivel, hint, erro, estado `disabled` e instrucoes de teclado quando aplicavel.
- `apps/web`: shell autenticado revisado com foco visivel em links, `aria-current` na navegacao ativa, breadcrumb semantico e skip link para o conteudo principal.
- Cobertura automatizada ampliada para labels de campos, teclado em `Select`, fechamento de `Dialog` com retorno de foco e abertura/fechamento de `DropdownMenu` por teclado.

## Checklist por componente

### Button

- Validado:
  - foco visivel no primitive compartilhado;
  - estado `disabled` e `loading` cobertos em story e teste.
- Pendente:
  - nenhuma pendencia funcional identificada.
- Risco para telas de cursos:
  - baixo.
- Status:
  - aceitavel agora.

### Input

- Validado:
  - stories com label visivel, hint, erro e estado `disabled`;
  - teste de associacao entre `label` e campo.
- Pendente:
  - o componente continua neutro e depende do consumidor para fornecer `id`, `label` e `aria-describedby`.
- Risco para telas de cursos:
  - medio se algum formulario novo usar apenas placeholder.
- Status:
  - aceitavel agora com uso disciplinado.

### Textarea

- Validado:
  - stories com label visivel, hint e erro;
  - teste de associacao entre `label` e campo.
- Pendente:
  - mesma dependencia do consumidor para wiring semantico de formulario.
- Risco para telas de cursos:
  - medio em formularios criados sem wrapper de campo.
- Status:
  - aceitavel agora com uso disciplinado.

### Checkbox

- Validado:
  - foco visivel no primitive;
  - stories com label e exemplo com hint/erro;
  - teste de nome acessivel via label.
- Pendente:
  - nenhuma pendencia funcional identificada.
- Risco para telas de cursos:
  - baixo.
- Status:
  - aceitavel agora.

### Select

- Validado:
  - story com label visivel e instrucoes de teclado;
  - teste de abertura e selecao por teclado.
- Pendente:
  - o primitive continua dependendo do consumidor para label explicita no trigger.
- Risco para telas de cursos:
  - medio se for usado sem `label` ou `aria-label`.
- Status:
  - aceitavel agora com uso disciplinado.

### Dialog

- Validado:
  - foco visivel no container e no botao de fechar;
  - documentacao de teclado no Storybook;
  - teste de fechamento com retorno de foco ao trigger.
- Pendente:
  - nenhuma pendencia funcional identificada.
- Risco para telas de cursos:
  - baixo.
- Status:
  - aceitavel agora.

### DropdownMenu

- Validado:
  - documentacao de teclado no Storybook;
  - teste de abertura por teclado e fechamento com `Escape`.
- Pendente:
  - nenhuma pendencia funcional identificada.
- Risco para telas de cursos:
  - baixo.
- Status:
  - aceitavel agora.

### Tabs

- Validado:
  - foco visivel nos triggers;
  - comportamento por setas ja coberto em teste;
  - documentacao de teclado adicionada ao Storybook.
- Pendente:
  - nenhuma pendencia funcional identificada.
- Risco para telas de cursos:
  - baixo.
- Status:
  - aceitavel agora.

### PageHeader

- Validado:
  - composicao semantica preservada como pattern de cabecalho interno.
- Pendente:
  - depende dos elementos `actions` recebidos manterem foco visivel e nome acessivel.
- Risco para telas de cursos:
  - baixo.
- Status:
  - aceitavel agora.

### LoadingState / ErrorState / EmptyState

- Validado:
  - uso de semantica contextual e texto de apoio;
  - `LoadingState` com `aria-busy`, `aria-live` e `srLabel`;
  - `ErrorState` com mensagem e area de acao clara.
- Pendente:
  - revisar futuras composicoes para evitar CTA sem contexto textual.
- Risco para telas de cursos:
  - baixo.
- Status:
  - aceitavel agora.

### AppShell

- Validado:
  - `nav`, `aside`, `header` e `main` preservados;
  - skip link para `#main-content`;
  - foco visivel em links de marca, navegacao e breadcrumb;
  - `aria-current="page"` na navegacao ativa;
  - breadcrumb migrado para lista semantica;
  - teste cobrindo skip link e breadcrumb atual.
- Pendente:
  - nao ha teste automatizado completo para fluxo mobile com `Dialog`, `Select` e `DropdownMenu` combinados.
- Risco para telas de cursos:
  - baixo para desktop, medio para regressao futura no menu mobile.
- Status:
  - aceitavel agora.

### AuthShell

- Validado:
  - foco visivel em links primarios e secundarios;
  - landmarks principais preservados.
- Pendente:
  - nao ha teste automatizado dedicado para tabulacao entre links e formulario.
- Risco para telas de cursos:
  - baixo, pois nao e shell de cursos, mas permanece parte da base da Sprint 2.
- Status:
  - aceitavel agora.

### AuthFormField

- Validado:
  - `label` com `htmlFor`;
  - hint e erro com ids previsiveis;
  - erro anunciado com `role="alert"`.
- Pendente:
  - a ligacao de `aria-describedby` ainda depende do formulario consumidor.
- Risco para telas de cursos:
  - medio se novos formularios ignorarem esse contrato.
- Status:
  - aceitavel agora com uso disciplinado.

## Limitacoes conhecidas

- O pacote UI ainda nao oferece um helper compartilhado de composicao de campo no proprio `packages/ui`; hoje o contrato acessivel de `Input`, `Textarea` e `Select` depende do consumidor.
- O shell autenticado continua documentado fora do Storybook por decisao arquitetural; isso reduz a visibilidade de comportamento composto dentro da vitrine do design system.
- A validacao automatizada completa em Windows pode falhar por `spawn EPERM` ao iniciar workers do Vitest ou processos do `esbuild` no Storybook. Isso deve ser tratado como limitacao de ambiente ate prova em contrario, nao como defeito de implementacao.

## Validacao executada

- `pnpm --filter @eduflow/ui typecheck`
- tentativa de `pnpm --filter @eduflow/ui test`
- tentativa de `pnpm --filter @eduflow/ui build-storybook`

## Proximos cuidados para telas de cursos

- Sempre compor campos com label visivel e `aria-describedby` quando houver hint/erro.
- Reutilizar `AuthFormField` ou evoluir um helper equivalente compartilhado antes de proliferar novos wrappers locais.
- Ao adicionar novas composicoes com `Dialog`, `DropdownMenu` ou `Select`, preservar os contratos de teclado documentados no Storybook.
