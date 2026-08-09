from pathlib import Path

visual_path = Path("scripts/visual-qa-f6-product-detail.mjs")
visual = visual_path.read_text()
start = visual.index("async function ensureMainImageFallback(client) {")
end = visual.index("\nasync function inspect(client) {", start)
replacement = r'''async function ensureMainImageFallback(client) {
  const alreadyFallback = await evaluate(
    client,
    `Boolean(document.querySelector('[data-testid="product-main-image-fallback"]'))`,
  );
  if (alreadyFallback) return;

  const targetLabel = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll('[data-testid="product-thumbnail"]')].find(
        (element) => element.getAttribute('aria-selected') === 'false',
      );
      return target?.getAttribute('aria-label') ?? null;
    })()`,
  );
  if (!targetLabel) throw new Error("Hydration probe thumbnail was not found");

  const deadline = Date.now() + 5000;
  let hydrated = false;
  while (Date.now() < deadline) {
    await evaluate(
      client,
      `(() => {
        const target = [...document.querySelectorAll('[data-testid="product-thumbnail"]')].find(
          (element) => element.getAttribute('aria-label') === ${JSON.stringify(targetLabel)},
        );
        if (!(target instanceof HTMLElement)) return false;
        target.click();
        return true;
      })()`,
    );
    await sleep(120);
    hydrated = await evaluate(
      client,
      `(() => {
        const target = [...document.querySelectorAll('[data-testid="product-thumbnail"]')].find(
          (element) => element.getAttribute('aria-label') === ${JSON.stringify(targetLabel)},
        );
        return target?.getAttribute('aria-selected') === 'true';
      })()`,
    );
    if (hydrated) break;
  }
  if (!hydrated) throw new Error("Product gallery did not hydrate before fallback QA");

  await sleep(180);
  const naturalFallback = await evaluate(
    client,
    `Boolean(document.querySelector('[data-testid="product-main-image-fallback"]'))`,
  );
  if (!naturalFallback) {
    const triggered = await evaluate(
      client,
      `(() => {
        const image = document.querySelector('[data-testid="product-main-image"]');
        if (!(image instanceof HTMLImageElement)) return false;
        image.src = 'data:image/png;base64,@@@';
        return true;
      })()`,
    );
    if (!triggered) throw new Error("Hydrated main product image was not found");
  }

  await waitForExpression(
    client,
    `document.querySelector('[data-testid="product-main-image-fallback"]')`,
  );
}
'''
visual = visual[:start] + replacement + visual[end:]
visual_path.write_text(visual)

audit_path = Path("scripts/audit-f11-technical-seo.mjs")
audit = audit_path.read_text()
old = '''  f6Visual.includes("async function ensureMainImageFallback") &&
    f6Visual.includes("image.dispatchEvent(new Event('error'))") &&
    f6Visual.includes("await ensureMainImageFallback(client)") &&
    f6Visual.includes('product-main-image-fallback'),'''
new = '''  f6Visual.includes("async function ensureMainImageFallback") &&
    f6Visual.includes("aria-selected") &&
    f6Visual.includes("Product gallery did not hydrate before fallback QA") &&
    f6Visual.includes("data:image/png;base64,@@@") &&
    f6Visual.includes("await ensureMainImageFallback(client)") &&
    f6Visual.includes('product-main-image-fallback'),'''
if old not in audit:
    raise SystemExit("old F6 audit proof missing")
audit = audit.replace(old, new, 1)
audit_path.write_text(audit)
