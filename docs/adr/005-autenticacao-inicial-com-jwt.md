# ADR-005 - Autenticacao inicial com JWT

## Status

Aceita como estrategia inicial planejada para o MVP.

## Contexto

O EduFlow precisara autenticar usuarios e autorizar acoes por organizacao, membership e papel. A autenticacao ainda nao esta implementada, mas o roadmap preve cadastro, login, refresh token, recuperacao de senha, RBAC e isolamento por organizacao.

Como a web e a API estao separadas, a estrategia inicial precisa funcionar bem em um cliente web e permitir evolucao para guards no NestJS.

## Decisao

Usar JWT como estrategia inicial de autenticacao da API. A implementacao deve usar `JwtAuthGuard` para validar access tokens, `CurrentUser` para expor o usuario autenticado, `OrganizationContextGuard` para resolver o tenant atual via header `X-Organization-Id` e `RolesGuard` para aplicar RBAC por membership com papéis declarados explicitamente nas rotas.

Na web, os tokens JWT nao ficam mais apenas em estado client-side. O app Next.js passa a persistir `access token`, `refresh token` e `activeOrganizationId` em cookies `HttpOnly` do proprio dominio web, gerenciados por route handlers internos. Esse BFF fino permite middleware para protecao basica de rotas, bootstrap previsivel da sessao e refresh controlado sem expor a logica completa de sessao nas telas de auth.

Esta ADR nao define ainda o desenho final de cookies ou de troca de contexto por slug em rota. Para o MVP, o contexto organizacional oficial da API sera enviado por header e sempre revalidado no backend.

## Consequencias positivas

- integra bem com guards e decorators no NestJS
- funciona de forma simples com frontend separado
- permite ao frontend web usar cookies `HttpOnly` sem acoplar a API a uma sessao server-side tradicional
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
