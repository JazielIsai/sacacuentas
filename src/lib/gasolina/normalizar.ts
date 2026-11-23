/**
 * Convierte los XML de la CNE (places + prices) en estaciones limpias.
 * Reglas de limpieza (documentadas en el README):
 *  - Se descartan coordenadas fuera de México (incluye 0,0).
 *  - Se descartan precios fuera de [PRECIO_MIN, PRECIO_MAX] (p. ej. $0.01 por error de captura).
 *  - Se descartan precios atípicos: menores a 70% o mayores a 140% de la mediana nacional de ese combustible.
 *  - Una estación puede venir repetida en prices con combustibles separados: se combinan.
 *  - Estaciones sin ningún precio válido no se incluyen.
 */
import { XMLParser } from 'fast-xml-parser';
import { COMBUSTIBLES, type Combustible, type Estacion, type Precios } from './tipos';

export const PRECIO_MIN = 15;
export const PRECIO_MAX = 40;
/** Rango aceptado respecto a la mediana nacional de cada combustible. */
export const FACTOR_MIN_MEDIANA = 0.7;
export const FACTOR_MAX_MEDIANA = 1.4;

export function mediana(v: number[]): number {
  const o = [...v].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

/** Caja aproximada que contiene a México. */
export const BBOX_MEXICO = { minLng: -118.5, maxLng: -86.5, minLat: 14.3, maxLat: 32.8 };

export function dentroDeMexico(lat: number, lng: number): boolean {
  return lng >= BBOX_MEXICO.minLng && lng <= BBOX_MEXICO.maxLng && lat >= BBOX_MEXICO.minLat && lat <= BBOX_MEXICO.maxLat;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  parseAttributeValue: false,
  parseTagValue: false,
  isArray: (name) => name === 'place' || name === 'gas_price',
});

interface PlaceXML {
  '@place_id': string;
  name?: string;
  cre_id?: string;
  location?: { x?: string; y?: string };
}
interface PriceXML {
  '@place_id': string;
  gas_price?: { '@type': string; '#text': string }[];
}

export interface ResultadoNormalizacion {
  estaciones: Omit<Estacion, 'mun'>[];
  descartes: { coordenadas: number; sinPrecio: number; preciosFueraDeRango: number; preciosAtipicos: number };
}

export function normalizar(placesXml: string, pricesXml: string): ResultadoNormalizacion {
  const places: PlaceXML[] = parser.parse(placesXml.replace(/^﻿/, ''))?.places?.place ?? [];
  const prices: PriceXML[] = parser.parse(pricesXml.replace(/^﻿/, ''))?.places?.place ?? [];

  let preciosFueraDeRango = 0;
  const preciosPorId = new Map<string, Precios>();
  for (const p of prices) {
    const acumulado = preciosPorId.get(p['@place_id']) ?? {};
    for (const g of p.gas_price ?? []) {
      const tipo = g['@type'] as Combustible;
      if (!COMBUSTIBLES.includes(tipo)) continue;
      const valor = Number(g['#text']);
      if (!Number.isFinite(valor) || valor < PRECIO_MIN || valor > PRECIO_MAX) {
        preciosFueraDeRango++;
        continue;
      }
      acumulado[tipo] = valor;
    }
    preciosPorId.set(p['@place_id'], acumulado);
  }

  // Segunda pasada: quitar atípicos respecto a la mediana nacional de cada combustible.
  let preciosAtipicos = 0;
  for (const c of COMBUSTIBLES) {
    const valores = [...preciosPorId.values()].map((p) => p[c]).filter((x): x is number => x !== undefined);
    if (valores.length < 20) continue; // muy pocos datos para juzgar
    const med = mediana(valores);
    for (const p of preciosPorId.values()) {
      const v = p[c];
      if (v !== undefined && (v < med * FACTOR_MIN_MEDIANA || v > med * FACTOR_MAX_MEDIANA)) {
        delete p[c];
        preciosAtipicos++;
      }
    }
  }

  let coordenadas = 0;
  let sinPrecio = 0;
  const estaciones: Omit<Estacion, 'mun'>[] = [];
  for (const p of places) {
    const lng = Number(p.location?.x);
    const lat = Number(p.location?.y);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !dentroDeMexico(lat, lng)) {
      coordenadas++;
      continue;
    }
    const precios = preciosPorId.get(p['@place_id']);
    if (!precios || Object.keys(precios).length === 0) {
      sinPrecio++;
      continue;
    }
    estaciones.push({
      id: Number(p['@place_id']),
      nombre: (p.name ?? '').trim().replace(/\s+/g, ' '),
      permiso: (p.cre_id ?? '').trim(),
      lat: Math.round(lat * 1e5) / 1e5,
      lng: Math.round(lng * 1e5) / 1e5,
      precios,
    });
  }
  estaciones.sort((a, b) => a.id - b.id);
  return { estaciones, descartes: { coordenadas, sinPrecio, preciosFueraDeRango, preciosAtipicos } };
}
