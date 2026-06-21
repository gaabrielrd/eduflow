# ADR-004 - PostgreSQL como banco principal

## Status

Aceita.

## Contexto

O EduFlow tera dados altamente relacionais: usuarios, organizacoes, memberships, papeis, cursos, modulos, aulas, versoes publicadas, matriculas, progresso, quizzes, certificados e relatorios.

O backend ja esta configurado com Prisma e datasource PostgreSQL. Ainda nao existem modelos de dominio no schema, mas a decisao do banco principal orienta as proximas sprints.

## Decisao

Usar PostgreSQL como banco principal do produto, acessado via Prisma a partir da API NestJS.

Redis, armazenamento S3-compatible e filas poderao ser adicionados como componentes auxiliares, mas nao substituem o PostgreSQL como fonte principal dos dados transacionais.

## Consequencias positivas

- oferece integridade relacional forte para o dominio educacional
- suporta transacoes, constraints e consultas maduras
- combina bem com modelagem multi-tenant por organizacao
- tem boa compatibilidade com Prisma
- e uma escolha conhecida para deploys, backups e observabilidade

## Consequencias negativas

- exige modelagem cuidadosa para evitar queries pesadas
- demanda disciplina em migrations e indices
- nao resolve sozinho casos de cache, jobs ou busca avancada
- pode ficar mais complexo em cenarios multi-tenant muito grandes

## Alternativas consideradas

- MongoDB ou banco documental: poderia simplificar snapshots de conteudo, mas enfraqueceria integridade relacional do dominio principal.
- SQLite: util para prototipos, mas insuficiente como alvo principal do MVP demonstravel.
- Banco por tenant: aumentaria isolamento, mas elevaria complexidade operacional cedo demais.
