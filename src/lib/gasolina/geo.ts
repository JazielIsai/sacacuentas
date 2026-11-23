import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

/** Distancia en km entre dos puntos (fórmula de haversine). */
export function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Convierte un nombre en slug para URL: "San Pedro Garza García" → "san-pedro-garza-garcia". */
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface PropsMunicipio {
  cvegeo: string;
  cve_ent: string;
  cve_mun: string;
  nomgeo: string;
}

type FeatureMun = Feature<Polygon | MultiPolygon, PropsMunicipio>;

interface Indexado {
  f: FeatureMun;
  bbox: [number, number, number, number];
}

function bboxDe(f: FeatureMun): [number, number, number, number] {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys)
    for (const anillo of poly)
      for (const [x, y] of anillo) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
  return [minX, minY, maxX, maxY];
}

/**
 * Índice para ubicar puntos en municipios. Filtra primero por caja envolvente y
 * luego hace point-in-polygon. Si el punto no cae en ningún polígono (p. ej. una
 * estación en la costa que queda fuera por la simplificación), usa el municipio
 * cuya caja contiene el punto y está más cerca de su centro, dentro de una tolerancia.
 */
export function crearIndiceMunicipios(fc: FeatureCollection<Polygon | MultiPolygon, PropsMunicipio>) {
  const items: Indexado[] = fc.features.map((f) => ({ f: f as FeatureMun, bbox: bboxDe(f as FeatureMun) }));
  const TOLERANCIA = 0.02; // ~2 km

  return function ubicar(lat: number, lng: number): PropsMunicipio | null {
    const candidatos = items.filter(({ bbox: [a, b, c, d] }) => lng >= a - TOLERANCIA && lng <= c + TOLERANCIA && lat >= b - TOLERANCIA && lat <= d + TOLERANCIA);
    for (const { f, bbox: [a, b, c, d] } of candidatos) {
      if (lng < a || lng > c || lat < b || lat > d) continue;
      if (booleanPointInPolygon([lng, lat], f)) return f.properties;
    }
    // Respaldo: el punto quedó en un hueco por la simplificación; probamos desplazamientos pequeños.
    for (const delta of [0.002, 0.005, 0.01, 0.02]) {
      for (const [dx, dy] of [[delta, 0], [-delta, 0], [0, delta], [0, -delta], [delta, delta], [-delta, -delta], [delta, -delta], [-delta, delta]]) {
        for (const { f } of candidatos) {
          if (booleanPointInPolygon([lng + dx, lat + dy], f)) return f.properties;
        }
      }
    }
    return null;
  };
}
