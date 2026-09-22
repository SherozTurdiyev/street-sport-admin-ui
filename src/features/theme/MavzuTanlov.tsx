import { Segmented, Typography } from 'antd';
import { useMavzu, useMavzuSaqlash } from './hooks';
import type { MavzuTanlovi } from './mavzu';

const VARIANTLAR: { value: MavzuTanlovi; label: string }[] = [
  { value: 'DARK', label: 'Qorong‘i' },
  { value: 'LIGHT', label: 'Yorug‘' },
  { value: 'SYSTEM', label: 'Tizim' },
];

export function MavzuTanlov() {
  const { tanlov } = useMavzu();
  const saqla = useMavzuSaqlash();

  return (
    <div className="flex flex-col gap-2">
      <Segmented
        options={VARIANTLAR}
        value={tanlov}
        onChange={(v) => saqla(v as MavzuTanlovi)}
      />
      <Typography.Text type="secondary">
        “Tizim” — qurilma sozlamasiga ergashadi. Tanlov hisobingizda saqlanadi
        va boshqa qurilmada ham qo‘llanadi.
      </Typography.Text>
    </div>
  );
}
