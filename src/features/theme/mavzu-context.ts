import { createContext } from 'react';
import type { Rejim } from '@/shared/theme/palitra';
import type { MavzuTanlovi } from './mavzu';

export type MavzuValue = {
  tanlov: MavzuTanlovi;
  rejim: Rejim;
  /** Faqat qo'llaydi va `localStorage` ga yozadi (serverdan kelganda). */
  ornat: (tanlov: MavzuTanlovi) => void;
};

export const MavzuContext = createContext<MavzuValue | null>(null);
