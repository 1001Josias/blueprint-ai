---
id: "task-detail-modal"
title: "Task Detail Modal"
status: "draft"
version: "1.0"
created_at: "2026-01-07"
updated_at: "2026-01-07"
author: "antigravity"
---

# Task Detail Modal

## Objetivo

Implementar um modal de detalhes de task premium com UX profissional inspirada em Linear/Notion. O modal centralizará todas as interações com tasks, mantendo os cards na lista compactos.

## Contexto

Atualmente, os cards de task exibem todos os detalhes inline, causando deformação do layout quando há muitos comentários. A solução é mover os detalhes para um modal dedicado.

## Requisitos Funcionais

### Modal Base

1. Abrir modal ao clicar em qualquer task
2. Exibir título, status, prioridade, descrição
3. Listar subtasks com toggle de checkbox
4. Listar todos os comentários
5. Suportar deep linking via URL query param

### Rich Text

6. Renderizar descrição como markdown (bold, lists, code)
7. Toolbar de formatação para comentários (B/I/U/Link/Code)

### Comentários CRUD

8. Adicionar novo comentário
9. Editar comentário existente
10. Deletar comentário
11. Menu de ações (⋮) no hover de cada comentário

### AI Enhancement

12. Botão "✨ Improve with AI" para melhorar texto do comentário
13. Integração com API de AI (Gemini/OpenAI)

## Design Reference

- Cards na lista: compactos, apenas título + status + badge de comentários
- Modal: glassmorphism, dark theme, violet accents
- Inspiração: Linear, Notion, Jira

## Fora do Escopo

- Attachments/uploads
- Mentions (@user)
- Reactions (emojis)
