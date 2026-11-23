/**
 * Mapa con Leaflet + OpenStreetMap. Leaflet se carga solo en el navegador
 * (import dinámico) para no romper el prerenderizado.
 */
import { useEffect, useRef } from 'preact/hooks';
import type { Combustible } from '@/lib/gasolina/tipos';
import 'leaflet/dist/leaflet.css';

export interface PuntoMapa {
  id: number;
  lat: number;
  lng: number;
  nombre: string;
  r?: number;
  p?: number;
  d?: number;
}

interface Props {
  puntos: PuntoMapa[];
  combustible?: Combustible;
  /** Punto del usuario ("cerca de mí"). */
  yo?: { lat: number; lng: number } | null;
  alto?: string;
}

const CLAVE: Record<Combustible, 'r' | 'p' | 'd'> = { regular: 'r', premium: 'p', diesel: 'd' };

function escapar(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const fmt = (n?: number) => (n === undefined ? '—' : `$${n.toFixed(2)}`);

/**
 * Verde (barata) → ámbar → rojo (cara) según el PERCENTIL del precio dentro del mapa
 * (tercio más barato, medio y más caro). Así un solo precio atípico no pinta todo de rojo.
 */
function color(precio: number | undefined, ordenados: number[]) {
  if (precio === undefined || ordenados.length === 0) return '#94a3b8';
  if (ordenados[0] === ordenados[ordenados.length - 1]) return '#059669';
  let menores = 0;
  while (menores < ordenados.length && ordenados[menores] < precio) menores++;
  const t = menores / ordenados.length;
  if (t < 1 / 3) return '#059669';
  if (t < 2 / 3) return '#d97706';
  return '#dc2626';
}

export default function MapaEstaciones({ puntos, combustible = 'regular', yo = null, alto = '420px' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapa = useRef<import('leaflet').Map | null>(null);
  const capa = useRef<import('leaflet').LayerGroup | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelado || !ref.current) return;
      if (!mapa.current) {
        mapa.current = L.map(ref.current, { preferCanvas: true, scrollWheelZoom: false });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapa.current);
      }
      capa.current?.remove();
      const grupo = L.layerGroup().addTo(mapa.current);
      capa.current = grupo;

      const k = CLAVE[combustible];
      const ordenados = puntos
        .map((p) => p[k])
        .filter((x): x is number => x !== undefined)
        .sort((a, b) => a - b);

      for (const p of puntos) {
        L.circleMarker([p.lat, p.lng], { radius: 7, weight: 1.5, color: '#fff', fillColor: color(p[k], ordenados), fillOpacity: 0.95 })
          .bindPopup(
            `<strong>${escapar(p.nombre)}</strong><br>` +
              `Regular: <b>${fmt(p.r)}</b> · Premium: <b>${fmt(p.p)}</b> · Diésel: <b>${fmt(p.d)}</b><br>` +
              `<a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener">Cómo llegar →</a>`,
          )
          .addTo(grupo);
      }
      if (yo) {
        L.circleMarker([yo.lat, yo.lng], { radius: 9, weight: 3, color: '#fff', fillColor: '#2563eb', fillOpacity: 1 }).bindTooltip('Tú').addTo(grupo);
      }

      const coords: [number, number][] = puntos.map((p) => [p.lat, p.lng]);
      if (yo) coords.push([yo.lat, yo.lng]);
      if (coords.length === 1) mapa.current.setView(coords[0], 15);
      else if (coords.length) mapa.current.fitBounds(L.latLngBounds(coords), { padding: [24, 24], maxZoom: 15 });
    })();
    return () => {
      cancelado = true;
    };
  }, [puntos, combustible, yo]);

  useEffect(() => () => mapa.current?.remove(), []);

  return (
    <div>
      <div ref={ref} style={{ height: alto }} class="z-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" role="region" aria-label="Mapa de gasolineras" />
      <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-[#059669]" />Tercio más barato</span>
        <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-[#d97706]" />Medio</span>
        <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-[#dc2626]" />Tercio más caro</span>
        <span>{`Colores según ${combustible === 'diesel' ? 'diésel' : combustible}. Toca un punto para ver precios.`}</span>
      </p>
    </div>
  );
}
