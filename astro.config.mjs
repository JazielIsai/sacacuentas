// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE_URL = process.env.SITE_URL ?? 'https://sacacuentas.mx';

// Sitio 100% estático: `npm run build` genera dist/ listo para subir a Hostinger
// (o servir con Nginx). Los datos de gasolina se regeneran a diario con GitHub Actions.
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'never',
  integrations: [
    preact(),
    mdx(),
    sitemap({
      filter: (page) => !page.endsWith('.json'),
      i18n: { defaultLocale: 'es-MX', locales: { 'es-MX': 'es-MX' } },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
