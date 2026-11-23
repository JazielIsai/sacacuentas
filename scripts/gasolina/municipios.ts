/**
 * Descarga (una sola vez, o cuando INEGI publique un nuevo corte) los polígonos
 * de municipios del Marco Geoestadístico del INEGI y los guarda simplificados en
 * data/geo/municipios.json. Se usan para asignar cada gasolinera a su municipio.
 *
 * Fuente: INEGI, Servicio Web del Catálogo Único de Claves Geoestadísticas
 *   https://gaia.inegi.org.mx/wscatgeo/v2/geo/mgem/{cve_ent}
 * Uso:  npm run gasolina:municipios
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = 'https://gaia.inegi.org.mx/wscatgeo/v2';
const SALIDA = 'data/geo/municipios.json';

async function json(url: string) {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (intento === 3) throw new Error(`No se pudo descargar ${url}: ${(e as Error).message}`);
      await new Promise((ok) => setTimeout(ok, 2000 * intento));
    }
  }
}

const estados = (await json(`${BASE}/mgee/`)).datos as { cve_ent: string; nomgeo: string }[];
if (estados.length !== 32) throw new Error(`Se esperaban 32 entidades y llegaron ${estados.length}`);

const features: unknown[] = [];
let fuente = '';
for (const e of estados) {
  const fc = await json(`${BASE}/geo/mgem/${e.cve_ent}`);
  fuente ||= fc.metadatos?.Fuente_informacion_vectorial ?? '';
  for (const f of fc.features) {
    const p = f.properties;
    features.push({
      type: 'Feature',
      properties: { cvegeo: p.cvegeo, cve_ent: p.cve_ent, cve_mun: p.cve_mun, nomgeo: p.nomgeo },
      geometry: f.geometry,
    });
  }
  process.stdout.write(`${e.cve_ent} ${e.nomgeo}: ${fc.features.length} municipios\n`);
}

const dir = mkdtempSync(join(tmpdir(), 'inegi-'));
const crudo = join(dir, 'municipios-crudo.json');
writeFileSync(crudo, JSON.stringify({ type: 'FeatureCollection', features }));

// Simplificación conservando topología: suficiente para saber en qué municipio cae un punto.
execFileSync('npx', ['mapshaper', crudo, '-simplify', '8%', 'keep-shapes', '-o', 'format=geojson', 'precision=0.00001', SALIDA], {
  stdio: 'inherit',
});

writeFileSync('data/geo/fuente.json', JSON.stringify({ fuente, url: `${BASE}/geo/mgem/{cve_ent}`, descargado: new Date().toISOString(), municipios: features.length }, null, 2) + '\n');
console.log(`\n${features.length} municipios → ${SALIDA} (${(statSync(SALIDA).size / 1e6).toFixed(1)} MB). ${fuente}`);
