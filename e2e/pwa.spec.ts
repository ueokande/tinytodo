import { expect, test } from "@playwright/test";

test("PWA manifest, icons, and service worker stay within the deployment path", async ({
  page,
  request,
}) => {
  await page.goto("./");
  const base = new URL("./", page.url());
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  if (!manifestHref) throw new Error("Manifest link missing");
  const manifestUrl = new URL(manifestHref, page.url());
  expect(manifestUrl.pathname).toBe(`${base.pathname}manifest.webmanifest`);
  const response = await request.get(manifestUrl.href);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(new URL(manifest.start_url, manifestUrl).href).toBe(base.href);
  expect(new URL(manifest.scope, manifestUrl).href).toBe(base.href);
  for (const icon of manifest.icons) {
    const url = new URL(icon.src, manifestUrl);
    expect(url.pathname.startsWith(base.pathname)).toBe(true);
    const iconResponse = await request.get(url.href);
    expect(iconResponse.ok()).toBe(true);
    expect(iconResponse.headers()["content-type"]).toContain("image/png");
  }
  const scope = await page.evaluate(
    async () => (await navigator.serviceWorker.ready).scope,
  );
  expect(scope).toBe(base.href);
});
