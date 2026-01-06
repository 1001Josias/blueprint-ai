---
project_id: documentation-site
prd_version: '1.1'
created_at: '2026-01-05'
updated_at: '2026-01-06'
---

# Tasks: Site de Documentação

## Task 1: Setup do Projeto de Docs
- **id:** task-101
- **status:** todo
- **priority:** high
- **description:** Inicializar o projeto de documentação usando Fumadocs (Next.js App Router).

### Subtasks

#### [ ] Inicializar projeto Fumadocs
Criar estrutura inicial do projeto usando o CLI do Fumadocs (`create-fumadocs-app`).

#### [ ] Configurar metadados do projeto
Atualizar `source.config.ts` ou similar para definir título, descrição e estrutura de arquivos.

#### [ ] Configurar tema (Tailwind CSS)
Ajustar cores do Tailwind para usar o tema violeta/dark do BlueprintAI.

---

## Task 2: Migração e Criação de Conteúdo
- **id:** task-102
- **status:** todo
- **priority:** high
- **description:** Migrar conteúdo existente e criar novas páginas de documentação.

### Subtasks

#### [ ] Migrar Getting Started
Criar página `content/docs/index.mdx` com introdução e setup (baseado no README).

#### [ ] Criar Guia "Core Concepts"
Documentar o fluxo de PRD -> Tasks e estrutura de pastas `projects/`.

#### [ ] Criar Referência de Schemas
Documentar os schemas Zod e frontmatter (baseado no `AGENTS.md`) usando TypeTable se possível.

#### [ ] Criar Guia de API
Documentar endpoints como o `PATCH /api/tasks/[taskId]` usando OpenAPI ou MDX manual.

---

## Task 3: Integração e Deploy
- **id:** task-103
- **status:** todo
- **priority:** medium
- **description:** Ajustes finais e preparação para deploy.

### Subtasks

#### [ ] Configurar Search
Verificar indexação e funcionamento da busca do Fumadocs.

#### [ ] Revisão de SEO
Adicionar meta tags e descrições apropriadas.

#### [ ] Validar links cruzados
Garantir que todos os links internos funcionam corretamente.
