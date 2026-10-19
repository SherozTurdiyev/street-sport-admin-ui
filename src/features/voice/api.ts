import { api } from '@/shared/api/client';

export type Transcript = { text: string };

/** Ovozli yordamchi qaysi ish uchun ochilgani. */
export type Niyat = 'BOOKING' | 'PAYMENT';

/** Backend qaytargan forma taklifi. Aniqlanmagan maydon — `null`. */
export type BuyruqTaklifi = {
  matn: string;
  venueId: string | null;
  venueName: string | null;
  slotMinutes: number | null;
  startsAt: string | null;
  endsAt: string | null;
  phone: string | null;
  amount: string | null;
  method: 'CASH' | 'CARD' | 'TRANSFER' | null;
};

export const voiceApi = {
  /**
   * `multipart/form-data`, maydon nomi `file`. `Content-Type` ATAYLAB
   * qo'lda berilmaydi — brauzer uni chegara bilan birga o'zi qo'yadi.
   *
   * Kalit bu yerda YO'Q: u backendda qoladi (`/voice/transcribe`).
   */
  transcribe: (wav: Blob) => {
    const form = new FormData();
    form.append('file', wav, 'audio.wav');
    return api
      .post<Transcript>('/voice/transcribe', form)
      .then((r) => r.data);
  },

  /**
   * Tanilgan matndan forma taklifi. Hech narsa yozilmaydi.
   *
   * Backend niyatni O'ZBEKCHA kutadi (`BRON`/`TOLOV`), interfeys esa
   * ichida inglizcha nom ishlatadi. Moslashtirish AYNAN shu yerda —
   * bitta joyda: ilgari `discount` maydonida xuddi shunday
   * nomuvofiqlik butun funksiyani ishlamay qo'ygan edi.
   */
  command: (matn: string, niyat: Niyat) =>
    api
      .post<BuyruqTaklifi>('/voice/command', {
        matn,
        niyat: niyat === 'BOOKING' ? 'BRON' : 'TOLOV',
      })
      .then((r) => r.data),
};
