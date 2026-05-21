const baseUrl = (process.env.TOON2FILM_SMOKE_BASE_URL || "http://127.0.0.1:3610/toon2film").replace(/\/$/, "");

const routes = [
  "",
  "/projects/new",
  "/source/upload",
  "/prompt-studio",
  "/video-studio",
  "/audio-studio",
  "/export",
  "/settings",
  "/projects/muyang-trailer"
];

const htmlMarkers = [
  "toon2film-critical-style",
  "studio-shell",
  "Toon2Film",
  "_next/static"
];

async function fetchText(url) {
  const response = await fetch(url, { redirect: "manual" });
  const text = await response.text().catch(() => "");
  return { response, text };
}

async function checkRoute(route) {
  const url = `${baseUrl}${route}`;
  const { response, text } = await fetchText(url);
  const missingMarkers = htmlMarkers.filter((marker) => !text.includes(marker));
  const cssHref = text.match(/href="([^"]+\.css[^"]*)"/)?.[1];
  let cssOk = false;

  if (cssHref) {
    const cssUrl = cssHref.startsWith("http") ? cssHref : new URL(cssHref, url).toString();
    const cssResponse = await fetch(cssUrl, { redirect: "manual" });
    const cssText = await cssResponse.text().catch(() => "");
    cssOk = cssResponse.ok && cssText.includes(".studio-shell");
  }

  return {
    route: route || "/",
    status: response.status,
    ok: response.ok && missingMarkers.length === 0 && cssOk,
    bytes: text.length,
    cssOk,
    missingMarkers
  };
}

const results = [];
for (const route of routes) {
  results.push(await checkRoute(route));
}

for (const result of results) {
  const markerText = result.missingMarkers.length ? ` missing=${result.missingMarkers.join(",")}` : "";
  console.log(
    `${result.ok ? "OK" : "FAIL"} ${result.route} status=${result.status} bytes=${result.bytes} css=${result.cssOk}${markerText}`
  );
}

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(`Toon2Film smoke failed: ${failed.length}/${results.length} route(s) unhealthy`);
  process.exit(1);
}
