---
id: opencode-transmute
title: OpenCode Transmute Plugin
status: draft
version: "1.0"
created_at: "2026-01-17"
updated_at: "2026-01-17"
workflow: opencode
author: ai-agent
category: plugins
---

# OpenCode Transmute Plugin

## Objetivo

Criar um **plugin de sistema para o OpenCode** que integre o agente de IA ao **Transmute**, transformando tarefas em **ambientes de execução isolados**, previsíveis e reproduzíveis.

O plugin conecta planejamento e execução ao:

- Transformar features do Transmute em **tools** disponíveis para o OpenCode
- Criar isolamento real via **Git worktrees**
- Automatizar setup de ambiente
- Manter contexto entre sessões
- Reduzir atrito cognitivo no desenvolvimento assistido por IA

## Problema

Ao trabalhar com agentes de IA no OpenCode em projetos com múltiplas tarefas:

1. **Poluição de workspace**: múltiplas tarefas modificam os mesmos arquivos
2. **Branches misturadas**: commits de tarefas diferentes se misturam
3. **Setup repetitivo**: cada sessão exige reconfiguração manual
4. **Contexto perdido**: ao reiniciar sessões, o agente perde o estado anterior
5. **Falta de integração**: não há conexão nativa entre OpenCode e sistemas de tarefas

O OpenCode não oferece nativamente um **modelo de sessão isolada por tarefa**, nem ferramentas para integração com Transmute.

## Proposta de Solução

O **opencode-transmute** resolve isso oferecendo:

### MVP (Escopo Principal)

1. **Isolamento por Tarefa**
   - Criação automática de branch baseada na tarefa
   - Git worktree dedicado por tarefa
   - Associação clara: tarefa ↔ branch ↔ worktree

2. **Automação de Ambiente**
   - Abertura de sessão de terminal (WezTerm)
   - Execução de hooks declarativos após criação
   - Logs de execução visíveis

3. **Persistência Mínima**
   - Estado salvo em `.opencode/transmute.sessions.json`
   - Apenas dados essenciais: tarefa, branch, worktree, timestamp
   - Permite retomada e evita duplicações

### Pós-MVP (Iterações Futuras)

1. **Tools de Integração com Transmute**
   - Buscar tarefas do sistema
   - Marcar progresso de tarefas
   - Vincular execução a tarefas

2. **Gestão de Sessões**
   - Listagem de sessões/worktrees ativos
   - Retomada assistida de worktrees
   - Cleanup de worktrees antigos

3. **Extensibilidade**
   - Integração com tmux
   - Spawn em nova janela (opcional)
   - Notificações para sessão principal

## Escopo e Não-Escopo

### Escopo (MVP)

| Item                 | Descrição                               |
| -------------------- | --------------------------------------- |
| Branch naming        | Gerar nome de branch baseado em task ID |
| Git worktree         | Criar worktree isolado para cada tarefa |
| Terminal session     | Abrir sessão WezTerm na mesma janela    |
| Hooks                | Executar comandos declarados após setup |
| Persistência         | Salvar estado mínimo para retomada      |
| OpenCode integration | Funcionar como plugin/tool do OpenCode  |

### Não-Escopo (MVP)

| Item                    | Razão                                   |
| ----------------------- | --------------------------------------- |
| Coordenação multi-agent | Complexidade prematura                  |
| Serviços externos       | Foco em operação local                  |
| Prompts interativos     | Execução deve ser explícita             |
| Gestão de processos     | Não rastrear PIDs ou status de execução |
| Integração Transmute    | Reservado para pós-MVP                  |
| Múltiplos terminais     | WezTerm é suficiente para MVP           |

## Arquitetura

O plugin será implementado como um **app no monorepo Transmute**, em `apps/opencode-transmute/`.

```
transmute/
├── apps/
│   ├── web/                         # App Next.js existente
│   ├── docs/                        # Documentação existente
│   └── opencode-transmute/          # Novo app - Plugin OpenCode
│       ├── src/
│       │   ├── core/                # Domínio do plugin
│       │   │   ├── naming.ts        # Geração de nomes de branch
│       │   │   ├── worktree.ts      # Criação/gestão de worktrees
│       │   │   ├── session.ts       # Persistência de estado
│       │   │   └── hooks.ts         # Execução de hooks declarativos
│       │   │
│       │   ├── adapters/            # Integrações externas
│       │   │   ├── terminal/
│       │   │   │   ├── types.ts     # Interface abstrata
│       │   │   │   └── wezterm.ts   # Implementação WezTerm
│       │   │   └── git/
│       │   │       └── worktree.ts  # Operações Git
│       │   │
│       │   ├── tools/               # Tools expostas ao OpenCode
│       │   │   ├── start-task.ts    # Iniciar sessão isolada
│       │   │   └── index.ts         # Registry de tools
│       │   │
│       │   └── index.ts             # Entry point do plugin
│       │
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── schemas/                     # Schemas compartilhados (reutilizável)
│   └── utils/                       # Utilitários compartilhados
│
└── projects/                        # Conteúdo markdown (PRDs + Tasks)
```

