# SOLE Production Content Contract v1

Status: normative publication contract. This document does not claim that any current demo product, price, stock, review, campaign or media asset is production-approved.

## Authority boundary

The commerce backend defined by F16 is authoritative for product publication, variant identity, price, discount, stock and sellability. An approved CMS may own editorial copy and composition, but it cannot override commercial truth. Licensed-media storage may own renditions, never the rights decision itself.

`src/data/shoes.ts`, static route copy, Unsplash URLs and generated/demo assets are review fixtures. They are explicitly non-production and must not be promoted by changing a UI label or environment flag.

## Lifecycle

Content moves only through `draft -> in_review -> approved -> published -> archived`. Publication is a server-side transition with actor, revision, timestamp and audit event. Only `published` entries inside their publication window may appear in public responses. Preview requires authorization, is `noindex`, and must not share public cache keys.

Approval and publication are separate duties in production. Any material edit to approved content increments its revision and returns it to `in_review`. Archive is reversible only through a new reviewed revision; deletion is reserved for retention-policy workflows.

## Evidence gates

Before publication:

- products require `product-authority`; product price/availability links also require `price-authority` and `inventory-authority` from the F16 backend;
- every image, video, font and downloadable asset requires `ownership` or `license` evidence plus accessible alternative text where applicable;
- comparative, scarcity, authenticity, sustainability, warranty and delivery claims require a traceable source and legal approval;
- campaigns, collections, drops, lookbooks and journal entries require editorial approval;
- testimonials, star ratings, review totals and social proof are prohibited unless sourced from an approved review system with moderation and consent records.

Missing, expired or revoked evidence fails closed: the entry is not publicly publishable and commerce links/hotspots are disabled.

## Relationships and commerce linking

Editorial content references immutable backend product IDs, never names, slugs or array indexes. Rendering resolves only the backend's current public product projection. A missing, unpublished or unsellable product becomes plain editorial content; it must not expose price, stock, add-to-cart or a broken product link.

Collections and campaigns may order references but cannot snapshot price or inventory as editorial truth. Scheduled drops use server time and an explicit timezone. Countdown completion never makes an item sellable by itself.

## Localization and accessibility

Each locale is reviewed independently. Persian is `fa-IR` and RTL; mixed identifiers and numeric values are isolated. Translation fallback must be explicit and cannot silently publish an unapproved locale. Media must provide meaningful localized alternative text, captions/transcripts where required, dimensions and a decorative flag when no alt text is appropriate.

## Delivery, cache and safety

Public content responses include content revision, schema version and publication timestamps. Webhooks are signed, replay-protected and delivered through an idempotent outbox. Public caches purge by immutable content ID/revision and must fail closed on publication revocation. Rich text uses an allowlist renderer; scripts, inline event handlers, arbitrary embeds and untrusted HTML are rejected.

Logs and analytics exclude draft content, preview tokens, personal data, licensing documents and unpublished campaign details. Audit history records actor, action, content ID, before/after status, revision, request ID and safe reason metadata.

## Production acceptance

Production content remains blocked until the CMS/source systems, roles, legal/brand approvers, retention policy, media rights store, localization workflow and server implementation are selected. Acceptance requires schema conformance, authorization/separation-of-duty tests, schedule/timezone tests, preview isolation, XSS tests, broken-reference tests, revocation/cache-purge tests, webhook replay tests and an auditable sample publication.
