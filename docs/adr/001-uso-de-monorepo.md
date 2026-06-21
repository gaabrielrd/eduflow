# ADR-001 - Uso de monorepo

## Status

Aceita.

## Contexto

O EduFlow precisa evoluir como produto modular, com frontend, backend, tipos compartilhados, configuracoes e componentes reutilizaveis. O repositorio ja usa `pnpm` workspaces com `apps/*` e `packages/*`.

Separar cada parte em repositorios independentes neste momento aumentaria o custo operacional antes de existir maturidade suficiente de dominio, deploy e versionamento independente.

## Decisao

Usar um monorepo `pnpm` com workspaces em `apps/*` e `packages/*`, namespace interno `@eduflow/*` e scripts raiz para `dev`, `build`, `lint`, `typecheck` e `test`.

As aplicacoes ficam em `apps/` e os pacotes compartilhados ficam em `packages/`. Configuracoes de TypeScript e ESLint tambem sao tratadas como pacotes reutilizaveis.

## Consequencias positivas

- facilita evoluir web, API e pacotes compartilhados no mesmo ciclo de desenvolvimento
- reduz duplicacao de configuracao de TypeScript, lint e scripts
- simplifica refactors entre contratos compartilhados e consumidores
- melhora onboarding local com um unico `pnpm install`
- permite extrair pacotes no futuro com menor atrito

## Consequencias negativas

- aumenta o risco de acoplamento operacional entre apps
- builds e checks podem ficar mais lentos conforme o produto crescer
- exige disciplina para nao criar imports por path entre apps
- demanda convencoes claras para separar contratos compartilhados de detalhes internos

## Alternativas consideradas

- Multirepo desde o inicio: daria isolamento mais forte, mas aumentaria overhead de setup, CI, versionamento e coordenacao.
- Monolito em um unico app fullstack: seria mais simples no curto prazo, mas dificultaria separar responsabilidades entre interface, API e pacotes reutilizaveis.
- Turborepo ou Nx desde o inicio: poderiam otimizar tarefas, mas adicionariam uma camada de ferramenta antes de haver necessidade real.
