---
project_id: opencode-transmute
prd_version: "1.0"
created_at: "2026-01-17"
updated_at: "2026-01-17"
---

# Tasks: OpenCode Transmute Plugin

---

## Task 1: Project Setup

- **id:** oc-trans-001
- **status:** todo
- **priority:** critical
- **description:** Inicializar estrutura do app opencode-transmute no monorepo Transmute.

### Subtasks

#### [ ] Criar estrutura de diretórios

Criar `apps/opencode-transmute` com estrutura:

```
apps/opencode-transmute/
├── src/
│   ├── core/
│   ├── adapters/
│   ├── tools/
│   └── index.ts
├── package.json
└── tsconfig.json
```

#### [ ] Configurar package.json

Definir dependências mínimas:

- typescript
- zod (validação)
- `@repo/schemas` (schemas compartilhados)
- `@repo/utils` (utilitários compartilhados)

#### [ ] Configurar TypeScript

Criar `tsconfig.json` estendendo `@repo/tsconfig`.

#### [ ] Registrar no Turborepo

Atualizar `turbo.json` para incluir o novo app no pipeline de build.

---

## Task 2: Core - Branch Naming

- **id:** oc-trans-002
- **status:** todo
- **priority:** high
- **description:** Implementar lógica de geração de nomes de branch baseada em task ID/nome.
- **dependencies:** oc-trans-001

### Subtasks

#### [ ] Definir schema de entrada

```typescript
interface BranchNameInput {
  taskId: string;
  taskName?: string;
  prefix?: string; // default: "feat"
}
```

#### [ ] Implementar função de sanitização

Converter strings para formato válido de branch:

- lowercase
- remover caracteres especiais
- substituir espaços por hífens
- limitar tamanho

#### [ ] Implementar generateBranchName

```typescript
// apps/opencode-transmute/src/core/naming.ts
function generateBranchName(input: BranchNameInput): string;
// Ex: "feat/task-123-implement-auth"
```

#### [ ] Adicionar testes unitários

Cobrir casos:

- Task ID simples
- Task com nome longo
- Caracteres especiais no nome
- Prefixos customizados

---

## Task 3: Core - Git Worktree Management

- **id:** oc-trans-003
- **status:** todo
- **priority:** high
- **description:** Implementar criação e gestão de git worktrees.
- **dependencies:** oc-trans-001

### Subtasks

#### [ ] Definir interface de worktree

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

#### [ ] Implementar listWorktrees

Executar `git worktree list --porcelain` e parsear output.

#### [ ] Implementar createWorktree

Executar `git worktree add -b <branch> <path> <base>`.

- Verificar se branch já existe
- Criar diretório worktrees se necessário

#### [ ] Implementar worktreeExists

Verificar se já existe worktree para uma branch específica.

#### [ ] Tratamento de erros

- Branch já existe
- Diretório já existe
- Git não inicializado
- Base branch não existe

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

---

## Task 5: Adapter - WezTerm Integration

- **id:** oc-trans-005
- **status:** todo
- **priority:** high
- **description:** Implementar integração com WezTerm para abrir sessões de terminal.
- **dependencies:** oc-trans-001

### Subtasks

#### [ ] Definir interface abstrata de terminal

```typescript
// apps/opencode-transmute/src/adapters/terminal/types.ts
interface TerminalAdapter {
  isAvailable(): Promise<boolean>;
  openSession(options: OpenSessionOptions): Promise<void>;
}

interface OpenSessionOptions {
  cwd: string;
  commands?: string[];
  title?: string;
}
```

#### [ ] Verificar disponibilidade do WezTerm

Checar se `wezterm` está no PATH.

#### [ ] Implementar openSession para WezTerm

Usar `wezterm cli spawn --cwd <path>` para abrir nova pane/tab.
Opcionalmente executar comandos iniciais.

#### [ ] Tratamento de erros

- WezTerm não instalado
- Falha ao abrir sessão
- Path inválido

---

## Task 6: Core - Hooks System

- **id:** oc-trans-006
- **status:** todo
- **priority:** medium
- **description:** Implementar sistema de hooks declarativos para execução pós-setup.
- **dependencies:** oc-trans-001

### Subtasks

#### [ ] Definir schema de configuração de hooks

```typescript
const hooksConfigSchema = z.object({
  afterCreate: z.array(z.string()).optional(),
  beforeDestroy: z.array(z.string()).optional(),
});
```

#### [ ] Implementar executeHooks

Executar array de comandos sequencialmente.
Capturar stdout/stderr.
Continuar ou parar em caso de erro (configurável).

#### [ ] Implementar logging de hooks

Mostrar output de cada comando executado.
Indicar sucesso/falha claramente.

---

## Task 7: Tool - start-task

- **id:** oc-trans-007
- **status:** todo
- **priority:** critical
- **description:** Implementar a tool principal que orquestra criação de ambiente isolado.
- **dependencies:** oc-trans-002, oc-trans-003, oc-trans-004, oc-trans-005, oc-trans-006

### Subtasks

#### [ ] Definir schema de input da tool

```typescript
const startTaskInputSchema = z.object({
  taskId: z.string(),
  taskName: z.string().optional(),
  baseBranch: z.string().optional(),
});
```

#### [ ] Implementar fluxo completo

1. Verificar se já existe sessão para taskId
2. Se existe, retornar worktree existente
3. Gerar nome de branch
4. Criar worktree
5. Persistir sessão
6. Abrir terminal no worktree
7. Executar hooks afterCreate
8. Retornar resultado

#### [ ] Definir schema de output

```typescript
const startTaskOutputSchema = z.object({
  status: z.enum(["created", "existing"]),
  branch: z.string(),
  worktreePath: z.string(),
  taskId: z.string(),
});
```

#### [ ] Registrar como tool do OpenCode

Expor tool com nome, descrição e schemas adequados.

---

## Task 8: Configuration

- **id:** oc-trans-008
- **status:** todo
- **priority:** medium
- **description:** Implementar sistema de configuração do plugin.
- **dependencies:** oc-trans-001

### Subtasks

#### [ ] Definir schema de configuração

```typescript
const configSchema = z.object({
  worktreesDir: z.string().default("./worktrees"),
  branchPrefix: z.string().default("feat"),
  hooks: hooksConfigSchema.optional(),
  terminal: z.enum(["wezterm"]).default("wezterm"),
});
```

#### [ ] Implementar loadConfig

Buscar configuração em:

1. `opencode.config.ts` (seção transmute)
2. `.opencode/transmute.config.json`
3. Defaults

#### [ ] Validar configuração

Usar Zod para validação e merge com defaults.

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

#### [ ] README do app

- Overview do plugin
- Como funciona no contexto do monorepo Transmute
- Configuração básica
- Exemplo de uso

#### [ ] Documentação de API

- Tools disponíveis
- Schemas de input/output
- Configurações suportadas

#### [ ] Troubleshooting

- WezTerm não encontrado
- Erros comuns de Git
- Como limpar worktrees manualmente

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
| 2     | oc-trans-002 | Branch naming é simples e independente          |
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
