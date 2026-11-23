/** Isla compartida por /finiquito y /liquidacion. */
import { useMemo, useState } from 'preact/hooks';
import { ANIO_VIGENTE, getValores } from '@/data';
import { calcularFiniquito, calcularLiquidacion, type MotivoSalida, type Zona } from '@/lib/calculos/separacion';
import { dinero, type Periodicidad } from '@/lib/calculos/comunes';
import { CampoSalario } from './CampoSalario';
import type { CampoEnlace } from '@/lib/compartir';
import { Compartir, useDatosDeEnlace } from './compartir';
import {
  aNumero,
  Campo,
  Distribucion,
  Fila,
  Formulario,
  InputFecha,
  InputNumero,
  Interruptor,
  intentar,
  PanelResultado,
  Selector,
  useFechaHoy,
} from './ui';

export default function CalcSeparacion({ modo }: { modo: 'finiquito' | 'liquidacion' }) {
  const [salario, setSalario] = useState('15000');
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>('mensual');
  const [ingreso, setIngreso] = useState(`${ANIO_VIGENTE - 3}-01-16`);
  const [salida, setSalida] = useFechaHoy(`${ANIO_VIGENTE}-06-30`);
  const [motivo, setMotivo] = useState<MotivoSalida>('renuncia');
  const [zona, setZona] = useState<Zona>('general');
  const [diasPend, setDiasPend] = useState('0');
  const [vacPend, setVacPend] = useState('0');
  const [aguinaldoPagado, setAguinaldoPagado] = useState(false);
  const [diasAg, setDiasAg] = useState('15');
  const [prima, setPrima] = useState('25');
  const [incluir20, setIncluir20] = useState(false);
  const [usarSDI, setUsarSDI] = useState(true);

  const campos: Record<string, CampoEnlace> = {
    salario: { valor: salario, poner: setSalario, tipo: 'numero' },
    periodo: { valor: periodicidad, poner: (x: string) => setPeriodicidad(x as typeof periodicidad), tipo: ['mensual', 'quincenal', 'semanal', 'diario'] },
    ingreso: { valor: ingreso, poner: setIngreso, tipo: 'fecha' },
    salida: { valor: salida, poner: setSalida, tipo: 'fecha' },
    motivo: { valor: motivo, poner: (x: string) => setMotivo(x as typeof motivo), tipo: ['renuncia', 'despido-justificado'] },
    zona: { valor: zona, poner: (x: string) => setZona(x as typeof zona), tipo: ['general', 'frontera'] },
    dpend: { valor: diasPend, poner: setDiasPend, tipo: 'numero' },
    vpend: { valor: vacPend, poner: setVacPend, tipo: 'numero' },
    agpag: { valor: aguinaldoPagado ? '1' : '0', poner: (x: string) => setAguinaldoPagado(x === '1'), tipo: 'si' },
    dias: { valor: diasAg, poner: setDiasAg, tipo: 'numero' },
    prima: { valor: prima, poner: setPrima, tipo: 'numero' },
    veinte: { valor: incluir20 ? '1' : '0', poner: (x: string) => setIncluir20(x === '1'), tipo: 'si' },
    sdi: { valor: usarSDI ? '1' : '0', poner: (x: string) => setUsarSDI(x === '1'), tipo: 'si' },
  };
  useDatosDeEnlace(campos);

  const res = useMemo(() => {
    const comun = {
      salario: aNumero(salario),
      periodicidad,
      fechaIngreso: ingreso,
      fechaSalida: salida,
      zona,
      diasSalarioPendiente: aNumero(diasPend) || 0,
      vacacionesPendientes: aNumero(vacPend) || 0,
      aguinaldoPagado,
      diasAguinaldo: aNumero(diasAg) || 15,
      primaVacacional: (aNumero(prima) || 25) / 100,
    };
    const v = getValores();
    return intentar(() =>
      modo === 'finiquito'
        ? { ...calcularFiniquito({ ...comun, motivo }, v), extra: null }
        : (() => {
            const l = calcularLiquidacion({ ...comun, incluir20Dias: incluir20, usarSalarioIntegrado: usarSDI }, v);
            return { ...l, conceptos: l.finiquito.conceptos, extra: l };
          })(),
    );
  }, [modo, salario, periodicidad, ingreso, salida, motivo, zona, diasPend, vacPend, aguinaldoPagado, diasAg, prima, incluir20, usarSDI]);

  const titulo = modo === 'finiquito' ? 'Tu finiquito (bruto)' : 'Tu liquidación (bruto)';

  return (
    <Distribucion
      izquierda={
        <Formulario>
          <CampoSalario {...{ salario, setSalario, periodicidad, setPeriodicidad }} />
          <Fila>
            <Campo label="Fecha de ingreso">{(id) => <InputFecha id={id} value={ingreso} onInput={setIngreso} />}</Campo>
            <Campo label="Último día trabajado">{(id) => <InputFecha id={id} value={salida} onInput={setSalida} />}</Campo>
          </Fila>
          <Fila>
            {modo === 'finiquito' && (
              <Campo label="¿Por qué terminó?">
                {(id) => (
                  <Selector
                    id={id}
                    value={motivo}
                    onChange={setMotivo}
                    opciones={[
                      ['renuncia', 'Renuncia voluntaria'],
                      ['despido-justificado', 'Despido justificado'],
                    ]}
                  />
                )}
              </Campo>
            )}
            <Campo label="Zona salarial" ayuda="Sólo cambia el tope de la prima de antigüedad.">
              {(id) => (
                <Selector
                  id={id}
                  value={zona}
                  onChange={setZona}
                  opciones={[
                    ['general', 'Resto del país'],
                    ['frontera', 'Zona Libre de la Frontera Norte'],
                  ]}
                />
              )}
            </Campo>
          </Fila>
          {modo === 'liquidacion' && (
            <div class="space-y-4 rounded-xl bg-slate-50 p-4">
              <Interruptor
                checked={usarSDI}
                onChange={setUsarSDI}
                label="Usar salario integrado"
                ayuda="La indemnización se paga con salario integrado (art. 84 LFT). Lo aproximamos sumando aguinaldo y prima vacacional."
              />
              <Interruptor
                checked={incluir20}
                onChange={setIncluir20}
                label="Incluir 20 días por año"
                ayuda="Procede en los casos de los arts. 49 y 52 LFT. Lee la explicación abajo."
              />
            </div>
          )}
          <details class="group rounded-xl border border-slate-200 p-4">
            <summary class="cursor-pointer list-none text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
              <span class="inline-block transition-transform group-open:rotate-90" aria-hidden="true">›</span> Más opciones (días pendientes, prestaciones)
            </summary>
            <div class="mt-4 space-y-5">
              <Fila>
                <Campo label="Días trabajados sin pagar" ayuda="P. ej. los días de la última quincena.">
                  {(id) => <InputNumero id={id} value={diasPend} onInput={setDiasPend} sufijo="días" />}
                </Campo>
                <Campo label="Vacaciones de años pasados no tomadas">
                  {(id) => <InputNumero id={id} value={vacPend} onInput={setVacPend} sufijo="días" />}
                </Campo>
              </Fila>
              <Fila>
                <Campo label="Días de aguinaldo por año">{(id) => <InputNumero id={id} value={diasAg} onInput={setDiasAg} sufijo="días" min={15} />}</Campo>
                <Campo label="Prima vacacional">{(id) => <InputNumero id={id} value={prima} onInput={setPrima} sufijo="%" min={25} />}</Campo>
              </Fila>
              <Interruptor checked={aguinaldoPagado} onChange={setAguinaldoPagado} label="Ya me pagaron el aguinaldo de este año" />
            </div>
          </details>
        </Formulario>
      }
      derecha={
        res.ok ? (
          <PanelResultado
            titulo={titulo}
            total={res.r.total}
            resumen={[
              { etiqueta: 'Aguinaldo', valor: dinero(res.r.conceptos.aguinaldo) },
              { etiqueta: 'Vacaciones + prima', valor: dinero(res.r.conceptos.vacaciones + res.r.conceptos.primaVacacional) },
              { etiqueta: 'Prima de antigüedad', valor: dinero(res.r.conceptos.primaAntiguedad) },
              ...(res.r.extra
                ? [{ etiqueta: 'Indemnización', valor: dinero(res.r.extra.indemnizacion3Meses + res.r.extra.indemnizacion20Dias) }]
                : [{ etiqueta: 'Salario pendiente', valor: dinero(res.r.conceptos.salarioPendiente) }]),
            ]}
            pasos={res.r.pasos}
            avisos={res.r.avisos}
          >
            <Compartir nombre={modo === 'finiquito' ? 'Calculadora de finiquito' : 'Calculadora de liquidación'} resultado={`${modo === 'finiquito' ? 'Mi finiquito' : 'Mi liquidación'}: ${dinero(res.r.total)} brutos (estimado).`} campos={campos} />
          </PanelResultado>
        ) : (
          <PanelResultado titulo={titulo} error={res.error} />
        )
      }
    />
  );
}
