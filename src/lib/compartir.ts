export interface CampoEnlace {
  valor: string;
  poner: (v: string) => void;
  /** 'numero', 'fecha', 'si' (casilla) o la lista de valores permitidos. */
  tipo: 'numero' | 'fecha' | 'si' | readonly string[];
}

/** Lo que viene en un enlace es ajeno: solo se acepta si tiene la forma esperada. */
export function esValido(v: string, tipo: CampoEnlace['tipo']): boolean {
  if (typeof tipo !== 'string') return tipo.includes(v);
  if (tipo === 'numero') return v.length <= 15 && /^[\d.,$\s]*$/.test(v);
  if (tipo === 'fecha') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }
  return v === '1' || v === '0';
}

export function leerFragmento(hash: string, campos: Record<string, Pick<CampoEnlace, 'tipo'>>): Record<string, string> {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const datos: Record<string, string> = {};
  for (const [k, c] of Object.entries(campos)) {
    const v = p.get(k);
    if (v !== null && esValido(v, c.tipo)) datos[k] = v;
  }
  return datos;
}

/** `campos` null = enlace sin datos personales. */
export function armarEnlace(base: string, campos: Record<string, Pick<CampoEnlace, 'valor'>> | null): string {
  if (!campos) return base;
  return `${base}#${new URLSearchParams(Object.entries(campos).map(([k, c]) => [k, c.valor]))}`;
}

export function armarMensaje(nombre: string, resultado: string | null, enlace: string): string {
  return resultado ? `${resultado}\n\nMira el cálculo paso a paso: ${enlace}` : `${nombre} gratis y explicada paso a paso: ${enlace}`;
}
