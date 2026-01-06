---
id: documentation-site
title: Site de Documentação
status: draft
version: '1.1'
created_at: '2026-01-05'
updated_at: '2026-01-05'
author: ai-agent
---

# Site de Documentação

## Objetivo

Criar um site de documentação dedicado para o BlueprintAI, separado do aplicativo principal. O objetivo é fornecer um guia completo e profissional para usuários e desenvolvedores, facilitando a adoção e contribuição para o projeto.

## Contexto

Atualmente, a documentação está dispersa em arquivos Markdown dentro do repositório (`README.md`, `AGENTS.md`). Com o crescimento do projeto, é necessário centralizar essas informações em um portal acessível, pesquisável e bem estruturado.

## Requisitos Funcionais

### Plataforma de Documentação
1. **Framework**: Utilizar **Fumadocs** (Next.js App Router).
2. **Estrutura de Conteúdo**:
   - **Getting Started**: Instalação, configuração local e "Hello World".
   - **Guia do Usuário**: Como criar PRDs, Tasks e usar as features do BlueprintAI.
   - **Referência para Agentes**: Documentação técnica dos schemas e padrões. **Nota:** O arquivo `AGENTS.md` será mantido na raiz para consumo por LLMs; o site servirá como visualização para humanos.
   - **API Reference**: Documentação dos endpoints internos (ex: update de tasks).
   
### Features do Site
1. **Busca Full-text**: Indexação de todo o conteúdo usando o search do Fumadocs.
2. **Dark Mode**: Suporte a tema escuro, alinhado com a identidade visual do app principal.
3. **MDX**: Suporte a componentes React e TypeTable para documentação de props/schemas.
4. **Navegação**: Sidebar automática baseada na estrutura de pastas (File-system routing).

## Requisitos Não-Funcionais

- **Performance**: O site deve carregar instantaneamente (Next.js SSG/SSR).
- **Design**: Manter consistência visual com o BlueprintAI (paleta de cores violeta/dark).
- **Manutenibilidade**: Conteúdo escrito em MDX.
- **Riqueza Visual**: Priorizar inclusão de screenshots/GIFs sempre que descrever funcionalidades de UI.

## Fora do Escopo

- Migração para monorepo (será tratado em um projeto de infraestrutura separado).
- Sistema de login ou controle de acesso (documentação será pública).
- Tradução/i18n (inicialmente apenas em uma língua, Português ou Inglês conforme padrão do projeto).

## Métricas de Sucesso

1. Site publicado e acessível.
2. Todo o conteúdo atual do `README.md` e `AGENTS.md` migrado e expandido.
3. Funcionalidade de busca retornando resultados relevantes.
