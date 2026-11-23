/**
 * Valores oficiales para el ejercicio 2026. Cada número lleva su fuente.
 * Cotejados contra las fuentes primarias el 23-nov-2026.
 * `PENDIENTES_2026` lista lo que falte por confirmar.
 */
import type { RenglonISR, ValoresAnuales } from './tipos';

type Fila = [inferior: number, superior: number, cuota: number, porcentaje: number];
const tarifa = (filas: Fila[]): RenglonISR[] =>
  filas.map(([limiteInferior, limiteSuperior, cuotaFija, porcentaje]) => ({ limiteInferior, limiteSuperior, cuotaFija, porcentaje }));

export const valores2026: ValoresAnuales = {
  anio: 2026,

  salarioMinimo: {
    // CONASAMI, DOF 9-dic-2025 (código 5775534).
    general: 315.04,
    frontera: 440.87,
  },

  uma: {
    // INEGI, comunicado 1/26. Vigente del 1-feb-2026 al 31-ene-2027 (en enero de 2026 regía la de 2025).
    diaria: 117.31,
    mensual: 3566.22,
    anual: 42794.64,
  },

  isr: {
    // Anexo 8 de la RMF 2026, apartado B, tarifas I, II, IV y V (DOF 28-dic-2025).
    tarifas: {
      diario: tarifa([
        [0.01, 27.78, 0.00, 1.92],
        [27.79, 235.81, 0.53, 6.40],
        [235.82, 414.41, 13.85, 10.88],
        [414.42, 481.73, 33.28, 16.00],
        [481.74, 576.76, 44.05, 17.92],
        [576.77, 1163.25, 61.08, 21.36],
        [1163.26, 1833.44, 186.35, 23.52],
        [1833.45, 3500.35, 343.98, 30.00],
        [3500.36, 4667.13, 844.05, 32.00],
        [4667.14, 14001.38, 1217.42, 34.00],
        [14001.39, Infinity, 4391.07, 35.00],
      ]),
      semanal: tarifa([
        [0.01, 194.46, 0.00, 1.92],
        [194.47, 1650.67, 3.71, 6.40],
        [1650.68, 2900.87, 96.95, 10.88],
        [2900.88, 3372.11, 232.96, 16.00],
        [3372.12, 4037.32, 308.35, 17.92],
        [4037.33, 8142.75, 427.56, 21.36],
        [8142.76, 12834.08, 1304.45, 23.52],
        [12834.09, 24502.45, 2407.86, 30.00],
        [24502.46, 32669.91, 5908.35, 32.00],
        [32669.92, 98009.66, 8521.94, 34.00],
        [98009.67, Infinity, 30737.49, 35.00],
      ]),
      quincenal: tarifa([
        [0.01, 416.70, 0.00, 1.92],
        [416.71, 3537.15, 7.95, 6.40],
        [3537.16, 6216.15, 207.75, 10.88],
        [6216.16, 7225.95, 499.20, 16.00],
        [7225.96, 8651.40, 660.75, 17.92],
        [8651.41, 17448.75, 916.20, 21.36],
        [17448.76, 27501.60, 2795.25, 23.52],
        [27501.61, 52505.25, 5159.70, 30.00],
        [52505.26, 70006.95, 12660.75, 32.00],
        [70006.96, 210020.70, 18261.30, 34.00],
        [210020.71, Infinity, 65866.05, 35.00],
      ]),
      mensual: tarifa([
        [0.01, 844.59, 0.00, 1.92],
        [844.60, 7168.51, 16.22, 6.40],
        [7168.52, 12598.02, 420.95, 10.88],
        [12598.03, 14644.64, 1011.68, 16.00],
        [14644.65, 17533.64, 1339.14, 17.92],
        [17533.65, 35362.83, 1856.84, 21.36],
        [35362.84, 55736.68, 5665.16, 23.52],
        [55736.69, 106410.50, 10457.09, 30.00],
        [106410.51, 141880.66, 25659.23, 32.00],
        [141880.67, 425641.99, 37009.69, 34.00],
        [425642.00, Infinity, 133488.54, 35.00],
      ]),
    },
  },

  subsidioEmpleo: {
    // Decreto DOF 31-dic-2025, art. Segundo. (Enero de 2026: 15.59%, transitorio Segundo.)
    porcentajeUmaMensual: 15.02,
    limiteIngresoMensual: 11492.66,
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
export const PENDIENTES_2026: string[] = [];
