// Rebuilds the table-front banner files the /banner page links to (the #table-banner section).
//   node design/event-banner/build-table.mjs            writes to public/banner/
//   node design/event-banner/build-table.mjs /some/dir  writes somewhere else
// Needs Playwright's Chromium and Ghostscript (gs). The words and layout are in table-banner.html.
//
// Two printers, checked Nov 2026:
// - Office Depot Custom Banners (item 790388), 6' x 2', same-day pickup if ordered by 2 pm.
//   The upload canvas is the exact 72 x 24 in, so that file has no bleed.
// - Vistaprint Vinyl Banners, 2.5' x 6': bleed 74 x 32 in, trim 72 x 30, safety 70 x 28.
// Per version it writes:
//   valencia-table-banner-<v>-6x2ft.pdf     Office Depot: 72 x 24 in, CMYK, fonts embedded
//   valencia-table-banner-<v>-2.5x6ft.pdf   Vistaprint: 74 x 32 in (1 in bleed), CMYK, fonts embedded
//   valencia-table-banner-<v>-6x2ft.png     the 72 x 24 banner at 96 dpi, for email or other programs
//   valencia-table-banner-<v>-preview.png   a small preview for the page (the 6' x 2')
// and Bruce's letter-size tabletop sheet: valencia-tabletop-sheet-letter.pdf and its preview.
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
const url = (q) => `file://${here}/table-banner.html?${q}`;

const browser = await chromium.launch();

async function open(q, w, h, scale = 1) {
  const p = await browser.newPage({ viewport: { width: Math.round(w * 96), height: Math.round(h * 96) }, deviceScaleFactor: scale });
  await p.goto(url(q));
  await p.waitForSelector("body[data-fit]");
  const fit = await p.getAttribute("body", "data-fit");
  if (fit !== "ok") throw new Error(`${q}: the words do not fit (${fit})`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(200);
  return p;
}

async function cmykPdf(q, w, h, file) {
  const p = await open(q, w, h);
  const rgb = `${out}/${file}.rgb.pdf`;
  await p.pdf({ path: rgb, printBackground: true, preferCSSPageSize: true });
  await p.close();
  execFileSync("gs", ["-q", "-o", `${out}/${file}`, "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
    "-sColorConversionStrategy=CMYK", "-dProcessColorModel=/DeviceCMYK", "-dPDFSETTINGS=/prepress",
    "-dDownsampleColorImages=false", "-dAutoFilterColorImages=false", "-dColorImageFilter=/DCTEncode",
    "-dEmbedAllFonts=true", rgb]);
  rmSync(rgb);
}

for (const v of ["strong", "care", "recovery", "logo"]) {
  const name = `valencia-table-banner-${v}`;
  await cmykPdf(`v=${v}&h=24`, 72, 24, `${name}-6x2ft.pdf`);
  await cmykPdf(`v=${v}&h=30&bleed=1`, 74, 32, `${name}-2.5x6ft.pdf`);
  let p = await open(`v=${v}&h=24`, 72, 24);
  await p.screenshot({ path: `${out}/${name}-6x2ft.png` });
  await p.close();
  p = await open(`v=${v}&h=24`, 72, 24, 1200 / (72 * 96));
  await p.screenshot({ path: `${out}/${name}-preview.png` });
  await p.close();
  console.log(`built ${name}`);
}

await cmykPdf("v=strong&w=8.5&h=11", 8.5, 11, "valencia-tabletop-sheet-letter.pdf");
const sheet = await open("v=strong&w=8.5&h=11", 8.5, 11, 800 / (8.5 * 96));
await sheet.screenshot({ path: `${out}/valencia-tabletop-sheet-letter-preview.png` });
await sheet.close();
console.log("built valencia-tabletop-sheet-letter");

await browser.close();
