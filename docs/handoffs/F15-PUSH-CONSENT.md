# SOLE F15 — Push Frontend & Consent Contract

## Lineage

- Accepted baseline: `integration/sole-frontend-v2@7cca0787e932c0417454aafa0ab186c2ba676001`
- Phase branch: `phase/sole-f15-push-consent`
- Target: `integration/sole-frontend-v2`

## Delivered

- Header-owned responsive Notification Center with backend-owned unread count.
- Real loading, empty, unauthorized, unavailable and malformed-response states; no sample notifications.
- Categories and independent preferences for order updates, price drops, promotions, system, email, SMS and marketing.
- Two-step browser permission flow; no permission request on page load.
- VAPID-driven subscribe contract with rollback if backend registration fails.
- Credentialed, CSRF-protected preference, mark-read, subscribe and unsubscribe mutations.
- Service-worker push rendering with bounded text and same-origin deep-link allowlisting.
- iPhone guidance: install to Home Screen before Push can be offered.

## Backend contract

- `GET /api/v1/notifications`
- `POST /api/v1/notifications/{id}/read`
- `PATCH /api/v1/notifications/preferences`
- `POST /api/v1/notifications/push-subscriptions`
- `DELETE /api/v1/notifications/push-subscriptions`

Backend must inject `meta[name="csrf-token"]` and `meta[name="sole-vapid-public-key"]`. The UI never treats browser permission as account-level marketing, email or SMS consent. Unread counts and preference values are never changed optimistically.

## Deferred to backend/server

- authentication and device ownership
- VAPID private key and delivery worker
- notification persistence and unread counts
- event-driven transactional sends
- consent history, suppression, quiet hours and frequency caps
- delivery/open/click analytics
- real HTTPS and installed-iOS device acceptance
