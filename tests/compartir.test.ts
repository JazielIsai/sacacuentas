import { describe, expect, it } from 'vitest';
import { armarEnlace, armarMensaje, leerFragmento } from '@/lib/compartir';

const campos = {
  sueldo: { valor: '20,000.50', tipo: 'numero' as const },
  ingreso: { valor: '2024-02-29', tipo: 'fecha' as const },
  periodo: { valor: 'mensual', tipo: ['mensual', 'quincenal'] as const },
  veinte: { valor: '1', tipo: 'si' as const },
};

describe('compartir', () => {
  it('sin permiso no incluye datos ni resultado', () => {
    const url = armarEnlace('https://x.mx/isr/', null);
    expect(url).toBe('https://x.mx/isr/');
    expect(armarMensaje('Calculadora', null, url)).not.toContain('20');
  });
  it('los datos van solo en el fragmento y se recuperan completos', () => {
    const u = new URL(armarEnlace('https://x.mx/isr/', campos));
    expect(u.search).toBe('');
    expect(leerFragmento(u.hash, campos)).toEqual({ sueldo: '20,000.50', ingreso: '2024-02-29', periodo: 'mensual', veinte: '1' });
  });
  it('sobrevive a la codificación de WhatsApp', () => {
    const url = armarEnlace('https://x.mx/isr/', campos);
    expect(new URL(`https://wa.me/?text=${encodeURIComponent(url)}`).searchParams.get('text')).toBe(url);
  });
  it('ignora valores inválidos o desconocidos', () => {
    expect(leerFragmento('#sueldo=<script>&ingreso=2026-02-30&periodo=anual&veinte=si&otro=1', campos)).toEqual({});
  });
});
