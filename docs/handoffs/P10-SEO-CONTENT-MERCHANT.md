# P10 Working Handoff — SEO, Content & Merchant

Status: `IMPLEMENTATION IN PROGRESS / NOT YET ACCEPTED`

## Exact baseline

- Frontend START_SHA: `c5c09684921d81f61a7985f32e3e32742d050552`
- Backend START_SHA: `6b9fef79ee0585423b7f763974f87c82a67c9cf1`
- Branch in both repositories: `phase/sole-p10-seo-content-merchant`
- Tracking issue: `sajadkhavas/solemate-kickz#58`

## Registered scope

- P10.1 governed CMS draft/review/publish/rollback workflow.
- P10.2 backend-authoritative route policy, redirects and invalid-state contracts.
- P10.3 SSR metadata, canonical, robots and schema enforcement.
- P10.4 segmented sitemap generation from published truth.
- P10.5 merchant-feed readiness from verified catalog, price and availability only.
- P10.6 permanent adversarial QA, registry/handoff closure and merges.

## Exclusions and guardrails

No production activation/data mutation, credential enrollment, merchant-provider submission, fabricated product/price/availability, open redirect, unpublished content exposure or indexable invalid/faceted state is authorized.

## Official references

- Google Search Central canonical guidance: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google Search Central robots meta guidance: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Google Merchant product data specification: https://support.google.com/merchants/answer/7052112
- Schema.org Product: https://schema.org/Product
- Laravel database transactions: https://laravel.com/docs/13.x/database#database-transactions

## Rollback impact

Frontend rollback target is the frontend START_SHA; Backend rollback target is the backend START_SHA. Rollback removes P10 CMS, SEO policy/sitemap/redirect and merchant-readiness additions while preserving P09 and all earlier commerce truth.

## Next phase

P11 — Observability, RUM & CRO remains registered and cannot start from P10 until exact-head Backend and Frontend quality gates pass and both P10 PRs merge.
