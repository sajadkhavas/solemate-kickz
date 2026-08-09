# F11 — Technical SEO & Search Readiness

## Repository

`sajadkhavas/solemate-kickz`

## Baseline branch

`integration/sole-frontend-v2`

## Baseline SHA

`6da6036da3b7825ff7fa11bcd191d8872ddeb85c`

The phase branch was created directly from this accepted F10 + VPS hardening baseline. Published history was not rebased or force-pushed.

## Phase branch

`phase/sole-f11-technical-seo`

## Final branch SHA

Git commit IDs are content-addressed, so a tracked file cannot contain the SHA of the commit that contains itself without changing that SHA. The authoritative final branch SHA is therefore the exact PR #12 head recorded by GitHub and repeated in the final supervisor report after exact-head validation.

## PR number

`#12` — base `integration/sole-frontend-v2`, head `phase/sole-f11-technical-seo`.

## Files changed

F11 keeps SEO implementation centralized while retaining only the regression-test corrections and catalog URL normalization required by exact-head review:

- `src/seo/seo-config.ts`
- `src/seo/seo-head.ts`
- `src/seo/seo-server.ts`
- `src/server.ts`
- `src/router.tsx`
- `src/routes/products.tsx`
- `scripts/f11-browser-runner.mjs`
- `scripts/f11-seo-test-utils.mjs`
- `scripts/audit-f11-technical-seo.mjs`
- `scripts/test-f11-technical-seo.mjs`
- `scripts/seo-qa-f11.mjs`
- `scripts/test-f4-f5-catalog-product-card.mjs`
- `scripts/audit-f7-cart-checkout.mjs`
- `scripts/test-f7-cart-checkout.mjs`
- `scripts/test-f9-wishlist-account-orders.mjs`
- `scripts/verify-cumulative-quality.mjs`
- `package.json`
- `.github/workflows/frontend-ci.yml`
- this handoff

`src/routeTree.gen.ts`, `scripts/browser-harness.mjs`, Product purchase behavior, cart/account state, motion/3D implementation and deployment scripts remain at the accepted baseline unless explicitly listed above.

## Route indexation matrix

| Route | Policy | Reason |
| --- | --- | --- |
| `/` | `index, follow` only with valid configured Site URL; otherwise `noindex, follow` | Truthful frontend-prototype landing content, but no production canonical may be inferred |
| `/about` | `index, follow` only with valid configured Site URL; otherwise `noindex, follow` | Truthful project-scope content independent of commerce backend |
| `/brands` | `index, follow` only with valid configured Site URL; otherwise `noindex, follow` | Truthful list of names present in the repository Dataset with explicit non-affiliation disclosure |
| `/products` | `noindex, follow` | Current catalog is a demo/local Dataset rather than authoritative production commerce data |
| `/products?...` | `noindex, follow`; canonical `/products` when Site URL is valid | Prevents faceted/search/sort/query crawl expansion |
| `/product/$id` valid | `noindex, follow` | Current product records, price/review flags and availability are demo Dataset data |
| `/product/$id` invalid | final HTTP 404 + `X-Robots-Tag: noindex, follow`; no canonical | Prevents soft 404 indexing, including Router-normalized malformed paths |
| `/auth` | `noindex, follow` | Utility/local-state route |
| `/cart` | `noindex, follow` | Transaction/local-state route |
| `/checkout` | `noindex, follow` | Transaction/local-state route |
| `/wishlist` | `noindex, follow` | Local-state route |
| `/account` | `noindex, follow` | Local/private-style route |

## Canonical policy

- Canonicals are generated only from the validated central Site URL.
- No request host, localhost, `example.com`, private/link-local IP, or guessed SOLE domain becomes a production canonical.
- `/`, `/about`, `/brands` self-canonicalize when Site URL is valid.
- `/products` always canonicalizes to the clean catalog path when Site URL is valid; query state never becomes canonical.
- Valid demo Product pages self-canonicalize for deterministic sharing/reference while remaining `noindex`.
- Utility routes emit no homepage canonical.
- 404/invalid-product final responses emit no canonical.
- TanStack Router `HeadContent` provides head-level deduplication; F11 runtime gates require exactly one critical tag.

## Site URL configuration

Public Site URL configuration is centralized at:

`VITE_SITE_URL`

Rules:

