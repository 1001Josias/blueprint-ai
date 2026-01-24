---
project_id: opencode-transmute
prd_version: "1.0"
created_at: "2026-01-17"
updated_at: "2026-01-18"
---

# Tasks: OpenCode Transmute Plugin

> **Nota:** Testes unitários são obrigatórios para todas as tasks de implementação. Cada task deve incluir testes com vitest antes de ser considerada concluída.

---

## Task 1: Project Setup

- **id:** oc-trans-001
- **status:** done
- **priority:** critical
- **description:** Inicializar estrutura do app opencode-transmute no monorepo Transmute.
- **comment:** Package created at `packages/opencode-transmute/` (changed from `apps/` per architecture decision for npm-publishable package).

### Subtasks

#### [x] Criar estrutura de diretórios

Criado `packages/opencode-transmute` com estrutura:

```
packages/opencode-transmute/
├── src/
│   ├── core/
│   │   ├── naming.ts
│   │   ├── worktree.ts
│   │   ├── session.ts
│   │   └── hooks.ts
│   ├── adapters/
│   │   └── terminal/
│   │       ├── types.ts
│   │       ├── wezterm.ts
│   │       └── index.ts
│   ├── tools/
│   │   └── start-task.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

#### [x] Configurar package.json

Dependências configuradas:

- typescript (via tsup)
- zod (validação)
- `@opencode-ai/plugin` (peer dependency para SDK do OpenCode)

#### [x] Configurar TypeScript

`tsconfig.json` estendendo `@repo/typescript-config/base.json`.

#### [x] Registrar no Turborepo

Package automaticamente detectado pelo pnpm workspace. Build e lint funcionando via turbo.

---

## Task 2: Core - AI Branch Naming

- **id:** oc-trans-002
- **status:** done
- **priority:** high
- **description:** Implementar geração inteligente de nomes de branch via IA, baseada no contexto da tarefa.
- **dependencies:** oc-trans-001

### Subtasks

#### [x] Definir schema de entrada (TaskContext)

```typescript
interface TaskContext {
  id: string;
  title: string;
  description: string;
  priority?: string;
  type?: string; // hint opcional: feat, fix, refactor, etc.
}

interface BranchNameResult {
  branch: string;
  type: string; // feat, fix, refactor, docs, chore, test
  slug: string;
}
```

#### [x] Implementar prompt para geração de branch name

Prompt estruturado criado em `naming.ts` que instrui a IA a:

- Analisar título e descrição da tarefa
- Inferir o tipo de mudança (feat, fix, refactor, docs, chore, test)
- Extrair palavras-chave relevantes
- Gerar slug conciso e descritivo (máx. 40 chars)
- Seguir convenções de git branch naming
- Responder em formato JSON

#### [x] Implementar função generateBranchName

```typescript
// packages/opencode-transmute/src/core/naming.ts
async function generateBranchName(
  context: TaskContext,
  client?: OpenCodeClient,
  sessionId?: string,
): Promise<BranchNameResult>;
// Ex output: { branch: "feat/implement-oauth-google-login", type: "feat", slug: "implement-oauth-google-login" }
```

Implementada com:

- `generateBranchName()` - função principal que tenta IA e faz fallback
- `generateBranchNameWithAI()` - usa OpenCode client para chamar LLM

#### [x] Implementar sanitização e validação

`sanitizeBranchName()` garante que o nome gerado:

- É lowercase
- Não contém caracteres inválidos para git
- Não excede limite de tamanho
- Tem formato `<type>/<slug>`

#### [x] Implementar fallback determinístico

`generateFallbackBranchName()` gera nome baseado em:

- Task ID + primeiras palavras do título
- Ex: `feat/task-123-implement-auth`

#### [x] Adicionar testes unitários

33 testes criados em `naming.test.ts` cobrindo:

- `sanitizeBranchName`: lowercase, remove caracteres inválidos, limite de tamanho
- `generateFallbackBranchName`: gera nome correto a partir de task ID e título
- `generateBranchNameWithAI`: retorna resultado válido (mock da IA)
- `generateBranchName`: usa fallback quando IA falha
- Diferentes tipos inferidos (feat, fix, refactor, docs, chore, test)
- Prevenção de duplicação de ID quando título começa com o ID ([f29cc5c](https://github.com/1001Josias/transmute/commit/f29cc5c))

---

## Task 3: Core - Git Worktree Management

- **id:** oc-trans-003
- **status:** done
- **priority:** high
- **description:** Implementar criação e gestão de git worktrees.
- **dependencies:** oc-trans-001

### Subtasks

#### [x] Definir interface de worktree

```typescript
interface Worktree {
  path: string;
  branch: string;
  isMain: boolean;
}

