export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>بارگذاری صفحه انجام نشد — SOLE</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="color-scheme" content="dark" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body { font: 15px/1.8 system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #f5f5f0; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 32rem; width: 100%; text-align: center; padding: 2rem; border: 1px solid #2a2a2a; border-radius: 1rem; background: #111; }
      .brand { margin: 0 0 1rem; font-weight: 900; letter-spacing: .2em; color: #c8f135; }
      h1 { font-size: 1.35rem; margin: 0 0 0.75rem; }
      p { color: #b8b8b0; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      a { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0.55rem 1rem; border-radius: 999px; font: inherit; font-weight: 700; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #c8f135; color: #0a0a0a; }
      .secondary { background: transparent; color: #f5f5f0; border-color: #3a3a3a; }
      a:focus-visible { outline: 3px solid #f5f5f0; outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main class="card">
      <p class="brand" aria-hidden="true">SOLE</p>
      <h1>این صفحه بارگذاری نشد</h1>
      <p>یک خطای موقت در سمت برنامه رخ داده است. می‌توانید همین صفحه را دوباره باز کنید یا به صفحه اصلی برگردید.</p>
      <div class="actions">
        <a class="primary" href="">تلاش دوباره</a>
        <a class="secondary" href="/">بازگشت به خانه</a>
      </div>
    </main>
  </body>
</html>`;
}
