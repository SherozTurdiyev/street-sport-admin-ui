import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import { API, DIRECTOR_ME, authedHandlers } from '@/test/handlers';
import { VoiceAssistant } from './VoiceAssistant';

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
    server.use(sttHandler('ertaga soat yettida bron qil'));
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

  it('mikrofonga ruxsat berilmasa tushunarli xabar chiqadi', async () => {
    mikrofonniUla(false);
    await och();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Ovoz bilan bron qilish' }),
    );

    expect(await screen.findByText(/Mikrofonga ruxsat berilmadi/)).toBeInTheDocument();
  });
});
