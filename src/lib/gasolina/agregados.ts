import { COMBUSTIBLES, type Combustible, type Estacion } from './tipos';

export interface Estadistica {
  promedio: number;
  min: number;
  max: number;
  n: number;
}

export type Resumen = Partial<Record<Combustible, Estadistica>>;

const r2 = (n: number) => Math.round(n * 100) / 100;

export function resumir(estaciones: Estacion[]): Resumen {
  const res: Resumen = {};
  for (const c of COMBUSTIBLES) {
    const v = estaciones.map((e) => e.precios[c]).filter((x): x is number => x !== undefined);
    if (!v.length) continue;
    res[c] = { promedio: r2(v.reduce((a, b) => a + b, 0) / v.length), min: Math.min(...v), max: Math.max(...v), n: v.length };
  }
  return res;
}

/** Las N estaciones más baratas para un combustible (empates: por nombre). */
export function masBaratas(estaciones: Estacion[], c: Combustible, n = 10): Estacion[] {
  return estaciones
    .filter((e) => e.precios[c] !== undefined)
    .sort((a, b) => a.precios[c]! - b.precios[c]! || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, n);
}

export function agruparPor<T>(items: T[], clave: (t: T) => string | null): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = clave(it);
    if (k === null) continue;
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

/** Resumen diario compacto para el histórico (data/gasolina/historial/AAAA-MM-DD.json). */
export interface HistorialDia {
  fecha: string;
  nacional: Partial<Record<Combustible, number>>;
  estados: Record<string, Partial<Record<Combustible, number>>>;
  municipios: Record<string, Partial<Record<Combustible, number>>>;
}

function soloPromedios(r: Resumen): Partial<Record<Combustible, number>> {
  const o: Partial<Record<Combustible, number>> = {};
  for (const c of COMBUSTIBLES) if (r[c]) o[c] = r[c]!.promedio;
  return o;
}

export function historialDelDia(fecha: string, estaciones: Estacion[]): HistorialDia {
  const conMun = estaciones.filter((e) => e.mun);
  const estados: HistorialDia['estados'] = {};
  for (const [k, v] of agruparPor(conMun, (e) => e.mun!.slice(0, 2))) estados[k] = soloPromedios(resumir(v));
  const municipios: HistorialDia['municipios'] = {};
  for (const [k, v] of agruparPor(conMun, (e) => e.mun)) municipios[k] = soloPromedios(resumir(v));
  return { fecha, nacional: soloPromedios(resumir(estaciones)), estados, municipios };
}

/** Forma compacta para islas (mapa y tabla): menos bytes en el HTML. */
export function aPunto(e: Estacion) {
  return { id: e.id, lat: e.lat, lng: e.lng, nombre: e.nombre, r: e.precios.regular, p: e.precios.premium, d: e.precios.diesel };
}
