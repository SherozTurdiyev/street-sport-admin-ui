import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { VoiceAssistant } from './VoiceAssistant';
import type { BuyruqTaklifi } from './api';

/*
 * `wavGaOtkaz` `AudioContext` ga tayanadi, jsdom da esa u yo'q.
 * Shuning uchun AYNAN shu funksiya almashtiriladi; qolgan zanjir —
 * `MediaRecorder`, hook, so'rov — haqiqiy kod bo'lib qoladi.
 */
vi.mock('./wav', () => ({
  wavGaOtkaz: () => Promise.resolve(new Blob(['wav'], { type: 'audio/wav' })),
}));

/** jsdom da mikrofon yo'q — eng kichik ishlaydigan o'rinbosar. */
class SoxtaRecorder {
  static ohirgisi: SoxtaRecorder | null = null;
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm';
  private tinglovchilar: Record<string, ((e: never) => void)[]> = {};

  constructor() {
    SoxtaRecorder.ohirgisi = this;
  }
  addEventListener(nom: string, fn: (e: never) => void): void {
    (this.tinglovchilar[nom] ??= []).push(fn);
  }
  start(): void {
    this.state = 'recording';
  }
  stop(): void {
    this.state = 'inactive';
    this.tinglovchilar['stop']?.forEach((fn) => fn(undefined as never));
  }
}

function mikrofonniUla(bersinmi = true): void {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: bersinmi
        ? () => Promise.resolve({ getTracks: () => [] } as unknown as MediaStream)
        : () => Promise.reject(new Error('NotAllowedError')),
    },
  });
  (globalThis as { MediaRecorder?: unknown }).MediaRecorder = SoxtaRecorder;
}

const sttHandler = (text: string) =>
  http.post(`${API}/voice/transcribe`, () => HttpResponse.json({ text }));

const TAKLIF: BuyruqTaklifi = {
  matn: 'ertaga kechki to`qqizda kam nou',
  venueId: 'v-1',
  venueName: 'Kam Nou',
  slotMinutes: 60,
  startsAt: '2026-10-20T16:00:00.000Z',
  endsAt: '2026-10-20T17:00:00.000Z',
  phone: '939542111',
  amount: null,
  method: null,
};

/** Yuborilgan tanani ham ushlaydi — niyat nomi moslanishi muhim. */
function commandHandler(
  javob: Partial<BuyruqTaklifi> = {},
  yozib?: (tana: Record<string, unknown>) => void,
) {
  return http.post(`${API}/voice/command`, async ({ request }) => {
    yozib?.((await request.json()) as Record<string, unknown>);
    return HttpResponse.json({ ...TAKLIF, ...javob });
  });
}

const RUXSATSIZ = {
  ...DIRECTOR_ME,
  permissions: DIRECTOR_ME.permissions.filter(
    (p) => p !== 'booking.create' && p !== 'payment.accept',
  ),
};

