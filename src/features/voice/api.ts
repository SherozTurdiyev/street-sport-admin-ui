import { api } from '@/shared/api/client';

export type Transcript = { text: string };

/** Ovozli yordamchi qaysi ish uchun ochilgani. */
export type Niyat = 'BOOKING' | 'PAYMENT';

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
};
