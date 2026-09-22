import { useContext } from 'react';
import { App } from 'antd';
import { authApi } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks';
import { MavzuContext, type MavzuValue } from './mavzu-context';
import type { MavzuTanlovi } from './mavzu';

export function useMavzu(): MavzuValue {
  const value = useContext(MavzuContext);
  if (!value) throw new Error('useMavzu faqat MavzuProvider ichida ishlaydi');
  return value;
}

/**
 * Tanlovni qo'llaydi va serverga yuboradi.
 *
 * Xato bo'lsa ko'rinish ORQAGA QAYTARILMAYDI: foydalanuvchi ko'zi
 * oldida ikki marta rang almashishi eng yoqimsiz variant. Keyingi
 * kirishda server qiymati qaytadi.
 */
export function useMavzuSaqlash(): (tanlov: MavzuTanlovi) => void {
  const { message } = App.useApp();
  const { ornat } = useMavzu();
  const { applyMe } = useAuth();

  return (tanlov: MavzuTanlovi) => {
    ornat(tanlov);
    authApi
      .updateProfile({ uiTheme: tanlov })
      .then(applyMe)
      .catch(() => {
        message.error('Rejim saqlanmadi — bu qurilmada ishlaydi');
      });
  };
}
