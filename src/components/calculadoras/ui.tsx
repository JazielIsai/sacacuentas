import type { ComponentChildren } from 'preact';
import { useEffect, useId, useState } from 'preact/hooks';
import { dinero, formatearPaso, type Paso } from '@/lib/calculos/comunes';

/** Fecha de hoy en hora local, como 'YYYY-MM-DD'. */
export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Estado que arranca con un valor determinista (para que el HTML prerenderizado
 * coincida con la hidratación) y se actualiza a "hoy" ya en el navegador.
 */
export function useFechaHoy(inicial: string): [string, (v: string) => void] {
  const [v, setV] = useState(inicial);
  useEffect(() => setV(hoyISO()), []);
  return [v, setV];
}

/** Convierte texto del usuario ("12,500.50", "$9 000") a número. */
export function aNumero(s: string): number {
  const limpio = s.replace(/[$\s,]/g, '');
  return limpio === '' ? NaN : Number(limpio);
}

/** Ejecuta un cálculo atrapando errores de validación para mostrarlos en la UI. */
export function intentar<T>(fn: () => T): { ok: true; r: T } | { ok: false; error: string } {
  try {
    return { ok: true, r: fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Revisa los datos' };
  }
}

export function Formulario({ children }: { children: ComponentChildren }) {
  return (
    <form class="tarjeta space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} noValidate>
      {children}
    </form>
  );
}

interface CampoProps {
  label: string;
  ayuda?: string;
  children: (id: string) => ComponentChildren;
}

export function Campo({ label, ayuda, children }: CampoProps) {
  const id = useId();
  return (
    <div>
      <label for={id} class="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div class="mt-1.5">{children(id)}</div>
      {ayuda && <p class="mt-1.5 text-xs text-slate-500">{ayuda}</p>}
    </div>
  );
}

export function InputDinero({ id, value, onInput }: { id: string; value: string; onInput: (v: string) => void }) {
  return (
    <div class="relative">
      <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">$</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        class="campo-input num pl-7"
        value={value}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
      />
    </div>
  );
}

export function InputNumero(props: { id: string; value: string; onInput: (v: string) => void; sufijo?: string; min?: number; step?: string }) {
  return (
    <div class="relative">
      <input
        id={props.id}
        type="number"
        inputMode="decimal"
        min={props.min ?? 0}
        step={props.step ?? 'any'}
        class={`campo-input num ${props.sufijo ? 'pr-16' : ''}`}
        value={props.value}
        onInput={(e) => props.onInput((e.target as HTMLInputElement).value)}
      />
      {props.sufijo && <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">{props.sufijo}</span>}
    </div>
  );
}

export function InputFecha({ id, value, onInput }: { id: string; value: string; onInput: (v: string) => void }) {
  return <input id={id} type="date" class="campo-input num" value={value} onInput={(e) => onInput((e.target as HTMLInputElement).value)} />;
}

export function Selector<T extends string>(props: { id: string; value: T; onChange: (v: T) => void; opciones: [T, string][] }) {
  return (
    <select id={props.id} class="campo-input" value={props.value} onChange={(e) => props.onChange((e.target as HTMLSelectElement).value as T)}>
      {props.opciones.map(([v, t]) => (
        <option value={v}>{t}</option>
      ))}
    </select>
  );
}

export function Interruptor({ checked, onChange, label, ayuda }: { checked: boolean; onChange: (v: boolean) => void; label: string; ayuda?: string }) {
  const id = useId();
  return (
    <div class="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        class="mt-1 h-4 w-4 rounded border-slate-300 accent-marca-600"
        checked={checked}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      />
      <label for={id} class="text-sm">
        <span class="font-semibold text-slate-800">{label}</span>
        {ayuda && <span class="mt-0.5 block text-xs text-slate-500">{ayuda}</span>}
      </label>
    </div>
  );
}

export function Fila({ children }: { children: ComponentChildren }) {
  return <div class="grid gap-5 sm:grid-cols-2">{children}</div>;
}

interface ResumenItem {
  etiqueta: string;
  valor: string;
}

interface PanelProps {
  titulo: string;
  total?: number;
  /** Texto alternativo al total (p. ej. "Nunca se liquida"). */
  totalTexto?: string;
  resumen?: ResumenItem[];
  pasos?: Paso[];
  avisos?: string[];
  error?: string;
  children?: ComponentChildren;
}

export function PanelResultado({ titulo, total, totalTexto, resumen = [], pasos = [], avisos = [], error, children }: PanelProps) {
  return (
    <section class="tarjeta overflow-hidden" aria-live="polite" aria-label="Resultado">
      <div class="bg-marca-800 px-5 py-5 text-white sm:px-6">
        <p class="text-sm font-medium text-marca-100">{titulo}</p>
        {error ? (
          <p class="mt-1 text-lg font-semibold text-amber-200">{error}</p>
        ) : (
          <p class="num mt-1 text-4xl font-extrabold tracking-tight">{totalTexto ?? (total !== undefined ? dinero(total) : '—')}</p>
        )}
        {!error && resumen.length > 0 && (
          <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/15 pt-4 text-sm">
            {resumen.map((r) => (
              <div>
                <dt class="text-marca-100">{r.etiqueta}</dt>
                <dd class="num font-semibold">{r.valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {!error && (
        <div class="px-5 py-5 sm:px-6">
          {avisos.length > 0 && (
            <ul class="mb-5 space-y-2">
              {avisos.map((a) => (
                <li class="flex gap-2 text-sm text-slate-700">
                  <span class="text-marca-700" aria-hidden="true">●</span>
                  {a}
                </li>
              ))}
            </ul>
          )}

          {pasos.length > 0 && (
            <details open class="group">
              <summary class="cursor-pointer list-none text-sm font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                <span class="inline-block transition-transform group-open:rotate-90" aria-hidden="true">›</span> Así se calculó, paso a paso
              </summary>
              <ol class="mt-3 divide-y divide-slate-100">
                {pasos.map((p, i) => (
                  <li class={`flex items-start justify-between gap-4 py-2.5 text-sm ${p.destacado ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                    <div class="min-w-0">
                      <span class="mr-2 text-xs text-slate-400 num">{`${i + 1}.`}</span>
                      {p.etiqueta}
                      {p.formula && <span class="mt-0.5 block text-xs font-normal text-slate-500 num break-words">{p.formula}</span>}
                      {p.fundamento && <span class="mt-0.5 block text-xs font-normal text-marca-700">{p.fundamento}</span>}
                    </div>
                    <span class="num shrink-0 text-right">{formatearPaso(p)}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}
          {children}
        </div>
      )}
      <p class="border-t border-slate-100 bg-amber-50 px-5 py-2.5 text-xs font-medium text-amber-900 sm:px-6">
        Cálculo informativo, no sustituye asesoría profesional.
      </p>
    </section>
  );
}

export function Distribucion({ izquierda, derecha }: { izquierda: ComponentChildren; derecha: ComponentChildren }) {
  return (
    <div class="grid items-start gap-6 lg:grid-cols-2">
      <div>{izquierda}</div>
      <div class="lg:sticky lg:top-20">{derecha}</div>
    </div>
  );
}
