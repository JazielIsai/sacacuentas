import { useMemo, useState } from 'preact/hooks';
import { getValores } from '@/data';
import { calcularIntereses } from '@/lib/calculos/intereses-tarjeta';
import { dinero } from '@/lib/calculos/comunes';
import { aNumero, Campo, Distribucion, Fila, Formulario, InputDinero, InputNumero, intentar, PanelResultado, Selector } from './ui';

function duracion(meses: number): string {
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  const partes = [];
  if (a) partes.push(`${a} ${a === 1 ? 'año' : 'años'}`);
  if (m) partes.push(`${m} ${m === 1 ? 'mes' : 'meses'}`);
  return partes.join(' y ') || '0 meses';
}

export default function CalcTarjeta() {
  const [saldo, setSaldo] = useState('20000');
  const [tasa, setTasa] = useState('60');
  const [modo, setModo] = useState<'fijo' | 'minimo'>('fijo');
  const [pago, setPago] = useState('2000');
  const [limite, setLimite] = useState('');
  const [verTabla, setVerTabla] = useState(false);

  const res = useMemo(
    () =>
      intentar(() =>
        calcularIntereses(
          { saldo: aNumero(saldo), tasaAnual: aNumero(tasa), modo, pagoMensual: aNumero(pago), limiteCredito: aNumero(limite) || 0 },
          getValores(),
        ),
      ),
    [saldo, tasa, modo, pago, limite],
  );

  return (
    <Distribucion
      izquierda={
        <Formulario>
          <Fila>
            <Campo label="Lo que debes hoy">{(id) => <InputDinero id={id} value={saldo} onInput={setSaldo} />}</Campo>
            <Campo label="Tasa de interés anual" ayuda="Viene en tu estado de cuenta. No es el CAT.">
              {(id) => <InputNumero id={id} value={tasa} onInput={setTasa} sufijo="% anual" />}
            </Campo>
          </Fila>
          <Campo label="¿Cuánto vas a pagar cada mes?">
            {(id) => (
              <Selector
                id={id}
                value={modo}
                onChange={setModo}
                opciones={[
                  ['fijo', 'Una cantidad fija'],
                  ['minimo', 'Solo el pago mínimo'],
                ]}
              />
            )}
          </Campo>
          {modo === 'fijo' ? (
            <Campo label="Pago mensual">{(id) => <InputDinero id={id} value={pago} onInput={setPago} />}</Campo>
          ) : (
            <Campo label="Límite de crédito (opcional)" ayuda="El pago mínimo nunca es menor al 1.25% de tu límite.">
              {(id) => <InputDinero id={id} value={limite} onInput={setLimite} />}
            </Campo>
          )}
        </Formulario>
      }
      derecha={
        res.ok ? (
          <PanelResultado
            titulo={res.r.liquidable ? `Terminas de pagar en ${duracion(res.r.meses)}` : 'Así no terminas de pagar'}
            total={res.r.liquidable ? res.r.totalPagado : undefined}
            totalTexto={res.r.liquidable ? undefined : 'Nunca ⚠️'}
            resumen={
              res.r.liquidable
                ? [
                    { etiqueta: 'Intereses', valor: dinero(res.r.totalIntereses) },
                    { etiqueta: 'IVA de intereses', valor: dinero(res.r.totalIva) },
                    { etiqueta: 'Pagas de más', valor: dinero(res.r.totalIntereses + res.r.totalIva) },
                    { etiqueta: 'Meses', valor: String(res.r.meses) },
                  ]
                : []
            }
            pasos={res.r.pasos}
            avisos={res.r.avisos}
          >
            {res.r.tabla.length > 0 && (
              <div class="mt-5">
                <button type="button" class="text-sm font-semibold text-marca-700 hover:underline" onClick={() => setVerTabla(!verTabla)} aria-expanded={verTabla}>
                  {verTabla ? 'Ocultar tabla mes por mes' : 'Ver tabla mes por mes'}
                </button>
                {verTabla && (
                  <div class="mt-3 max-h-96 overflow-auto rounded-lg border border-slate-200">
                    <table class="num w-full text-right text-xs">
                      <thead class="sticky top-0 bg-slate-100 text-slate-600">
                        <tr>
                          <th class="px-2 py-2 text-left">Mes</th>
                          <th class="px-2 py-2">Interés+IVA</th>
                          <th class="px-2 py-2">Pago</th>
                          <th class="px-2 py-2">Saldo</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        {res.r.tabla.map((m) => (
                          <tr>
                            <td class="px-2 py-1.5 text-left">{m.mes}</td>
                            <td class="px-2 py-1.5">{dinero(m.interes + m.iva)}</td>
                            <td class="px-2 py-1.5">{dinero(m.pago)}</td>
                            <td class="px-2 py-1.5">{dinero(m.saldoFinal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </PanelResultado>
        ) : (
          <PanelResultado titulo="Tu deuda" error={res.error} />
        )
      }
    />
  );
}
