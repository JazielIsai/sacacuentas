import type { ValoresAnuales } from '../src/data/tipos';
import { valores2026 } from '../src/data/valores-2026';

/**
 * Valores de prueba con números redondos para que los casos se puedan verificar a mano
 * y NO dependan de los valores 2026 que siguen pendientes de verificación.
 * La tarifa de ISR sí es la real (para probar la mecánica de la tabla).
 */
export const vPrueba: ValoresAnuales = {
  ...valores2026,
  salarioMinimo: { general: 300, frontera: 400 },
  uma: { diaria: 100, mensual: 3040, anual: 36480 },
  subsidioEmpleo: { porcentajeUmaMensual: 13.8, limiteIngresoMensual: 10171 },
};
