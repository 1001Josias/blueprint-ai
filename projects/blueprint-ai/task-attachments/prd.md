---
id: "task-attachments"
title: "Task Attachments"
status: "draft"
version: "1.0"
created_at: "2026-01-07"
updated_at: "2026-01-07"
author: "antigravity"
---

# Task Attachments

## Objetivo

Permitir anexar arquivos (imagens, mockups, documentos) a tasks e PRDs para melhorar a comunicação e documentação visual.

## Contexto

Durante discussões de UX, mockups são gerados para ajudar na tomada de decisão. Atualmente não há forma estruturada de anexar essas imagens às tasks, dificultando a referência futura.

## Requisitos Funcionais

### Schema & Parser

1. Adicionar campo `attachments` ao schema de Task
2. Suportar sintaxe markdown para imagens inline na descrição
3. Detectar e listar imagens referenciadas automaticamente

### Storage

4. Criar diretório `assets/` dentro de cada projeto para armazenar arquivos
5. Copiar imagens geradas para o projeto automaticamente
6. Suportar caminhos relativos nas referências

### UI Display

7. Renderizar imagens inline na descrição (já funciona via markdown→HTML)
8. Galeria de attachments no Task Detail Modal
9. Lightbox para visualizar imagens em tamanho completo

### Upload (Fase 2)

10. Drag & drop de imagens no modal
11. Upload via API endpoint
12. Geração de thumbnails

## Fora do Escopo (v1)

- Upload de arquivos genéricos (PDFs, ZIPs)
- Versionamento de attachments
- OCR ou análise de conteúdo
