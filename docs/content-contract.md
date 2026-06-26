# Contrato de conteudo editavel v1

O contrato compartilhado de conteudo editavel vive em `@eduflow/types` e e a fonte de verdade para schema, tipos inferidos, validacao em runtime, editor e renderer. Este documento e o guia operacional para contribuidores que precisam entender o formato atual, testar payloads e adicionar novos tipos de bloco.

No dominio atual, esse documento e persistido no campo `Lesson.contentJson`. A lesson tambem carrega um `contentType` (`TEXT`, `VIDEO`, `QUIZ`, `FILE`), que classifica a experiencia da aula, enquanto `contentJson` descreve o corpo editavel renderizavel.

## Como isso se encaixa em cursos e lessons

A estrutura atual de autoria segue:

- `Course`: curso editavel
- `CourseModule`: secao ordenada dentro do curso
- `Lesson`: aula ordenada dentro do modulo

Cada `Lesson` possui:

- `contentType`: tipo funcional da aula
- `contentJson`: documento versionado deste guia

Isso permite manter a evolucao do conteudo desacoplada da modelagem relacional do curriculo. Em outras palavras: curso e ordenacao vivem em `Course`/`CourseModule`/`Lesson`; o corpo estruturado da aula vive neste contrato versionado.

## Estrutura raiz do JSON

O documento v1 e estrito:

- aceita apenas `version: 1`
- exige `blocks` como array
- rejeita campos desconhecidos no root
- rejeita campos desconhecidos em cada bloco
- rejeita campos desconhecidos dentro de `props`

Shape raiz:

```json
{
  "version": 1,
  "blocks": [
    {
      "id": "block_1",
      "type": "heading",
      "props": {
        "level": 2,
        "text": "Introduction"
      }
    }
  ]
}
```

Campos obrigatorios no root:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `version` | `1` | Literal fixo do schema v1 |
| `blocks` | `ContentBlock[]` | Array ordenado de blocos |

## Lista completa de blocos

Os blocos suportados hoje sao:

- `heading`
- `paragraph`
- `quote`
- `callout`
- `divider`
- `image`
- `video`
- `file`

## Props por tipo de bloco

### `heading`

| Prop | Tipo | Obrigatorio | Regra |
| --- | --- | --- | --- |
| `level` | `1 | 2 | 3 | 4 | 5 | 6` | Sim | Define a hierarquia visual e semantica |
| `text` | `string` | Sim | Nao pode ser vazio apos `trim()` |

Exemplo:

```json
{
  "id": "heading_1",
  "type": "heading",
  "props": {
    "level": 2,
    "text": "Introducao"
  }
}
```

### `paragraph`

| Prop | Tipo | Obrigatorio | Regra |
| --- | --- | --- | --- |
| `text` | `string` | Sim | Pode conter texto simples legado ou HTML rico |

### `quote`

| Prop | Tipo | Obrigatorio | Regra |
| --- | --- | --- | --- |
| `text` | `string` | Sim | Pode conter texto simples legado ou HTML rico |
| `attribution` | `string` | Nao | Texto livre opcional |

### `callout`

| Prop | Tipo | Obrigatorio | Regra |
| --- | --- | --- | --- |
| `variant` | `"info" | "success" | "warning" | "destructive"` | Sim | Enum fechado no schema |
| `text` | `string` | Sim | Pode conter texto simples legado ou HTML rico |
| `title` | `string` | Nao | Titulo opcional do destaque |

### `divider`

| Prop | Tipo | Obrigatorio | Regra |
| --- | --- | --- | --- |
| Nenhuma | - | - | `props` deve ser um objeto vazio |

### `image`

| Prop | Tipo | Obrigatorio | Regra |
| --- | --- | --- | --- |
| `assetId` | `string` | Nao | Referencia opcional para um `MediaAsset` existente da biblioteca |
| `alt` | `string` | Nao | Texto alternativo opcional |
| `caption` | `string` | Nao | Legenda opcional |

### `video`

| Prop | Tipo | Obrigatorio | Regra |
| --- | --- | --- | --- |
| `title` | `string` | Nao | Titulo opcional |
| `caption` | `string` | Nao | Legenda opcional |

Observacao operacional:

- a selecao de asset para `video` continua pendente porque a biblioteca de midia atual ainda nao suporta uploads/listagem de arquivos de video no MVP.

### `file`

| Prop | Tipo | Obrigatorio | Regra |
| --- | --- | --- | --- |
| `assetId` | `string` | Nao | Referencia opcional para um `MediaAsset` existente da biblioteca |
| `title` | `string` | Nao | Titulo opcional |
| `caption` | `string` | Nao | Legenda opcional |

## Regras de validacao e garantias de strictness

O schema atual, implementado em `packages/types/src/content-contract.ts`, garante:

