import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { useMavzu } from './hooks';

/**
 * Server qiymati USTUN: u boshqa qurilmadagi tanlovni olib keladi.
 * `/auth/me` kelishi bilan rejim shu yerda qo'llanadi va
 * `localStorage` yangilanadi.
 */
export function MavzuSinxron() {
  const { me } = useAuth();
  const { tanlov, ornat } = useMavzu();
  const serverniki = me?.uiTheme;

  useEffect(() => {
    if (serverniki !== undefined && serverniki !== tanlov) ornat(serverniki);
  }, [serverniki, tanlov, ornat]);

  return null;
}