interface CreateWorktreeOptions {
  branch: string;
  baseBranch?: string; // default: "main"
  targetDir?: string; // default: "./worktrees/<branch>"
}
```

#### [x] Implementar listWorktrees

Executar `git worktree list --porcelain` e parsear output.

#### [x] Implementar createWorktree

Executar `git worktree add -b <branch> <path> <base>`.

- Verificar se branch já existe
- Criar diretório worktrees se necessário
- **Novo:** Atualizar branch base (fetch/pull) antes de criar para evitar conflitos

#### [x] Implementar worktreeExists

Verificar se já existe worktree para uma branch específica.

#### [x] Tratamento de erros

- Branch já existe
- Diretório já existe
- Git não inicializado
- Base branch não existe

#### [x] Adicionar testes unitários

Cobrir casos com vitest:

- `listWorktrees`: parsing correto do output `git worktree list --porcelain`
- `createWorktree`: chamada correta ao git, criação de diretório
- `worktreeExists`: retorna true/false corretamente
- Erros: branch já existe, diretório já existe, git não inicializado

**PR:** [feat(opencode-transmute): implement git worktree management](https://github.com/1001Josias/transmute/pull/35)

---

## Task 4: Core - Session Persistence

- **id:** oc-trans-004
- **status:** todo
- **priority:** high
- **description:** Implementar persistência mínima de estado de sessões.
- **dependencies:** oc-trans-001

### Subtasks

#### [ ] Definir schema de estado

```typescript
const sessionSchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  branch: z.string(),
  worktreePath: z.string(),
  createdAt: z.string().datetime(),
  opencodeSessionId: z.string(), // Vínculo obrigatório com session do OpenCode
});

const stateSchema = z.object({
  sessions: z.array(sessionSchema),
});
```

#### [ ] Implementar loadState

Ler `.opencode/transmute.sessions.json`.
Retornar estado vazio se arquivo não existe.
Validar com Zod.

#### [ ] Implementar saveState

Escrever estado validado no arquivo.
Criar diretório `.opencode` se necessário.

#### [ ] Implementar addSession / removeSession

Helpers para manipular lista de sessões.

#### [ ] Implementar findSessionByTask

Buscar sessão existente por taskId.

#### [ ] Adicionar testes unitários

Cobrir casos com vitest:

- `loadState`: arquivo não existe retorna estado vazio, arquivo válido é parseado, arquivo inválido lança erro
- `saveState`: cria diretório se não existe, escreve JSON válido
- `addSession`: adiciona sessão ao estado
- `removeSession`: remove sessão existente, ignora se não existe
- `findSessionByTask`: encontra sessão, retorna undefined se não existe

---

## Task 5: Adapter - WezTerm Integration

- **id:** oc-trans-005
- **status:** todo
- **priority:** high
- **description:** Implementar integração com WezTerm para abrir sessões de terminal.
- **dependencies:** oc-trans-001

### Subtasks

#### [ ] Definir interface abstrata de terminal

Interface já definida em `types.ts`:

```typescript
interface TerminalAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  openSession(options: OpenSessionOptions): Promise<void>;
}

