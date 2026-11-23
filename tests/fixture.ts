import type { ValoresAnuales } from '../src/data/tipos';
import { valores2026 } from '../src/data/valores-2026';

/**
 * Valores de prueba con números redondos para que los casos se puedan verificar a mano
 * y no cambien al actualizar los valores del año.
 */
export const vPrueba: ValoresAnuales = {
  ...valores2026,
  salarioMinimo: { general: 300, frontera: 400 },
  // Tarifa mensual 2023–2025 (Anexo 8 RMF 2023): fija, para casos calculados a mano.
  isr: { tarifas: { ...valores2026.isr.tarifas, mensual: [
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
      ] } },
  uma: { diaria: 100, mensual: 3040, anual: 36480 },
  subsidioEmpleo: { porcentajeUmaMensual: 13.8, limiteIngresoMensual: 10171 },
};
