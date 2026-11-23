import { useMemo, useState } from 'preact/hooks';
import { getValores } from '@/data';
import { calcularISR, type PeriodoISR } from '@/lib/calculos/isr';
import { dinero } from '@/lib/calculos/comunes';
import { aNumero, Campo, Distribucion, Fila, Formulario, InputDinero, intentar, PanelResultado, Selector } from './ui';

export default function CalcISR() {
  const [ingreso, setIngreso] = useState('15000');
  const [periodo, setPeriodo] = useState<PeriodoISR>('mensual');

  const res = useMemo(() => intentar(() => calcularISR({ ingreso: aNumero(ingreso), periodo }, getValores())), [ingreso, periodo]);
  const pct = res.ok ? (res.r.isrRetenido / aNumero(ingreso)) * 100 : 0;

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
        </Formulario>
      }
      derecha={
        res.ok ? (
          <PanelResultado
            titulo="ISR que te retienen"
            total={res.r.isrRetenido}
            resumen={[
              { etiqueta: 'Te queda (antes de IMSS)', valor: dinero(res.r.neto) },
              { etiqueta: 'Tasa efectiva', valor: `${pct.toFixed(2)}%` },
              { etiqueta: 'ISR según tarifa', valor: dinero(res.r.isrAntesSubsidio) },
              { etiqueta: 'Subsidio al empleo', valor: dinero(res.r.subsidio) },
            ]}
            pasos={res.r.pasos}
            avisos={res.r.avisos}
          />
        ) : (
          <PanelResultado titulo="ISR que te retienen" error={res.error} />
        )
      }
    />
  );
}
