import { useMemo, useState } from 'preact/hooks';
import { getValores } from '@/data';
import type { PeriodoISR } from '@/lib/calculos/isr';
import { calcularSueldoNeto } from '@/lib/calculos/sueldo-neto';
import { dinero } from '@/lib/calculos/comunes';
import type { CampoEnlace } from '@/lib/compartir';
import { Compartir, useDatosDeEnlace } from './compartir';
import { aNumero, Campo, Distribucion, Fila, Formulario, InputDinero, InputNumero, intentar, PanelResultado, Selector } from './ui';

export default function CalcSueldoNeto() {
  const [ingreso, setIngreso] = useState('15000');
  const [periodo, setPeriodo] = useState<PeriodoISR>('mensual');
  const [zona, setZona] = useState<'general' | 'frontera'>('general');

  const [antiguedad, setAntiguedad] = useState('0');
  const [diasAg, setDiasAg] = useState('15');
  const [prima, setPrima] = useState('25');
  const [otros, setOtros] = useState('0');

  const campos: Record<string, CampoEnlace> = {
    sueldo: { valor: ingreso, poner: setIngreso, tipo: 'numero' },
    periodo: { valor: periodo, poner: (x: string) => setPeriodo(x as typeof periodo), tipo: ['mensual', 'quincenal', 'semanal', 'diario'] },
    zona: { valor: zona, poner: (x: string) => setZona(x as typeof zona), tipo: ['general', 'frontera'] },
    antig: { valor: antiguedad, poner: setAntiguedad, tipo: 'numero' },
    dias: { valor: diasAg, poner: setDiasAg, tipo: 'numero' },
    prima: { valor: prima, poner: setPrima, tipo: 'numero' },
    otros: { valor: otros, poner: setOtros, tipo: 'numero' },
  };
  useDatosDeEnlace(campos);

  const res = useMemo(
    () =>
      intentar(() =>
        calcularSueldoNeto(
          {
            ingreso: aNumero(ingreso),
            periodo,
            zona,
            antiguedad: aNumero(antiguedad),
            diasAguinaldo: aNumero(diasAg),
            primaVacacional: aNumero(prima) / 100,
            otrosDescuentos: otros.trim() === '' ? 0 : aNumero(otros),
          },
          getValores(),
        ),
      ),
    [ingreso, periodo, zona, antiguedad, diasAg, prima, otros],
  );

  return (
    <Distribucion
      izquierda={
        <Formulario>
          <Fila>
            <Campo label="Sueldo bruto" ayuda="Lo que dice tu recibo antes de deducciones.">
              {(id) => <InputDinero id={id} value={ingreso} onInput={setIngreso} />}
            </Campo>
            <Campo label="Periodo de pago">
              {(id) => (
                <Selector
                  id={id}
                  value={periodo}
                  onChange={setPeriodo}
                  opciones={[
                    ['mensual', 'Mensual'],
                    ['quincenal', 'Quincenal'],
                    ['semanal', 'Semanal'],
                    ['diario', 'Diario'],
                  ]}
                />
              )}
            </Campo>
          </Fila>
          <Campo label="Zona salarial" ayuda="Con salario mínimo no te retienen ISR ni IMSS.">
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
          <Fila>
            <Campo label="Años cumplidos en tu trabajo">{(id) => <InputNumero id={id} value={antiguedad} onInput={setAntiguedad} sufijo="años" step="1" />}</Campo>
            <Campo label="Otros descuentos" ayuda="Infonavit, préstamos, caja de ahorro…">{(id) => <InputDinero id={id} value={otros} onInput={setOtros} />}</Campo>
          </Fila>
          <Fila>
            <Campo label="Días de aguinaldo por año">{(id) => <InputNumero id={id} value={diasAg} onInput={setDiasAg} sufijo="días" min={15} />}</Campo>
            <Campo label="Prima vacacional">{(id) => <InputNumero id={id} value={prima} onInput={setPrima} sufijo="%" min={25} />}</Campo>
          </Fila>
        </Formulario>
      }
      derecha={
        res.ok ? (
          <PanelResultado
            titulo="Tu sueldo neto"
            total={res.r.neto}
            resumen={[
              { etiqueta: 'ISR', valor: dinero(res.r.isr) },
              { etiqueta: 'IMSS', valor: dinero(res.r.imss) },
              { etiqueta: 'Otros descuentos', valor: dinero(aNumero(otros) || 0) },
              { etiqueta: 'Te queda', valor: `${((res.r.neto / aNumero(ingreso)) * 100).toFixed(1)}%` },
            ]}
            pasos={res.r.pasos}
            avisos={res.r.avisos}
          >
            <Compartir nombre="Calculadora de sueldo neto" resultado={`Mi sueldo neto: ${dinero(res.r.neto)} (estimado).`} campos={campos} />
          </PanelResultado>
        ) : (
          <PanelResultado titulo="Tu sueldo neto" error={res.error} />
        )
      }
    />
  );
}
