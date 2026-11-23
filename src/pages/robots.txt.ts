import type { APIRoute } from 'astro';
import { SITIO } from '@/data/sitio';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  // Con noindex NO se bloquea el rastreo: Google tiene que poder leer la etiqueta.
  const lineaSitemap = SITIO.indexable ? `\nSitemap: ${sitemap}\n` : '';
  return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\n${lineaSitemap}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
