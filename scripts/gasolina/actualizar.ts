/**
 * Actualización diaria de precios de gasolina (lo corre GitHub Actions).
 *
 *  1. Descarga los XML de la CNE (estaciones + precios).
 *  2. Limpia y normaliza (src/lib/gasolina/normalizar.ts).
 *  3. Ubica cada estación en su municipio con los polígonos del INEGI.
 *  4. Valida que los datos sean razonables; si no, TERMINA CON ERROR y no se publica nada.
 *  5. Escribe data/gasolina/estaciones.json y data/gasolina/historial/AAAA-MM-DD.json
 *
 * Uso:  npm run gasolina:actualizar
 * Sin red (pruebas):  CNE_PLACES=ruta/places.xml CNE_PRICES=ruta/prices.xml npm run gasolina:actualizar
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { historialDelDia } from '../../src/lib/gasolina/agregados';
import { crearIndiceMunicipios, slugify, type PropsMunicipio } from '../../src/lib/gasolina/geo';
import { normalizar } from '../../src/lib/gasolina/normalizar';
import type { Estacion, Municipio, Snapshot } from '../../src/lib/gasolina/tipos';
import { ESTADO_POR_CVE } from '../../src/data/estados';

export const URL_ESTACIONES = 'https://publicacionexterna.azurewebsites.net/publicaciones/places';
export const URL_PRECIOS = 'https://publicacionexterna.azurewebsites.net/publicaciones/prices';

/** Umbrales mínimos: si la CNE publica algo roto o incompleto, preferimos no publicar. */
const MIN_ESTACIONES = 10_000;
const MIN_UBICADAS = 0.97; // fracción de estaciones que deben caer en algún municipio

async function descargar(url: string): Promise<string> {
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/xml,text/xml,*/*' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const texto = await r.text();
      if (!texto.includes('<places')) throw new Error('la respuesta no parece el XML esperado');
      return texto;
    } catch (e) {
      console.warn(`Intento ${intento} falló para ${url}: ${(e as Error).message}`);
      if (intento === 4) throw e;
      await new Promise((ok) => setTimeout(ok, 5000 * intento));
    }
  }
  throw new Error('inalcanzable');
}

function fechaCDMX(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const placesXml = process.env.CNE_PLACES ? readFileSync(process.env.CNE_PLACES, 'utf8') : await descargar(URL_ESTACIONES);
const pricesXml = process.env.CNE_PRICES ? readFileSync(process.env.CNE_PRICES, 'utf8') : await descargar(URL_PRECIOS);

const { estaciones: limpias, descartes } = normalizar(placesXml, pricesXml);
console.log(`Estaciones con precio válido: ${limpias.length}`, descartes);
if (limpias.length < MIN_ESTACIONES) {
  throw new Error(`Solo ${limpias.length} estaciones válidas (mínimo ${MIN_ESTACIONES}). No se publica.`);
}

const geo = JSON.parse(readFileSync('data/geo/municipios.json', 'utf8')) as FeatureCollection<Polygon | MultiPolygon, PropsMunicipio>;
const ubicar = crearIndiceMunicipios(geo);

const municipios: Record<string, Municipio> = {};
const estaciones: Estacion[] = limpias.map((e) => {
  const m = ubicar(e.lat, e.lng);
  if (m && !municipios[m.cvegeo]) {
    municipios[m.cvegeo] = { cvegeo: m.cvegeo, cveEnt: m.cve_ent, nombre: m.nomgeo, slug: slugify(m.nomgeo) };
  }
  return { ...e, mun: m?.cvegeo ?? null };
});

// Slugs únicos dentro de cada estado (por si dos municipios se llamaran igual).
const vistos = new Map<string, string>();
for (const m of Object.values(municipios).sort((a, b) => a.cvegeo.localeCompare(b.cvegeo))) {
  const clave = `${m.cveEnt}/${m.slug}`;
  if (vistos.has(clave)) m.slug = `${m.slug}-${m.cvegeo.slice(2)}`;
  vistos.set(`${m.cveEnt}/${m.slug}`, m.cvegeo);
  if (!ESTADO_POR_CVE[m.cveEnt]) throw new Error(`Entidad desconocida: ${m.cveEnt}`);
}

const ubicadas = estaciones.filter((e) => e.mun).length;
console.log(`Ubicadas en municipio: ${ubicadas}/${estaciones.length} · municipios con estaciones: ${Object.keys(municipios).length}`);
if (ubicadas / estaciones.length < MIN_UBICADAS) {
  throw new Error(`Solo se ubicó ${((ubicadas / estaciones.length) * 100).toFixed(1)}% de las estaciones. Revisa data/geo/municipios.json.`);
}

const fecha = fechaCDMX();
const snapshot: Snapshot = {
  fecha,
  descargado: new Date().toISOString(),
  fuente: { estaciones: URL_ESTACIONES, precios: URL_PRECIOS },
  municipios,
  estaciones,
};

mkdirSync('data/gasolina/historial', { recursive: true });
writeFileSync('data/gasolina/estaciones.json', JSON.stringify(snapshot));
writeFileSync(`data/gasolina/historial/${fecha}.json`, JSON.stringify(historialDelDia(fecha, estaciones)));
console.log(`Listo: data/gasolina/estaciones.json y data/gasolina/historial/${fecha}.json`);
