# Contrato de conteudo editavel v1

O contrato compartilhado de conteudo editavel vive em `@eduflow/types` e e a fonte de verdade para editor e renderer. Ele usa Zod para validacao em runtime, tipos inferidos para TypeScript e permanece desacoplado de React, Nest DTOs e modelos Prisma.

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

## Versionamento

Novas evolucoes do formato devem entrar como novos schemas versionados, sem alargar silenciosamente o contrato v1. Isso preserva compatibilidade explicita entre conteudo legado e novos block types.
