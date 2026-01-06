---
id: docs-and-monorepo
title: Documentação e Migração para Monorepo
status: draft
version: '1.0'
created_at: '2026-01-05'
updated_at: '2026-01-05'
author: ai-agent
---

# Documentação e Migração para Monorepo

## Objetivo

Criar documentação completa do BlueprintAI e migrar a estrutura do projeto para um monorepo, onde a documentação será um app separado. Isso permitirá melhor organização, reutilização de código entre apps, e uma experiência de documentação profissional.

## Contexto

O BlueprintAI está crescendo e precisa de:
1. **Documentação formal** para usuários e desenvolvedores entenderem como usar o sistema
2. **Estrutura escalável** que suporte múltiplos apps (web app, docs, futuramente CLI, API, etc.)
3. **Developer Experience (DX)** melhorada com tooling de monorepo

Atualmente o projeto é um Next.js standalone. A migração para monorepo com Turborepo permitirá:
- Compartilhar componentes UI, schemas e utilitários entre apps
- Build caching inteligente
- Desenvolvimento paralelo de múltiplos apps
- Melhor organização de código

## Requisitos Funcionais

### Documentação
1. **Site de documentação** usando Nextra ou similar (baseado em Next.js)
2. **Seções principais**:
   - Getting Started (instalação, primeiro projeto)
   - Guia de Uso (PRD schema, Tasks schema, workflows)
   - Referência API (endpoints, schemas)
   - Contribuição (setup local, guidelines)
3. **MDX support** para componentes interativos na documentação
4. **Search** integrado (Algolia ou local)
5. **Dark mode** consistente com o app principal

### Monorepo
1. **Turborepo** como ferramenta de build
2. **Estrutura de apps**:
   - `apps/web` - App principal (atual)
   - `apps/docs` - Site de documentação
3. **Packages compartilhados**:
   - `packages/ui` - Componentes reutilizáveis
   - `packages/schemas` - Zod schemas (PRD, Tasks)
   - `packages/utils` - Utilitários comuns
   - `packages/tsconfig` - Configurações TypeScript
   - `packages/eslint-config` - Configurações ESLint
4. **Scripts unificados** no root (`pnpm dev`, `pnpm build`, etc.)

## Requisitos Não-Funcionais

- **Performance**: Build incremental com Turborepo cache
- **DX**: Hot reload funcionando em todos os apps
- **CI/CD**: GitHub Actions configurado para builds paralelos
- **Consistência**: Mesmo design system entre web e docs

## Fora do Escopo

- CLI tool (será um projeto futuro separado)
- Autenticação/usuários (futuro)
- Internacionalização da documentação (futuro, apenas inglês inicialmente)
- Deploy automatizado (será configurado depois)

## Métricas de Sucesso

1. Documentação publicável com todas as seções principais
2. Monorepo funcionando com `pnpm dev` iniciando ambos os apps
3. Build time total < 30s com cache quente
4. Zero duplicação de código entre apps (schemas, utils compartilhados)
5. Todos os testes passando em ambos os apps