- `version` obrigatoriamente igual a `1`
- `blocks` sempre validado por discriminated union em `type`
- `id` obrigatorio para todo bloco
- `heading.props.level` limitado a `1` ate `6`
- `heading.props.text` obrigatorio e nao vazio apos `trim()`
- `callout.props.variant` limitado a `info | success | warning | destructive`
- `image.props.assetId` e `file.props.assetId`, quando presentes, continuam sendo strings opacas de referencia
- nenhuma chave extra no documento, no bloco ou em `props`

Os testes que cobrem esse contrato ficam em `packages/types` e devem continuar validando:

- documento valido com todos os blocos suportados
- versao nao suportada
- tipo de bloco desconhecido
- props obrigatorias ausentes
- enum invalido
- campos extras no root
- campos extras no bloco
- campos extras em `props`

## Compatibilidade do renderer com texto legado e HTML rico

O contrato v1 nao mudou de shape: os campos `props.text` continuam sendo `string`.

No entanto, para blocos textuais, essa `string` pode assumir dois formatos compativeis:

- texto simples legado, sem markup
- HTML rico persistido pelo editor inline baseado em Tiptap

Comportamento esperado do renderer:

- `heading` aceita string simples e tambem HTML persistido
- `paragraph`, `quote` e `callout` aceitam string simples e HTML persistido
- o renderer diferencia markup por inspeção de string
- conteudo malformado que passar em runtime deve degradar com fallback visual, sem quebrar a tela inteira

Isso preserva compatibilidade com aulas antigas sem introduzir `contentJson.version: 2` nesta fase.

## Limitacoes conhecidas do v1

As limitacoes atuais devem ser tratadas como parte explicita do contrato operativo:

- blocos textuais continuam persistindo `string`, nao um AST ou JSON estruturado de rich text
- o renderer confia no HTML persistido e apenas detecta markup por inspeção de string
- `image` e `file` podem carregar `assetId` para resolver metadados e preview basico sem persistir `storageKey`, mas ainda nao tentam viewers avancados ou tratamento rico de erro
- `video` continua como placeholder no preview e sem integracao de asset enquanto a biblioteca de midia nao suportar MIME types de video
- blocos nao suportados ou payloads malformados degradam para fallback visual no renderer, ou sao descartados pela normalizacao do editor, em vez de serem reparados
- o autosave do editor e debounce-based e nao possui fila de retry, resolucao offline ou reconciliacao explicita de conflito

## Como adicionar um novo block type

Ao introduzir um novo bloco, trate a mudanca como trabalho coordenado entre contrato, renderer, estado do editor, interface de edicao, testes e documentacao.

Passos obrigatorios:

1. Adicionar o schema e o tipo em `packages/types/src/content-contract.ts`.
2. Exportar o tipo pela raiz de `@eduflow/types` se o novo bloco precisar ser consumido externamente.
3. Adicionar fixtures e testes de validacao em `packages/types`.
4. Adicionar a branch de renderizacao em `packages/ui/src/components/patterns/content-renderer.tsx`.
5. Adicionar ou ajustar testes de renderer em `packages/ui/tests/content-renderer.test.tsx`.
6. Atualizar `apps/web/src/lib/courses/lesson-editor.ts`:
   - `createEditorBlock`
   - `getBlockTypeLabel`
   - `getBlockSummary`, se aplicavel
   - qualquer normalizacao ou helper adicional exigido pelo novo bloco
7. Atualizar `apps/web/src/components/courses/lesson-content-editor-screen.tsx`:
   - lista de tipos adicionaveis
   - UI de edicao do novo bloco
   - qualquer comportamento de preview ou selecao impactado pela mudanca
8. Adicionar ou ajustar testes puros do reducer em `apps/web/src/lib/courses/lesson-editor.test.ts`.
9. Adicionar ou ajustar testes de integracao em `apps/web/src/components/courses/lesson-content-editor-screen.test.tsx` quando houver mudanca no fluxo de save, preview ou interacoes principais.
10. Atualizar este documento:
   - lista de blocos
   - tabela de props
   - limitacoes conhecidas, se a mudanca alterar o comportamento atual
   - estrategia futura, se a mudanca afetar compatibilidade

Checklist minimo para PR:

- schema valida o novo bloco
- renderer exibe o novo bloco
- editor consegue criar e editar o novo bloco
- testes cobrem contrato e comportamento
- documentacao reflete a nova superficie publica

## Estrategia futura de extensao e versionamento

Evolucoes futuras devem seguir estas regras:

- nao alargar silenciosamente o contrato v1 quando a mudanca quebrar compatibilidade
- avaliar mudancas aditivas com cuidado, porque o schema atual e estrito e a mudanca afeta editor, renderer e fixtures
- criar um novo schema versionado quando houver alteracao incompativel de shape, semantica ou expectativa de persistencia
- manter renderer e editor capazes de lidar com conteudo legado durante migracoes
- atualizar testes e documentacao no mesmo ciclo da mudanca para evitar drift entre contrato e comportamento

Em resumo: blocos novos e ajustes compativeis podem evoluir dentro da estrategia atual, mas qualquer mudanca que redefina o significado de `props`, altere a representacao de rich text ou exija transicao de dados deve ser tratada como nova versao explicita do contrato.
