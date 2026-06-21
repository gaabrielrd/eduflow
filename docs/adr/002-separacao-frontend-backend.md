# ADR-002 - Separacao frontend/backend

## Status

Aceita.

## Contexto

O EduFlow tera uma interface web rica para autores, gestores e alunos, alem de uma API responsavel por autenticacao, tenancy, cursos, publicacao, matriculas, progresso, avaliacoes, certificados, relatorios e IA.

O repositorio ja possui `apps/web` em Next.js e `apps/api` em NestJS. A separacao explicita evita que responsabilidades de UI, dominio e integracao fiquem misturadas em um unico runtime.

## Decisao

Separar frontend e backend em workspaces diferentes:

- `apps/web`: Next.js, React, TypeScript e Tailwind CSS
- `apps/api`: NestJS, TypeScript, Prisma e PostgreSQL

A comunicacao entre web e API sera feita por contratos HTTP e tipos compartilhados quando isso for seguro e estavel.

## Consequencias positivas

- permite evoluir UI e API com responsabilidades claras
- favorece autorizacao, validacao e regras de negocio centralizadas no backend
- deixa a web livre para focar em experiencia, rotas e estado de cliente
- facilita deploys e escalabilidade independentes no futuro
- demonstra competencias senior em frontend e backend sem acoplar os runtimes

## Consequencias negativas

- aumenta a quantidade de configuracao inicial
- exige cuidado com contratos entre web e API
- pode gerar duplicacao se tipos compartilhados forem mal definidos
- demanda estrategias explicitas para autenticacao, CORS e erros de rede

## Alternativas consideradas

- Usar apenas Next.js como fullstack: reduziria setup, mas acoplaria dominio e UI cedo demais para o objetivo do projeto.
- Criar um backend minimalista sem framework: seria mais leve, mas perderia padroes de modularidade, DI e validacao que o NestJS ja oferece.
- Usar BFF dentro do Next.js e API separada depois: postergaria decisoes importantes e aumentaria risco de reescrita.
