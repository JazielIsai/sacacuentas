import type { Periodicidad } from '@/lib/calculos/comunes';
import { Campo, Fila, InputDinero, Selector } from './ui';

export const OPCIONES_PERIODO: [Periodicidad, string][] = [
  ['mensual', 'Mensual'],
  ['quincenal', 'Quincenal'],
  ['semanal', 'Semanal'],
  ['diario', 'Diario'],
];

interface Props {
  salario: string;
  setSalario: (v: string) => void;
  periodicidad: Periodicidad;
  setPeriodicidad: (v: Periodicidad) => void;
}

export function CampoSalario({ salario, setSalario, periodicidad, setPeriodicidad }: Props) {
  return (
    <Fila>
      <Campo label="Tu salario" ayuda="Sueldo base bruto (antes de impuestos), sin bonos ni horas extra.">
        {(id) => <InputDinero id={id} value={salario} onInput={setSalario} />}
      </Campo>
      <Campo label="¿Cada cuándo?">
        {(id) => <Selector id={id} value={periodicidad} onChange={setPeriodicidad} opciones={OPCIONES_PERIODO} />}
      </Campo>
    </Fila>
  );
}
