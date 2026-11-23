/**
 * Finiquito y liquidación comparten la mayor parte del cálculo:
 * - Finiquito: lo que se debe SIEMPRE al terminar la relación laboral.
 * - Liquidación: finiquito + indemnización por despido injustificado.
 */
import type { ValoresAnuales } from '../../data/tipos';
import {
  AGUINALDO_DIAS_MINIMO,
  diasVacacionesLFT,
  INDEMNIZACION_DIAS_POR_ANIO,
  INDEMNIZACION_MESES,
  PRIMA_ANTIGUEDAD_ANIOS_RENUNCIA,
  PRIMA_ANTIGUEDAD_DIAS_POR_ANIO,
  PRIMA_ANTIGUEDAD_TOPE_SM,
  PRIMA_VACACIONAL_MINIMA,
} from '../../data/ley';
import { diasAguinaldoProporcionales } from './aguinaldo';
import {
  dinero,
  antiguedad,
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

export type MotivoSalida = 'renuncia' | 'despido-justificado' | 'despido-injustificado';
export type Zona = 'general' | 'frontera';

export interface EntradaFiniquito {
  salario: number;
  periodicidad: Periodicidad;
  fechaIngreso: string;
  fechaSalida: string;
  motivo: MotivoSalida;
  zona?: Zona;
  /** Días trabajados que todavía no te pagan (p. ej. de la última quincena). */
  diasSalarioPendiente?: number;
  /** Días de vacaciones de años anteriores que no disfrutaste. */
  vacacionesPendientes?: number;
  /** Si el aguinaldo de este año ya se pagó (p. ej. salida en diciembre). */
  aguinaldoPagado?: boolean;
  diasAguinaldo?: number;
  primaVacacional?: number;
}

export interface ResultadoFiniquito extends Resultado {
  salarioDiario: number;
  aniosServicio: number;
  conceptos: {
    salarioPendiente: number;
    aguinaldo: number;
    vacaciones: number;
    primaVacacional: number;
    primaAntiguedad: number;
  };
}

function primaAntiguedadAplica(motivo: MotivoSalida, aniosCompletos: number): boolean {
  if (motivo === 'renuncia') return aniosCompletos >= PRIMA_ANTIGUEDAD_ANIOS_RENUNCIA;
  return true; // art. 162 fr. III: separación por despido, justificado o no
}

/** Factor de integración (aguinaldo + prima vacacional) para aproximar el salario integrado (art. 84 LFT). */
export function factorIntegracion(diasAguinaldo: number, diasVacaciones: number, prima: number): number {
  return 1 + (diasAguinaldo + diasVacaciones * prima) / 365;
}

export function calcularFiniquito(e: EntradaFiniquito, v: ValoresAnuales, opts: { salarioBasePrima?: number } = {}): ResultadoFiniquito {
  validarPositivo(e.salario, 'El salario');
  const diasAg = e.diasAguinaldo ?? AGUINALDO_DIAS_MINIMO;
  const prima = e.primaVacacional ?? PRIMA_VACACIONAL_MINIMA;
  const zona = e.zona ?? 'general';
  const ingreso = parseFecha(e.fechaIngreso);
  const salida = parseFecha(e.fechaSalida);
  const ant = antiguedad(ingreso, salida);
  const sd = r2(salarioDiario(e.salario, e.periodicidad));
  const pasos: Paso[] = [];
  const avisos: string[] = [];

  pasos.push({ etiqueta: 'Salario diario', valor: sd, fundamento: 'Art. 89 LFT' });
  pasos.push({
    etiqueta: 'Antigüedad',
    formula: `${ant.aniosCompletos} años y ${ant.diasDesdeAniversario} días`,
    valor: r2(ant.aniosConFraccion),
    tipo: 'numero',
  });

  // 1. Salario devengado
  const diasPend = e.diasSalarioPendiente ?? 0;
  const salarioPendiente = r2(diasPend * sd);
  if (diasPend > 0) {
    pasos.push({ etiqueta: 'Salario de días trabajados no pagados', formula: `${diasPend} días × ${dinero(sd)}`, valor: salarioPendiente });
  }

  // 2. Aguinaldo proporcional del año de salida
  let aguinaldo = 0;
  if (!e.aguinaldoPagado) {
    const anio = salida.getUTCFullYear();
    const inicioAnio = new Date(Date.UTC(anio, 0, 1));
    const diasTrab = diasInclusivos(ingreso > inicioAnio ? ingreso : inicioAnio, salida);
    const diasProp = r2(diasAguinaldoProporcionales(diasAg, diasTrab, anio));
    aguinaldo = r2(diasProp * sd);
    pasos.push({
      etiqueta: 'Aguinaldo proporcional',
      formula: `${diasAg} días × ${diasTrab}/${diasDelAnio(anio)} = ${diasProp} días × ${dinero(sd)}`,
      valor: aguinaldo,
      fundamento: 'Art. 87 LFT',
    });
  }

  // 3. Vacaciones proporcionales del año de servicio en curso + pendientes
  const diasVacAnioEnCurso = diasVacacionesLFT(ant.aniosCompletos + 1);
  const diasVacProp = r2((diasVacAnioEnCurso * ant.diasDesdeAniversario) / 365);
  const vacPend = e.vacacionesPendientes ?? 0;
  const diasVacTotal = r2(diasVacProp + vacPend);
  const vacaciones = r2(diasVacTotal * sd);
  pasos.push({
    etiqueta: 'Vacaciones proporcionales',
    formula: `${diasVacAnioEnCurso} días × ${ant.diasDesdeAniversario}/365 = ${diasVacProp} días${vacPend ? ` + ${vacPend} pendientes` : ''}`,
    valor: vacaciones,
    fundamento: 'Arts. 76 y 79 LFT',
  });

  const primaVac = r2(vacaciones * prima);
  pasos.push({ etiqueta: `Prima vacacional (${r2(prima * 100)}%)`, formula: `${dinero(vacaciones)} × ${r2(prima * 100)}%`, valor: primaVac, fundamento: 'Art. 80 LFT' });

  // 4. Prima de antigüedad
  let primaAnt = 0;
  if (primaAntiguedadAplica(e.motivo, ant.aniosCompletos)) {
    const sm = zona === 'frontera' ? v.salarioMinimo.frontera : v.salarioMinimo.general;
    const tope = r2(sm * PRIMA_ANTIGUEDAD_TOPE_SM);
    const base = opts.salarioBasePrima ?? sd;
    const salarioTopado = Math.min(base, tope);
    const diasPrima = r2(PRIMA_ANTIGUEDAD_DIAS_POR_ANIO * ant.aniosConFraccion);
    primaAnt = r2(diasPrima * salarioTopado);
    pasos.push({
      etiqueta: 'Prima de antigüedad',
      formula: `12 días × ${r2(ant.aniosConFraccion)} años = ${diasPrima} días × ${dinero(r2(salarioTopado))}${base > tope ? ` (tope 2 SM = ${dinero(tope)})` : ''}`,
      valor: primaAnt,
      fundamento: 'Arts. 162 y 486 LFT',
    });
  } else {
    avisos.push('Con renuncia voluntaria, la prima de antigüedad se paga solo si tienes 15 años o más de servicio (art. 162 fr. III LFT).');
  }

  const total = r2(salarioPendiente + aguinaldo + vacaciones + primaVac + primaAnt);
  pasos.push({ etiqueta: 'Total del finiquito (bruto)', valor: total, destacado: true });
  avisos.push('Montos brutos: sobre ellos puede aplicar retención de ISR. Revisa también si tienes otras prestaciones (bonos, fondo de ahorro, comisiones).');

  return {
    total,
    pasos,
    avisos,
    salarioDiario: sd,
    aniosServicio: ant.aniosConFraccion,
    conceptos: { salarioPendiente, aguinaldo, vacaciones, primaVacacional: primaVac, primaAntiguedad: primaAnt },
  };
}

export interface EntradaLiquidacion extends Omit<EntradaFiniquito, 'motivo'> {
  /** Incluir 20 días por año (art. 50 fr. II), que procede en casos específicos. */
  incluir20Dias?: boolean;
  /** Calcular la indemnización con salario integrado aproximado (recomendado). */
  usarSalarioIntegrado?: boolean;
}

export interface ResultadoLiquidacion extends Resultado {
  finiquito: ResultadoFiniquito;
  salarioIntegrado: number;
  indemnizacion3Meses: number;
  indemnizacion20Dias: number;
}

export function calcularLiquidacion(e: EntradaLiquidacion, v: ValoresAnuales): ResultadoLiquidacion {
  const diasAg = e.diasAguinaldo ?? AGUINALDO_DIAS_MINIMO;
  const prima = e.primaVacacional ?? PRIMA_VACACIONAL_MINIMA;
  const sd = r2(salarioDiario(e.salario, e.periodicidad));
  const ant = antiguedad(parseFecha(e.fechaIngreso), parseFecha(e.fechaSalida));
  const usarSDI = e.usarSalarioIntegrado ?? true;

  const factor = factorIntegracion(diasAg, diasVacacionesLFT(ant.aniosCompletos + 1), prima);
  const sdi = usarSDI ? r2(sd * factor) : sd;

  const fin = calcularFiniquito({ ...e, motivo: 'despido-injustificado' }, v, { salarioBasePrima: sdi });
  const pasos: Paso[] = [...fin.pasos.filter((p) => !p.destacado)];
  pasos.push({ etiqueta: 'Subtotal finiquito', valor: fin.total, destacado: true });

  if (usarSDI) {
    pasos.push({
      etiqueta: 'Salario diario integrado (aprox.)',
      formula: `${dinero(sd)} × factor ${factor.toFixed(4)} (aguinaldo + prima vacacional)`,
      valor: sdi,
      fundamento: 'Arts. 84 y 89 LFT',
    });
  }

  const ind3 = r2(INDEMNIZACION_MESES * 30 * sdi);
  pasos.push({ etiqueta: 'Indemnización de 3 meses', formula: `90 días × ${dinero(sdi)}`, valor: ind3, fundamento: 'Arts. 48 y 50 fr. III LFT' });

  let ind20 = 0;
  if (e.incluir20Dias) {
    const dias = r2(INDEMNIZACION_DIAS_POR_ANIO * ant.aniosConFraccion);
    ind20 = r2(dias * sdi);
    pasos.push({
      etiqueta: '20 días por año de servicio',
      formula: `20 × ${r2(ant.aniosConFraccion)} años = ${dias} días × ${dinero(sdi)}`,
      valor: ind20,
      fundamento: 'Art. 50 fr. II LFT',
    });
  }

  const total = r2(fin.total + ind3 + ind20);
  pasos.push({ etiqueta: 'Total de la liquidación (bruto)', valor: total, destacado: true });

  const topeExento = r2(v.exenciones.separacionUMAPorAnio * v.uma.diaria * Math.max(1, Math.round(ant.aniosConFraccion)));
  const avisos = [
    ...fin.avisos.filter((a) => !a.startsWith('Con renuncia')),
    `La indemnización y la prima de antigüedad están exentas de ISR hasta 90 UMA por año de servicio (aprox. ${dinero(topeExento)} en tu caso, art. 93 fr. XIII LISR).`,
  ];
  if (!e.incluir20Dias) {
    avisos.push('No se incluyeron los 20 días por año: proceden cuando el patrón se niega a reinstalarte o en los supuestos del art. 49 LFT. Actívalos si es tu caso.');
  }

  return { total, pasos, avisos, finiquito: fin, salarioIntegrado: sdi, indemnizacion3Meses: ind3, indemnizacion20Dias: ind20 };
}
