// Rebuilds the table-front banner files the /banner page links to (the #table-banner section).
//   node design/event-banner/build-table.mjs            writes to public/banner/
//   node design/event-banner/build-table.mjs /some/dir  writes somewhere else
// Needs Playwright's Chromium and Ghostscript (gs). The words and layout are in table-banner.html.
//
// Built for Vistaprint's standard 2.5' x 6' vinyl banner (Specs & Templates, Nov 2026):
// bleed 74 x 32 in, trim 72 x 30, safety 70 x 28. Per version it writes:
//   valencia-table-banner-<v>-2.5x6ft.pdf   the print file: 74 x 32 in (1 in bleed), CMYK, fonts embedded
//   valencia-table-banner-<v>-2.5x6ft.png   the 72 x 30 trim at 96 dpi, for email or other programs
//   valencia-table-banner-<v>-preview.png   a small preview for the page
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Playwright is not a site dependency: use the machine's own (NODE_PATH="$(npm root -g)" if it is global).
const { chromium } = createRequire(import.meta.url)("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || resolve(here, "../../public/banner"));
mkdirSync(out, { recursive: true });
const page = (q) => `file://${here}/table-banner.html?h=30&${q}`;

const browser = await chromium.launch();
for (const v of ["care", "recovery", "logo"]) {
  const name = `valencia-table-banner-${v}`;

  const trim = await browser.newPage({ viewport: { width: 72 * 96, height: 30 * 96 } });
  await trim.goto(page(`v=${v}`));
  await trim.waitForSelector("body[data-fit]");
  const fit = await trim.getAttribute("body", "data-fit");
  if (fit !== "ok") throw new Error(`${v}: the words do not fit (${fit})`);
  await trim.screenshot({ path: `${out}/${name}-2.5x6ft.png`, scale: "css", clip: { x: 0, y: 0, width: 72 * 96, height: 30 * 96 } });
  await trim.close();

  const small = await browser.newPage({ viewport: { width: 72 * 96, height: 30 * 96 }, deviceScaleFactor: 1200 / (72 * 96) });
  await small.goto(page(`v=${v}`));
  await small.waitForSelector("body[data-fit]");
  await small.screenshot({ path: `${out}/${name}-preview.png` });
  await small.close();

  const bleed = await browser.newPage();
  await bleed.goto(page(`v=${v}&bleed=1`));
  await bleed.waitForSelector("body[data-fit]");
  const rgb = `${out}/${name}-rgb.pdf`;
  await bleed.pdf({ path: rgb, printBackground: true, preferCSSPageSize: true });
  await bleed.close();
  execFileSync("gs", ["-q", "-o", `${out}/${name}-2.5x6ft.pdf`, "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
    "-sColorConversionStrategy=CMYK", "-dProcessColorModel=/DeviceCMYK", "-dPDFSETTINGS=/prepress",
    "-dDownsampleColorImages=false", "-dAutoFilterColorImages=false", "-dColorImageFilter=/DCTEncode",
    "-dEmbedAllFonts=true", rgb]);
  rmSync(rgb);
  console.log(`built ${name}`);
}
await browser.close();
