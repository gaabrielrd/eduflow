# Monorepo Overview

## Visao geral

O EduFlow comeca como um monorepo `pnpm` para manter apps e pacotes compartilhados no mesmo ciclo de desenvolvimento, com separacao clara de responsabilidades.

## Organizacao do workspace

- `apps/web`: base da experiencia de autoria e consumo para web
- `apps/api`: base da API principal, autenticacao e servicos de dominio
- `packages/ui`: biblioteca compartilhada de componentes e primitives de interface
- `packages/types`: tipos comuns usados entre frontend, backend e jobs
- `packages/config`: constantes, nomes de eventos e helpers de configuracao sem segredos
- `packages/eslint-config`: presets de lint reaproveitaveis entre workspaces
- `packages/tsconfig`: configuracoes base de TypeScript para apps e pacotes

## Proximos passos

- substituir o placeholder de `apps/web` por um bootstrap real de Next.js
- substituir o placeholder de `apps/api` por um bootstrap real de NestJS
- adicionar dependencias de runtime por workspace apenas quando cada app sair do modo placeholder
- expandir `packages/ui` e `packages/types` conforme o dominio do produto ganhar forma
