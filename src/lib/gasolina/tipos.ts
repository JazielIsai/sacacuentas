export type Combustible = 'regular' | 'premium' | 'diesel';
export const COMBUSTIBLES: Combustible[] = ['regular', 'premium', 'diesel'];
export const NOMBRE_COMBUSTIBLE: Record<Combustible, string> = {
  regular: 'Regular (Magna)',
  premium: 'Premium',
  diesel: 'Diésel',
};

export type Precios = Partial<Record<Combustible, number>>;

/** Estación normalizada, lista para guardar en data/gasolina/estaciones.json */
export interface Estacion {
  /** place_id de la CNE */
  id: number;
  nombre: string;
  /** Número de permiso (cre_id) */
  permiso: string;
  lat: number;
  lng: number;
  /** cvegeo del municipio (5 dígitos: entidad + municipio) o null si no se pudo ubicar */
  mun: string | null;
  precios: Precios;
}

export interface Municipio {
  cvegeo: string;
  cveEnt: string;
  nombre: string;
  slug: string;
}

export interface Snapshot {
  /** Fecha (YYYY-MM-DD, hora de CDMX) de la descarga */
  fecha: string;
  /** ISO timestamp de la descarga */
  descargado: string;
  fuente: { estaciones: string; precios: string };
  municipios: Record<string, Municipio>;
  estaciones: Estacion[];
}
