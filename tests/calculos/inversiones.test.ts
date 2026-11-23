import { describe, expect, it } from 'vitest';
import type { OpcionInversion } from '@/data/inversiones';
import { OPCIONES_INVERSION } from '@/data/inversiones';
import { compararInversiones, interesDiario, simularOpcion, tasaPonderada, type ContextoInversion } from '@/lib/calculos/inversiones';

const ctxSinISR: ContextoInversion = {
  retencionISRAnual: 0,
  inflacionAnual: 4,
  udi: 8,
  ipabUDIs: 400000,
  prosofipoUDIs: 25000,
  exencionSofipoUMAsAnuales: 5,
  umaAnual: 36480, // → tope exento SOFIPO = $182,400
};
const ctx: ContextoInversion = { ...ctxSinISR, retencionISRAnual: 0.9 };

const base: Omit<OpcionInversion, 'id' | 'tramos'> = {
  institucion: 'Prueba',
  producto: 'Cuenta',
  tipo: 'banco',
  proteccion: 'ipab',
  liquidez: 'Diaria',
  capitalizacion: 'diario',
  baseDias: 365,
  fuente: 'https://example.com',
  verificado: null,
};
const cuenta = (tramos: OpcionInversion['tramos'], extra: Partial<OpcionInversion> = {}): OpcionInversion => ({ ...base, id: 'x', tramos, ...extra });

describe('tramos marginales', () => {
  const openbank = [
    { hasta: 30000, tasa: 13 },
    { hasta: 1000000, tasa: 7 },
    { hasta: null, tasa: 6.5 },
  ];
  it('tasa ponderada de $50,000 en Openbank = (30,000×13% + 20,000×7%) / 50,000 = 10.6%', () => {
    expect(tasaPonderada(50000, openbank)).toBeCloseTo(10.6, 10);
  });
  it('un tramo de 0% arriba del tope no paga nada', () => {
    expect(tasaPonderada(60000, [{ hasta: 30000, tasa: 15 }, { hasta: null, tasa: 0 }])).toBeCloseTo(7.5, 10);
  });
  it('interés diario con un solo tramo', () => {
    expect(interesDiario(36500, [{ hasta: null, tasa: 10 }], 365)).toBeCloseTo(10, 10);
  });
});

describe('simularOpcion — capitalización diaria', () => {
  it('$10,000 al 10% un año (365 días) sin ISR = 10,000 × (1 + 0.10/365)^365', () => {
    // 12 meses × 30.4 = 364.8 → 365 días (redondeo hacia arriba)
    const r = simularOpcion(cuenta([{ hasta: null, tasa: 10 }]), { monto: 10000, meses: 12 }, ctxSinISR);
    expect(r.dias).toBe(365);
    expect(r.saldoFinal).toBeCloseTo(10000 * (1 + 0.1 / 365) ** 365, 1); // 11,051.56
    expect(r.isrRetenido).toBe(0);
  });

  it('retención de 0.90% anual sobre el capital: $100,000 al 5% por un año ≈ 0.9% del saldo promedio', () => {
    const r = simularOpcion(cuenta([{ hasta: null, tasa: 5 }]), { monto: 100000, meses: 12 }, ctx);
    // El saldo crece de 100,000 a ~104,200 → retención entre 900 y 0.9% de 104,200
    expect(r.isrRetenido).toBeGreaterThan(900);
    expect(r.isrRetenido).toBeLessThan(938);
    expect(r.gananciaNeta).toBeCloseTo(r.interesBruto - r.isrRetenido, 1);
  });

  it('la retención nunca excede los intereses (art. 54 LISR)', () => {
    const r = simularOpcion(cuenta([{ hasta: null, tasa: 0.5 }]), { monto: 100000, meses: 12 }, ctx);
    expect(r.isrRetenido).toBeCloseTo(r.interesBruto, 2);
    expect(r.gananciaNeta).toBeCloseTo(0, 1);
  });

  it('SOFIPO: exenta si el saldo ≤ 5 UMA anuales; retiene si lo supera', () => {
    const sofipo = cuenta([{ hasta: null, tasa: 8 }], { tipo: 'sofipo', proteccion: 'prosofipo' });
    expect(simularOpcion(sofipo, { monto: 100000, meses: 12 }, ctx).isrRetenido).toBe(0);
    expect(simularOpcion(sofipo, { monto: 300000, meses: 12 }, ctx).isrRetenido).toBeGreaterThan(0);
  });

  it('aportaciones mensuales: 12 aportaciones de $1,000 en un año', () => {
    const r = simularOpcion(cuenta([{ hasta: null, tasa: 0 }]), { monto: 5000, aportacionMensual: 1000, meses: 12 }, ctxSinISR);
    expect(r.aportado).toBe(17000);
    expect(r.saldoFinal).toBe(17000);
    expect(r.gananciaNeta).toBe(0);
  });

  it('avisa cuando el saldo supera la cobertura (PROSOFIPO 25,000 UDIs × 8 = $200,000)', () => {
    const sofipo = cuenta([{ hasta: null, tasa: 5 }], { tipo: 'sofipo', proteccion: 'prosofipo' });
    const r = simularOpcion(sofipo, { monto: 250000, meses: 1 }, ctx);
    expect(r.coberturaPesos).toBe(200000);
    expect(r.excedeCobertura).toBe(true);
  });

  it('rendimiento real descuenta la inflación', () => {
    const r = simularOpcion(cuenta([{ hasta: null, tasa: 4 }]), { monto: 10000, meses: 12 }, ctxSinISR);
    expect(r.rendimientoRealAnual).toBeCloseTo(0, 0); // ~4% nominal vs 4% de inflación
  });

  it('valida entradas', () => {
    const c = cuenta([{ hasta: null, tasa: 5 }]);
    expect(() => simularOpcion(c, { monto: 0, meses: 12 }, ctx)).toThrow();
    expect(() => simularOpcion(c, { monto: -1, meses: 12 }, ctx)).toThrow();
    expect(() => simularOpcion(c, { monto: 1000, meses: 0 }, ctx)).toThrow();
  });
});

