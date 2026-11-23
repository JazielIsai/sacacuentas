/** Tabla de estaciones ordenable. Se prerenderiza completa (SEO) y en el navegador permite reordenar. */
import { useMemo, useState } from 'preact/hooks';
import type { Combustible } from '@/lib/gasolina/tipos';
import type { PuntoMapa } from './MapaEstaciones';

interface Fila extends PuntoMapa {
  distancia?: number;
}

type Orden = Combustible | 'nombre' | 'distancia';
const CLAVE: Record<Combustible, 'r' | 'p' | 'd'> = { regular: 'r', premium: 'p', diesel: 'd' };
const fmt = (n?: number) => (n === undefined ? '—' : `$${n.toFixed(2)}`);

export default function TablaEstaciones({ filas, ordenInicial = 'regular', limite }: { filas: Fila[]; ordenInicial?: Orden; limite?: number }) {
  const [orden, setOrden] = useState<Orden>(ordenInicial);
  const [verTodas, setVerTodas] = useState(false);

  const ordenadas = useMemo(() => {
    const arr = [...filas];
    if (orden === 'nombre') arr.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    else if (orden === 'distancia') arr.sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));
    else {
      const k = CLAVE[orden];
      arr.sort((a, b) => (a[k] ?? Infinity) - (b[k] ?? Infinity));
    }
    return arr;
  }, [filas, orden]);

  const mostradas = limite && !verTodas ? ordenadas.slice(0, limite) : ordenadas;
  const conDistancia = filas.some((f) => f.distancia !== undefined);

  const Encabezado = ({ id, texto, alinear = 'right' }: { id: Orden; texto: string; alinear?: 'left' | 'right' }) => (
    <th scope="col" class={`px-3 py-2.5 font-semibold text-${alinear}`} aria-sort={orden === id ? 'ascending' : 'none'}>
      <button type="button" class={`hover:text-marca-700 ${orden === id ? 'text-marca-800 underline underline-offset-4' : ''}`} onClick={() => setOrden(id)}>
        {texto}
      </button>
    </th>
  );

  return (
    <div class="tarjeta overflow-hidden">
      <div class="overflow-x-auto">
        <table class="num w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th scope="col" class="px-3 py-2.5 text-left font-semibold">#</th>
              <Encabezado id="nombre" texto="Estación" alinear="left" />
              {conDistancia && <Encabezado id="distancia" texto="Distancia" />}
              <Encabezado id="regular" texto="Regular" />
              <Encabezado id="premium" texto="Premium" />
              <Encabezado id="diesel" texto="Diésel" />
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {mostradas.map((f, i) => (
              <tr key={f.id} class="hover:bg-slate-50">
                <td class="px-3 py-2.5 text-slate-400">{i + 1}</td>
                <td class="max-w-[16rem] px-3 py-2.5">
                  <span class="block truncate font-medium text-slate-800" title={f.nombre}>{f.nombre}</span>
                  <a class="text-xs text-marca-700 hover:underline" href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`} target="_blank" rel="noopener nofollow">
                    Cómo llegar
                  </a>
                </td>
                {conDistancia && <td class="px-3 py-2.5 text-right text-slate-600">{f.distancia !== undefined ? `${f.distancia.toFixed(1)} km` : '—'}</td>}
                <td class={`px-3 py-2.5 text-right ${orden === 'regular' ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{fmt(f.r)}</td>
                <td class={`px-3 py-2.5 text-right ${orden === 'premium' ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{fmt(f.p)}</td>
                <td class={`px-3 py-2.5 text-right ${orden === 'diesel' ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{fmt(f.d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limite !== undefined && filas.length > limite && (
        <button type="button" class="w-full border-t border-slate-100 px-4 py-3 text-sm font-semibold text-marca-700 hover:bg-marca-50" onClick={() => setVerTodas(!verTodas)}>
          {verTodas ? 'Ver menos' : `Ver las ${filas.length} estaciones`}
        </button>
      )}
    </div>
  );
}
