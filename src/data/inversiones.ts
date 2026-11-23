/**
 * Tasas de inversión para el comparador /inversiones.
 *
 * ESTAS TASAS CAMBIAN SEGUIDO (a veces cada semana). Cada opción lleva:
 *   - `fuente`: dónde CONFIRMAR el dato (normalmente el sitio de la institución).
 *     OJO: mientras `verificado` sea null, la tasa NO se tomó de ahí, sino de prensa o comparadores.
 *   - `verificado`: fecha en que se confirmó contra la FUENTE OFICIAL (app/sitio de la institución).
 *     `null` = tomado de prensa o comparadores, PENDIENTE de confirmar.
 * La página muestra la fecha de corte (`FECHA_TASAS`) y avisa si hay tasas sin verificar.
 *
 * Tasas anuales brutas (antes de impuestos), en %.
 */

export const FECHA_TASAS = '2026-11-19';

/** 'por-confirmar' = no hemos verificado qué protección tiene; NO afirmar que no tiene. */
export type Proteccion = 'gobierno' | 'ipab' | 'prosofipo' | 'ninguna' | 'por-confirmar';
export type TipoInstitucion = 'gobierno' | 'banco' | 'sofipo' | 'otro';

/**
 * Tramo de saldo. Las tasas son MARGINALES: cada tramo paga su tasa solo por la
 * porción del saldo que cae en él. `hasta: null` = sin límite.
 * Ej. Openbank: 13% por los primeros $30,000, 7% de $30,000 a $1,000,000, 6.5% por arriba.
 */
export interface Tramo {
  hasta: number | null;
  tasa: number;
}

export interface OpcionInversion {
  id: string;
  institucion: string;
  producto: string;
  tipo: TipoInstitucion;
  proteccion: Proteccion;
  /** Texto corto: "Diaria", "Cada 28 días", etc. */
  liquidez: string;
  /**
   * 'diario': los intereses se calculan y abonan diario (cuentas a la vista).
   * 'plazo': instrumento a plazo fijo que se reinvierte al vencer (CETES, pagarés).
   */
  capitalizacion: 'diario' | 'plazo';
  /** Días del plazo (solo para capitalizacion = 'plazo'). */
  plazoDias?: number;
  /** Base de días de la tasa: CETES usan 360; las cuentas, normalmente 365. */
  baseDias: 360 | 365;
  tramos: Tramo[];
  requisitos?: string;
  fuente: string;
  verificado: string | null;
}

