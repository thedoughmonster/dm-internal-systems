import { esc } from "./utils.ts";

export function htmlPage(params: URLSearchParams) {
  const checkinToken = params.get("checkin") ?? "";
  const hasCheckin = Boolean(checkinToken);

  const ogImage = "https://doh.monster/og/curbside.png";
  const canonicalUrl = `https://doh.monster/?checkin=${encodeURIComponent(checkinToken)}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dough Monster Curbside Check-In</title>

  <meta property="og:title" content="Dough Monster Curbside Check-In" />
  <meta property="og:description" content="Tap to let us know you’ve arrived. We’ll bring your order right out." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${esc(canonicalUrl)}" />
  <meta property="og:image" content="${ogImage}" />

  <meta name="twitter:card" content="summary_large_image" />

  <link rel="stylesheet" href="/functions/v1/toast_checkin/styles.css" />
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Curbside Check-In</h1>
      <p>Tap when you arrive and we’ll bring your order right out.</p>
      <button id="btn" ${hasCheckin ? "" : "disabled"}>I’m here</button>
      <div id="ok" class="ok">You’re checked in. We’ll be right out.</div>
    </div>
  </div>

<script>
const btn = document.getElementById("btn");
const ok = document.getElementById("ok");

btn?.addEventListener("click", async () => {
  btn.disabled = true;
  btn.textContent = "Checking in…";
  try {
    const resp = await fetch(window.location.href, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent: "checkin", userAgent: navigator.userAgent })
    });
    if (!resp.ok) throw new Error();
    ok.style.display = "block";
    btn.textContent = "Checked in";
  } catch {
    btn.disabled = false;
    btn.textContent = "I’m here";
    alert("Could not check in. Please try again.");
  }
});
</script>
</body>
</html>`;
}
