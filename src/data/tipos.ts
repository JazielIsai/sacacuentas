/** Un renglón de la tarifa de ISR (art. 96 LISR). Montos en pesos. */
export interface RenglonISR {
  limiteInferior: number;
  /** `Infinity` en el último renglón. */
  limiteSuperior: number;
  cuotaFija: number;
  /** Porcentaje sobre el excedente del límite inferior, p. ej. 10.88 */
  porcentaje: number;
}

export interface ValoresAnuales {
  anio: number;

  salarioMinimo: {
    /** Salario mínimo general diario. */
    general: number;
    /** Zona Libre de la Frontera Norte, diario. */
    frontera: number;
  };

  /** Unidad de Medida y Actualización. */
  uma: {
    diaria: number;
    mensual: number;
    anual: number;
  };

  isr: {
    /** Tarifa mensual del art. 96 LISR. Las demás periodicidades se derivan de ésta. */
    tarifaMensual: RenglonISR[];
  };

  subsidioEmpleo: {
    /** Porcentaje de la UMA mensual que se otorga como subsidio mensual. */
    porcentajeUmaMensual: number;
    /** Ingreso mensual máximo para tener derecho al subsidio. */
    limiteIngresoMensual: number;
  };

  /** Exenciones de ISR (art. 93 LISR), expresadas en número de UMA. */
  exenciones: {
    aguinaldoUMA: number;
    primaVacacionalUMA: number;
    /** Por cada año de servicio, en pagos por separación. */
    separacionUMAPorAnio: number;
  };

  /** IVA aplicable a intereses de tarjeta (art. 1 LIVA). */
  ivaTasa: number;
}