export const OPCIONES_INVERSION: OpcionInversion[] = [
  {
    id: 'cetes-28',
    institucion: 'CETES',
    producto: 'Cetesdirecto 28 días (reinvirtiendo)',
    tipo: 'gobierno',
    proteccion: 'gobierno',
    liquidez: 'Cada 28 días',
    capitalizacion: 'plazo',
    plazoDias: 28,
    baseDias: 360,
    // TODO(verificar): subasta del 17-nov-2026 reportada en 6.19%. Confirmar en Banxico.
    tramos: [{ hasta: null, tasa: 6.19 }],
    fuente: 'https://www.banxico.org.mx/mercados/valores-gubernamentales-secto.html',
    verificado: null,
  },
  {
    id: 'cetes-91',
    institucion: 'CETES',
    producto: 'Cetesdirecto 91 días (reinvirtiendo)',
    tipo: 'gobierno',
    proteccion: 'gobierno',
    liquidez: 'Cada 91 días',
    capitalizacion: 'plazo',
    plazoDias: 91,
    baseDias: 360,
    // TODO(verificar): 6.69% en la subasta del 3-nov-2026; no se encontró dato más reciente.
    tramos: [{ hasta: null, tasa: 6.69 }],
    fuente: 'https://www.banxico.org.mx/mercados/valores-gubernamentales-secto.html',
    verificado: null,
  },
  {
    id: 'nu-turbo',
    institucion: 'Nu',
    producto: 'Cajita Turbo + Cajitas',
    tipo: 'banco',
    proteccion: 'ipab',
    liquidez: 'Diaria',
    capitalizacion: 'diario',
    baseDias: 365,
    // TODO(verificar): 13% Turbo (tope $25,000) y 6.5% Cajitas, vigencia publicada 8-oct al 18-nov-2026.
    tramos: [
      { hasta: 25000, tasa: 13 },
      { hasta: null, tasa: 6.5 },
    ],
    requisitos: 'La tasa Turbo tiene condiciones de uso de la cuenta.',
    fuente: 'https://blog.nu.com.mx/cuanto-rendimiento-da-nu/',
    verificado: null,
  },
  {
    id: 'mercado-pago',
    institucion: 'Mercado Pago',
    producto: 'Rendimientos con Meli+',
    tipo: 'otro',
    // TODO(verificar): esquema de protección vigente de los rendimientos de Mercado Pago.
    proteccion: 'por-confirmar',
    liquidez: 'Diaria',
    capitalizacion: 'diario',
    baseDias: 365,
    // TODO(verificar): 15% hasta $25,000 con suscripción Meli+ (fuente informal, oct-2026); tasa sobre el excedente no confirmada (se usa 7%).
    tramos: [
      { hasta: 25000, tasa: 15 },
      { hasta: null, tasa: 7 },
    ],
    requisitos: 'Requiere suscripción Meli+ (tiene costo).',
    fuente: 'https://www.mercadopago.com.mx/',
    verificado: null,
  },
  {
    id: 'openbank',
    institucion: 'Openbank',
    producto: 'Cuenta Open',
    tipo: 'banco',
    proteccion: 'ipab',
    liquidez: 'Diaria',
    capitalizacion: 'diario',
    baseDias: 365,
    // TODO(verificar): 13% hasta $30,000; 7% hasta $1,000,000; 6.5% arriba (comparadores, nov-2026).
    tramos: [
      { hasta: 30000, tasa: 13 },
      { hasta: 1000000, tasa: 7 },
      { hasta: null, tasa: 6.5 },
    ],
    fuente: 'https://www.openbank.mx/',
    verificado: null,
  },
  {
    id: 'klar-max',
    institucion: 'Klar',
    producto: 'Inversión Max (Klar Plus)',
    tipo: 'sofipo',
    proteccion: 'prosofipo',
    liquidez: 'Diaria',
    capitalizacion: 'diario',
    baseDias: 365,
    // TODO(verificar): 15% hasta $25,000 solo clientes Plus; 6% base (comparadores, nov-2026).
    tramos: [
      { hasta: 25000, tasa: 15 },
      { hasta: null, tasa: 6 },
    ],
    requisitos: 'La tasa de 15% es solo para clientes Klar Plus (suscripción).',
    fuente: 'https://www.klar.mx/',
    verificado: null,
  },
  {
    id: 'didi',
    institucion: 'DiDi',
    producto: 'Cuenta DiDi',
    tipo: 'sofipo',
    proteccion: 'prosofipo',
    liquidez: 'Diaria',
    capitalizacion: 'diario',
    baseDias: 365,
    // TODO(verificar): 15% hasta $10,000; 7% el excedente (comparadores, nov-2026).
    tramos: [
      { hasta: 10000, tasa: 15 },
      { hasta: null, tasa: 7 },
    ],
    fuente: 'https://www.descuento.com.mx/ofertas/rendimientos-en-2026-comparativa-para-ver-donde-rinden-tus-ahorros-631628',
    verificado: null,
  },
  {
    id: 'uala',
    institucion: 'Ualá',
    producto: 'Cuenta Ualá',
    tipo: 'banco',
    proteccion: 'ipab',
    liquidez: 'Diaria',
    capitalizacion: 'diario',
    baseDias: 365,
    // TODO(verificar): 15% hasta $30,000 y 0% arriba; requiere gasto o nómina de $6,000/mes (comparadores, nov-2026).
    tramos: [
      { hasta: 30000, tasa: 15 },
      { hasta: null, tasa: 0 },
    ],
    requisitos: 'Gastar o recibir nómina de $6,000 al mes (con $3,000 baja a 12%). Arriba de $30,000 no paga.',
    fuente: 'https://www.uala.mx/',
    verificado: null,
  },
  {
    id: 'stori',
    institucion: 'Stori',
    producto: 'Apartados',
    tipo: 'sofipo',
    proteccion: 'prosofipo',
    liquidez: 'Diaria',
    capitalizacion: 'diario',
    baseDias: 365,
    // TODO(verificar): fuentes reportan entre 6.79% y 7.25% sin tope; se usa la menor.
    tramos: [{ hasta: null, tasa: 6.79 }],
    fuente: 'https://www.storicard.com/',
    verificado: null,
  },
  {
    id: 'hey',
    institucion: 'Hey Banco',
    producto: 'Ahorro Hey',
    tipo: 'banco',
    proteccion: 'ipab',
    liquidez: 'Diaria',
    capitalizacion: 'diario',
    baseDias: 365,
    // TODO(verificar): 4% base; hasta ~7.5% con Hey Fan / Hey Pro.
    tramos: [{ hasta: null, tasa: 4 }],
    requisitos: 'Tasa base. Con membresía Hey Fan / Hey Pro puede ser mayor.',
    fuente: 'https://heybanco.com/',
    verificado: null,
  },
];

/** Datos de contexto que también cambian y necesitan fuente. */
export const CONTEXTO_INVERSION = {
  /**
   * Retención anual de ISR sobre el CAPITAL que genera intereses (arts. 54 y 135 LISR).
   * TODO(verificar): 0.90% según la LIF 2026 (DOF 7-nov-2025), reportado por varias fuentes; confirmar el artículo en el DOF.
   */
  retencionISRAnual: 0.9,
  /** Inflación anual de referencia. INEGI, INPC octubre 2026 (publicado 9-nov-2026): 3.75%. */
  inflacionAnual: 3.75,
  inflacionFuente: 'INEGI, INPC octubre 2026',
  /** Valor de la UDI (Banxico, DOF). 20-nov-2026: 8.920859. */
  udi: 8.920859,
  /** IPAB: cobertura por persona y por banco (art. 11 Ley de Protección al Ahorro Bancario). */
  ipabUDIs: 400000,
  /** Fondo de Protección de SOFIPOs: cobertura por persona y por sociedad (art. 105 LACP). */
  prosofipoUDIs: 25000,
  /**
   * Art. 93 fr. XX LISR: intereses de SOFIPOs exentos si el saldo promedio diario
   * no excede 5 UMA anuales.
   */
  exencionSofipoUMAsAnuales: 5,
};
