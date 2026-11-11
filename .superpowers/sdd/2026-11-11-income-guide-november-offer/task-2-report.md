# Task 2 report: five Guide CTA variants

## Result

Implemented the Task 2 offer-event API and Hotmart attribution integration for
the `guide-page-cta` experiment.

## Changes

- Added `guide-page-cta` and its five variants (`0` through `4`) to the
  offer-events experiment registry.
- Extended the POST event schema to accept Guide `impression`, `click`,
  `checkout`, and `conversion` events while rejecting unsupported variants.
- Kept the existing balanced-variant policy and all existing experiment
  registries unchanged.
- Updated Hotmart attribution validation to accept only validated
  `guide-page-cta:0..4` values, while preserving the existing program CTA
  validation and rejection of unsupported values.
- Added focused route and webhook attribution tests.

## TDD evidence

The new route test initially failed because the expected route helpers were
not implemented. The new Hotmart test initially failed because the attribution
helper was not exported/extended. Both passed after the minimal implementation
was added.

## Validation

- Focused API and attribution tests: **5 passed**
- Repository TypeScript tests: **25 passed**
- `npm run typecheck`: **passed**
- Focused ESLint on changed API files: **passed**
- `npm run verify`: **passed** (repository lint emitted existing warnings)

## Self-review

The change is limited to the Task 2 routes and their tests. Existing
`program-secondary-cta` variants remain `0..2`; Guide attribution is accepted
only after the shared parser validates the experiment and variant. No
unrelated working-tree changes were staged or modified.
