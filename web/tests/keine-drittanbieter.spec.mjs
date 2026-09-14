import { expect, test } from "@playwright/test";
import { SEITEN } from "./seiten.mjs";

// WEB-F-007: Beim Seitenaufruf gehen alle Anfragen an die eigene Domain.
for (const url of SEITEN) {
  test(`keine Drittanbieter-Anfragen auf ${url}`, async ({ page, baseURL }) => {
    const fremd = [];
    page.on("request", (request) => {
      if (!request.url().startsWith(baseURL)) {
        fremd.push(request.url());
      }
    });
    await page.goto(url, { waitUntil: "networkidle" });
    expect(fremd).toEqual([]);
  });
}
