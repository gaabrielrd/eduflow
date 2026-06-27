# Publicacao e versionamento de cursos

Este guia descreve o fluxo operacional de publicacao do EduFlow. A decisao arquitetural esta registrada em [ADR-003 - CourseVersion para cursos publicados](./adr/003-course-version-para-cursos-publicados.md); o formato detalhado do snapshot esta em [CourseVersion snapshot v1](./course-version-snapshot.md).

## Course vs CourseVersion

`Course` e a entidade editavel da autoria. Autores podem alterar titulo, descricao, modulos, lessons, conteudo e midias associadas ao rascunho do curso.

`CourseVersion` e a representacao publicada e imutavel de um curso em um momento especifico. Cada publicacao cria uma nova linha com:

- `courseId` e `organizationId` para manter o vinculo de origem e tenancy
- `versionNumber` incremental por curso
- titulo e descricao congelados no momento da publicacao
- `publishedById` e `publishedAt`
- `snapshotJson` com o outline e detalhes publicados
- `status`, hoje iniciado como `PUBLISHED`

Leitores de experiencia publicada devem usar `CourseVersion`, nao o `Course` editavel. Isso evita que alteracoes posteriores no rascunho mudem o conteudo consumido por alunos, relatorios ou certificados.

## Ciclo de publicacao

O endpoint `POST /courses/:courseId/publish` cria uma nova versao publicada a partir do estado atual do curso. O fluxo e:

1. Resolver autenticacao e contexto organizacional.
2. Exigir role de autoria (`OWNER`, `ADMIN`, `INSTRUCTOR` ou `MANAGER`).
3. Buscar o curso dentro da organizacao ativa; cursos inexistentes ou de outra organizacao retornam `404`.
4. Validar estrutura, conteudo e referencias de midia.
5. Calcular o proximo `versionNumber` como o maior numero existente para o curso mais um.
6. Construir `snapshotJson` com `CourseVersionSnapshotService`.
7. Criar `CourseVersion` e marcar o `Course` como `PUBLISHED` na mesma transacao.

O incremento de versao e por curso. Publicar outro curso da mesma organizacao comeca novamente em `versionNumber = 1`.

## Regras de validacao

As regras compartilhadas vivem em `packages/types/src/course-publish-validation.ts`, e a API aplica essas regras em `CoursePublishValidationService`.

| Codigo | Quando ocorre |
| --- | --- |
| `COURSE_TITLE_REQUIRED` | O titulo do curso esta em branco. |
| `COURSE_ARCHIVED` | O curso esta arquivado. |
| `COURSE_WITHOUT_MODULES` | O curso nao possui modulos ativos. |
| `MODULE_WITHOUT_LESSONS` | Um modulo ativo nao possui lessons ativas. |
| `LESSON_TITLE_REQUIRED` | Uma lesson ativa esta sem titulo. |
| `LESSON_CONTENT_INVALID` | `contentJson` nao passa no schema compartilhado. |
| `MEDIA_ASSET_MISSING` | Uma midia referenciada no conteudo nao existe. |
| `MEDIA_ASSET_WRONG_ORGANIZATION` | Uma midia referenciada pertence a outra organizacao. |
| `MEDIA_ASSET_UNAVAILABLE` | Uma midia referenciada existe, mas nao esta pronta para uso. |

`GET /courses/:courseId/publish-validation` retorna `{ valid, errors }` sem criar versao. `POST /courses/:courseId/publish` executa a mesma validacao e retorna `400` com o payload de validacao quando o curso nao pode ser publicado.

## Snapshot e imutabilidade

`CourseVersion.snapshotJson` usa o contrato v1 documentado em [docs/course-version-snapshot.md](./course-version-snapshot.md). O snapshot inclui metadados do curso, modulos ordenados, summaries de lessons, detalhes de lessons e midias publicas necessarias para renderizar o conteudo publicado.

Depois de criado, `snapshotJson` nao deve mudar. A migracao que introduziu `CourseVersion` cria o trigger `CourseVersion_snapshotJson_immutable`, que rejeita atualizacoes do campo `snapshotJson`. A aplicacao tambem trata `CourseVersion` como leitura historica: editar o rascunho do `Course` depois de publicar nao altera versoes antigas.

Endpoints de listagem e inspecao de versoes nao devem expor o snapshot completo sem uma necessidade explicita. A listagem de versoes permanece leve e a tela de inspecao mostra apenas metadados seguros.

## Cobertura de testes

A cobertura principal esta em `apps/api/src/courses/courses.test.ts`:

- publicacao valida cria `CourseVersion`
- curso inexistente retorna `404`
- usuario sem permissao de autoria retorna `403`
- curso de outra organizacao retorna `404`
- curso sem modulos, modulo sem lessons e conteudo invalido sao rejeitados
- referencias de midia ausentes, indisponiveis ou de outra organizacao sao rejeitadas
- `versionNumber` incrementa por curso
- snapshots antigos permanecem inalterados apos edicoes no rascunho
- caminhos invalidos nao criam versoes

No frontend, `apps/web/src/components/courses/course-details-screen.test.tsx` cobre checklist de publicacao, estado invalido, sucesso e falha. `apps/web/src/components/courses/course-versions-screen.test.tsx` cobre historico de versoes vazio e populado.

Esses testes entram na CI porque `.github/workflows/ci.yml` executa `pnpm test` em pull requests e pushes para `main`.

## Limites conhecidos

- Nao existe rollback ou restauracao de um curso a partir de uma versao publicada.
- Nao existe UI de diff entre versoes.
- Nao existe fluxo de despublicacao ou arquivamento operacional de versoes.
- O player do aluno ainda nao consome `CourseVersion`.
- Matriculas, progresso, relatorios e certificados ainda nao apontam para versoes publicadas.
- Nao existe estrategia de backfill, migracao ou conversao para snapshots antigos alem da regra de manter leitores compativeis.
- O snapshot v1 congela URLs publicas de midia; mudancas nessa semantica exigem novo `schemaVersion`.
