import type { RenglonISR, ValoresAnuales } from '../../data/tipos';
import { dinero, r2, validarPositivo, type Paso, type Resultado } from './comunes';

export type PeriodoISR = 'mensual' | 'quincenal' | 'semanal' | 'diario';

/**
 * Días de cada periodo, para prorratear el subsidio (decreto: mensual ÷ 30.4 × días).
 */
export const DIAS_PERIODO: Record<PeriodoISR, number> = {
  mensual: 30.4,
  quincenal: 15,
  semanal: 7,
  diario: 1,
};

export function buscarRenglon(base: number, tarifa: RenglonISR[]): RenglonISR {
  // Se busca el último renglón cuyo límite inferior no exceda la base; así no
  // se "cae" en el hueco de un centavo entre renglones.
  let elegido = tarifa[0];
  for (const r of tarifa) if (base >= r.limiteInferior) elegido = r;
  return elegido;
}

/** ISR según tarifa del art. 96 (antes de subsidio). */
export function isrTarifa(base: number, tarifa: RenglonISR[]) {
  if (base <= 0) return { renglon: tarifa[0], excedente: 0, impuestoMarginal: 0, isr: 0 };
  const renglon = buscarRenglon(base, tarifa);
  const excedente = r2(base - renglon.limiteInferior);
  const impuestoMarginal = r2((excedente * renglon.porcentaje) / 100);
  return { renglon, excedente, impuestoMarginal, isr: r2(renglon.cuotaFija + impuestoMarginal) };
}

export interface EntradaISR {
  ingreso: number;
  periodo: PeriodoISR;
  /** Área geográfica, para la exención del salario mínimo (art. 96). */
  zona?: 'general' | 'frontera';
}

export interface ResultadoISR extends Resultado {
  isrAntesSubsidio: number;
  subsidio: number;
  isrRetenido: number;
  neto: number;
}

export function calcularISR(e: EntradaISR, v: ValoresAnuales): ResultadoISR {
  validarPositivo(e.ingreso, 'El ingreso');
  const dias = DIAS_PERIODO[e.periodo];
  const tarifa = v.isr.tarifas[e.periodo];
  const t = isrTarifa(e.ingreso, tarifa);
  const pasos: Paso[] = [];
  const avisos: string[] = [];

  pasos.push({ etiqueta: `Ingreso gravable ${e.periodo}`, valor: e.ingreso });
  pasos.push({ etiqueta: 'Límite inferior del renglón', valor: t.renglon.limiteInferior, fundamento: 'Art. 96 LISR' });
  pasos.push({ etiqueta: 'Excedente del límite inferior', formula: `${dinero(e.ingreso)} − ${dinero(t.renglon.limiteInferior)}`, valor: t.excedente });
  pasos.push({ etiqueta: 'Porcentaje sobre el excedente', valor: t.renglon.porcentaje, tipo: 'porcentaje' });
  pasos.push({ etiqueta: 'Impuesto marginal', formula: `${dinero(t.excedente)} × ${t.renglon.porcentaje}%`, valor: t.impuestoMarginal });
  pasos.push({ etiqueta: 'Cuota fija', valor: t.renglon.cuotaFija });
  pasos.push({ etiqueta: 'ISR antes de subsidio', formula: 'cuota fija + impuesto marginal', valor: t.isr, destacado: true });

  // Subsidio para el empleo (decreto vigente): % de la UMA mensual, proporcional al periodo.
  const ingresoMensualEq = (e.ingreso / dias) * 30.4;
  let subsidio = 0;
  if (ingresoMensualEq <= v.subsidioEmpleo.limiteIngresoMensual) {
    const subsidioMensual = (v.uma.mensual * v.subsidioEmpleo.porcentajeUmaMensual) / 100;
    subsidio = r2((subsidioMensual / 30.4) * dias);
    pasos.push({
      etiqueta: 'Subsidio para el empleo',
      formula: `${v.subsidioEmpleo.porcentajeUmaMensual}% × UMA mensual ${dinero(v.uma.mensual)}${e.periodo === 'mensual' ? '' : ` ÷ 30.4 × ${dias} días`}`,
      valor: subsidio,
      fundamento: 'Decreto de subsidio para el empleo',
    });
  } else {
    avisos.push(
      `Tu ingreso mensual equivalente supera ${dinero(v.subsidioEmpleo.limiteIngresoMensual)}, así que no aplica el subsidio para el empleo.`,
    );
  }

  // Art. 96 LISR: no se retiene a quien en el mes solo percibe un salario mínimo general de su área.
  const sm = v.salarioMinimo[e.zona ?? 'general'];
  const soloMinimo = e.ingreso <= r2(sm * (e.periodo === 'mensual' ? 365 / 12 : dias));

  // Desde el decreto de 2024 el subsidio sólo reduce el ISR; no genera saldo a favor en efectivo.
  const subsidioAplicado = Math.min(subsidio, t.isr);
  const isrRetenido = soloMinimo ? 0 : r2(t.isr - subsidioAplicado);
  if (soloMinimo) avisos.push('Si solo ganas el salario mínimo, tu patrón no debe retenerte ISR (art. 96 LISR).');
  if (!soloMinimo && subsidio > t.isr) {
    avisos.push('El subsidio es mayor que el ISR: la retención queda en $0 (el excedente no se entrega en efectivo).');
  }
  pasos.push({ etiqueta: 'ISR a retener', formula: soloMinimo ? 'salario mínimo: sin retención' : 'ISR − subsidio aplicado', fundamento: 'Art. 96 LISR', valor: isrRetenido, destacado: true });

  const neto = r2(e.ingreso - isrRetenido);
  pasos.push({ etiqueta: 'Sueldo después de ISR', valor: neto, destacado: true });
  avisos.push('No incluye cuotas obreras del IMSS, INFONAVIT ni otras deducciones de nómina.');

  return { total: isrRetenido, pasos, avisos, isrAntesSubsidio: t.isr, subsidio: subsidioAplicado, isrRetenido, neto };
}
