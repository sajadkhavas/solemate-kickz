from pathlib import Path

path = Path("scripts/visual-qa-f4-f5-catalog-product-card.mjs")
text = path.read_text()

old = '''  if (setup) await setup();
  await sleep(250);
  const metrics = await inspect(client);'''
new = '''  if (setup) await setup();
  await waitForExpression(client, `document.fonts.status === 'loaded'`);
  await waitForExpression(
    client,
    `[...document.querySelectorAll('[data-testid="product-card"] img')].every((image) => image.complete)`,
  );
  await sleep(650);
  const metrics = await inspect(client);'''
if old not in text:
    raise SystemExit("Capture stability anchor not found")
text = text.replace(old, new, 1)

old = '''  const { client } = browser;

  client.on("Runtime.exceptionThrown", (event) => {'''
new = '''  const { client } = browser;
  await client.send("Network.enable");
  await client.send("Network.setBlockedURLs", {
    urls: ["https://images.unsplash.com/*", "https://*.unsplash.com/*"],
  });

  client.on("Runtime.exceptionThrown", (event) => {'''
if old not in text:
    raise SystemExit("Network stability anchor not found")
text = text.replace(old, new, 1)

old = '''  console.log(JSON.stringify(report.summary));
  if (!report.pass) process.exitCode = 1;'''
new = '''  console.log(JSON.stringify(report.summary));
  if (criticalFindings.length) console.error(JSON.stringify(criticalFindings, null, 2));
  if (!report.pass) process.exitCode = 1;'''
if old not in text:
    raise SystemExit("Report diagnostics anchor not found")
text = text.replace(old, new, 1)

path.write_text(text)
