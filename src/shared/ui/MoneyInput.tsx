import { Input, type InputProps } from 'antd';
import { groupDigits, moneyDigits } from '@/shared/format/money';
import { useMask } from './useMask';

type Props = Omit<InputProps, 'value' | 'onChange' | 'type'> & {
  value?: string;
  onChange?: (next: string) => void;
};

/**
 * Summa maydoni — `200 000` ko'rinishida, uchtalab ajratilgan.
 *
 * Qiymat SATR bo'lib qoladi va hech qachon `Number` ga o'girilmaydi
 * (BR-13): `InputNumber` shu sababli ishlatilmaydi. Formaga faqat
 * raqamlar tushadi, bo'sh joysiz.
 */
export function MoneyInput({ value, onChange, ...rest }: Props) {
  const { ref, view, handleChange } = useMask({
    value: value ?? '',
    onChange: (next) => onChange?.(next),
    parse: moneyDigits,
    render: groupDigits,
  });

  return (
    <Input
      ref={ref}
      inputMode="numeric"
      suffix="so'm"
      {...rest}
      value={view}
      onChange={handleChange}
    />
  );
}
