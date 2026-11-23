import { DIAS_MES_LFT } from '../../data/ley';

/** Un paso del desglose que se muestra al usuario y que también se prueba. */
export interface Paso {
  etiqueta: string;
  /** Fórmula legible, p. ej. "15 días × $333.33" */
  formula?: string;
  valor: number;
  /** Cómo formatear `valor`. */
  tipo?: 'dinero' | 'dias' | 'numero' | 'porcentaje';
  /** Fundamento legal breve, p. ej. "Art. 87 LFT" */
  fundamento?: string;
  /** Marca los subtotales / totales para resaltarlos. */
  destacado?: boolean;
}

export interface Resultado {
  total: number;
  pasos: Paso[];
  avisos: string[];
}

/** Redondea a centavos (half-up, evitando errores de punto flotante). */
export function r2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const fmtMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const fmtNum = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 4 });

export function dinero(n: number): string {
  return fmtMXN.format(n);
}

export function numero(n: number): string {
  return fmtNum.format(n);
}

export function formatearPaso(p: Paso): string {
  switch (p.tipo) {
    case 'dias':
      return `${numero(p.valor)} días`;
    case 'numero':
      return numero(p.valor);
    case 'porcentaje':
      return `${numero(p.valor)}%`;
    default:
      return dinero(p.valor);
  }
}

// ---------- Fechas (todo en UTC para evitar líos de zona horaria) ----------

const MS_DIA = 86_400_000;

/** Convierte 'YYYY-MM-DD' a fecha UTC. Lanza error si es inválida. */
export function parseFecha(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Fecha inválida: ${iso}`);
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCMonth() !== +m[2] - 1) throw new Error(`Fecha inválida: ${iso}`);
  return d;
}

export function aISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Días naturales entre dos fechas, contando ambos extremos. */
export function diasInclusivos(desde: Date, hasta: Date): number {
  return Math.round((hasta.getTime() - desde.getTime()) / MS_DIA) + 1;
}

export function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

export function diasDelAnio(anio: number): number {
  return esBisiesto(anio) ? 366 : 365;
}

/** Suma años respetando el 29 de febrero (→ 28 de febrero en años no bisiestos). */
export function sumarAnios(d: Date, anios: number): Date {
  const anio = d.getUTCFullYear() + anios;
  const mes = d.getUTCMonth();
  let dia = d.getUTCDate();
  if (mes === 1 && dia === 29 && !esBisiesto(anio)) dia = 28;
  return new Date(Date.UTC(anio, mes, dia));
}

/**
 * Antigüedad entre ingreso y fecha de corte (la fecha de corte cuenta como día trabajado).
 * Devuelve años completos cumplidos, días desde el último aniversario y la
 * antigüedad en años con fracción.
 */
export function antiguedad(ingreso: Date, corte: Date) {
  if (corte < ingreso) throw new Error('La fecha final no puede ser anterior a la de ingreso');
  // El día siguiente al corte es el "aniversario" si se trabajó el año completo.
  const finExclusivo = new Date(corte.getTime() + MS_DIA);
  let completos = 0;
  while (sumarAnios(ingreso, completos + 1) <= finExclusivo) completos++;
  const ultimoAniversario = sumarAnios(ingreso, completos);
  const diasDesdeAniversario = Math.round((finExclusivo.getTime() - ultimoAniversario.getTime()) / MS_DIA);
  const fraccion = diasDesdeAniversario / 365;
  return {
    aniosCompletos: completos,
    diasDesdeAniversario,
    aniosConFraccion: completos + fraccion,
  };
}

// ---------- Salario ----------

export type Periodicidad = 'diario' | 'semanal' | 'quincenal' | 'mensual';

/** Art. 89 LFT: semanal ÷ 7, mensual ÷ 30. Quincenal ÷ 15. */
export function salarioDiario(monto: number, periodicidad: Periodicidad): number {
  switch (periodicidad) {
    case 'diario':
      return monto;
    case 'semanal':
      return monto / 7;
    case 'quincenal':
      return monto / 15;
    case 'mensual':
      return monto / DIAS_MES_LFT;
  }
}

export function validarPositivo(n: number, nombre: string): void {
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${nombre} debe ser mayor a cero`);
}
