// Genera public/og.png (1200×630) para Open Graph. Uso: node scripts/generar-og.mjs
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#064e3b"/><stop offset="1" stop-color="#059669"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="80" y="90" width="96" height="96" rx="20" fill="#fff"/>
  <text x="128" y="160" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="700" fill="#059669" text-anchor="middle">$</text>
  <text x="80" y="330" font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="800" fill="#fff">SacaCuentas</text>
  <text x="80" y="410" font-family="Helvetica, Arial, sans-serif" font-size="40" fill="#d1fae5">Calculadoras de dinero para México,</text>
  <text x="80" y="462" font-family="Helvetica, Arial, sans-serif" font-size="40" fill="#d1fae5">explicadas paso a paso.</text>
  <text x="80" y="560" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#a7f3d0">Aguinaldo · Finiquito · Liquidación · Vacaciones · ISR · Tarjetas</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(new URL('../public/og.png', import.meta.url).pathname);
console.log('public/og.png generado');
