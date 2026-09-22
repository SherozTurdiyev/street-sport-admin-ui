import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useMavzu, useMavzuSaqlash } from './hooks';

/**
 * Sarlavhadagi tugma faqat ikki holat orasida yuradi. "Tizim" bu yerda
 * YO'Q: aylanma bosishda foydalanuvchi qaysi holatda turganini bilmay
 * qolardi — u profil sahifasida tanlanadi.
 */
export function MavzuTugma() {
  const { rejim } = useMavzu();
  const saqla = useMavzuSaqlash();
  const yoruggami = rejim === 'light';
  const nom = yoruggami ? 'Qorong‘i rejimga o‘tish' : 'Yorug‘ rejimga o‘tish';

  return (
    <Tooltip title={nom}>
      <Button
        type="text"
        aria-label={nom}
        icon={
          yoruggami ? <MoonOutlined aria-hidden /> : <SunOutlined aria-hidden />
        }
        onClick={() => saqla(yoruggami ? 'DARK' : 'LIGHT')}
      />
    </Tooltip>
  );
}
