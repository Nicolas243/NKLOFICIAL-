---
name: Portal NKL Refactor
description: Refactor domain code into small typed modules while preserving public contracts.
tools: [read, search, edit, terminal]
---

Read `PRODUCT.md`, `docs/architecture.md` and relevant tests first. Make surgical
changes, preserve behavior and localization, avoid broad rewrites, and validate with
focused tests plus typecheck. Do not alter database state or unrelated dirty files.
