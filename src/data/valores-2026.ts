/**
 * Valores oficiales para el ejercicio 2026.
 *
 * REGLA: cada número lleva su fuente oficial. Los marcados con `TODO(verificar)`
 * NO se han confirmado contra el documento oficial y deben revisarse antes de
 * publicar. La lista `PENDIENTES_2026` al final resume todos los pendientes
 * (se muestra en `npm test` y en el README).
 */
import type { ValoresAnuales } from './tipos';

const UMA_DIARIA = 113.14;
// TODO(verificar): UMA 2026. El valor de arriba es la UMA 2025 (DOF 10-ene-2025),
// usado como PROVISIONAL. INEGI publica la UMA del año en el DOF en enero.
// Fuente: https://www.inegi.org.mx/temas/uma/

export const valores2026: ValoresAnuales = {
  anio: 2026,

  salarioMinimo: {
    // TODO(verificar): Resolución del H. Consejo de Representantes de la CONASAMI
    // que fija los salarios mínimos 2026, publicada en el DOF (diciembre 2025).
    // Fuente: https://www.gob.mx/conasami
    general: 315.04,
    frontera: 440.87,
  },

  uma: {
    diaria: UMA_DIARIA,
    // Mensual = diaria × 30.4 ; anual = mensual × 12 (art. 4 Ley para Determinar el Valor de la UMA).
    mensual: Math.round(UMA_DIARIA * 30.4 * 100) / 100,
    anual: Math.round(UMA_DIARIA * 30.4 * 12 * 100) / 100,
  },

  isr: {
    // TODO(verificar): Tarifa mensual art. 96 LISR. Ésta es la publicada en el
    // Anexo 8 de la RMF 2023 (DOF 27-dic-2022), vigente en 2023–2025.
    // Confirmar si el Anexo 8 de la RMF 2026 la actualizó (art. 152 LISR:
    // se actualiza cuando la inflación acumulada supera 10%).
    // Fuente: https://www.sat.gob.mx/ (Normatividad > RMF > Anexo 8)
    tarifaMensual: [
      { limiteInferior: 0.01, limiteSuperior: 746.04, cuotaFija: 0, porcentaje: 1.92 },
      { limiteInferior: 746.05, limiteSuperior: 6332.05, cuotaFija: 14.32, porcentaje: 6.4 },
      { limiteInferior: 6332.06, limiteSuperior: 11128.01, cuotaFija: 371.83, porcentaje: 10.88 },
      { limiteInferior: 11128.02, limiteSuperior: 12935.82, cuotaFija: 893.63, porcentaje: 16.0 },
      { limiteInferior: 12935.83, limiteSuperior: 15487.71, cuotaFija: 1182.88, porcentaje: 17.92 },
      { limiteInferior: 15487.72, limiteSuperior: 31236.49, cuotaFija: 1640.18, porcentaje: 21.36 },
      { limiteInferior: 31236.5, limiteSuperior: 49233.0, cuotaFija: 5004.12, porcentaje: 23.52 },
      { limiteInferior: 49233.01, limiteSuperior: 93993.9, cuotaFija: 9236.89, porcentaje: 30.0 },
      { limiteInferior: 93993.91, limiteSuperior: 125325.2, cuotaFija: 22665.17, porcentaje: 32.0 },
      { limiteInferior: 125325.21, limiteSuperior: 375975.61, cuotaFija: 32691.18, porcentaje: 34.0 },
      { limiteInferior: 375975.62, limiteSuperior: Infinity, cuotaFija: 117912.32, porcentaje: 35.0 },
    ],
  },

  subsidioEmpleo: {
    // TODO(verificar): Decreto que otorga el subsidio para el empleo para 2026 (DOF).
    // Valores PROVISIONALES = decreto 2025 (DOF 31-dic-2024): 13.8% de la UMA
    // mensual para ingresos mensuales de hasta $10,171.00.
    porcentajeUmaMensual: 13.8,
    limiteIngresoMensual: 10171.0,
  },

  exenciones: {
    // Art. 93 fr. XIV LISR: gratificación anual (aguinaldo) exenta hasta 30 UMA.
    aguinaldoUMA: 30,
    // Art. 93 fr. XIV LISR: prima vacacional exenta hasta 15 UMA.
    primaVacacionalUMA: 15,
    // Art. 93 fr. XIII LISR: indemnizaciones / primas de antigüedad exentas
    // hasta 90 UMA por cada año de servicio.
    separacionUMAPorAnio: 90,
  },

  // Art. 1 Ley del IVA: tasa general 16%.
  ivaTasa: 0.16,
};

/** Valores que faltan por confirmar contra la fuente oficial. */
export const PENDIENTES_2026: string[] = [
  'UMA 2026 (INEGI / DOF enero 2026) — se usa provisionalmente la UMA 2025 ($113.14)',
  'Salario mínimo 2026 general ($315.04) y frontera ($440.87) — confirmar en DOF / CONASAMI',
  'Tarifa mensual ISR art. 96 — confirmar Anexo 8 RMF 2026 (se usa la de 2023–2025)',
  'Subsidio para el empleo 2026 — se usa provisionalmente el decreto 2025 (13.8% UMA, tope $10,171)',
];
