import type { OpcionInversion, Tramo } from '../../data/inversiones';
import { dinero, numero, r2, type Paso } from './comunes';

export interface ContextoInversion {
  /** % anual sobre el capital. */
  retencionISRAnual: number;
  /** % anual. */
  inflacionAnual: number;
  udi: number;
  ipabUDIs: number;
  prosofipoUDIs: number;
  exencionSofipoUMAsAnuales: number;
  /** UMA anual del año vigente, para la exención de SOFIPOs. */
  umaAnual: number;
}

export interface EntradaInversion {
  monto: number;
  aportacionMensual?: number;
  meses: number;
}

export interface ResultadoOpcion {
  opcion: OpcionInversion;
  dias: number;
  aportado: number;
  saldoFinal: number;
  interesBruto: number;
  isrRetenido: number;
  gananciaNeta: number;
  /** Rendimiento neto anualizado sobre el saldo promedio, en %. */
  rendimientoNetoAnual: number;
  /** Rendimiento neto descontando inflación, en %. */
  rendimientoRealAnual: number;
  /** Tasa promedio ponderada que paga el monto inicial según los tramos, en %. */
  tasaInicial: number;
  coberturaPesos: number | null;
  excedeCobertura: boolean;
  diasSinInvertir: number;
  pasos: Paso[];
  avisos: string[];
}

const DIAS_MES = 30.4;

/** Interés de un día con tasas marginales por tramo. */
export function interesDiario(saldo: number, tramos: Tramo[], baseDias: number): number {
  let restante = saldo;
  let piso = 0;
  let interes = 0;
  for (const t of tramos) {
    if (restante <= 0) break;
    const ancho = t.hasta === null ? restante : Math.max(0, t.hasta - piso);
    const porcion = Math.min(restante, ancho);
    interes += (porcion * t.tasa) / 100 / baseDias;
    restante -= porcion;
    if (t.hasta !== null) piso = t.hasta;
  }
  return interes;
}

/** Tasa anual promedio ponderada que recibe un saldo dado los tramos, en %. */
export function tasaPonderada(saldo: number, tramos: Tramo[]): number {
  if (saldo <= 0) return tramos[0]?.tasa ?? 0;
  return (interesDiario(saldo, tramos, 1) / saldo) * 100;
}

export function describirTramos(tramos: Tramo[]): string {
  if (tramos.length === 1) return `${numero(tramos[0].tasa)}% sobre todo el saldo`;
  let piso = 0;
  return tramos
    .map((t) => {
      const txt = t.hasta === null ? `${numero(t.tasa)}% arriba de ${dinero(piso)}` : `${numero(t.tasa)}% ${piso === 0 ? 'hasta' : `de ${dinero(piso)} a`} ${dinero(t.hasta)}`;
      if (t.hasta !== null) piso = t.hasta;
      return txt;
    })
    .join(' · ');
}

function cobertura(op: OpcionInversion, ctx: ContextoInversion): number | null {
  if (op.proteccion === 'ipab') return r2(ctx.ipabUDIs * ctx.udi);
  if (op.proteccion === 'prosofipo') return r2(ctx.prosofipoUDIs * ctx.udi);
  return null;
}

