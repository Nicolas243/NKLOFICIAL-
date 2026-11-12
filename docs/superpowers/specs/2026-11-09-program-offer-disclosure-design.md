# Program offer and disclosure design

## Intent

Make the commercial recommendation in opportunity secondary views look like a compact advertisement instead of a full catalog card nested inside another card. Keep the initial `/programas` cards focused on discovery.

## Goals

- Show a compact rectangular recommendation in the modal and individual opportunity page, not in the initial catalog card.
- Keep “Convidar no Buy Me a Coffee” exclusive to the Buy Me a Coffee opportunity card.
- Keep the affiliate disclosure available everywhere it is relevant, but collapsed by default with a clear way to expand it.
- Preserve existing CTA attribution, consent behavior, sponsored-link semantics, and analytics.

## Approaches

1. Reuse the existing full `NativeAdCard` everywhere: rejected because it creates a card-inside-card and repeats the “Conteúdo Premium” hierarchy.
2. Create a separate compact recommendation component and a reusable collapsed disclosure: selected because each surface has one responsibility and the existing experiment contract can remain unchanged.
3. Hide the recommendation entirely from secondary views: rejected because the approved CTA experiment needs a visible, measurable placement.

## Design

- `ProgramSecondaryOffer` will render a compact rectangular offer component with the selected variant, CTA link, and existing impression/click tracking.
- The compact offer will be used in the opportunity modal and the individual opportunity page; the initial catalog grid will not render it.
- `AffiliateDisclaimer` will become a closed `<details>` disclosure with accessible summary text and the existing legal copy.
- The footer will retain the general Buy Me a Coffee support link, while the invite CTA will be removed from the global footer and rendered only for the matching opportunity.
- The Buy Me a Coffee card will use the opportunity's existing affiliate/outbound link handling and a dedicated invite CTA without changing other program records.

## Validation

- Add focused E2E coverage for the compact secondary offer, collapsed disclosure, and Buy Me a Coffee-only invite CTA.
- Run the catalog E2E suite, lint, typecheck, build, and `npm run verify`.
- Deploy only after production routes return HTTP 200 and the changed text/layout is present.
