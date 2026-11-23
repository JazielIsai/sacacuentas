import type { ValoresAnuales } from '../../data/tipos';
import { AGUINALDO_DIAS_MINIMO } from '../../data/ley';
import {
  dinero,
  diasDelAnio,
  diasInclusivos,
  parseFecha,
  r2,
  salarioDiario,
  validarPositivo,
  type Periodicidad,
  type Paso,
  type Resultado,
} from './comunes';
import { isrTarifa } from './isr';

export interface EntradaAguinaldo {
  salario: number;
  periodicidad: Periodicidad;
  fechaIngreso: string;
  /** Último día trabajado del año (31-dic si sigues trabajando). */
  fechaCorte: string;
  diasAguinaldo?: number;
}

export interface ResultadoAguinaldo extends Resultado {
  diasTrabajados: number;
  diasAguinaldoProporcionales: number;
  bruto: number;
  exento: number;
  gravado: number;
  isrEstimado: number;
  neto: number;
}

/** Aguinaldo proporcional: días de aguinaldo × días trabajados en el año / días del año. */
export function diasAguinaldoProporcionales(diasAguinaldo: number, diasTrabajados: number, anio: number): number {
  return (diasAguinaldo * diasTrabajados) / diasDelAnio(anio);
}

export function calcularAguinaldo(e: EntradaAguinaldo, v: ValoresAnuales): ResultadoAguinaldo {
  validarPositivo(e.salario, 'El salario');
  const diasAg = e.diasAguinaldo ?? AGUINALDO_DIAS_MINIMO;
  const avisos: string[] = [];
  if (diasAg < AGUINALDO_DIAS_MINIMO) {
    avisos.push('Por ley el aguinaldo es de al menos 15 días de salario (art. 87 LFT). Se calculó con lo que indicaste.');
  }

  const ingreso = parseFecha(e.fechaIngreso);
  const corte = parseFecha(e.fechaCorte);
  const anio = corte.getUTCFullYear();
  if (corte < ingreso) throw new Error('La fecha de corte no puede ser anterior a la de ingreso');

  const inicioAnio = new Date(Date.UTC(anio, 0, 1));
  const desde = ingreso > inicioAnio ? ingreso : inicioAnio;
  const diasTrab = diasInclusivos(desde, corte);
  const totalDiasAnio = diasDelAnio(anio);

  const sd = r2(salarioDiario(e.salario, e.periodicidad));
  const pasos: Paso[] = [];
  pasos.push({ etiqueta: 'Salario diario', valor: sd, fundamento: 'Art. 89 LFT' });
  pasos.push({ etiqueta: `Días trabajados en ${anio}`, valor: diasTrab, tipo: 'dias' });

  const diasProp = r2(diasAguinaldoProporcionales(diasAg, diasTrab, anio));
  pasos.push({
    etiqueta: 'Días de aguinaldo que te tocan',
    formula: diasTrab >= totalDiasAnio ? `año completo = ${diasAg} días` : `${diasAg} días × ${diasTrab} / ${totalDiasAnio}`,
    valor: diasProp,
    tipo: 'dias',
    fundamento: 'Art. 87 LFT',
  });

  const bruto = r2(diasProp * sd);
  pasos.push({ etiqueta: 'Aguinaldo bruto', formula: `${diasProp} días × ${dinero(sd)}`, valor: bruto, destacado: true });

  const topeExento = r2(v.exenciones.aguinaldoUMA * v.uma.diaria);
  const exento = Math.min(bruto, topeExento);
  const gravado = r2(bruto - exento);
  pasos.push({
    etiqueta: 'Parte exenta de ISR',
    formula: `hasta ${v.exenciones.aguinaldoUMA} UMA × ${dinero(v.uma.diaria)} = ${dinero(topeExento)}`,
    valor: exento,
    fundamento: 'Art. 93 fr. XIV LISR',
  });
  pasos.push({ etiqueta: 'Parte gravada', valor: gravado });

  // Estimación: ISR del mes con aguinaldo gravado − ISR del mes sin él (art. 96 LISR).
  const mensual = r2(sd * 30.4);
  const isrEstimado = gravado > 0 ? r2(isrTarifa(mensual + gravado, v.isr.tarifas.mensual).isr - isrTarifa(mensual, v.isr.tarifas.mensual).isr) : 0;
  pasos.push({
    etiqueta: 'ISR estimado sobre la parte gravada',
    formula: gravado > 0 ? `ISR(${dinero(mensual)} + ${dinero(gravado)}) − ISR(${dinero(mensual)})` : 'no hay parte gravada',
    valor: isrEstimado,
    fundamento: 'Art. 96 LISR',
  });

  const neto = r2(bruto - isrEstimado);
  pasos.push({ etiqueta: 'Aguinaldo neto estimado', valor: neto, destacado: true });

  if (gravado > 0) {
    avisos.push(
      'El ISR es una estimación con el método del art. 96 LISR; tu patrón puede usar el método opcional del art. 174 del Reglamento y retener un poco distinto.',
    );
  }

  return {
    total: bruto,
    pasos,
    avisos,
    diasTrabajados: diasTrab,
    diasAguinaldoProporcionales: diasProp,
    bruto,
    exento,
    gravado,
    isrEstimado,
    neto,
  };
}
