# Task 1 report — Simplify the income guide copy

## Status

Implemented the approved copy-only changes for `/guias/renda-extra` in `src/app/guias/renda-extra/page.tsx`.

## Changes

- Replaced the main description with the exact approved Portuguese copy.
- Updated the PDF cover title and three supporting labels with the exact approved text; retained the `PDF`, `Portal NKL`, and existing layout labels.
- Replaced all four benefit items with the approved text while preserving the existing list markup and keys.
- Replaced only the monthly subscription description; retained the heading, `R$ 19/mês` price, button, offer variants, and checkout behavior.
- No layout, pricing, handlers, or offer logic was changed.

## Validation

- `npx eslint src/app/guias/renda-extra/page.tsx` — passed with no errors.
- `git --no-pager diff -- src/app/guias/renda-extra/page.tsx` — reviewed; only the intended copy changes are present.
- Local route check: `GET http://localhost:3000/guias/renda-extra` returned HTTP 200 and contained the new description, cover title, benefit text, unchanged `R$ 19/mês` price, and both checkout-option disclosure text.

## Commit

- `52dd6d2` — Simplify income guide copy

## Concerns

None for the requested change. The working tree contains unrelated pre-existing modifications and untracked files; they were not included in the implementation commit.