describe('simularOpcion — instrumentos a plazo (CETES)', () => {
  const cetes = cuenta([{ hasta: null, tasa: 7.2 }], { tipo: 'gobierno', proteccion: 'gobierno', capitalizacion: 'plazo', plazoDias: 28, baseDias: 360 });

  it('dos periodos de 28 días al 7.2% (base 360), reinvirtiendo', () => {
    // 1 mes = 30.4 → 30 días: solo vence 1 periodo. Usamos 2 meses = 61 días → 2 periodos (56 días).
    const r = simularOpcion(cetes, { monto: 10000, meses: 2 }, ctxSinISR);
    // periodo 1: 10,000 × 7.2% × 28/360 = 56 ; periodo 2: 10,056 × 0.0056 = 56.3136
    expect(r.interesBruto).toBeCloseTo(112.31, 2);
    expect(r.saldoFinal).toBeCloseTo(10112.31, 2);
    expect(r.diasSinInvertir).toBe(61 - 56);
  });

  it('retención proporcional al plazo: 10,000 × 0.9% × 28/365 por periodo', () => {
    const r = simularOpcion(cetes, { monto: 10000, meses: 1 }, ctx);
    expect(r.isrRetenido).toBeCloseTo((10000 * 0.009 * 28) / 365, 2);
  });

  it('las aportaciones esperan al siguiente vencimiento', () => {
    const r = simularOpcion({ ...cetes, tramos: [{ hasta: null, tasa: 0 }] }, { monto: 1000, aportacionMensual: 500, meses: 3 }, ctxSinISR);
    expect(r.aportado).toBe(2500);
    expect(r.saldoFinal).toBe(2500);
  });
});

describe('datos y comparador', () => {
  it('todas las opciones tienen tramos válidos y ordenados', () => {
    for (const o of OPCIONES_INVERSION) {
      expect(o.tramos.length).toBeGreaterThan(0);
      expect(o.tramos.at(-1)!.hasta).toBeNull();
      for (let i = 1; i < o.tramos.length - 1; i++) expect(o.tramos[i].hasta!).toBeGreaterThan(o.tramos[i - 1].hasta!);
      if (o.capitalizacion === 'plazo') expect(o.plazoDias).toBeGreaterThan(0);
      expect(o.fuente).toMatch(/^https:\/\//);
    }
  });

  it('ordena de mayor a menor ganancia neta', () => {
    const r = compararInversiones(OPCIONES_INVERSION, { monto: 50000, meses: 12 }, ctx);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].gananciaNeta).toBeGreaterThanOrEqual(r[i].gananciaNeta);
  });

  for (const o of OPCIONES_INVERSION.filter((x) => !x.verificado)) {
    it.todo(`VERIFICAR tasa: ${o.institucion} — ${o.producto}`);
  }
});
