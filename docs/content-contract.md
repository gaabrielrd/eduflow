# Contrato de conteudo editavel v1

O contrato compartilhado de conteudo editavel vive em `@eduflow/types` e e a fonte de verdade para editor e renderer. Ele usa Zod para validacao em runtime, tipos inferidos para TypeScript e permanece desacoplado de React, Nest DTOs e modelos Prisma.

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

## Estrutura raiz

O documento v1 e estrito: aceita apenas `version: 1` e rejeita campos desconhecidos no root, nos blocos e em `props`.

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

## Blocos suportados

- `heading`: `props.level` de `1` a `6` e `props.text` obrigatorio
- `paragraph`: `props.text` obrigatorio
- `quote`: `props.text` obrigatorio e `props.attribution` opcional
- `callout`: `props.variant` em `info | success | warning | destructive`, `props.text` obrigatorio e `props.title` opcional
- `divider`: `props` vazio
- `image`: placeholder minimo com `props.alt` e `props.caption` opcionais
- `video`: placeholder minimo com `props.title` e `props.caption` opcionais
- `file`: placeholder minimo com `props.title` e `props.caption` opcionais

## Semantica atual dos campos textuais

O contrato v1 nao mudou de shape: os campos `props.text` continuam sendo `string`.

No entanto, para blocos textuais (`paragraph`, `quote` e `callout`), essa `string` pode assumir dois formatos compativeis:

- texto simples legado, sem markup
- HTML rico persistido pelo editor baseado em Tiptap

O renderer do frontend deve aceitar ambos os formatos. Isso preserva compatibilidade com aulas antigas sem introduzir `contentJson.version: 2` nesta fase.

## Versionamento

Novas evolucoes do formato devem entrar como novos schemas versionados, sem alargar silenciosamente o contrato v1. Isso preserva compatibilidade explicita entre conteudo legado e novos block types.
