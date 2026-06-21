# Roadmap EduFlow

## Visao

Construir o EduFlow, uma plataforma educacional modular para criacao, publicacao e acompanhamento de cursos digitais, com recursos de IA para acelerar autoria de conteudo.

## Objetivo do MVP

Entregar um produto demonstravel que prove competencias senior em:

- arquitetura de produto educacional;
- React/Next.js com TypeScript;
- backend NestJS;
- PostgreSQL e modelagem relacional;
- multi-tenancy;
- autenticacao e autorizacao;
- editor de conteudo educacional;
- publicacao/versionamento de cursos;
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

Essa decisao evita que alteracoes em um curso afetem alunos ja matriculados em uma versao publicada.

## Sprints planejadas

### Sprint 0 - Fundacao tecnica

Objetivo: estabelecer a base do monorepo, padroes de desenvolvimento e pipeline inicial.

Entregas:

- estrutura de projeto para frontend e backend;
- configuracao de TypeScript compartilhada;
- setup de lint, formatacao e convencoes;
- ambiente local com PostgreSQL, Redis e MinIO;
- CI inicial com validacao de build e testes;
- documentacao de onboarding tecnico.

### Sprint 1 - Auth, usuarios e organizacoes

Objetivo: habilitar autenticacao e o modelo base de tenancy.

Entregas:

- cadastro, login e refresh token;
- recuperacao de senha;
- entidades de usuario, organizacao e membership;
- papeis iniciais e guards de autorizacao;
- isolamento de dados por organizacao.

### Sprint 2 - Shell da aplicacao e design system

Objetivo: construir a fundacao de UX e componentes reutilizaveis.

Entregas:

- layout autenticado;
- navegacao principal;
- sistema base de componentes;
- formularios padronizados;
- estados de loading, vazio e erro;
- Storybook inicial.

### Sprint 3 - Cursos e estrutura curricular

Objetivo: permitir autoria da estrutura principal do curso.

Entregas:

- CRUD de cursos;
- CRUD de modulos;
- CRUD de aulas;
- ordenacao de modulos e aulas;
- status de rascunho do curso;
- listagens e filtros basicos.

### Sprint 4 - Editor de aulas

Objetivo: viabilizar criacao de conteudo educacional em um editor simples.

Entregas:

- editor de texto rico ou blocos simples;
- suporte a titulos, paragrafos, listas e links;
- autosave ou estrategia de salvamento confiavel;
- preview basico da aula;
- validacoes de conteudo obrigatorio.

### Sprint 5 - Upload e biblioteca de midia

Objetivo: permitir gestao de arquivos usados nos cursos.

Entregas:

- upload de arquivos;
- armazenamento em servico S3-compatible;
- biblioteca de midia por organizacao;
- metadata basica dos arquivos;
- selecao de midia no editor.

### Sprint 6 - Publicacao e versionamento

Objetivo: transformar cursos editaveis em versoes publicadas estaveis.

Entregas:

- modelo `CourseVersion`;
- fluxo de publicacao;
- snapshot de estrutura e conteudo;
- listagem de versoes publicadas;
- bloqueios para preservar integridade das versoes.

### Sprint 7 - Matricula, player e progresso

Objetivo: entregar a experiencia base do aluno.

Entregas:

- matricula em curso;
- player do aluno por versao publicada;
- navegacao por modulo e aula;
- marcacao de aula concluida;
- percentual de progresso por curso.

### Sprint 8 - Quiz e avaliacao

Objetivo: introduzir checagem de aprendizagem no fluxo do curso.

Entregas:

- quiz por aula ou modulo;
- tipos iniciais de pergunta;
- submissao de respostas;
- correcao automatica quando aplicavel;
- feedback basico ao aluno.

### Sprint 9 - Certificados e relatorios

Objetivo: fechar o ciclo de conclusao e visibilidade operacional.

Entregas:

- emissao de certificado;
- template inicial de certificado;
- relatorios basicos de matriculas;
- relatorios basicos de progresso;
- visao administrativa resumida.

### Sprint 10 - IA para autoria educacional

Objetivo: acelerar a criacao de conteudo com assistencia de IA.

Entregas:

- geracao de resumo de aula;
- geracao de objetivos de aprendizagem;
- geracao de perguntas de quiz;
- jobs assincronos para tarefas de IA;
- exibicao de estados e rastreio das geracoes.

### Sprint 11 - Acessibilidade, seguranca e qualidade

Objetivo: endurecer o produto antes da demonstracao final.

Entregas:

- revisao de acessibilidade dos fluxos principais;
- reforco de autorizacao e protecao de dados;
- cobertura de testes nos fluxos criticos;
- hardening de validacoes e tratamento de erro;
- revisao de performance basica.

### Sprint 12 - Deploy, documentacao e portfolio

Objetivo: preparar o MVP para apresentacao publica e manutencao.

Entregas:

- deploy de demo;
- ambiente observavel minimo;
- README e documentacao tecnica completos;
- registro de decisoes arquiteturais;
- material de portfolio com escopo, prints e highlights.

## Definition of Done global

Uma issue so deve ser considerada concluida quando:

- implementacao concluida;
- TypeScript sem erros;
- lint sem erros criticos;
- testes relevantes adicionados ou atualizados;
- fluxo validado manualmente;
- estados de loading tratados;
- estados de erro tratados;
- permissoes verificadas quando aplicavel;
- layout responsivo minimo;
- acessibilidade basica considerada;
- documentacao atualizada quando necessario.

## Resultado esperado do MVP

Ao final do roadmap, o EduFlow deve permitir que uma organizacao:

- crie e organize cursos;
- publique versoes imutaveis;
- matricule alunos;
- acompanhe progresso;
- aplique quizzes;
- emita certificados;
- consuma assistencias de IA na autoria;
- demonstre uma base tecnica robusta e bem documentada.
