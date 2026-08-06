from pathlib import Path

path = Path("scripts/test-f4-f5-catalog-product-card.mjs")
text = path.read_text()

helper_anchor = '''async function clickText(client, selector, text) {
  const clicked = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((node) => node.textContent?.trim().includes(${JSON.stringify(text)}));
      target?.click(); return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Text target not found: ${text}`);
  await sleep(120);
}
'''
helper_replacement = helper_anchor + '''
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
if helper_anchor not in text:
    raise SystemExit("clickText helper anchor not found")
text = text.replace(helper_anchor, helper_replacement, 1)

first_block = '''    await navigate(client, `${baseUrl}/products`);
    await click(client, '[data-testid="quick-view-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="quick-view-dialog"]')`);'''
first_replacement = '''    await navigate(client, `${baseUrl}/products`);
    await waitForExpression(
      client,
      `[...document.querySelectorAll('[data-testid="quick-view-trigger"]')].some((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden';
      })`,
    );
    await activateVisible(client, '[data-testid="quick-view-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="quick-view-dialog"]')`);'''
if first_block not in text:
    raise SystemExit("Primary Quick View block not found")
text = text.replace(first_block, first_replacement, 1)

sold_block = '''    await navigate(client, `${baseUrl}/products?q=Dunk%20Low`);
    await waitForExpression(client, `document.querySelector('[data-testid="quick-view-trigger"]')`);
    await click(client, '[data-testid="quick-view-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="quick-view-dialog"]')`);'''
sold_replacement = '''    await navigate(client, `${baseUrl}/products?q=Dunk%20Low`);
    await waitForExpression(
      client,
      `[...document.querySelectorAll('[data-testid="quick-view-trigger"]')].some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })`,
    );
    await activateVisible(client, '[data-testid="quick-view-trigger"]');
    await waitForExpression(client, `document.querySelector('[data-testid="quick-view-dialog"]')`);'''
if sold_block not in text:
    raise SystemExit("Sold-out Quick View block not found")
text = text.replace(sold_block, sold_replacement, 1)

path.write_text(text)
