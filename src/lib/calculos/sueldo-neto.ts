import type { ValoresAnuales } from '../../data/tipos';
import { AGUINALDO_DIAS_MINIMO, diasVacacionesLFT, PRIMA_VACACIONAL_MINIMA } from '../../data/ley';
import { IMSS_OBRERO, IMSS_TOPE_UMA, IMSS_UMBRAL_EXCEDENTE_UMA } from '../../data/ley';
import { dinero, r2, salarioDiario, validarPositivo, type Paso, type Resultado } from './comunes';
import { calcularISR, DIAS_PERIODO, esSoloSalarioMinimo, type EntradaISR } from './isr';
import { factorIntegracion } from './separacion';

export interface EntradaSueldoNeto extends EntradaISR {
  /** Años de servicio cumplidos (para integrar el salario). */
  antiguedad?: number;
  diasAguinaldo?: number;
  /** Fracción, p. ej. 0.25 */
  primaVacacional?: number;
  /** Infonavit, préstamos, caja de ahorro… por periodo. */
  otrosDescuentos?: number;
}

export interface ResultadoSueldoNeto extends Resultado {
  isr: number;
  imss: number;
  sbc: number;
  neto: number;
}

export function calcularSueldoNeto(e: EntradaSueldoNeto, v: ValoresAnuales): ResultadoSueldoNeto {
  validarPositivo(e.ingreso, 'El sueldo');
  const otros = e.otrosDescuentos ?? 0;
  const antig = e.antiguedad ?? 0;
  const diasAg = e.diasAguinaldo ?? AGUINALDO_DIAS_MINIMO;
  const prima = e.primaVacacional ?? PRIMA_VACACIONAL_MINIMA;
  if (!Number.isFinite(otros) || otros < 0) throw new Error('Los otros descuentos no pueden ser negativos');
  if (!Number.isInteger(antig) || antig < 0 || antig > 70) throw new Error('Los años de antigüedad deben ser un entero entre 0 y 70');
  if (!Number.isFinite(diasAg) || diasAg < AGUINALDO_DIAS_MINIMO || diasAg > 365) throw new Error('Los días de aguinaldo deben estar entre 15 y 365');
  if (!Number.isFinite(prima) || prima < PRIMA_VACACIONAL_MINIMA || prima > 10) throw new Error('La prima vacacional debe ser de al menos 25%');

  const isr = calcularISR(e, v);
  const dias = DIAS_PERIODO[e.periodo];
  const soloMinimo = esSoloSalarioMinimo(e, v);
  const pasos: Paso[] = isr.pasos.filter((p) => p.etiqueta !== 'Sueldo después de ISR');
  const avisos = isr.avisos.filter((a) => !a.startsWith('No incluye cuotas'));

  // Salario base de cotización (arts. 27 a 29 LSS).
  const sd = r2(salarioDiario(e.ingreso, e.periodo));
  const factor = factorIntegracion(diasAg, diasVacacionesLFT(antig + 1), prima);
  const tope = r2(v.uma.diaria * IMSS_TOPE_UMA);
  const integrado = r2(sd * factor);
  const sbc = Math.min(tope, Math.max(v.salarioMinimo[e.zona ?? 'general'], integrado));
  let imss = 0;
  if (soloMinimo) {
    pasos.push({ etiqueta: 'Cuota obrera del IMSS', formula: 'salario mínimo: la paga tu patrón', valor: 0, fundamento: 'Art. 36 LSS' });
    avisos.push('Si ganas el salario mínimo, tu patrón debe pagar tu cuota del IMSS (art. 36 LSS).');
  } else {
    pasos.push({ etiqueta: 'Salario diario', valor: sd, fundamento: 'Art. 29 LSS' });
    pasos.push({
      etiqueta: 'Salario base de cotización (diario)',
      formula: `${dinero(sd)} × ${factor.toFixed(4)}${integrado > tope ? ` (tope: ${IMSS_TOPE_UMA} UMA)` : ''}`,
      valor: sbc,
      fundamento: 'Arts. 27 y 28 LSS',
    });
    for (const c of IMSS_OBRERO) {
      const base = c.soloExcedente ? Math.max(0, sbc - v.uma.diaria * IMSS_UMBRAL_EXCEDENTE_UMA) : sbc;
      if (base === 0) continue;
      const cuota = r2((base * dias * c.porcentaje) / 100);
      imss = r2(imss + cuota);
      pasos.push({ etiqueta: `IMSS: ${c.nombre}`, formula: `${dinero(base)} × ${dias} días × ${c.porcentaje}%`, valor: cuota, fundamento: c.fundamento });
    }
    pasos.push({ etiqueta: 'Cuota obrera del IMSS', valor: imss, destacado: true });
    if (integrado > tope) avisos.push(`Tu salario supera el tope de cotización de ${IMSS_TOPE_UMA} UMA.`);
  }

  if (otros > 0) pasos.push({ etiqueta: 'Otros descuentos', valor: otros });
  const neto = r2(e.ingreso - isr.isrRetenido - imss - otros);
  if (neto < 0) throw new Error('Los descuentos son mayores que tu sueldo');
  pasos.push({ etiqueta: 'Sueldo neto', formula: 'bruto − ISR − IMSS − otros descuentos', valor: neto, destacado: true });
  avisos.push(
    'Estimación: el IMSS se cobra por los días reales del mes (aquí, 30.4 si es mensual y 15 si es quincenal), y bonos, vales o comisiones pueden subir tu salario de cotización.',
  );
  return { total: neto, pasos, avisos, isr: isr.isrRetenido, imss, sbc, neto };
}
