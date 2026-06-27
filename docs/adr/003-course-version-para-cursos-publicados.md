# ADR-003 - CourseVersion para cursos publicados

## Status

Aceita como decisao arquitetural planejada para o MVP.

## Contexto

Cursos digitais sao editados por autores, mas alunos matriculados precisam consumir uma experiencia estavel. Se uma aula, modulo ou quiz mudar enquanto alunos ja estao cursando, progresso, avaliacoes e certificados podem perder consistencia.

O schema Prisma atual ainda nao possui modelos de dominio. Esta ADR registra a decisao antes da implementacao para orientar a modelagem futura.

## Decisao

Separar `Course` de `CourseVersion`.

`Course` sera a entidade editavel usada na autoria. `CourseVersion` sera um snapshot publicado e imutavel, usado por matriculas, player, progresso, quizzes e certificados.

Matriculas devem apontar para uma versao publicada, nao para o rascunho editavel do curso.

O formato v1 de `CourseVersion.snapshotJson` fica documentado em [CourseVersion snapshot v1](../course-version-snapshot.md). Ele separa o outline publicado do curso de `lessonDetails`: `lessons` nao carrega `contentJson` nem midias, e o detalhe individual da lesson guarda o conteudo e as midias minimas necessarias para o player.

## Consequencias positivas

- protege alunos de mudancas inesperadas em cursos ja publicados
- preserva consistencia historica de progresso e certificados
- permite autores evoluirem rascunhos sem afetar versoes em uso
- facilita auditoria de publicacoes e comparacao entre versoes
- reduz ambiguidade em relatorios baseados em matriculas

## Consequencias negativas

- aumenta a complexidade da modelagem relacional
- exige estrategia clara de snapshot de conteudo, quizzes e midias
- pode duplicar dados entre rascunho e versao publicada
- demanda regras explicitas para republicacao e despublicacao
- torna migrations futuras mais delicadas

## Alternativas consideradas

- Usar apenas `Course` com status publicado: mais simples, mas permitiria que edicoes afetassem alunos ativos.
- Copiar apenas aulas modificadas: economizaria espaco, mas aumentaria complexidade de leitura e consistencia.
- Versionar por evento: daria historico granular, mas e mais complexo do que o necessario para o MVP.
