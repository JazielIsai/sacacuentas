/** Botón "cerca de mí": pide la ubicación, descarga el listado nacional (JSON estático) y calcula distancias en el navegador. */
import { useMemo, useState } from 'preact/hooks';
import { distanciaKm } from '@/lib/gasolina/geo';
import type { Combustible } from '@/lib/gasolina/tipos';
import MapaEstaciones, { type PuntoMapa } from './MapaEstaciones';
import TablaEstaciones from './TablaEstaciones';

/** Formato compacto de /gasolina/estaciones.json: [id, lat, lng, nombre, regular, premium, diesel, cvegeo] */
type Compacta = [number, number, number, string, number | null, number | null, number | null, string | null];

type Estado = { tipo: 'inicio' } | { tipo: 'cargando' } | { tipo: 'error'; mensaje: string } | { tipo: 'listo'; yo: { lat: number; lng: number }; todas: Compacta[] };

export default function CercaDeMi() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicio' });
  const [radio, setRadio] = useState(5);
  const [combustible, setCombustible] = useState<Combustible>('regular');

  async function buscar() {
    if (!('geolocation' in navigator)) {
      setEstado({ tipo: 'error', mensaje: 'Tu navegador no permite obtener la ubicación.' });
      return;
    }
    setEstado({ tipo: 'cargando' });
    const datos = fetch('/gasolina/estaciones.json').then((r) => {
      if (!r.ok) throw new Error('No se pudo cargar el listado de gasolineras.');
      return r.json() as Promise<{ e: Compacta[] }>;
    });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { e } = await datos;
          setEstado({ tipo: 'listo', yo: { lat: pos.coords.latitude, lng: pos.coords.longitude }, todas: e });
        } catch (err) {
          setEstado({ tipo: 'error', mensaje: (err as Error).message });
        }
      },
      (err) =>
        setEstado({
          tipo: 'error',
          mensaje: err.code === err.PERMISSION_DENIED ? 'No diste permiso para usar tu ubicación. Actívalo en tu navegador e inténtalo otra vez.' : 'No pudimos obtener tu ubicación. Inténtalo de nuevo.',
        }),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }

  const cercanas = useMemo(() => {
    if (estado.tipo !== 'listo') return [];
    const { yo, todas } = estado;
    return todas
      .map(([id, lat, lng, nombre, r, p, d]) => ({ id, lat, lng, nombre, r: r ?? undefined, p: p ?? undefined, d: d ?? undefined, distancia: distanciaKm(yo.lat, yo.lng, lat, lng) }))
      .filter((x) => x.distancia <= radio)
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 150);
  }, [estado, radio]);

  return (
    <section class="tarjeta p-5 sm:p-6" aria-labelledby="cerca-titulo">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="cerca-titulo" class="text-xl font-bold tracking-tight">Gasolineras cerca de ti</h2>
          <p class="mt-1 text-sm text-slate-600">Calculamos las distancias en tu navegador y no guardamos tu ubicación. El mapa carga la zona desde OpenStreetMap.</p>
        </div>
        <button
          type="button"
          onClick={buscar}
          disabled={estado.tipo === 'cargando'}
          class="inline-flex items-center gap-2 rounded-xl bg-marca-700 px-5 py-3 font-semibold text-white shadow-sm hover:bg-marca-800 disabled:opacity-60"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd"/></svg>
          {estado.tipo === 'cargando' ? 'Buscando…' : estado.tipo === 'listo' ? 'Actualizar ubicación' : 'Buscar cerca de mí'}
        </button>
      </div>

      {estado.tipo === 'error' && <p class="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{estado.mensaje}</p>}

      {estado.tipo === 'listo' && (
        <div class="mt-5 space-y-4">
          <div class="flex flex-wrap gap-3 text-sm">
            <label class="flex items-center gap-2">
              Radio
              <select class="campo-input w-auto py-1.5" value={radio} onChange={(e) => setRadio(Number((e.target as HTMLSelectElement).value))}>
                {[2, 5, 10, 20].map((r) => <option value={r}>{`${r} km`}</option>)}
              </select>
            </label>
            <label class="flex items-center gap-2">
              Combustible
              <select class="campo-input w-auto py-1.5" value={combustible} onChange={(e) => setCombustible((e.target as HTMLSelectElement).value as Combustible)}>
                <option value="regular">Regular</option>
                <option value="premium">Premium</option>
                <option value="diesel">Diésel</option>
              </select>
            </label>
          </div>
          {cercanas.length === 0 ? (
            <p class="text-sm text-slate-600">{`No encontramos gasolineras a menos de ${radio} km. Prueba con un radio mayor.`}</p>
          ) : (
            <>
              <MapaEstaciones puntos={cercanas as PuntoMapa[]} combustible={combustible} yo={estado.yo} alto="360px" />
              <TablaEstaciones key={combustible} filas={cercanas} ordenInicial={combustible} limite={20} />
            </>
          )}
        </div>
      )}
    </section>
  );
}
