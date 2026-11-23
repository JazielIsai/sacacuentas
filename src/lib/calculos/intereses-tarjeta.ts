import type { ValoresAnuales } from '../../data/tipos';
import { PAGO_MINIMO_PCT_LINEA, PAGO_MINIMO_PCT_SALDO } from '../../data/ley';
import { dinero, r2, validarPositivo, type Paso, type Resultado } from './comunes';

export interface EntradaTarjeta {
  saldo: number;
  /** Tasa de interés ordinaria anual en %, p. ej. 60 (no confundir con el CAT). */
  tasaAnual: number;
  modo: 'fijo' | 'minimo';
  /** Pago mensual fijo (modo 'fijo'). */
  pagoMensual?: number;
  /** Límite de crédito (para el pago mínimo, regla de Banxico). */
  limiteCredito?: number;
}

export interface MesTarjeta {
  mes: number;
  saldoInicial: number;
  interes: number;
  iva: number;
  pago: number;
  abonoCapital: number;
  saldoFinal: number;
}

export interface ResultadoTarjeta extends Resultado {
  meses: number;
  totalPagado: number;
  totalIntereses: number;
  totalIva: number;
  liquidable: boolean;
  tabla: MesTarjeta[];
}

export const MAX_MESES = 600; // 50 años: si no se liquida antes, se considera impagable

/** Pago mínimo (Banxico): mayor entre 1.5% del saldo + intereses + IVA, y 1.25% de la línea. */
export function pagoMinimo(saldo: number, interes: number, iva: number, limiteCredito = 0): number {
  const a = saldo * PAGO_MINIMO_PCT_SALDO + interes + iva;
  const b = limiteCredito * PAGO_MINIMO_PCT_LINEA;
  return r2(Math.max(a, b));
}

export function calcularIntereses(e: EntradaTarjeta, v: ValoresAnuales): ResultadoTarjeta {
  validarPositivo(e.saldo, 'El saldo');
  validarPositivo(e.tasaAnual, 'La tasa anual');
  if (e.modo === 'fijo') validarPositivo(e.pagoMensual ?? 0, 'El pago mensual');

  const tasaMensual = e.tasaAnual / 100 / 12;
  const avisos: string[] = [];
  const tabla: MesTarjeta[] = [];
  let saldo = r2(e.saldo);
  let totalPagado = 0;
  let totalIntereses = 0;
  let totalIva = 0;
  let liquidable = true;

  const interes1 = r2(saldo * tasaMensual);
  const iva1 = r2(interes1 * v.ivaTasa);
  if (e.modo === 'fijo' && (e.pagoMensual ?? 0) <= interes1 + iva1) {
    liquidable = false;
    avisos.push(
      `Con un pago de ${dinero(e.pagoMensual ?? 0)} al mes nunca terminas de pagar: el primer mes generas ${dinero(r2(interes1 + iva1))} de intereses + IVA. Necesitas pagar más.`,
    );
  }

  let mes = 0;
  while (liquidable && saldo > 0.005 && mes < MAX_MESES) {
    mes++;
    const interes = r2(saldo * tasaMensual);
    const iva = r2(interes * v.ivaTasa);
    const adeudo = r2(saldo + interes + iva);
    let pago = e.modo === 'fijo' ? (e.pagoMensual as number) : pagoMinimo(saldo, interes, iva, e.limiteCredito ?? 0);
    pago = Math.min(r2(pago), adeudo);
    const abono = r2(pago - interes - iva);
    const saldoFinal = r2(adeudo - pago);
    tabla.push({ mes, saldoInicial: saldo, interes, iva, pago, abonoCapital: abono, saldoFinal });
    totalPagado += pago;
    totalIntereses += interes;
    totalIva += iva;
    saldo = saldoFinal;
  }
  if (liquidable && saldo > 0.005) {
    liquidable = false;
    avisos.push(`En ${MAX_MESES / 12} años todavía no terminarías de pagar.`);
  }

  totalPagado = r2(totalPagado);
  totalIntereses = r2(totalIntereses);
  totalIva = r2(totalIva);

  const pasos: Paso[] = [
    { etiqueta: 'Saldo inicial', valor: r2(e.saldo) },
    { etiqueta: 'Tasa mensual', formula: `${e.tasaAnual}% anual ÷ 12`, valor: r2(tasaMensual * 100 * 100) / 100, tipo: 'porcentaje' },
    {
      etiqueta: 'Intereses del primer mes',
      formula: `${dinero(r2(e.saldo))} × ${r2(tasaMensual * 10000) / 100}%`,
      valor: interes1,
    },
    { etiqueta: 'IVA sobre esos intereses (16%)', valor: iva1, fundamento: 'Art. 1 LIVA' },
  ];
  if (liquidable) {
    pasos.push({ etiqueta: 'Meses para liquidar', valor: mes, tipo: 'numero', destacado: true });
    pasos.push({ etiqueta: 'Intereses totales', valor: totalIntereses });
    pasos.push({ etiqueta: 'IVA total', valor: totalIva });
    pasos.push({ etiqueta: 'Total pagado', valor: totalPagado, destacado: true });
  }
  if (e.modo === 'minimo') {
    avisos.push('Pagando solo el mínimo, cada mes el pago baja junto con el saldo y la deuda se alarga muchísimo. Úsalo como referencia, no como plan.');
  }
  avisos.push('Supone que no haces compras nuevas y que la tasa no cambia. No incluye comisiones ni anualidad.');

  return { total: totalPagado, pasos, avisos, meses: mes, totalPagado, totalIntereses, totalIva, liquidable, tabla };
}
