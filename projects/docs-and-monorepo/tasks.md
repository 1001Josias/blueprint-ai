---
project_id: docs-and-monorepo
prd_version: '1.0'
created_at: '2026-01-05'
updated_at: '2026-01-05'
---

# Tasks: Documentação e Migração para Monorepo

## Task 1: Configurar Monorepo com Turborepo
- **id:** task-001
- **status:** todo
- **priority:** critical
- **description:** Migrar o projeto atual para estrutura de monorepo usando Turborepo, reorganizando arquivos e configurando workspaces pnpm.

### Subtasks

#### [ ] Inicializar Turborepo na raiz do projeto
Adicionar turbo.json e configurar pipelines de build, dev e lint.

#### [ ] Mover app atual para apps/web
Reorganizar estrutura de pastas, movendo src/, projects/, public/ para apps/web/.

#### [ ] Criar packages/tsconfig
Extrair configurações TypeScript compartilhadas para um package dedicado.

#### [ ] Criar packages/eslint-config
Extrair configurações ESLint para reutilização entre apps.

#### [ ] Configurar pnpm workspaces
Atualizar pnpm-workspace.yaml para reconhecer apps/* e packages/*.

#### [ ] Validar build e dev funcionando
Testar que pnpm dev e pnpm build funcionam corretamente após migração.

---

## Task 2: Extrair Packages Compartilhados
- **id:** task-002
- **status:** todo
- **priority:** high
- **description:** Criar packages reutilizáveis extraindo código do app web que será compartilhado com o app de docs.

### Subtasks

#### [ ] Criar packages/schemas
Mover src/lib/schemas.ts para um package dedicado com exports tipados.

#### [ ] Criar packages/utils
Mover src/lib/utils.ts e funções utilitárias para package compartilhado.

#### [ ] Criar packages/ui
Extrair componentes base (se houver) para reutilização entre apps.

#### [ ] Atualizar imports no apps/web
Refatorar imports para usar @repo/schemas, @repo/utils, @repo/ui.

#### [ ] Adicionar testes nos packages
Garantir que packages tenham testes unitários básicos.

---

## Task 3: Criar App de Documentação
- **id:** task-003
- **status:** todo
- **priority:** high
- **description:** Criar o app de documentação usando Nextra (framework de docs baseado em Next.js) com todas as seções principais.

### Subtasks

#### [ ] Inicializar apps/docs com Nextra
Usar template Nextra para criar o app de documentação.

#### [ ] Configurar tema e design system
Aplicar dark mode e cores consistentes com o app principal.

#### [ ] Criar página Getting Started
Documentar instalação, requisitos e primeiro projeto.

#### [ ] Criar página de PRD Schema
Documentar estrutura do prd.md com exemplos.

#### [ ] Criar página de Tasks Schema
Documentar estrutura do tasks.md com exemplos.

#### [ ] Criar página de API Reference
Documentar endpoints disponíveis (ex: PATCH /api/tasks/[taskId]).

#### [ ] Configurar search local
Implementar busca na documentação usando flexsearch ou similar.

---

## Task 4: Configurar CI/CD
- **id:** task-004
- **status:** todo
- **priority:** medium
- **description:** Configurar GitHub Actions para build, lint e testes em todos os apps e packages do monorepo.

### Subtasks

#### [ ] Criar workflow de CI
Configurar .github/workflows/ci.yml com Turborepo remote caching.

#### [ ] Adicionar checks de lint
Rodar ESLint em todos os packages e apps.

#### [ ] Adicionar checks de TypeScript
Validar tipos em todo o monorepo.

#### [ ] Configurar Turborepo remote cache
Habilitar cache remoto para builds mais rápidos na CI.

---

## Task 5: Atualizar Documentação do Repositório
- **id:** task-005
- **status:** todo
- **priority:** medium
- **description:** Atualizar README e AGENTS.md para refletir a nova estrutura de monorepo.

### Subtasks

#### [ ] Atualizar README.md
Documentar nova estrutura de pastas e comandos do monorepo.

#### [ ] Atualizar AGENTS.md
Adicionar instruções para trabalhar com monorepo e múltiplos apps.

#### [ ] Adicionar README em cada app/package
Criar READMEs específicos para apps/web, apps/docs e packages/*.