- HTTP/HTTPS only.
- origin only; credentials, query, hash and non-root path are rejected.
- hostname normalization strips IPv6 brackets/trailing-dot ambiguity before safety checks.
- localhost, `.localhost`, `.local`, loopback, private, link-local, carrier-grade NAT, documentation/reserved IPv4 ranges and non-public IPv6 ranges are rejected.
- IPv6 loopback, unspecified, IPv4-mapped, ULA, link-local, multicast and documentation ranges are rejected.
- normalized value is the URL origin with deterministic trailing-slash behavior.
- missing/invalid value triggers fail-safe `noindex` and omits absolute canonical/`og:url`.
- the value is public configuration, not a secret.

### Deployment timing

`VITE_SITE_URL` is consumed through Vite `import.meta.env`, so it is **build-time public configuration**. Production deployment must set the verified public origin before `bun run build` / `bun run build:vps`. Changing only a systemd/runtime environment value after an artifact is already built is not sufficient to change compiled canonical/metadata values; rebuild the artifact when the production Site URL changes.

## Query/facet policy

The current `/products` content is demo Dataset content, so the catalog base and every query variant are `noindex, follow`. When a valid Site URL is configured they canonicalize to the single clean `/products` URL.

TanStack Router search validation still provides application defaults (`sort=newest`, `quick=all`, `view=grid`), but F11 adds the official `stripSearchParams` middleware for those defaults. This keeps the canonical catalog URL clean instead of redirecting `/products` to a URL whose only parameters reproduce default UI state. Real filter state such as brand/category/size/search remains URL-addressable. Default-only or unknown query noise may be normalized through an internal Router redirect; the runtime gate follows only bounded same-origin redirects, rejects cross-origin redirects, and verifies the final clean policy.

No SEO landing page is invented for filter/search/sort state.

## robots.txt policy

`/robots.txt` is served from the custom TanStack Start server entry without adding an app route or changing generated route files.

It always contains:

- `User-agent: *`
- `Allow: /`

When and only when Site URL is valid, it also advertises the absolute Sitemap URL. Utility routes are not `Disallow`ed because crawlers must be able to read their `noindex` metadata.

## Sitemap policy

`/sitemap.xml` is server-rendered XML.

With a valid Site URL it contains only:

- `/`
- `/about`
- `/brands`

It intentionally excludes:

- `/products` while catalog data is demo/local;
- all Product URLs while Product data is demo/local;
- all utility/local-state routes;
- query/filter/search/sort URLs;
- 404 URLs.

Without a valid Site URL it returns a valid empty URL set rather than fabricating absolute URLs.

## Structured data policy

F11 publishes only truth-safe JSON-LD:

- `WebSite` for `/` when Site URL is configured.
- `BreadcrumbList` for indexable secondary public routes.

F11 does not publish `Organization` because verified organization/contact data is not present. It does not publish Product merchant/rich-result fields from the demo Dataset, including Offer, availability, priceCurrency, shipping, returns, AggregateRating, Review or seller.

JSON-LD is serialized with a dedicated safe serializer before insertion into the SSR head.

## Product SEO policy

Valid Product routes receive route-specific title, description, canonical, Open Graph and Twitter metadata. The copy explicitly describes the Dataset boundary and does not claim real inventory or commerce availability.

Product routes remain `noindex, follow` until authoritative product data replaces the demo Dataset. Invalid Product IDs continue to use TanStack Router `notFound()` and server-level 4xx protection adds `X-Robots-Tag: noindex, follow`.

## 404/invalid-product behavior

The custom server entry preserves framework status codes and adds `X-Robots-Tag: noindex, follow` to every final response with status 400 or greater. It does not rewrite 404s to the homepage.

Permanent SSR tests cover:

- `/product/invalid-id`
- `/product/`
- `/this-route-does-not-exist`

TanStack Router may normalize a malformed/trailing route with an internal 3xx before resolving it. F11 therefore validates the complete bounded same-origin redirect chain and requires the **final** response to be real HTTP 404 with `X-Robots-Tag: noindex, follow`, no canonical, and no hop to the homepage. Cross-origin redirects fail the suite immediately.

## SSR validation

F11 validation uses actual HTTP responses from the TanStack Start development server, not source grep alone. It checks initial HTML `<head>`, final response status/headers, JSON-LD, crawlable anchors, robots.txt and sitemap.xml before any client hydration.

Redirect handling is explicit rather than hidden: at most five same-origin redirects are followed and recorded; any cross-origin redirect fails the test. The clean `/products` URL is specifically required to return final 200 without a redirect, while default/unknown query normalization must remain on the catalog route and resolve to the expected final URL policy.

