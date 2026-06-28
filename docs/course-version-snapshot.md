# CourseVersion snapshot v1

Este documento define o formato de `CourseVersion.snapshotJson`. O snapshot e a representacao publicada e imutavel consumida por matriculas, player, relatorios e certificados, sem depender de registros editaveis de autoria.

O schema runtime e os tipos TypeScript vivem em `@eduflow/types`, no arquivo `packages/types/src/course-version-snapshot.ts`.

Para o fluxo operacional de publicacao, regras de validacao, incremento de versao, imutabilidade e limites conhecidos, consulte [docs/publishing-versioning.md](./publishing-versioning.md).

## Principios

- O snapshot e otimizado para leitura, nao para edicao.
- O formato raiz representa o outline do curso: metadados do curso, modulos ordenados e metadados de lessons.
- O corpo de uma lesson fica em `lessonDetails`, para um endpoint futuro de carregamento individual de lesson.
- `lessons` nao contem `contentJson` nem midias.
- Nao existe `media` no root.
- `lessonDetails[].contentJson` reutiliza o contrato versionado descrito em `docs/content-contract.md`.
- Midias existem apenas dentro da lesson detail que referencia aquela midia.
- Campos privados de autoria, sessao, storage interno, senha, email do publisher e timestamps mutaveis de draft nao entram no snapshot.

## Shape raiz

```json
{
  "schemaVersion": 1,
  "publishedAt": "2026-06-27T12:00:00.000Z",
  "publishedBy": {
    "id": "user_1",
    "name": "Instructor Name"
  },
  "course": {
    "id": "course_1",
    "organizationId": "org_1",
    "title": "Course title",
    "slug": "course-title",
    "description": null
  },
  "modules": [
    {
      "id": "module_1",
      "title": "Module title",
      "description": null,
      "position": 1,
      "lessonIds": ["lesson_1"]
    }
  ],
  "lessons": [
    {
      "id": "lesson_1",
      "moduleId": "module_1",
      "title": "Lesson title",
      "description": null,
      "contentType": "TEXT",
      "position": 1,
      "estimatedDurationMinutes": null,
      "isPreview": false
    }
  ],
  "lessonDetails": [
    {
      "id": "lesson_1",
      "moduleId": "module_1",
      "title": "Lesson title",
      "description": null,
      "contentType": "TEXT",
      "position": 1,
      "estimatedDurationMinutes": null,
      "isPreview": false,
      "contentJson": { "version": 1, "blocks": [] },
      "media": []
    }
  ]
}
```

## Ordenacao e consistencia

- `modules` deve estar ordenado por `position ASC`, depois `id ASC`.
- `lessons` deve seguir a ordem dos modulos; dentro de cada modulo, `position ASC`, depois `id ASC`.
- `modules[].lessonIds` deve conter exatamente as lessons daquele modulo, na mesma ordem de `lessons`.
- Cada item em `lessons` deve ter exatamente um item correspondente em `lessonDetails`.
- Os metadados duplicados entre lesson summary e lesson detail devem ser identicos.
- IDs no snapshot sao copias congeladas. Consumidores podem usa-los como IDs locais do snapshot, mas nao devem ler registros editaveis para renderizar o curso publicado.
- `LessonProgress.lessonId` persiste esse ID congelado como `String`; ele nao possui chave estrangeira para `Lesson`, porque `Lesson` continua sendo a entidade mutavel de autoria.
- Codigo de player e progresso deve validar `lessonId` contra `CourseVersion.snapshotJson.lessons` ou `lessonDetails` na borda da aplicacao antes de gravar ou ler progresso.
- O snapshot v1 nao possui marcador de lesson opcional ou obrigatoria. Para conclusao de matricula no MVP, todo item em `lessons[]` deve ser tratado como obrigatorio; mudancas posteriores no rascunho do curso nao alteram essa lista congelada.

## Lesson detail

`lessonDetails` guarda o payload congelado necessario para renderizar uma lesson individual publicada. Esse payload deve alimentar um endpoint futuro de player, por exemplo `GET /course-versions/:versionId/lessons/:lessonId`.

`contentJson` segue o contrato atual de conteudo editavel v1. A versao de `contentJson` e independente de `schemaVersion`.

`media` contem apenas as midias referenciadas por blocos da propria lesson. No contrato atual, referencias de midia aparecem em `image.props.assetId` e `file.props.assetId`; cada `media[].id` deve corresponder a um desses asset IDs.

Shape de midia:

```json
{
  "id": "media_1",
  "url": "https://cdn.example.com/media/file.png",
  "fileName": "file.png",
  "originalName": "Original file.png",
  "mimeType": "image/png",
  "sizeBytes": 12345
}
```

`url` e uma URL publica congelada para v1. Se a estrategia de entrega mudar, a mudanca deve virar uma nova versao do snapshot em vez de alterar silenciosamente o significado de v1.

## Evolucao e migracoes futuras

Mudancas compativeis podem ser adicionadas apenas quando nao quebrarem consumidores existentes e forem refletidas no schema, testes e documentacao no mesmo ciclo.

Criar `schemaVersion: 2` quando houver alteracao incompativel, como:

- remover ou renomear campos
- mudar a semantica de `media.url`
- trocar a representacao de lesson detail
- alterar regras de ordenacao ou de consistencia entre arrays
- mudar o formato esperado de `contentJson` de forma incompativel

Durante migracoes, leitores devem continuar reconhecendo snapshots antigos ate existir uma estrategia explicita de backfill ou conversao.
