import { useMemo, useState } from 'preact/hooks';
import { getValores } from '@/data';
import { CONTEXTO_INVERSION, FECHA_TASAS, OPCIONES_INVERSION, type Proteccion } from '@/data/inversiones';
import { dinero, formatearPaso, numero } from '@/lib/calculos/comunes';
import { compararInversiones, describirTramos, type ContextoInversion, type ResultadoOpcion } from '@/lib/calculos/inversiones';
import { aNumero, Campo, Formulario, InputDinero, Interruptor, intentar, Selector } from './ui';

const ctx: ContextoInversion = { ...CONTEXTO_INVERSION, umaAnual: getValores().uma.anual };

const PLAZOS: [string, string][] = [
  ['1', '1 mes'],
  ['3', '3 meses'],
  ['6', '6 meses'],
  ['12', '1 año'],
  ['24', '2 años'],
  ['36', '3 años'],
  ['60', '5 años'],
];

const ETIQUETA_PROTECCION: Record<Proteccion, { texto: string; clase: string }> = {
  gobierno: { texto: 'Gobierno federal', clase: 'bg-sky-50 text-sky-800 ring-sky-200' },
  ipab: { texto: 'IPAB', clase: 'bg-marca-50 text-marca-800 ring-marca-200' },
  prosofipo: { texto: 'PROSOFIPO', clase: 'bg-violet-50 text-violet-800 ring-violet-200' },
  ninguna: { texto: 'Sin seguro de depósitos', clase: 'bg-amber-50 text-amber-800 ring-amber-200' },
  'por-confirmar': { texto: 'Protección por confirmar', clase: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

const fechaTasas = new Date(`${FECHA_TASAS}T12:00:00Z`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const pendientes = OPCIONES_INVERSION.filter((o) => !o.verificado).length;

function Fila({ r, maximo, posicion }: { r: ResultadoOpcion; maximo: number; posicion: number }) {
  const [abierto, setAbierto] = useState(false);
  const p = ETIQUETA_PROTECCION[r.opcion.proteccion];
  const ancho = maximo > 0 ? Math.max(2, (r.gananciaNeta / maximo) * 100) : 0;

  return (
    <li class={`tarjeta overflow-hidden ${posicion === 1 ? 'border-marca-500 ring-1 ring-marca-500' : ''}`}>
      <button
        type="button"
        class="w-full px-4 py-4 text-left hover:bg-slate-50 sm:px-5"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="num text-xs font-bold text-slate-400">{`#${posicion}`}</span>
              <span class="font-bold text-slate-900">{r.opcion.institucion}</span>
              <span class={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${p.clase}`}>{p.texto}</span>
            </p>
            <p class="mt-0.5 text-sm text-slate-600">{r.opcion.producto}</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="num text-lg font-extrabold text-marca-800">{`+${dinero(r.gananciaNeta)}`}</p>
            <p class="num text-xs text-slate-500">{`${numero(Math.round(r.rendimientoNetoAnual * 100) / 100)}% neto anual`}</p>
          </div>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div class="h-full rounded-full bg-marca-500" style={{ width: `${ancho}%` }} />
        </div>
        <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>{`Tasa: ${describirTramos(r.opcion.tramos)}`}</span>
          <span>{`Liquidez: ${r.opcion.liquidez}`}</span>
          {r.opcion.requisitos && <span class="font-medium text-amber-700">Con requisitos</span>}
        </p>
      </button>

      {abierto && (
        <div class="border-t border-slate-100 px-4 py-4 sm:px-5">
          {r.avisos.length > 0 && (
            <ul class="mb-4 space-y-1.5">
              {r.avisos.map((a) => (
                <li class="flex gap-2 text-sm text-slate-700">
                  <span class="text-marca-700" aria-hidden="true">●</span>
                  {a}
                </li>
              ))}
            </ul>
          )}
          <ol class="divide-y divide-slate-100">
            {r.pasos.map((paso, i) => (
              <li class={`flex items-start justify-between gap-4 py-2 text-sm ${paso.destacado ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                <div class="min-w-0">
                  <span class="num mr-2 text-xs text-slate-400">{`${i + 1}.`}</span>
                  {paso.etiqueta}
                  {paso.formula && <span class="num mt-0.5 block break-words text-xs font-normal text-slate-500">{paso.formula}</span>}
                  {paso.fundamento && <span class="mt-0.5 block text-xs font-normal text-marca-700">{paso.fundamento}</span>}
                </div>
                <span class="num shrink-0 text-right">{formatearPaso(paso)}</span>
              </li>
            ))}
          </ol>
          <p class="mt-3 text-xs text-slate-500">
            Confirma la tasa en:{' '}
            <a class="text-marca-700 underline" href={r.opcion.fuente} target="_blank" rel="noopener nofollow">
              {new URL(r.opcion.fuente).hostname}
            </a>
          </p>
        </div>
      )}
    </li>
  );
}

