import { useMemo, useState } from 'preact/hooks';
import { ANIO_VIGENTE } from '@/data';
import { calcularVacaciones } from '@/lib/calculos/vacaciones';
import { dinero, type Periodicidad } from '@/lib/calculos/comunes';
import { CampoSalario } from './CampoSalario';
import { aNumero, Campo, Distribucion, Fila, Formulario, InputFecha, InputNumero, intentar, PanelResultado, useFechaHoy } from './ui';

export default function CalcVacaciones() {
  const [salario, setSalario] = useState('12000');
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>('mensual');
  const [ingreso, setIngreso] = useState(`${ANIO_VIGENTE - 3}-01-15`);
  const [corte, setCorte] = useFechaHoy(`${ANIO_VIGENTE}-06-30`);
  const [prima, setPrima] = useState('25');

  const res = useMemo(
    () =>
      intentar(() =>
        calcularVacaciones({
          salario: aNumero(salario),
          periodicidad,
          fechaIngreso: ingreso,
          fechaCorte: corte,
          primaVacacional: (aNumero(prima) || 25) / 100,
        }),
      ),
    [salario, periodicidad, ingreso, corte, prima],
  );

  return (
    <Distribucion
      izquierda={
        <Formulario>
          <CampoSalario {...{ salario, setSalario, periodicidad, setPeriodicidad }} />
          <Fila>
            <Campo label="Fecha de ingreso">{(id) => <InputFecha id={id} value={ingreso} onInput={setIngreso} />}</Campo>
            <Campo label="Calcular a la fecha">{(id) => <InputFecha id={id} value={corte} onInput={setCorte} />}</Campo>
          </Fila>
          <Campo label="Prima vacacional" ayuda="Mínimo legal 25%. Algunos contratos dan 50% o más.">
            {(id) => <InputNumero id={id} value={prima} onInput={setPrima} sufijo="%" min={25} step="1" />}
          </Campo>
        </Formulario>
      }
      derecha={
        res.ok ? (
          <PanelResultado
            titulo={res.r.aniosCumplidos >= 1 ? `Te tocan ${res.r.diasVacaciones} días de vacaciones` : 'Vacaciones proporcionales'}
            total={res.r.total}
            resumen={[
              { etiqueta: 'Años cumplidos', valor: String(res.r.aniosCumplidos) },
              { etiqueta: 'Al siguiente aniversario', valor: `${res.r.diasProximoAnio} días` },
              { etiqueta: 'Pago de los días', valor: dinero(res.r.pagoVacaciones) },
              { etiqueta: 'Prima vacacional', valor: dinero(res.r.primaVacacional) },
            ]}
            pasos={res.r.pasos}
            avisos={res.r.avisos}
          />
        ) : (
          <PanelResultado titulo="Tus vacaciones" error={res.error} />
        )
      }
    />
  );
}
