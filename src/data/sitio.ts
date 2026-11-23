export const SITIO = {
  nombre: 'SacaCuentas',
  dominio: 'sacacuentas.mx',
  lema: 'Calculadoras de dinero para México, explicadas paso a paso',
  descripcion:
    'Calcula tu aguinaldo, finiquito, liquidación, vacaciones, ISR e intereses de tarjeta con la ley vigente en México. Gratis, al instante y con el desglose explicado.',
  locale: 'es_MX',
};

export interface Calculadora {
  slug: string;
  nombre: string;
  resumen: string;
  emoji: string;
}

export const CALCULADORAS: Calculadora[] = [
  { slug: 'aguinaldo', nombre: 'Aguinaldo', resumen: 'Cuánto te toca este diciembre, completo o proporcional, y cuánto paga ISR.', emoji: '🎁' },
  { slug: 'finiquito', nombre: 'Finiquito', resumen: 'Lo que te deben al renunciar o al terminar tu trabajo.', emoji: '📄' },
  { slug: 'liquidacion', nombre: 'Liquidación', resumen: 'Indemnización por despido injustificado: 3 meses, prima de antigüedad y más.', emoji: '⚖️' },
  { slug: 'vacaciones', nombre: 'Vacaciones', resumen: 'Tus días de vacaciones con la reforma de vacaciones dignas y tu prima vacacional.', emoji: '🏖️' },
  { slug: 'isr', nombre: 'ISR de tu sueldo', resumen: 'Cuánto ISR te retienen y cuánto te queda libre cada mes o quincena.', emoji: '🧾' },
  { slug: 'gasolina', nombre: 'Gasolina', resumen: 'Precio de la gasolina hoy en tu municipio y la gasolinera más barata cerca de ti.', emoji: '⛽' },
  // Oculta hasta verificar las tasas (ver README): { slug: 'inversiones', nombre: 'Inversiones', resumen: 'Compara CETES, Nu, Mercado Pago y otras: cuánto ganarías ya con ISR y topes.', emoji: '📈' },
  { slug: 'intereses-tarjeta', nombre: 'Intereses de tarjeta', resumen: 'Cuánto tardas en pagar tu tarjeta y cuánto se va en intereses e IVA.', emoji: '💳' },
];
