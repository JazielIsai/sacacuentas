import { describe, expect, it } from 'vitest';
import { calcularIntereses, pagoMinimo } from '@/lib/calculos/intereses-tarjeta';
import { vPrueba } from '../fixture';

describe('pagoMinimo (regla Banxico)', () => {
  it('1.5% del saldo + intereses + IVA', () => {
    expect(pagoMinimo(10000, 500, 80)).toBe(730);
  });
  it('o 1.25% de la línea si es mayor', () => {
    expect(pagoMinimo(10000, 500, 80, 100000)).toBe(1250);
  });
});

describe('calcularIntereses', () => {
  it('liquida $1,000 al 12% anual pagando $600 al mes en 2 meses', () => {
    const r = calcularIntereses({ saldo: 1000, tasaAnual: 12, modo: 'fijo', pagoMensual: 600 }, vPrueba);
    expect(r.liquidable).toBe(true);
    expect(r.meses).toBe(2);
    expect(r.tabla[0]).toMatchObject({ interes: 10, iva: 1.6, saldoFinal: 411.6 });
    expect(r.tabla[1]).toMatchObject({ interes: 4.12, iva: 0.66, pago: 416.38, saldoFinal: 0 });
    expect(r.totalPagado).toBe(1016.38);
    expect(r.totalIntereses).toBe(14.12);
    expect(r.totalIva).toBe(2.26);
  });

  it('un pago que no cubre intereses + IVA nunca liquida', () => {
    const r = calcularIntereses({ saldo: 10000, tasaAnual: 60, modo: 'fijo', pagoMensual: 500 }, vPrueba);
    expect(r.liquidable).toBe(false);
    expect(r.avisos[0]).toMatch(/nunca terminas/);
  });

  it('pagando el mínimo tarda muchísimo más que con un pago fijo', () => {
    const min = calcularIntereses({ saldo: 10000, tasaAnual: 60, modo: 'minimo' }, vPrueba);
    const fijo = calcularIntereses({ saldo: 10000, tasaAnual: 60, modo: 'fijo', pagoMensual: 1500 }, vPrueba);
    expect(min.meses).toBeGreaterThan(fijo.meses * 3);
    expect(min.totalPagado).toBeGreaterThan(fijo.totalPagado);
  });
});
