---
id: state-management
title: State Management Improvements
status: draft
version: "1.0"
author: AI Agent
created_at: "2026-01-07"
updated_at: "2026-01-07"
---

# State Management Improvements

## Overview

Improve the state management architecture of the web application by introducing modern, type-safe libraries for URL query params and global state.

## Goals

1. **Simplify URL state management** using `nuqs` for query params
2. **Centralize global state** using `Zustand` for shared application state
3. **Eliminate manual workarounds** like `window.history.replaceState()` hacks
4. **Improve developer experience** with cleaner, more maintainable code

## Background

Currently, the app uses:

- React `useState` for local component state
- `useTransition` for optimistic updates
- Manual `window.history.replaceState()` for URL query param sync (hack to avoid infinite re-renders)

This approach works but is fragile and doesn't scale well.

## Proposed Libraries

### nuqs

- Type-safe query param management for Next.js
- Automatic URL sync without re-render issues
- Shareable, bookmarkable URLs

### Zustand

- Lightweight global state management
- No boilerplate, simple API
- Works well with React Server Components