The configured suite runs with `VITE_SITE_URL=https://sole.test`, a reserved test origin used only as deterministic acceptance configuration. A separate QA server runs with a rejected localhost Site URL to prove fail-safe behavior. Source/audit coverage additionally locks the non-public IPv6 rejection added during supervisor review.

## Commands executed by permanent gates

- `bun run audit:f11`
- `bun run test:f11`
- `bun run qa:seo:f11`
- `bun run typecheck`
- `bun run lint`
- `bun run format:check`
- `bun run build`
- `bun run build:vps`
- `bun run audit:deploy`
- inherited F0/F1, F2, F3, F4/F5, F6, F7, F8, F9 and F10 gates
- `bun run verify:cumulative`

## Tests passed

The authoritative pass/fail evidence is the exact final-head Frontend CI run attached to PR #12. The supervisor report records its exact run ID, head SHA and gate results before merge. Earlier failing exact-head runs are retained as evidence rather than hidden; their discovered regressions and test-contract issues were corrected before final acceptance.

## Tests unavailable + exact reason

No test is intentionally skipped by F11. Conditional diagnostic steps may be skipped when their parent behavioral gate passes. If GitHub Actions refuses to start a job because of an external account Billing/Spending state, that platform annotation is recorded separately; the permanent gates remain unchanged and are not marked green by substitution.

## Regression audit

F11 does not change route generation, cart/account state, Product selection, motion/3D implementation, or deployment scripts. Functional catalog filtering/search/sort semantics are preserved; F11 only removes default search-state noise from generated catalog URLs. Regression protection is inherited through Frontend CI and cumulative verification for:

- Homepage
- Products + filter/search/sort
- Product Detail
- Wishlist
- Cart
- Checkout
- Account
- Brands/About
- Navigation/Search Dialog
- F10 3D activation/fallback and reduced motion
- SSR
- VPS deployment audit and Node-server build

Supervisor review found CI-only interaction drift in inherited browser automation. Corrections were intentionally scoped to the affected phase tests:

- F4/F5 mobile filter activation uses visible target activation without weakening catalog assertions.
- F7 post-dialog product/cart activation is scoped to its behavior test; functional assertions remain intact.
- F9 Wishlist clear still must receive keyboard focus, activate through a trusted CDP Enter event, render the empty state and persist an empty wishlist.
- F9 ProductCard synchronization still requires `aria-pressed=true`; the test now waits for the final hydrated store-derived state instead of reading a premature snapshot.
- The shared browser harness is restored exactly to the accepted F10 baseline.

## Known limitations

- Production SOLE domain is intentionally not provided in the mission; deployment must set `VITE_SITE_URL` to the verified public origin **before building the production/VPS artifact** before public pages can become indexable.
- Product/catalog commerce data is still a demo Dataset, so F11 deliberately keeps catalog/Product routes out of the search index and sitemap.
- No verified business identity/contact data exists for Organization schema.

These are truth boundaries, not incomplete F11 implementation.

## Truth-safety decisions

- No guessed domain.
- No fake Product Offer.
- No fake inventory/availability schema.
- No fake priceCurrency, shipping or return policy.
- No fake ratings/reviews.
- No fake seller, address, phone or social profile.
- No utility-route indexing.
- No canonical-to-home shortcut for unrelated routes.
- No cross-origin redirect is accepted by SSR SEO tests.

## Final acceptance checklist

- Exact required baseline ancestry enforced by audit.
- Route surface preserved and generated route tree untouched.
- Central Site URL validation implemented, including non-public IPv4/IPv6 rejection.
- Route-aware metadata and indexation policy implemented.
- Catalog facet/query policy deterministic and default URL noise stripped.
- Product demo boundary explicit.
- robots.txt and sitemap.xml implemented server-side.
- Minimal truth-safe structured data implemented.
- Final 404 semantics and noindex response header tested through bounded same-origin normalization.
- SSR head and crawlable links tested over HTTP.
- F11 gates registered in package, Frontend CI and cumulative evidence.
- Inherited browser regressions corrected locally without altering the accepted shared harness or weakening behavioral assertions.
- No prior quality gate removed or weakened.
- No direct main or Integration write performed by the phase implementation.
- PR #12 is only eligible for Ready for Review and supervisor merge after exact final-head quality evidence is green.
