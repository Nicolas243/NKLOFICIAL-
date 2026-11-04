<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Working agreements

- Read this file and the nearest relevant documentation before changing code.
- Preserve the existing Next.js 16, React, Drizzle, Supabase and Tailwind stack.
- Use `.env.local` for local secrets; never print, commit or copy secret values.
- Validate focused behavior first, then run `npm run verify` for production-facing changes.
- Use `npm run test:e2e` when changing critical pages or interactions; known baseline failures are recorded in `docs/quality.md`.
- Test locally before deployment. Do not publish, migrate production data or change infrastructure without explicit approval.

## Context map

- Product and audience: [PRODUCT.md](./PRODUCT.md)
- Architecture: [docs/architecture.md](./docs/architecture.md)
- Design system and UX: [docs/design.md](./docs/design.md)
- Onboarding: [docs/onboarding.md](./docs/onboarding.md)
- Setup and recovery: [docs/setup.md](./docs/setup.md)
- Quality gates and known failures: [docs/quality.md](./docs/quality.md)
