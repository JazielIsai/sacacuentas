import { describe, expect, it } from 'vitest';
import type { FeatureCollection, Polygon } from 'geojson';
import { crearIndiceMunicipios, distanciaKm, slugify, type PropsMunicipio } from '@/lib/gasolina/geo';

describe('slugify', () => {
  it.each([
    ['San Pedro Garza García', 'san-pedro-garza-garcia'],
    ['Cuauhtémoc', 'cuauhtemoc'],
    ['Peñón Blanco', 'penon-blanco'],
    ['Heroica Ciudad de Juchitán de Zaragoza', 'heroica-ciudad-de-juchitan-de-zaragoza'],
    ["Dr. Arroyo (Nuevo León)", 'dr-arroyo-nuevo-leon'],
  ])('%s → %s', (a, b) => expect(slugify(a)).toBe(b));
});

describe('distanciaKm (haversine)', () => {
  it('Monterrey ↔ CDMX ≈ 706 km en línea recta', () => {
    expect(distanciaKm(25.6866, -100.3161, 19.4326, -99.1332)).toBeCloseTo(706, -1);
  });
  it('mismo punto = 0', () => {
    expect(distanciaKm(20, -100, 20, -100)).toBe(0);
  });
});

describe('crearIndiceMunicipios', () => {
  const cuadro = (cvegeo: string, x0: number, y0: number): FeatureCollection<Polygon, PropsMunicipio>['features'][number] => ({
    type: 'Feature',
    properties: { cvegeo, cve_ent: cvegeo.slice(0, 2), cve_mun: cvegeo.slice(2), nomgeo: `Mun ${cvegeo}` },
    geometry: { type: 'Polygon', coordinates: [[[x0, y0], [x0 + 1, y0], [x0 + 1, y0 + 1], [x0, y0 + 1], [x0, y0]]] },
  });
  const fc: FeatureCollection<Polygon, PropsMunicipio> = { type: 'FeatureCollection', features: [cuadro('19001', -101, 25), cuadro('19002', -100, 25)] };
  const ubicar = crearIndiceMunicipios(fc);

  it('ubica un punto dentro de su polígono', () => {
    expect(ubicar(25.5, -100.5)?.cvegeo).toBe('19001');
    expect(ubicar(25.5, -99.5)?.cvegeo).toBe('19002');
  });
  it('rescata puntos justo fuera del borde (huecos por simplificación)', () => {
    expect(ubicar(24.997, -100.5)?.cvegeo).toBe('19001');
  });
  it('devuelve null si está lejos de todo', () => {
    expect(ubicar(20, -90)).toBeNull();
  });
});
