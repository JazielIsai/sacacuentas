import { describe, expect, it } from 'vitest';
import { normalizar, mediana } from '@/lib/gasolina/normalizar';

const places = `﻿<?xml version="1.0" encoding="utf-8"?>
<places>
  <place place_id="1"><name>  ESTACION   UNO </name><cre_id>PL/1/EXP/ES/2015</cre_id><location><x>-100.31</x><y>25.67</y></location></place>
  <place place_id="2"><name>DOS</name><cre_id>PL/2/EXP/ES/2015</cre_id><location><x>0</x><y>0</y></location></place>
  <place place_id="3"><name>TRES</name><cre_id>PL/3/EXP/ES/2015</cre_id><location><x>-99.13</x><y>19.43</y></location></place>
  <place place_id="4"><name>CUATRO</name><cre_id>PL/4/EXP/ES/2015</cre_id><location><x>-103.35</x><y>20.67</y></location></place>
</places>`;

const prices = `<?xml version="1.0" encoding="utf-8"?>
<places>
  <place place_id="1"><gas_price type="regular">23.5</gas_price></place>
  <place place_id="1"><gas_price type="diesel">26.9</gas_price></place>
  <place place_id="2"><gas_price type="regular">23</gas_price></place>
  <place place_id="3"><gas_price type="regular">0.01</gas_price><gas_price type="premium">28.4</gas_price></place>
  <place place_id="99"><gas_price type="regular">24</gas_price></place>
</places>`;

describe('normalizar (XML de la CNE)', () => {
  const { estaciones, descartes } = normalizar(places, prices);

  it('combina entradas repetidas de una estación (combustibles separados)', () => {
    const e1 = estaciones.find((e) => e.id === 1)!;
    expect(e1.precios).toEqual({ regular: 23.5, diesel: 26.9 });
  });

  it('limpia espacios del nombre y conserva permiso y coordenadas', () => {
    const e1 = estaciones.find((e) => e.id === 1)!;
    expect(e1.nombre).toBe('ESTACION UNO');
    expect(e1.permiso).toBe('PL/1/EXP/ES/2015');
    expect([e1.lat, e1.lng]).toEqual([25.67, -100.31]);
  });

  it('descarta coordenadas inválidas (0,0)', () => {
    expect(estaciones.find((e) => e.id === 2)).toBeUndefined();
    expect(descartes.coordenadas).toBe(1);
  });

  it('descarta precios fuera de rango pero conserva los demás combustibles', () => {
    expect(estaciones.find((e) => e.id === 3)!.precios).toEqual({ premium: 28.4 });
    expect(descartes.preciosFueraDeRango).toBe(1);
  });

  it('omite estaciones sin precio y precios sin estación', () => {
    expect(estaciones.find((e) => e.id === 4)).toBeUndefined();
    expect(descartes.sinPrecio).toBe(1);
    expect(estaciones.map((e) => e.id)).toEqual([1, 3]);
  });

  it('descarta atípicos respecto a la mediana nacional (con suficientes datos)', () => {
    const n = 30;
    const pl = `<places>${Array.from({ length: n }, (_, i) => `<place place_id="${i}"><name>E${i}</name><cre_id>P${i}</cre_id><location><x>-100</x><y>25</y></location></place>`).join('')}</places>`;
    // 29 estaciones a $24 y una a $16 (66% de la mediana) → la de $16 se descarta
    const pr = `<places>${Array.from({ length: n }, (_, i) => `<place place_id="${i}"><gas_price type="regular">${i === 0 ? 16 : 24}</gas_price></place>`).join('')}</places>`;
    const r = normalizar(pl, pr);
    expect(r.descartes.preciosAtipicos).toBe(1);
    expect(r.estaciones).toHaveLength(n - 1);
  });

  it('mediana', () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 2, 3])).toBe(2.5);
  });
});
