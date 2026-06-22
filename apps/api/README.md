# @eduflow/api

API backend do EduFlow baseada em NestJS, Prisma e validacao global. Esta base prepara configuracao de ambiente, healthcheck, acesso ao banco e padrao inicial de erros para a evolucao modular do produto.

## Testes

Os testes da API usam `node:test` com `supertest`, aplicacao Nest real e PostgreSQL real via Prisma.

Fluxo local recomendado:

```bash
docker compose up -d
pnpm api:prisma:generate
pnpm api:prisma:migrate:deploy
pnpm api:test
```

A suite cobre os fluxos criticos de autenticacao, organizacoes, permissoes e isolamento entre tenants. Entre os casos, o harness de teste limpa as tabelas criticas para manter execucao deterministica tanto localmente quanto na CI.