export function simularOpcion(op: OpcionInversion, e: EntradaInversion, ctx: ContextoInversion): ResultadoOpcion {
  const aport = e.aportacionMensual ?? 0;
  if (!Number.isFinite(e.monto) || e.monto < 0) throw new Error('El monto no puede ser negativo');
  if (!Number.isFinite(aport) || aport < 0) throw new Error('La aportación no puede ser negativa');
  if (e.monto === 0 && aport === 0) throw new Error('Escribe un monto inicial o una aportación mensual');
  if (!Number.isFinite(e.meses) || e.meses < 1 || e.meses > 600) throw new Error('El plazo debe estar entre 1 y 600 meses');

  // Hacia arriba para que N meses incluyan N aportaciones (3 × 30.4 = 91.2 → 92 días).
  const dias = Math.ceil(e.meses * DIAS_MES - 1e-9);
  const tasaRet = ctx.retencionISRAnual / 100;
  const topeExentoSofipo = ctx.exencionSofipoUMAsAnuales * ctx.umaAnual;
  const exento = (saldo: number) => op.tipo === 'sofipo' && saldo <= topeExentoSofipo;

  let saldo = e.monto; // dinero invertido
  let efectivo = 0; // dinero esperando reinversión (solo instrumentos a plazo)
  let aportado = e.monto;
  let bruto = 0;
  let isr = 0;
  let sumaSaldos = 0;

  const plazo = op.plazoDias ?? 1;

  for (let d = 1; d <= dias; d++) {
    // Aportación al cumplirse cada mes.
    if (aport > 0 && Math.floor(d / DIAS_MES) > Math.floor((d - 1) / DIAS_MES)) {
      if (op.capitalizacion === 'diario') saldo += aport;
      else efectivo += aport;
      aportado += aport;
    }

    if (op.capitalizacion === 'diario') {
      const i = interesDiario(saldo, op.tramos, op.baseDias);
      // La retención no puede exceder los intereses pagados (art. 54 LISR).
      const ret = exento(saldo) ? 0 : Math.min(i, (saldo * tasaRet) / 365);
      saldo += i - ret;
      bruto += i;
      isr += ret;
    } else if (d % plazo === 0) {
      // Vence el instrumento: se cobra el rendimiento del periodo y se reinvierte todo.
      const i = (saldo * op.tramos[0].tasa * plazo) / 100 / op.baseDias;
      const ret = exento(saldo) ? 0 : Math.min(i, (saldo * tasaRet * plazo) / 365);
      saldo += i - ret + efectivo;
      efectivo = 0;
      bruto += i;
      isr += ret;
    }
    sumaSaldos += saldo + efectivo;
  }
  // Días del último periodo incompleto, que no alcanzan a vencer.
  const diasSinInvertir = op.capitalizacion === 'plazo' ? dias % plazo : 0;

  const saldoFinal = r2(saldo + efectivo);
  aportado = r2(aportado);
  const interesBruto = r2(bruto);
  const isrRetenido = r2(isr);
  const gananciaNeta = r2(saldoFinal - aportado);
  const saldoPromedio = sumaSaldos / dias;
  const rendimientoNetoAnual = saldoPromedio > 0 ? (gananciaNeta / saldoPromedio) * (365 / dias) * 100 : 0;
  const rendimientoRealAnual = ((1 + rendimientoNetoAnual / 100) / (1 + ctx.inflacionAnual / 100) - 1) * 100;
  const tasaInicial = tasaPonderada(Math.max(e.monto, aport), op.tramos);
  const cob = cobertura(op, ctx);

  const avisos: string[] = [];
  if (op.requisitos) avisos.push(op.requisitos);
  if (cob !== null && saldoFinal > cob) {
    avisos.push(`Tu saldo final supera la cobertura de ${op.proteccion === 'ipab' ? 'IPAB' : 'PROSOFIPO'} (${dinero(cob)}). Considera repartir tu dinero en varias instituciones.`);
  }
  if (op.proteccion === 'ninguna') avisos.push('Este producto no cuenta con seguro de depósitos. Revisa en qué se invierte tu dinero.');
  if (op.proteccion === 'por-confirmar') avisos.push('Revisa con la institución qué protección tiene este producto y en qué se invierte tu dinero.');
  if (op.capitalizacion === 'plazo' && dias % plazo !== 0) {
    avisos.push(`El plazo no es múltiplo de ${plazo} días: el último periodo incompleto no genera rendimiento en esta simulación.`);
  }

  const pasos: Paso[] = [
    { etiqueta: 'Tasa anual bruta', formula: describirTramos(op.tramos), valor: r2(tasaInicial), tipo: 'porcentaje' },
    {
      etiqueta: op.capitalizacion === 'diario' ? 'Capitalización diaria' : `Reinversión cada ${plazo} días`,
      formula: op.capitalizacion === 'diario' ? `saldo × tasa ÷ ${op.baseDias}, cada día` : `saldo × tasa × ${plazo} ÷ ${op.baseDias}, al vencer`,
      valor: dias,
      tipo: 'dias',
    },
    { etiqueta: 'Total aportado', formula: aport > 0 ? `${dinero(e.monto)} + aportaciones de ${dinero(aport)} al mes` : undefined, valor: aportado },
    { etiqueta: 'Intereses brutos', valor: interesBruto },
    {
      etiqueta: 'Retención de ISR',
      formula: op.tipo === 'sofipo' && isrRetenido === 0 ? `exento: saldo ≤ 5 UMA anuales (${dinero(topeExentoSofipo)})` : `${numero(ctx.retencionISRAnual)}% anual sobre el capital`,
      valor: isrRetenido,
      fundamento: op.tipo === 'sofipo' ? 'Arts. 54, 93 fr. XX y 135 LISR' : 'Arts. 54 y 135 LISR; LIF 2026',
    },
    { etiqueta: 'Ganancia neta', valor: gananciaNeta, destacado: true },
    { etiqueta: 'Saldo final', valor: saldoFinal, destacado: true },
    { etiqueta: 'Rendimiento neto anual', valor: r2(rendimientoNetoAnual), tipo: 'porcentaje' },
    {
      etiqueta: 'Rendimiento real (descontando inflación)',
      formula: `(1 + ${numero(r2(rendimientoNetoAnual))}%) ÷ (1 + ${numero(ctx.inflacionAnual)}%) − 1`,
      valor: r2(rendimientoRealAnual),
      tipo: 'porcentaje',
    },
  ];

  return {
    opcion: op,
    dias,
    aportado,
    saldoFinal,
    interesBruto,
    isrRetenido,
    gananciaNeta,
    rendimientoNetoAnual,
    rendimientoRealAnual,
    tasaInicial,
    coberturaPesos: cob,
    excedeCobertura: cob !== null && saldoFinal > cob,
    diasSinInvertir,
    pasos,
    avisos,
  };
}

/** Simula todas las opciones y las ordena de mayor a menor ganancia neta. */
export function compararInversiones(opciones: OpcionInversion[], e: EntradaInversion, ctx: ContextoInversion): ResultadoOpcion[] {
  return opciones.map((o) => simularOpcion(o, e, ctx)).sort((a, b) => b.gananciaNeta - a.gananciaNeta);
}
