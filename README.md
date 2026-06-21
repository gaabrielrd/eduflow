# EduFlow

Plataforma educacional modular para criacao, publicacao e acompanhamento de cursos digitais, com recursos de IA para acelerar a autoria de conteudo.

## Visao

Construir o EduFlow como um produto demonstravel que evidencie capacidade senior em arquitetura de software, experiencia educacional, modelagem de dominio e execucao full stack.

## Objetivo do MVP

Entregar um MVP funcional e apresentavel que prove competencias em:

- arquitetura de produto educacional;
- React/Next.js com TypeScript;
- backend NestJS;
- PostgreSQL e modelagem relacional;
- multi-tenancy;
- autenticacao e autorizacao;
- editor de conteudo educacional;
- publicacao e versionamento de cursos;
- matricula, player e progresso;
- quiz e avaliacao;
- certificados;
- relatorios;
- IA aplicada a autoria;
- acessibilidade;
- documentacao tecnica.

## Stack proposta

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod
- Storybook
- Vitest
- Testing Library
- Playwright

### Backend

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- Redis
- BullMQ
- JWT/Auth
- S3-compatible storage, preferencialmente MinIO local no desenvolvimento

### IA

- LLM API
- Structured outputs
- Jobs assincronos
- Geracao de resumo
- Geracao de objetivos de aprendizagem
- Geracao de perguntas de quiz

## Escopo P0

- Autenticacao
- Organizacoes e memberships
- Papeis e permissoes
- CRUD de cursos
- Modulos e aulas
- Editor simples de aula
- Upload e biblioteca de midia
- Publicacao com `CourseVersion`
- Matricula
- Player do aluno
- Progresso
- Quiz
- Certificados
- Relatorios basicos
- IA para autoria
- Acessibilidade nos fluxos principais
- Deploy de demo
- Documentacao tecnica

## Decisao arquitetural central

Separar `Course` de `CourseVersion`.

- `Course`: entidade editavel, usada na autoria.
- `CourseVersion`: snapshot publicado e imutavel, usado por matriculas e player.

Essa separacao evita que alteracoes em um curso impactem alunos ja matriculados em uma versao publicada.

## Planejamento

O roadmap detalhado do MVP esta em [roadmap.md](/E:/OneDrive/Dev/eduflow/roadmap.md).
