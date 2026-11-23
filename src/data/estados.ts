/**
 * Entidades federativas: clave INEGI (cve_ent), nombre corto para mostrar y slug para la URL.
 * Los nombres oficiales largos (p. ej. "Veracruz de Ignacio de la Llave") se acortan
 * al nombre de uso común, que es como la gente busca.
 */
export interface Estado {
  cve: string;
  nombre: string;
  slug: string;
}

export const ESTADOS: Estado[] = [
  { cve: '01', nombre: 'Aguascalientes', slug: 'aguascalientes' },
  { cve: '02', nombre: 'Baja California', slug: 'baja-california' },
  { cve: '03', nombre: 'Baja California Sur', slug: 'baja-california-sur' },
  { cve: '04', nombre: 'Campeche', slug: 'campeche' },
  { cve: '05', nombre: 'Coahuila', slug: 'coahuila' },
  { cve: '06', nombre: 'Colima', slug: 'colima' },
  { cve: '07', nombre: 'Chiapas', slug: 'chiapas' },
  { cve: '08', nombre: 'Chihuahua', slug: 'chihuahua' },
  { cve: '09', nombre: 'Ciudad de México', slug: 'ciudad-de-mexico' },
  { cve: '10', nombre: 'Durango', slug: 'durango' },
  { cve: '11', nombre: 'Guanajuato', slug: 'guanajuato' },
  { cve: '12', nombre: 'Guerrero', slug: 'guerrero' },
  { cve: '13', nombre: 'Hidalgo', slug: 'hidalgo' },
  { cve: '14', nombre: 'Jalisco', slug: 'jalisco' },
  { cve: '15', nombre: 'Estado de México', slug: 'estado-de-mexico' },
  { cve: '16', nombre: 'Michoacán', slug: 'michoacan' },
  { cve: '17', nombre: 'Morelos', slug: 'morelos' },
  { cve: '18', nombre: 'Nayarit', slug: 'nayarit' },
  { cve: '19', nombre: 'Nuevo León', slug: 'nuevo-leon' },
  { cve: '20', nombre: 'Oaxaca', slug: 'oaxaca' },
  { cve: '21', nombre: 'Puebla', slug: 'puebla' },
  { cve: '22', nombre: 'Querétaro', slug: 'queretaro' },
  { cve: '23', nombre: 'Quintana Roo', slug: 'quintana-roo' },
  { cve: '24', nombre: 'San Luis Potosí', slug: 'san-luis-potosi' },
  { cve: '25', nombre: 'Sinaloa', slug: 'sinaloa' },
  { cve: '26', nombre: 'Sonora', slug: 'sonora' },
  { cve: '27', nombre: 'Tabasco', slug: 'tabasco' },
  { cve: '28', nombre: 'Tamaulipas', slug: 'tamaulipas' },
  { cve: '29', nombre: 'Tlaxcala', slug: 'tlaxcala' },
  { cve: '30', nombre: 'Veracruz', slug: 'veracruz' },
  { cve: '31', nombre: 'Yucatán', slug: 'yucatan' },
  { cve: '32', nombre: 'Zacatecas', slug: 'zacatecas' },
];

export const ESTADO_POR_CVE: Record<string, Estado> = Object.fromEntries(ESTADOS.map((e) => [e.cve, e]));
