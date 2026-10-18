import { useCallback, useEffect, useRef, useState } from 'react';

export type YozuvHolati = 'tayyor' | 'ruxsat' | 'yozilmoqda';

/**
 * Operator juda uzoq gapirib ketsa ham fayl cheksiz o'smasin: backend
 * 5 MB dan kattasini rad etadi, bu esa undan ancha oldin to'xtatadi.
 */
const MAX_SONIYA = 60;

export type Recorder = {
  holat: YozuvHolati;
  soniya: number;
  /** Mikrofon ruxsatini so'raydi va yozishni boshlaydi. */
  boshla: () => Promise<void>;
  /** Yozishni to'xtatadi va yozilgan bo'lakni qaytaradi. */
  toxtat: () => Promise<Blob>;
  /** Yozuvni natijasiz tashlab yuboradi (oyna yopilganda). */
  bekor: () => void;
};

/**
 * `MediaRecorder` ustidagi yupqa qobiq.
 *
 * Nima uchun alohida hook: mikrofon oqimini YOPISH oson unutiladigan
 * ish, unutilsa brauzer yorlig'ida yozuv chirog'i yonib qolaveradi.
 * Shu yerda u bitta joyda — to'xtatishda ham, bekor qilishda ham,
 * komponent yo'q bo'lganda ham.
 */
export function useRecorder(): Recorder {
  const [holat, setHolat] = useState<YozuvHolati>('tayyor');
  const [soniya, setSoniya] = useState(0);

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const bolaklar = useRef<Blob[]>([]);
  const taymer = useRef<ReturnType<typeof setInterval> | null>(null);

  const tozala = useCallback(() => {
    if (taymer.current !== null) {
      clearInterval(taymer.current);
      taymer.current = null;
    }
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    recorder.current = null;
    bolaklar.current = [];
  }, []);

  // Komponent yo'q bo'lsa ham mikrofon o'chadi.
  useEffect(() => tozala, [tozala]);

  const toxtat = useCallback(async (): Promise<Blob> => {
    const mr = recorder.current;
    if (!mr) throw new Error('Yozuv boshlanmagan');

    const blob = await new Promise<Blob>((resolve) => {
      mr.addEventListener(
        'stop',
        () => resolve(new Blob(bolaklar.current, { type: mr.mimeType })),
        { once: true },
      );
      mr.stop();
    });

    tozala();
    setHolat('tayyor');
    setSoniya(0);
    return blob;
  }, [tozala]);

  const boshla = useCallback(async () => {
    setHolat('ruxsat');
    try {
      const oqim = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = oqim;
      bolaklar.current = [];

      const mr = new MediaRecorder(oqim);
      mr.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) bolaklar.current.push(e.data);
      });
      recorder.current = mr;
      mr.start();

      setSoniya(0);
      setHolat('yozilmoqda');
      taymer.current = setInterval(() => {
        setSoniya((oldingi) => {
          const keyingi = oldingi + 1;
          // Chegaraga yetganda o'zi to'xtaydi; natija `stop`
          // hodisasini kutayotgan `toxtat` ga boradi.
          if (keyingi >= MAX_SONIYA) recorder.current?.stop();
          return keyingi;
        });
      }, 1000);
    } catch (e) {
      tozala();
      setHolat('tayyor');
      throw e;
    }
  }, [tozala]);

  const bekor = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    tozala();
    setHolat('tayyor');
    setSoniya(0);
  }, [tozala]);

  return { holat, soniya, boshla, toxtat, bekor };
}
