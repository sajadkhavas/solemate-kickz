from pathlib import Path

path = Path("scripts/visual-qa-f4-f5-catalog-product-card.mjs")
text = path.read_text()

click_anchor = '''async function click(client, selector) {
  const clicked = await evaluate(
    client,
    `(() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      target?.click(); return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Target not found: ${selector}`);
  await sleep(120);
}
'''
activate_helper = click_anchor + '''
async function activateVisible(client, selector) {
  const activated = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})].find((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && style.pointerEvents !== 'none';
      });
      if (!(target instanceof HTMLElement)) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.focus({ preventScroll: true });
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
      }));
      return true;
    })()`,
  );
  if (!activated) throw new Error(`Visible activation target not found: ${selector}`);
  await sleep(150);
}
'''
if click_anchor not in text:
    raise SystemExit("Visual click helper not found")
text = text.replace(click_anchor, activate_helper, 1)

old = '''    await captureState(client, baseUrl, "quick-view-open", "/products", 1280, 800, async () => {
      await click(client, '[data-testid="quick-view-trigger"]');
      await waitForExpression(
        client,
        `document.querySelector('[data-testid="quick-view-dialog"]')`,
      );
    });'''
new = '''    await captureState(client, baseUrl, "quick-view-open", "/products", 1280, 800, async () => {
      await waitForExpression(
        client,
        `[...document.querySelectorAll('[data-testid="quick-view-trigger"]')].some((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })`,
      );
      await activateVisible(client, '[data-testid="quick-view-trigger"]');
      await waitForExpression(
        client,
        `document.querySelector('[data-testid="quick-view-dialog"]')`,
      );
    });'''
if old not in text:
    raise SystemExit("Visual Quick View setup block not found")
path.write_text(text.replace(old, new, 1))