### Benefícios da Localização em `apps/`

1. **Consistência**: Segue o padrão do monorepo (web, docs, agora opencode-transmute)
2. **Compartilhamento**: Pode importar `@repo/schemas` e `@repo/utils`
3. **Build Pipeline**: Integrado ao Turborepo existente
4. **Isolamento**: App independente, não polui outros packages

### Separação de Responsabilidades

1. **Core**: Lógica de domínio pura, sem dependências externas
2. **Adapters**: Integrações com Git, terminais, etc.
3. **Tools**: Interface com o OpenCode

## Modelo de Execução

### Princípios

1. **Determinístico**: Apenas comandos definidos em hooks são executados
2. **Explícito**: Nenhuma ação implícita ou mágica
3. **Auditável**: Logs claros de todas as operações
4. **Não-interativo**: Sem prompts durante execução

### Fluxo de `start-task`

```
1. Receber task ID/nome
2. Gerar nome de branch (ex: feat/task-123-description)
3. Verificar se já existe worktree para esta tarefa
4. Se não existe:
   a. Criar branch a partir de main
   b. Criar worktree em ./worktrees/<branch-name>
   c. Persistir estado em .opencode/transmute.sessions.json
5. Abrir sessão WezTerm no diretório do worktree
6. Executar hooks declarados (install, setup, etc.)
7. Retornar status e path do worktree
```

### Hooks Declarativos

```typescript
// opencode.config.ts
export default {
  transmute: {
    hooks: {
      afterCreate: ["pnpm install", "pnpm dev"],
    },
  },
};
```

## Persistência de Estado

### O que persistir

```typescript
interface TransmuteSession {
  taskId: string;
  taskName: string;
  branch: string;
  worktreePath: string;
  createdAt: string;
}

interface TransmuteState {
  sessions: TransmuteSession[];
}
```

### O que NÃO persistir

- Status da tarefa (vem do Transmute)
- Processos ativos ou PIDs
- Estado de execução de hooks
- Configurações de terminal

### Arquivo de Estado

```json
// .opencode/transmute.sessions.json
{
  "sessions": [
    {
      "taskId": "task-123",
      "taskName": "implement-auth",
      "branch": "feat/task-123-implement-auth",
      "worktreePath": "./worktrees/feat-task-123-implement-auth",
      "createdAt": "2026-01-17T10:30:00Z"
    }
  ]
}
```

## Decisões Técnicas

### D1: WezTerm como terminal principal

**Decisão**: Usar WezTerm como única integração de terminal no MVP.

**Razão**:

- API CLI robusta e bem documentada
- Suporte a panes e tabs na mesma janela
- Evita complexidade de abstrações prematuras

**Trade-off**: Usuários de outros terminais precisarão aguardar pós-MVP.

### D2: Git worktrees vs branches simples

**Decisão**: Usar git worktrees para isolamento real.

**Razão**:

- Isolamento completo de arquivos
- Múltiplas tarefas podem rodar em paralelo
- Evita conflitos de working directory

**Trade-off**: Usa mais espaço em disco, requer gestão de worktrees.

### D3: Hooks declarativos vs scripts arbitrários

**Decisão**: Apenas hooks declarados em config são executados.

**Razão**:

- Previsibilidade e segurança
- Fácil auditoria
- Evita execução de comandos maliciosos

**Trade-off**: Menos flexibilidade para casos edge.

### D4: Persistência mínima

**Decisão**: Persistir apenas dados de mapeamento tarefa→worktree.

**Razão**:

- Simplicidade
- Estado derivável (pode verificar worktrees existentes)
- Evita problemas de sincronização

**Trade-off**: Menos informação disponível para decisões automáticas.

## Riscos e Mitigações

| Risco                      | Probabilidade | Impacto | Mitigação                             |
| -------------------------- | ------------- | ------- | ------------------------------------- |
| Worktrees órfãos           | Alta          | Médio   | Cleanup periódico pós-MVP             |
| Conflitos de branch naming | Baixa         | Baixo   | Validação antes de criar              |
| WezTerm não instalado      | Média         | Alto    | Verificação prévia + erro claro       |
| Estado corrompido          | Baixa         | Médio   | Estado mínimo + reconstrução possível |
| Hooks falhando             | Média         | Médio   | Logs claros + continuação opcional    |

## Métricas de Sucesso

### MVP

1. Agente consegue criar worktree isolado via tool
2. Terminal abre automaticamente no diretório correto
3. Hooks são executados após criação
4. Estado é persistido e permite retomada
5. Múltiplas tarefas podem rodar em worktrees separados

### Pós-MVP

1. Agente consegue buscar tarefas do Transmute
2. Agente consegue atualizar status no Transmute
3. Listagem e cleanup de worktrees funcionam
4. Suporte a múltiplos terminais

## Referências

- [Git Worktrees Documentation](https://git-scm.com/docs/git-worktree)
- [WezTerm CLI Reference](https://wezfurlong.org/wezterm/cli/general.html)
- [OpenCode Plugin System](https://opencode.ai/docs)
- PRD: MCP Server Integration (referência de tools)
