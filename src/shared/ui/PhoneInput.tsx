import { Input, type InputProps } from 'antd';
import {
  PHONE_PLACEHOLDER,
  formatPhone,
  phoneDigits,
  phoneValue,
} from '@/shared/format/phone';
import { useMask } from './useMask';

type Props = Omit<InputProps, 'value' | 'onChange' | 'type'> & {
  value?: string;
  onChange?: (next: string) => void;
};

/**
 * Telefon maydoni — `+998 (90) 000-00-00` maskasi bilan.
 *
 * Formaga E.164 qiymati tushadi (`+998901234567`), shuning uchun
 * mavjud tekshiruvlar va so'rovlar o'zgarishsiz qoladi: maska faqat
 * ko'rinish qatlamida.
 */
export function PhoneInput({ value, onChange, ...rest }: Props) {
  const { ref, view, handleChange } = useMask({
    value: value ?? '',
    onChange: (next) => onChange?.(next),
    parse: phoneValue,
    render: (v) => formatPhone(phoneDigits(v)),
    // `998` — mamlakat kodi, uni o'chirib bo'lmaydi.
    fixed: 3,
  });

  return (
    <Input
      ref={ref}
      inputMode="tel"
      autoComplete="tel"
      placeholder={PHONE_PLACEHOLDER}
      {...rest}
      value={view}
      onChange={handleChange}
    />
  );
}
