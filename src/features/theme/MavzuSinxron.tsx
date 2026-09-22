import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { useMavzu } from './hooks';
import type { MavzuTanlovi } from './mavzu';

/**
 * Server qiymati USTUN: u boshqa qurilmadagi tanlovni olib keladi.
 * `/auth/me` kelishi bilan rejim shu yerda qo'llanadi va `localStorage`
 * yangilanadi.
 *
 * Qiymat faqat O'ZGARGANDA qo'llanadi. Aks holda saqlash xato berganda
 * (serverda eski qiymat qolganda) bu komponent foydalanuvchining
 * tanlovini darhol orqaga qaytarib, ko'z oldida rangni ikki marta
 * almashtirardi — aynan qilmaslikka kelishilgan narsa.
 */
export function MavzuSinxron() {
  const { me } = useAuth();
  const { ornat } = useMavzu();
  const oxirgi = useRef<MavzuTanlovi | undefined>(undefined);
  const serverniki = me?.uiTheme;

  useEffect(() => {
    if (serverniki === undefined || serverniki === oxirgi.current) return;
    oxirgi.current = serverniki;
    ornat(serverniki);
  }, [serverniki, ornat]);

  return null;
}
