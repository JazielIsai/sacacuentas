import { useMemo, useState } from 'preact/hooks';
import { ANIO_VIGENTE, getValores } from '@/data';
import { calcularAguinaldo } from '@/lib/calculos/aguinaldo';
import { dinero, numero, type Periodicidad } from '@/lib/calculos/comunes';
import { CampoSalario } from './CampoSalario';
import { aNumero, Campo, Distribucion, Fila, Formulario, InputFecha, InputNumero, intentar, PanelResultado } from './ui';

export default function CalcAguinaldo() {
  const [salario, setSalario] = useState('12000');
  const [periodicidad, setPeriodicidad] = useState<Periodicidad>('mensual');
  const [ingreso, setIngreso] = useState(`${ANIO_VIGENTE - 2}-03-01`);
  const [corte, setCorte] = useState(`${ANIO_VIGENTE}-12-31`);
  const [dias, setDias] = useState('15');

  const res = useMemo(
    () =>
      intentar(() =>
        calcularAguinaldo(
          { salario: aNumero(salario), periodicidad, fechaIngreso: ingreso, fechaCorte: corte, diasAguinaldo: aNumero(dias) || 15 },
          getValores(),
        ),
      ),
    [salario, periodicidad, ingreso, corte, dias],
  );

  return (
    <Distribucion
      izquierda={
        <Formulario>
          <CampoSalario {...{ salario, setSalario, periodicidad, setPeriodicidad }} />
          <Fila>
            <Campo label="Fecha de ingreso">{(id) => <InputFecha id={id} value={ingreso} onInput={setIngreso} />}</Campo>
            <Campo label="Calcular hasta" ayuda="31 de diciembre si sigues trabajando, o tu último día.">
              {(id) => <InputFecha id={id} value={corte} onInput={setCorte} />}
            </Campo>
          </Fila>
          <Campo label="Días de aguinaldo por año" ayuda="La ley marca mínimo 15. Revisa tu contrato: muchas empresas dan más.">
            {(id) => <InputNumero id={id} value={dias} onInput={setDias} sufijo="días" min={15} step="1" />}
          </Campo>
        </Formulario>
      }
      derecha={
        res.ok ? (
          <PanelResultado
            titulo="Tu aguinaldo bruto"
            total={res.r.bruto}
            resumen={[
              { etiqueta: 'Neto estimado', valor: dinero(res.r.neto) },
              { etiqueta: 'Días que te tocan', valor: `${numero(res.r.diasAguinaldoProporcionales)} días` },
              { etiqueta: 'Exento de ISR', valor: dinero(res.r.exento) },
              { etiqueta: 'ISR estimado', valor: dinero(res.r.isrEstimado) },
            ]}
            pasos={res.r.pasos}
            avisos={res.r.avisos}
          />
        ) : (
          <PanelResultado titulo="Tu aguinaldo bruto" error={res.error} />
        )
      }
    />
  );
}
