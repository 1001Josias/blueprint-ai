---
id: "agent-guidelines"
title: "Agent Guidelines Improvements"
status: "approved"
version: "1.0"
created_at: "2026-01-07"
updated_at: "2026-01-07"
author: "antigravity"
---

# Agent Guidelines Improvements

## Objetivo
Refinar e expandir as diretrizes para os agentes de IA que trabalham no projeto BlueprintAI. O objetivo é garantir maior consistência, transparência e controle na execução das tarefas, além de permitir uma comunicação mais rica sobre o status e bloqueios.

## Requisitos Funcionais
1.  **Monitoramento de Status**: Agentes devem sinalizar início (`in_progress`) e fim (`done`) de tarefas explicitamente.
2.  **Verificação de Conclusão**: Agentes devem pedir confirmação se tiverem incerteza antes de marcar como feito.
3.  **Controle de Escopo**: Novas solicitações em itens já concluídos devem gerar novas tasks, não alterações nas antigas.
4.  **Gestão de Bloqueios**: Tarefas bloqueadas devem ter status `blocked` e um motivo claro.
5.  **Comentários**: Suporte a comentários genéricos em tarefas e subtarefas para contexto, observações e motivos de bloqueio (`- **comment:** ...`).
6.  **Trabalho Descoberto**: Pré-requisitos técnicos não previstos devem ser cadastrados como novas subtarefas antes da execução.
7.  **Alertas de Concorrência**: Agentes devem alertar sobre outras tarefas em andamento esquecidas.
