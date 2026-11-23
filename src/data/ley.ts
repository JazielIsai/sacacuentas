/**
 * Reglas de la Ley Federal del Trabajo (LFT) y de Banxico que NO cambian cada año.
 * Se concentran aquí para que todo número "mágico" tenga su fundamento a la vista.
 * Fuente LFT: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf
 */

/** Art. 87 LFT: aguinaldo mínimo de 15 días de salario. */
export const AGUINALDO_DIAS_MINIMO = 15;

/** Art. 80 LFT: prima vacacional no menor al 25% del salario de las vacaciones. */
export const PRIMA_VACACIONAL_MINIMA = 0.25;

/** Art. 89 LFT: si el salario es mensual, se divide entre 30 para obtener el diario. */
export const DIAS_MES_LFT = 30;

/**
 * Art. 76 LFT (reforma "vacaciones dignas", DOF 27-dic-2022, vigente desde 1-ene-2023):
 * 12 días el primer año; +2 días por año hasta llegar a 20 en el quinto;
 * a partir del sexto, +2 días por cada 5 años de servicio.
 * @param anioDeServicio 1 = primer año cumplido.
 */
export function diasVacacionesLFT(anioDeServicio: number): number {
  if (anioDeServicio < 1) return 0;
  if (anioDeServicio <= 5) return 12 + (anioDeServicio - 1) * 2;
  // 6–10 → 22, 11–15 → 24, 16–20 → 26 ...
  return 20 + Math.ceil((anioDeServicio - 5) / 5) * 2;
}

/** Art. 48 y 50 fr. III LFT: indemnización constitucional de 3 meses de salario. */
export const INDEMNIZACION_MESES = 3;

/** Art. 50 fr. II LFT: 20 días de salario por cada año de servicio (cuando procede). */
export const INDEMNIZACION_DIAS_POR_ANIO = 20;

/** Art. 162 fr. I LFT: prima de antigüedad de 12 días de salario por año de servicio. */
export const PRIMA_ANTIGUEDAD_DIAS_POR_ANIO = 12;

/** Arts. 162 fr. II, 485 y 486 LFT: salario base topado al doble del salario mínimo. */
export const PRIMA_ANTIGUEDAD_TOPE_SM = 2;

/** Art. 162 fr. III LFT: en retiro voluntario se paga con 15 años de servicio o más. */
export const PRIMA_ANTIGUEDAD_ANIOS_RENUNCIA = 15;

/**
 * Pago mínimo de tarjeta de crédito — Banxico, Circular 13/2011 y modificaciones:
 * el mayor entre (a) 1.5% del saldo insoluto (sin intereses ni IVA) + intereses + IVA,
 * y (b) 1.25% del límite de crédito.
 * Porcentajes cotejados con el texto original (disp. 2.1) el 23-nov-2026; aplican desde el 4-ene-2013.
 * TODO(verificar): cambios de la Circular 14/2014, que modificó la 13/2011.
 * Fuente: https://www.banxico.org.mx/marco-normativo/
 */
export const PAGO_MINIMO_PCT_SALDO = 0.015;
export const PAGO_MINIMO_PCT_LINEA = 0.0125;
