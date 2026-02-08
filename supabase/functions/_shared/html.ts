export function escapeHtml(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function basePathForFunctions(url: URL): string {
  return url.pathname.startsWith("/functions/v1/") ? "/functions/v1" : "";
}

export function htmlPage(params: {
  title: string;
  body: string;
}): string {
  const { title, body } = params;
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root{
        --bg:#070B18;
        --card:#0E1633;
        --card2:#0B122A;
        --border:rgba(255,255,255,.10);
        --text:#F4F6FF;
        --muted:rgba(244,246,255,.70);
        --accent:#E4FF3B;
        --accentText:#070B18;
        --shadow: 0 20px 60px rgba(0,0,0,.55);
      }
      *{box-sizing:border-box}
      body{
        margin:0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        color:var(--text);
        background:
          radial-gradient(1000px 700px at 15% 20%, rgba(228,255,59,.10), transparent 60%),
          radial-gradient(900px 650px at 85% 10%, rgba(59,130,246,.14), transparent 55%),
          radial-gradient(900px 650px at 50% 95%, rgba(167,139,250,.10), transparent 55%),
          var(--bg);
      }
      a{color:inherit; text-decoration:none}
      .container{max-width:980px; margin:0 auto; padding:24px}
      .brand{display:flex; align-items:center; justify-content:center; gap:12px; margin-top:10px}
      .logo{
        width:44px; height:44px; border-radius:12px;
        background:var(--accent);
        display:grid; place-items:center;
        color:var(--accentText); font-weight:900; font-size:22px;
        box-shadow:0 0 24px rgba(228,255,59,.22);
      }
      .title{margin:12px 0 6px; text-align:center; font-size:36px; font-weight:950; letter-spacing:-.02em}
      .subtitle{margin:0 0 22px; text-align:center; color:var(--muted)}
      .card{
        background: linear-gradient(180deg, rgba(14,22,51,.90), rgba(11,18,42,.86));
        border:1px solid var(--border);
        border-radius:18px;
        box-shadow: var(--shadow);
        overflow:hidden;
      }
      .card-inner{padding:18px}
      .grid{display:grid; gap:12px}
      .row{display:flex; align-items:center; gap:14px}
      .avatar{
        width:56px; height:56px; border-radius:16px;
        border:1px solid var(--border);
        background: rgba(228,255,59,.08);
        overflow:hidden;
        flex:0 0 auto;
      }
      .avatar img{width:100%; height:100%; object-fit:cover; display:block}
      .name{font-weight:900; font-size:16px; line-height:1.2}
      .meta{color:var(--muted); font-size:13px; margin-top:3px}
      .pill{
        display:inline-flex; align-items:center; gap:8px;
        padding:8px 12px; border-radius:999px;
        background: rgba(255,255,255,.06);
        border:1px solid var(--border);
        color:var(--muted);
        font-weight:800; font-size:12px;
      }
      .cta{
        display:inline-flex; align-items:center; justify-content:center;
        padding:10px 14px;
        border-radius:14px;
        background: var(--accent);
        color: var(--accentText);
        font-weight:950;
        font-size:13px;
        border:0;
        white-space:nowrap;
      }
      .cta:active{transform:translateY(1px)}
      .divider{height:1px; background:var(--border)}
      .headerBar{
        display:flex; align-items:center; justify-content:space-between;
        gap:12px;
        padding:14px 18px;
        background:rgba(255,255,255,.03);
        border-bottom:1px solid var(--border);
      }
      .headerLeft{display:flex; flex-direction:column; gap:4px}
      .headerH{font-weight:950}
      .headerS{color:var(--muted); font-size:13px}
      @media (max-width:520px){
        .title{font-size:30px}
        .row{align-items:flex-start}
        .cta{padding:10px 12px}
      }
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

export function notFoundHtml(message: string): string {
  return htmlPage({
    title: "Introuvable",
    body: `
      <div class="container">
        <div class="brand">
          <div class="logo">A</div>
          <div style="font-weight:900; letter-spacing:.02em">ARCANE</div>
        </div>
        <h1 class="title">Introuvable</h1>
        <p class="subtitle">${escapeHtml(message)}</p>
        <div class="card">
          <div class="card-inner">
            <span class="pill">Lien invalide ou révoqué</span>
          </div>
        </div>
      </div>
    `,
  });
}

export function respondHtml(html: string, status = 200): Response {
  const res = new Response(html, { status });
  // Set explicitly via headers API (some gateways are picky about content-type propagation).
  res.headers.set("content-type", "text/html; charset=utf-8");
  res.headers.set("cache-control", "no-store");
  return res;
}
