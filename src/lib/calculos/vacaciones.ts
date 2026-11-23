import { diasVacacionesLFT, PRIMA_VACACIONAL_MINIMA } from '../../data/ley';
import {
  dinero,
  antiguedad,
  parseFecha,
  r2,
  salarioDiario,
  validarPositivo,
  type Periodicidad,
  type Paso,
  type Resultado,
} from './comunes';

export interface EntradaVacaciones {
  fechaIngreso: string;
  /** Fecha a la que se calcula (normalmente hoy). */
  fechaCorte: string;
  salario: number;
  periodicidad: Periodicidad;
  /** Fracción, p. ej. 0.25 para 25%. Mínimo legal 25%. */
  primaVacacional?: number;
}

export interface ResultadoVacaciones extends Resultado {
  aniosCumplidos: number;
  diasVacaciones: number;
  diasProximoAnio: number;
  pagoVacaciones: number;
  primaVacacional: number;
}

export function calcularVacaciones(e: EntradaVacaciones): ResultadoVacaciones {
  validarPositivo(e.salario, 'El salario');
  const prima = e.primaVacacional ?? PRIMA_VACACIONAL_MINIMA;
  const avisos: string[] = [];
  if (prima < PRIMA_VACACIONAL_MINIMA) {
    avisos.push('La prima vacacional no puede ser menor al 25% (art. 80 LFT). Se calculó con lo que indicaste.');
  }

  const sd = r2(salarioDiario(e.salario, e.periodicidad));
  const ant = antiguedad(parseFecha(e.fechaIngreso), parseFecha(e.fechaCorte));
  const pasos: Paso[] = [];

  pasos.push({ etiqueta: 'Salario diario', valor: sd, fundamento: 'Art. 89 LFT' });
  pasos.push({ etiqueta: 'Años de servicio cumplidos', valor: ant.aniosCompletos, tipo: 'numero' });

  let dias: number;
  if (ant.aniosCompletos >= 1) {
    dias = diasVacacionesLFT(ant.aniosCompletos);
    pasos.push({
      etiqueta: `Días de vacaciones por tu año ${ant.aniosCompletos}`,
      valor: dias,
      tipo: 'dias',
      fundamento: 'Art. 76 LFT',
    });
  } else {
    dias = r2((diasVacacionesLFT(1) * ant.diasDesdeAniversario) / 365);
    avisos.push(
      'Todavía no cumples un año. Las vacaciones se disfrutan al cumplirlo; si la relación termina antes, se pagan en proporción (art. 79 LFT).',
    );
    pasos.push({
      etiqueta: 'Días proporcionales (aún no cumples 1 año)',
      formula: `12 días × ${ant.diasDesdeAniversario} / 365`,
      valor: dias,
      tipo: 'dias',
      fundamento: 'Arts. 76 y 79 LFT',
    });
  }

  const pago = r2(dias * sd);
  pasos.push({ etiqueta: 'Pago de los días de vacaciones', formula: `${dias} días × ${dinero(sd)}`, valor: pago });

  const montoPrima = r2(pago * prima);
  pasos.push({
    etiqueta: `Prima vacacional (${r2(prima * 100)}%)`,
    formula: `${dinero(pago)} × ${r2(prima * 100)}%`,
    valor: montoPrima,
    fundamento: 'Art. 80 LFT',
  });

  const total = r2(pago + montoPrima);
  pasos.push({ etiqueta: 'Total (salario de vacaciones + prima)', valor: total, destacado: true });

  const diasProximoAnio = diasVacacionesLFT(ant.aniosCompletos + 1);

  return {
    total,
    pasos,
    avisos,
    aniosCumplidos: ant.aniosCompletos,
    diasVacaciones: dias,
    diasProximoAnio,
    pagoVacaciones: pago,
    primaVacacional: montoPrima,
  };
}