interface OpenSessionOptions {
  cwd: string;
  commands?: string[];
  title?: string;
  env?: Record<string, string>;
}
```

#### [ ] Verificar disponibilidade do WezTerm

Implementado `isAvailable()` que executa `wezterm --version` e verifica exit code.

#### [ ] Implementar openSession para WezTerm

Implementado usando `wezterm cli spawn --cwd <path>`:

- Suporta `--pane-title` para definir título
- Suporta execução de comandos via `sh -c`
- Verifica disponibilidade antes de abrir

#### [ ] Tratamento de erros

Novas classes de erro em `errors.ts`:

- `TerminalNotAvailableError` - WezTerm não instalado
- `TerminalSpawnError` - Falha ao abrir sessão
- `InvalidPathError` - Path inválido

#### [ ] Adicionar testes unitários

21 testes criados em `wezterm.test.ts` cobrindo:

- `isAvailable`: true quando wezterm disponível, false caso contrário
- `getVersion`: extrai versão do output
- `openSession`: constrói comando correto com cwd, title e commands
- Erros: TerminalNotAvailableError, InvalidPathError, TerminalSpawnError

---

## Task 6: Core - Hooks System

- **id:** oc-trans-006
- **status:** todo
- **priority:** medium
- **description:** Implementar sistema de hooks declarativos para execução pós-setup.
- **dependencies:** oc-trans-001

### Subtasks

#### [ ] Definir schema de configuração de hooks

Schema já definido com Zod:

```typescript
const hooksConfigSchema = z.object({
  afterCreate: z.array(z.string()).optional(),
  beforeDestroy: z.array(z.string()).optional(),
});
```

#### [ ] Implementar executeHooks

Implementado com:

- Execução sequencial de comandos via `sh -c`
- Captura de stdout/stderr
- Medição de duração de cada comando
- Modo `stopOnError: true` (strict, default) - para na primeira falha
- Modo `stopOnError: false` (lenient) - continua após falhas
- Suporte a variáveis de ambiente customizadas

#### [ ] Implementar logging de hooks

Resultado de cada comando inclui:

- `command`: comando executado
- `success`: boolean de sucesso
- `stdout`/`stderr`: saída capturada
- `exitCode`: código de saída
- `duration`: tempo de execução em ms

#### [ ] Adicionar testes unitários

32 testes criados em `hooks.test.ts` cobrindo:

- Schema validation
- Execução básica e múltiplos comandos
- Working directory correto
- Modo strict (stopOnError: true)
- Modo lenient (stopOnError: false)
- Variáveis de ambiente
- Comandos complexos (pipes, conditionals)
- executeAfterCreateHooks / executeBeforeDestroyHooks

---

## Task 7: Tool - start-task

- **id:** oc-trans-007
- **status:** todo
- **priority:** critical
- **description:** Implementar a tool principal que orquestra criação de ambiente isolado.
- **dependencies:** oc-trans-002, oc-trans-003, oc-trans-004, oc-trans-005, oc-trans-006

### Subtasks

#### [ ] Definir schema de input da tool

Schema definido com Zod:

```typescript
const startTaskInputSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  baseBranch: z.string().optional(),
});
```

#### [ ] Implementar fluxo completo

Fluxo implementado em `startTask()`:

1. Verifica se sessão existe para taskId (`findSessionByTask`)
2. Se existe, retorna worktree existente e abre terminal
3. Gera nome de branch via IA (`generateBranchName`)
4. Cria worktree (`createWorktree`)
5. Persiste sessão com `opencodeSessionId` (`addSession`)
6. Executa hooks afterCreate (`executeAfterCreateHooks`)
7. Abre terminal no worktree (`openSession`)
   - **Novo:** Para novas tasks, inicializar com `--prompt` contendo contexto
   - **Novo:** Para tasks existentes, usar `--continue` para retomar histórico
8. Retorna resultado

#### [ ] Definir schema de output

```typescript
const startTaskOutputSchema = z.object({
  status: z.enum(["created", "existing"]),
  branch: z.string(),
  worktreePath: z.string(),
  taskId: z.string(),
  taskName: z.string(),
  opencodeSessionId: z.string().optional(),
});
```

#### [ ] Registrar como tool do OpenCode

Tool registrada no plugin com:

- Nome: `start-task`
- Descrição clara do propósito
- Schemas de input/output integrados
- Execução do fluxo completo

#### [ ] Adicionar testes unitários

19 testes criados em `start-task.test.ts` cobrindo:

- Schema validation
- Criação de nova task (worktree + session)
- Uso de branch type hint
- Execução de hooks
- Abertura de terminal
- Retomada de sessão existente
- Tratamento de erros (terminal indisponível, hooks falhando)
- Função `resumeTask` auxiliar

---

## Task 8: Configuration

- **id:** oc-trans-008
- **status:** todo
- **priority:** medium
- **description:** Implementar sistema de configuração do plugin.
- **dependencies:** oc-trans-001

### Subtasks

#### [ ] Definir schema de configuração

Schema implementado em `config.ts`:

```typescript
const configSchema = z.object({
  worktreesDir: z.string().default("./worktrees"),
  defaultBranchType: branchTypeSchema.default("feat"),
  maxBranchSlugLength: z.number().int().positive().default(40),
  hooks: hooksConfigSchema.default(defaultHooks),
  terminal: terminalTypeSchema.default("wezterm"), // wezterm | tmux | kitty | none
  autoOpenTerminal: z.boolean().default(true),
  autoRunHooks: z.boolean().default(true),
  defaultBaseBranch: z.string().default("main"),
  useAiBranchNaming: z.boolean().default(true),
});
```

#### [ ] Implementar loadConfig

Buscar configuração em ordem de precedência:

1. `opencode.config.ts` (seção transmute) - via dynamic import
2. `.opencode/transmute.config.json`
3. `transmute.config.json`
4. Defaults

Funções implementadas:

- `loadConfig()` - carrega de todas as fontes com precedência
- `loadConfigFromFile()` - carrega de arquivo JSON
- `loadConfigFromOpencodeConfig()` - carrega de opencode.config.ts
- `findConfigFile()` - encontra arquivo de config no repositório

#### [ ] Validar configuração

- `validateConfig()` - valida com Zod e retorna resultado tipado
- `mergeConfig()` - merge com defaults via Zod parse

#### [ ] Integração com plugin

- Plugin agora carrega config na inicialização
- Terminal adapter criado baseado em config
- Hooks e flags respeitam configuração
- Logs de fonte de configuração para debugging

#### [ ] Adicionar testes unitários

30 testes criados em `config.test.ts` cobrindo:

- Schema validation e defaults
- `mergeConfig`: merge parcial com defaults
- `validateConfig`: sucesso e erro
- `findConfigFile`: encontra arquivos em ordem de precedência
- `loadConfigFromFile`: parse JSON e erros
- `loadConfig`: todas as fontes com fallback
- `getHooksConfig`: resolve hooks com defaults
- `resolveWorktreesDir`: resolve paths relativos e absolutos

---

## Task 9: Integration Testing

- **id:** oc-trans-009
- **status:** todo
- **priority:** medium
- **description:** Criar testes de integração para o fluxo completo.
- **dependencies:** oc-trans-007

### Subtasks

#### [ ] Setup de ambiente de teste

Criar repositório git temporário para testes.
Configurar mocks para terminal adapter.

#### [ ] Testar fluxo de criação completo

Verificar que worktree é criado corretamente.
Verificar que estado é persistido.
Verificar que branch existe.

#### [ ] Testar retomada de sessão

Criar sessão, verificar que segunda chamada retorna existente.

#### [ ] Testar cleanup

Verificar que worktree pode ser removido corretamente.

---

## Task 10: Documentation

- **id:** oc-trans-010
- **status:** todo
- **priority:** low
- **description:** Documentar uso e configuração do plugin.
- **dependencies:** oc-trans-007, oc-trans-008

### Subtasks

#### [ ] Criar seção Plugins no docs

Nova seção `apps/docs/content/docs/plugins/` criada com:

- `index.mdx` - Overview da seção de plugins

#### [ ] Documentação do Plugin

Documentação completa em `apps/docs/content/docs/plugins/opencode-transmute/`:

- `index.mdx` - Overview, quick start, como funciona
- `configuration.mdx` - Todas as opções de configuração com exemplos
- `api.mdx` - Referência de API (tools, funções, schemas, erros)
- `troubleshooting.mdx` - Guia de solução de problemas

#### [ ] Build do docs funcionando

Verificado que `pnpm build` no apps/docs compila as novas páginas corretamente.

---

# Backlog Pós-MVP

As tarefas abaixo estão planejadas para iterações futuras, após validação do MVP.

---

## Task 11: Tool - list-sessions

- **id:** oc-trans-011
- **status:** todo
- **priority:** low
- **description:** Implementar tool para listar sessões/worktrees ativos.
- **dependencies:** oc-trans-007
- **comment:** Pós-MVP - Gestão de sessões

### Subtasks

#### [ ] Implementar listagem de sessões

Combinar dados persistidos com worktrees existentes.

#### [ ] Detectar sessões órfãs

Worktrees sem sessão registrada e vice-versa.

---

## Task 12: Tool - cleanup-sessions

- **id:** oc-trans-012
- **status:** todo
- **priority:** low
- **description:** Implementar tool para limpar worktrees antigos ou órfãos.
- **dependencies:** oc-trans-011
- **comment:** Pós-MVP - Gestão de sessões

### Subtasks

#### [ ] Implementar remoção de worktree

Executar `git worktree remove` e atualizar estado.

#### [ ] Implementar cleanup por idade

Remover worktrees mais antigos que X dias.

#### [ ] Implementar cleanup de órfãos

Remover worktrees sem sessão correspondente.

---

## Task 13: Tool - transmute-list-tasks

- **id:** oc-trans-013
- **status:** todo
- **priority:** medium
- **description:** Implementar tool para buscar tarefas do Transmute.
- **dependencies:** oc-trans-007
- **comment:** Pós-MVP - Integração Transmute

### Subtasks

#### [ ] Integrar com markdown parser do Transmute

Importar e reutilizar funções de `apps/web/src/lib/markdown.ts`:

- `getAllTasksWithProject`
- `getProject`

Considerar extrair para `packages/markdown` se necessário.

#### [ ] Filtrar por status

Permitir filtrar por todo, in_progress, etc.

#### [ ] Filtrar por workspace/projeto

Permitir escopo específico.

---

## Task 14: Tool - transmute-update-status

- **id:** oc-trans-014
- **status:** todo
- **priority:** medium
- **description:** Implementar tool para atualizar status de tarefas no Transmute.
- **dependencies:** oc-trans-013
- **comment:** Pós-MVP - Integração Transmute

### Subtasks

#### [ ] Integrar com API de update

Reutilizar lógica do endpoint `PATCH /api/tasks/[taskId]` de `apps/web`.
Considerar extrair para função compartilhada se necessário.

#### [ ] Atualizar status de tarefa

Marcar como in_progress, done, blocked.

#### [ ] Adicionar comentários

Permitir adicionar notas à tarefa.

---

## Task 15: Adapter - tmux Integration

- **id:** oc-trans-015
- **status:** todo
- **priority:** low
- **description:** Implementar adapter de terminal para tmux.
- **dependencies:** oc-trans-005
- **comment:** Pós-MVP - Extensibilidade

### Subtasks

#### [ ] Implementar TerminalAdapter para tmux

Usar `tmux new-window` ou `tmux split-window`.

#### [ ] Configuração de sessão/janela

Permitir especificar sessão tmux alvo.

---

## Task 16: New Window Spawn Option

- **id:** oc-trans-016
- **status:** todo
- **priority:** low
- **description:** Adicionar opção para abrir worktree em nova janela de terminal.
- **dependencies:** oc-trans-005
- **comment:** Pós-MVP - UX

### Subtasks

#### [ ] Adicionar opção spawnNewWindow

```typescript
interface OpenSessionOptions {
  // ...
  spawnNewWindow?: boolean;
}
```

#### [ ] Implementar para WezTerm

Usar `wezterm start` ao invés de `wezterm cli spawn`.

---

# Priorização e Justificativas

## Ordem de Execução MVP

| Ordem | Task         | Justificativa                                   |
| ----- | ------------ | ----------------------------------------------- |
| 1     | oc-trans-001 | Setup é pré-requisito para tudo                 |
| 2     | oc-trans-002 | AI Branch naming é core e precisa de iteração   |
| 3     | oc-trans-003 | Worktree é a funcionalidade central             |
| 4     | oc-trans-004 | Persistência é simples mas necessária           |
| 5     | oc-trans-005 | Terminal é a interface do usuário               |
| 6     | oc-trans-006 | Hooks agregam valor mas não bloqueiam           |
| 7     | oc-trans-008 | Config antes da tool para definir comportamento |
| 8     | oc-trans-007 | Tool principal integra tudo                     |
| 9     | oc-trans-009 | Testes validam a implementação                  |
| 10    | oc-trans-010 | Docs podem ser feitas em paralelo               |

## Critérios de Aceite Gerais

1. **Code Review**: Todo código passa por lint e type-check
2. **Testes**: Funcionalidades core têm testes unitários
3. **Logs**: Operações importantes são logadas
4. **Erros**: Mensagens de erro são claras e acionáveis
5. **Configurável**: Comportamentos têm defaults sensatos mas são customizáveis