export default function CalcInversiones() {
  const [monto, setMonto] = useState('50000');
  const [aportacion, setAportacion] = useState('0');
  const [meses, setMeses] = useState('12');
  const [sinRequisitos, setSinRequisitos] = useState(false);

  const res = useMemo(() => {
    const opciones = sinRequisitos ? OPCIONES_INVERSION.filter((o) => !o.requisitos) : OPCIONES_INVERSION;
    return intentar(() =>
      compararInversiones(opciones, { monto: aNumero(monto) || 0, aportacionMensual: aNumero(aportacion) || 0, meses: Number(meses) }, ctx),
    );
  }, [monto, aportacion, meses, sinRequisitos]);

  const mejor = res.ok ? res.r[0] : null;
  const maximo = mejor ? Math.max(0, mejor.gananciaNeta) : 0;

  return (
    <div class="space-y-6">
      <Formulario>
        <div class="grid gap-5 sm:grid-cols-3">
          <Campo label="¿Cuánto vas a invertir?">{(id) => <InputDinero id={id} value={monto} onInput={setMonto} />}</Campo>
          <Campo label="Aportación mensual" ayuda="Opcional. Lo que agregarías cada mes.">
            {(id) => <InputDinero id={id} value={aportacion} onInput={setAportacion} />}
          </Campo>
          <Campo label="Plazo">{(id) => <Selector id={id} value={meses} onChange={setMeses} opciones={PLAZOS} />}</Campo>
        </div>
        <Interruptor
          checked={sinRequisitos}
          onChange={setSinRequisitos}
          label="Ocultar opciones con requisitos"
          ayuda="Quita las que piden suscripción, gasto mínimo o nómina para dar su mejor tasa."
        />
      </Formulario>

      <section aria-live="polite" aria-label="Comparativa">
        {!res.ok ? (
          <p class="tarjeta px-5 py-4 font-semibold text-amber-800">{res.error}</p>
        ) : (
          <>
            {mejor && (
              <div class="tarjeta overflow-hidden">
                <div class="bg-marca-800 px-5 py-5 text-white sm:px-6">
                  <p class="text-sm font-medium text-marca-100">Donde más ganarías (neto de ISR)</p>
                  <p class="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {mejor.opcion.institucion}
                    <span class="font-semibold text-marca-100">{` · ${mejor.opcion.producto}`}</span>
                  </p>
                  <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/15 pt-4 text-sm sm:grid-cols-4">
                    <div>
                      <dt class="text-marca-100">Ganancia neta</dt>
                      <dd class="num font-semibold">{dinero(mejor.gananciaNeta)}</dd>
                    </div>
                    <div>
                      <dt class="text-marca-100">Saldo final</dt>
                      <dd class="num font-semibold">{dinero(mejor.saldoFinal)}</dd>
                    </div>
                    <div>
                      <dt class="text-marca-100">Neto anual</dt>
                      <dd class="num font-semibold">{`${numero(Math.round(mejor.rendimientoNetoAnual * 100) / 100)}%`}</dd>
                    </div>
                    <div>
                      <dt class="text-marca-100">Real (vs. inflación)</dt>
                      <dd class="num font-semibold">{`${numero(Math.round(mejor.rendimientoRealAnual * 100) / 100)}%`}</dd>
                    </div>
                  </dl>
                </div>
                <p class="bg-amber-50 px-5 py-2.5 text-xs font-medium text-amber-900 sm:px-6">
                  {`Tasas de referencia al ${fechaTasas}. Cambian seguido: confírmalas en la app de cada institución antes de invertir. No es recomendación de inversión.`}
                  {import.meta.env.DEV && pendientes > 0 && <strong class="block text-red-700">{`[DEV] ${pendientes} tasas sin verificar en src/data/inversiones.ts`}</strong>}
                </p>
              </div>
            )}

            <p class="mt-6 text-sm text-slate-600">Toca cualquier opción para ver el cálculo paso a paso.</p>
            <ol class="mt-3 space-y-3">
              {res.r.map((r, i) => (
                <Fila key={r.opcion.id} r={r} maximo={maximo} posicion={i + 1} />
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
