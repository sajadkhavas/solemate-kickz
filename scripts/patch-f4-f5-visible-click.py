from pathlib import Path

path = Path("scripts/test-f4-f5-catalog-product-card.mjs")
text = path.read_text()
old = '''async function click(client, selector) {
  const clicked = await evaluate(
    client,
    `(() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      target?.click(); return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Clickable target not found: ${selector}`);
  await sleep(120);
}'''
new = '''async function click(client, selector) {
  const clicked = await evaluate(
    client,
    `(() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})].find((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && style.pointerEvents !== 'none';
      });
      target?.scrollIntoView({ block: 'center', inline: 'center' });
      target?.click(); return Boolean(target);
    })()`,
  );
  if (!clicked) throw new Error(`Visible clickable target not found: ${selector}`);
  await sleep(120);
}'''
if old not in text:
    raise SystemExit("Legacy click helper not found")
path.write_text(text.replace(old, new, 1))
