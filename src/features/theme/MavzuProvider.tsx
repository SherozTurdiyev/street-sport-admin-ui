import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import type { Rejim } from '@/shared/theme/palitra';
import { hisobla, qolla, saqlanganTanlov, tanlovniYoz } from './mavzu';
import { tizimRejimi, tizimgaObuna, type MavzuTanlovi } from './mavzu';
import { MavzuContext, type MavzuValue } from './mavzu-context';

/**
 * `useSyncExternalStore` ATAYLAB `useEffect` + `setState` o'rniga:
 * oxirgisi oxlint'ning `set-state-in-effect` qoidasiga uriladi va
 * birinchi chizishda noto'g'ri rejim bilan bir kadr ko'rsatadi.
 */
export function MavzuProvider({ children }: PropsWithChildren) {
  const [tanlov, setTanlov] = useState<MavzuTanlovi>(saqlanganTanlov);
  const tizim = useSyncExternalStore<Rejim>(
    tizimgaObuna,
    tizimRejimi,
    // Server tomoni yo'q (CSR), lekin argument majburiy.
    () => 'dark',
  );

  const rejim = hisobla(tanlov, tizim);
  // Chizish paytida DOM ga yozish — React holatiga tegmaydi va
  // `useEffect` dan oldin bajariladi, ya'ni noto'g'ri rangli kadr yo'q.
  qolla(rejim);

  const ornat = useCallback((keyingi: MavzuTanlovi) => {
    setTanlov(keyingi);
    tanlovniYoz(keyingi);
  }, []);

  const value = useMemo<MavzuValue>(
    () => ({ tanlov, rejim, ornat }),
    [tanlov, rejim, ornat],
  );

  return <MavzuContext value={value}>{children}</MavzuContext>;
}
