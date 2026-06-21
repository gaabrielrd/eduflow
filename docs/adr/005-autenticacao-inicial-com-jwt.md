# ADR-005 - Autenticacao inicial com JWT

## Status

Aceita como estrategia inicial planejada para o MVP.

## Contexto

O EduFlow precisara autenticar usuarios e autorizar acoes por organizacao, membership e papel. A autenticacao ainda nao esta implementada, mas o roadmap preve cadastro, login, refresh token, recuperacao de senha, RBAC e isolamento por organizacao.

Como a web e a API estao separadas, a estrategia inicial precisa funcionar bem em um cliente web e permitir evolucao para guards no NestJS.

## Decisao

Usar JWT como estrategia inicial de autenticacao da API. A implementacao futura deve definir access tokens, refresh tokens, rotacao, expiracao, armazenamento seguro no cliente e guards de autorizacao por papel e organizacao.

Esta ADR nao define ainda o desenho final de sessoes, cookies ou refresh token. Ela registra apenas a direcao inicial para orientar as proximas sprints.

## Consequencias positivas

- integra bem com guards e decorators no NestJS
- funciona de forma simples com frontend separado
- permite carregar claims essenciais como usuario, organizacao ativa e papeis
- reduz dependencia inicial de armazenamento server-side de sessao
- e uma abordagem conhecida para APIs HTTP

## Consequencias negativas

- revogacao imediata de tokens exige estrategia adicional
- armazenamento inseguro no cliente pode aumentar risco de roubo de token
- claims podem ficar desatualizadas ate a renovacao do token
- refresh token, rotacao e logout global precisam de desenho cuidadoso
- RBAC e tenancy nao podem depender apenas do payload do token sem verificacoes no backend

## Alternativas consideradas

- Sessoes server-side: facilitariam revogacao, mas exigiriam armazenamento de sessao e maior acoplamento operacional desde o inicio.
- Provedor externo de identidade no MVP: reduziria implementacao propria, mas esconderia parte importante da demonstracao tecnica.
- API keys por usuario: inadequadas para fluxos web de alunos, autores e gestores.
