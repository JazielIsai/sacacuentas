/**
 * Listado nacional compacto para "cerca de mí" (se descarga solo al pulsar el botón).
 * Formato: { fecha, e: [[id, lat, lng, nombre, regular, premium, diesel, cvegeo], ...] }
 * También sirve como API estática: https://sacacuentas.isai-dev.com/gasolina/estaciones.json
 */
import type { APIRoute } from 'astro';
import { snapshot } from '@/data/gasolina';

export const GET: APIRoute = () => {
  const s = snapshot();
  const e = s.estaciones.map((x) => [x.id, x.lat, x.lng, x.nombre, x.precios.regular ?? null, x.precios.premium ?? null, x.precios.diesel ?? null, x.mun]);
  return new Response(JSON.stringify({ fecha: s.fecha, fuente: 'Comisión Nacional de Energía (CNE)', e }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
