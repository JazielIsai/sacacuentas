/**
 * Acceso a los datos de gasolina en tiempo de build (Astro genera las páginas
 * estáticas con lo que haya en data/gasolina/). Solo se usa en el servidor.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { agruparPor, resumir, type HistorialDia, type Resumen } from '@/lib/gasolina/agregados';
import type { Estacion, Municipio, Snapshot } from '@/lib/gasolina/tipos';
import { ESTADOS, ESTADO_POR_CVE, type Estado } from './estados';

const DIR = join(process.cwd(), 'data/gasolina');

let cache: Snapshot | null = null;
export function snapshot(): Snapshot {
  if (!cache) {
    const ruta = join(DIR, 'estaciones.json');
    if (!existsSync(ruta)) throw new Error('Falta data/gasolina/estaciones.json. Corre: npm run gasolina:actualizar');
    cache = JSON.parse(readFileSync(ruta, 'utf8')) as Snapshot;
  }
  return cache;
}

export interface ZonaEstado {
  estado: Estado;
  estaciones: Estacion[];
  resumen: Resumen;
  municipios: ZonaMunicipio[];
}

export interface ZonaMunicipio {
  municipio: Municipio;
  estado: Estado;
  estaciones: Estacion[];
  resumen: Resumen;
}

let zonas: ZonaEstado[] | null = null;
export function zonasPorEstado(): ZonaEstado[] {
  if (zonas) return zonas;
  const s = snapshot();
  const porMun = agruparPor(s.estaciones, (e) => e.mun);
  const porEnt = agruparPor(s.estaciones, (e) => e.mun?.slice(0, 2) ?? null);
  zonas = ESTADOS.filter((e) => porEnt.has(e.cve)).map((estado) => {
    const municipios: ZonaMunicipio[] = Object.values(s.municipios)
      .filter((m) => m.cveEnt === estado.cve && porMun.has(m.cvegeo))
      .map((m) => ({ municipio: m, estado, estaciones: porMun.get(m.cvegeo)!, resumen: resumir(porMun.get(m.cvegeo)!) }))
      .sort((a, b) => a.municipio.nombre.localeCompare(b.municipio.nombre, 'es'));
    const estaciones = porEnt.get(estado.cve)!;
    return { estado, estaciones, resumen: resumir(estaciones), municipios };
  });
  return zonas;
}

export function resumenNacional(): Resumen {
  return resumir(snapshot().estaciones);
}

export function estadoDe(cvegeo: string): Estado {
  return ESTADO_POR_CVE[cvegeo.slice(0, 2)];
}

/** Fecha legible de la última actualización, p. ej. "20 de noviembre de 2026". */
export function fechaLegible(): string {
  return new Date(`${snapshot().fecha}T12:00:00Z`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

let historialCache: HistorialDia[] | null = null;
/** Días del histórico, del más antiguo al más reciente. */
export function historial(dias = 90): HistorialDia[] {
  if (!historialCache) {
    const dir = join(DIR, 'historial');
    historialCache = existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
          .sort()
          .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as HistorialDia)
      : [];
  }
  return historialCache.slice(-dias);
}
