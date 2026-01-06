---
id: monorepo-infra
title: Infraestrutura de Monorepo
status: draft
version: '1.0'
created_at: '2026-01-05'
updated_at: '2026-01-05'
author: ai-agent
---

# Infraestrutura de Monorepo

## Objetivo

Migrar a estrutura do projeto BlueprintAI para um monorepo escalável utilizando Turborepo, permitindo a coexistência do Web App atual e do futuro Site de Documentação, com compartilhamento eficiente de código e configurações.

## Contexto

A migração é um pré-requisito para o desenvolvimento do site de documentação. Precisamos garantir que a experiência de desenvolvimento (DX) permaneça fluida e que não haja regressões no app principal durante a transição.

## Requisitos Funcionais

### Estrutura de Monorepo
1. **Turborepo**: Configuração da raiz com `turbo.json` para orquestração de scripts.
2. **Package Manager**: Uso de `pnpm workspaces` para gerenciamento de dependências.
3. **Workspace Organization**:
   - `apps/web`: O Web App Next.js atual (migrado da raiz).
   - `apps/docs`: O futuro site de documentação (placeholder/inicialização).
   - `packages/*`: Bibliotecas compartilhadas.

### Packages Compartilhados
1. **`packages/ui`**: Componentes de UI base (shadcn/ui) compartilhados.
2. **`packages/schemas`**: Schemas Zod (PRD, Tasks) que serão usados tanto pelo app quanto pela documentação.
3. **`packages/utils`**: Funções utilitárias (formatters, parsers).
4. **`packages/config`**: Configurações base para TypeScript, ESLint e Tailwind.

## Requisitos Não-Funcionais

- **Zero Downtime**: O app web deve continuar funcionando normalmente após a migração.
- **Build Performance**: Utilizar cache do Turborepo para builds incrementais.
- **DX**: Scripts unificados na raiz (`pnpm dev`, `pnpm build`, `pnpm lint`).

## Fora do Escopo

- Implementação do conteúdo do site de documentação (será feito no projeto `documentation-site`).
- Alterações funcionais no Web App (apenas refatoração estrutural).

## Métricas de Sucesso

1. `pnpm install` na raiz instala dependências de todos os workspaces.
2. `pnpm dev` inicia web app e docs simultaneamente.
3. Build e Lint passam com sucesso em todos os workspaces.
