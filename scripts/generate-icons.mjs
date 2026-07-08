// Renders the "SCB" brand mark (same mark as .brand-icon in the sidebar)
// into the PNG sizes needed for the web manifest + Next.js favicon/apple-icon
// conventions. Re-run with `node scripts/generate-icons.mjs` after changing
// the brand colors in app/globals.css.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const TINTE = "#1c1c21";
const PAPIER = "#faf9f5";
const AMTSBLAU = "#1e4fa3";

function iconSvg({ size, radius, monogramScale }) {
  const fontSize = Math.round(size * monogramScale);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${TINTE}" />
  <rect x="${size * 0.16}" y="${size * 0.685}" width="${size * 0.68}" height="${size * 0.016}" fill="${AMTSBLAU}" />
  <text
    x="50%" y="${size * 0.6}"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
    font-size="${fontSize}"
    letter-spacing="${size * 0.012}"
    fill="${PAPIER}"
  >SCB</text>
</svg>`;
}

async function render(svg, size, outFile) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outFile);
  console.log("wrote", outFile);
}

const root = process.cwd();
const iconsDir = path.join(root, "public", "icons");
await mkdir(iconsDir, { recursive: true });

// "any" purpose — gently rounded square, safe to show as-is
for (const size of [192, 512]) {
  const svg = iconSvg({ size, radius: size * 0.18, monogramScale: 0.34 });
  await render(svg, size, path.join(iconsDir, `icon-${size}.png`));
}

// Maskable — full-bleed background, monogram shrunk into the ~80% safe
// zone so Android's own shape mask never clips it. See:
// https://web.dev/articles/maskable-icon
for (const size of [192, 512]) {
  const svg = iconSvg({ size, radius: 0, monogramScale: 0.26 });
  await render(svg, size, path.join(iconsDir, `icon-maskable-${size}.png`));
}

// Next.js auto-detects app/icon.png and app/apple-icon.png and wires up
// the <link rel="icon">/<link rel="apple-touch-icon"> tags itself.
{
  const svg = iconSvg({ size: 256, radius: 256 * 0.18, monogramScale: 0.34 });
  await render(svg, 256, path.join(root, "app", "icon.png"));
}
{
  const svg = iconSvg({ size: 180, radius: 180 * 0.18, monogramScale: 0.34 });
  await render(svg, 180, path.join(root, "app", "apple-icon.png"));
}
