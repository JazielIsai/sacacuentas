/**
 * Compartir por WhatsApp. Los datos viajan en el fragmento (#...) de la URL, que el
 * navegador NO envía al servidor, y solo se incluyen si la persona lo activa.
 */
import { useEffect, useState } from 'preact/hooks';
import { armarEnlace, armarMensaje, leerFragmento, type CampoEnlace } from '@/lib/compartir';
import { Interruptor } from './ui';

/** Rellena el formulario con los datos del enlace, si los trae. */
export function useDatosDeEnlace(campos: Record<string, CampoEnlace>) {
  useEffect(() => {
    const aplicar = () => {
      const datos = leerFragmento(location.hash, campos);
      for (const [k, v] of Object.entries(datos)) campos[k].poner(v);
    };
    aplicar();
    addEventListener('hashchange', aplicar);
    return () => removeEventListener('hashchange', aplicar);
  }, []);
}

export function Compartir({ nombre, resultado, campos }: { nombre: string; resultado: string; campos: Record<string, CampoEnlace> }) {
  const [incluir, setIncluir] = useState(false);
  const [aviso, setAviso] = useState('');
  const enlace = () => armarEnlace(location.origin + location.pathname, incluir ? campos : null);

  return (
    <div class="mt-5 space-y-3 border-t border-slate-100 pt-5">
      <Interruptor
        checked={incluir}
        onChange={(x) => {
          setIncluir(x);
          setAviso('');
        }}
        label="Incluir mis datos y mi resultado"
        ayuda="Quien reciba el enlace verá lo que escribiste. Si no lo activas, solo se comparte la calculadora."
      />
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-xl bg-marca-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-marca-800"
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(armarMensaje(nombre, incluir ? resultado : null, enlace()))}`, '_blank', 'noopener,noreferrer')}
        >
          Compartir por WhatsApp
        </button>
        <button
          type="button"
          class="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(enlace());
              setAviso('Enlace copiado.');
            } catch {
              setAviso(`Copia este enlace: ${enlace()}`);
            }
          }}
        >
          Copiar enlace
        </button>
      </div>
      <p class="break-all text-xs text-slate-600" role="status">{aviso}</p>
    </div>
  );
}