describe('Ovozli yordamchi', () => {
  beforeEach(() => {
    mikrofonniUla();
    server.use(...authedHandlers());
  });

  const och = async () => {
    renderApp(<VoiceAssistant />);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ovozli yordamchi' }),
    );
  };

  it('ikkala ruxsat bo`lsa ikkala tugma ham chiqadi', async () => {
    await och();

    expect(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /to‘lov qabul qilish/i }),
    ).toBeInTheDocument();
  });

  it('`payment.accept` yo`q bo`lsa to`lov tugmasi chiqmaydi', async () => {
    server.use(
      ...authedHandlers({
        ...DIRECTOR_ME,
        permissions: DIRECTOR_ME.permissions.filter(
          (p) => p !== 'payment.accept',
        ),
      }),
    );
    await och();

    expect(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /to‘lov qabul qilish/i }),
    ).toBeNull();
  });

  it('ikkala ruxsat ham yo`q bo`lsa yordamchi umuman chizilmaydi', async () => {
    server.use(...authedHandlers(RUXSATSIZ));
    renderApp(<VoiceAssistant />);

    // Ruxsatlar yuklangach ham tugma paydo bo'lmasligi kerak.
    await expect(
      screen.findByRole('button', { name: 'Ovozli yordamchi' }),
    ).rejects.toThrow();
  });

  it('yozib to`xtatilgach tanilgan matn ko`rsatiladi', async () => {
    server.use(sttHandler('ertaga soat yettida bron qil'), commandHandler());
    await och();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /to‘xtatish va tanish/i }),
    );

    expect(
      await screen.findByText('ertaga soat yettida bron qil'),
    ).toBeInTheDocument();
  });

  it('niyatni backend kutgan nom bilan yuboradi', async () => {
    // `BOOKING` -> `BRON`: nomuvofiqlik bo'lsa so'rov 400 bilan
    // qaytardi va butun oqim ishlamasdi.
    const tanalar: Record<string, unknown>[] = [];
    server.use(
      sttHandler('ertaga kechki to`qqizda kam nou'),
      commandHandler({}, (t) => tanalar.push(t)),
    );
    await och();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /to‘xtatish va tanish/i }),
    );

    await screen.findByText('Kam Nou');
    expect(tanalar[0]?.['niyat']).toBe('BRON');
  });

  it('tushunilgan maydonlar ko`rsatiladi va oyna ochiladi', async () => {
    server.use(
      sttHandler('ertaga kechki to`qqizda kam nou'),
      commandHandler(),
    );
    await och();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /to‘xtatish va tanish/i }),
    );

    // Operator JIMGINA to'ldirilgan formani emas, nima tushunilganini
    // ko'rishi kerak.
    expect(await screen.findByText('Kam Nou')).toBeInTheDocument();
    expect(screen.getByText('+998 (93) 954-21-11')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Oynani ochish' }),
    ).toBeEnabled();
  });

  it('stadion aniqlanmasa oyna ochilmaydi', async () => {
    server.use(
      sttHandler('nimadir'),
      commandHandler({ venueId: null, venueName: null, slotMinutes: null }),
    );
    await och();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /to‘xtatish va tanish/i }),
    );

    expect(
      await screen.findByText(/Stadion yoki vaqt aniqlanmadi/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Oynani ochish' }),
    ).toBeDisabled();
  });

  it('bo`sh nutqda backend xatosi ko`rsatiladi', async () => {
    server.use(
      http.post(`${API}/voice/transcribe`, () =>
        HttpResponse.json(
          { code: 'VOICE_NO_SPEECH', message: 'Ovoz tanilmadi.' },
          { status: 422 },
        ),
      ),
    );
    await och();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /to‘xtatish va tanish/i }),
    );

    expect(await screen.findByText(/Ovoz tanilmadi/)).toBeInTheDocument();
  });

  it('xato chiqqanda QAYTA YOZISH tugmasi bo`ladi', async () => {
    /*
     * Jim yozuvda `VOICE_NO_SPEECH` keladi. Ilgari oynada faqat
     * xabar turardi va chiqish yo'li yo'q edi: matn ham, taklif ham
     * yo'q, demak tugmalar bloki umuman chizilmasdi.
     */
    server.use(
      http.post(`${API}/voice/transcribe`, () =>
        HttpResponse.json(
          { code: 'VOICE_NO_SPEECH', message: 'Ovoz tanilmadi.' },
          { status: 422 },
        ),
      ),
    );
    await och();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /to‘xtatish va tanish/i }),
    );

    await screen.findByText(/Ovoz tanilmadi/);
    const qayta = screen.getByRole('button', { name: 'Qaytadan aytish' });

    // Tugma ishlashi ham kerak: bosilgach yozuv qaytadan boshlanadi.
    await userEvent.click(qayta);
    expect(
      await screen.findByRole('button', { name: /to‘xtatish va tanish/i }),
    ).toBeInTheDocument();
  });

  it('mikrofonga ruxsat berilmasa tushunarli xabar chiqadi', async () => {
    mikrofonniUla(false);
    await och();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    );

    expect(await screen.findByText(/Mikrofonga ruxsat berilmadi/)).toBeInTheDocument();
  });
});
