import { describe, expect, it } from 'vitest';
import { wavYoz } from './wav';

/** `DataView` ustida kichik yordamchilar — sarlavha baytma-bayt o'qiladi. */
function matn(view: DataView, dan: number, uzunlik: number): string {
  let s = '';
  for (let i = 0; i < uzunlik; i += 1) s += String.fromCharCode(view.getUint8(dan + i));
  return s;
}

describe('wavYoz', () => {
  const namunalar = new Float32Array([0, 0.5, -0.5, 1, -1]);

  it('RIFF/WAVE sarlavhasini yozadi', () => {
    const view = new DataView(wavYoz(namunalar, 16_000));

    expect(matn(view, 0, 4)).toBe('RIFF');
    expect(matn(view, 8, 4)).toBe('WAVE');
    expect(matn(view, 12, 4)).toBe('fmt ');
    expect(matn(view, 36, 4)).toBe('data');
  });

  it('16 kHz, mono, 16-bit PCM deb e`lon qiladi', () => {
    const view = new DataView(wavYoz(namunalar, 16_000));

    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // kanallar
    expect(view.getUint32(24, true)).toBe(16_000); // chastota
    expect(view.getUint16(34, true)).toBe(16); // bit chuqurligi
    // byteRate = chastota * kanal * (bit/8)
    expect(view.getUint32(28, true)).toBe(16_000 * 2);
    expect(view.getUint16(32, true)).toBe(2); // blockAlign
  });

  it('uzunlik maydonlari haqiqiy hajmga mos keladi', () => {
    const buf = wavYoz(namunalar, 16_000);
    const view = new DataView(buf);

    const dataBaytlari = namunalar.length * 2;
    expect(buf.byteLength).toBe(44 + dataBaytlari);
    expect(view.getUint32(40, true)).toBe(dataBaytlari);
    // RIFF uzunligi — butun fayl minus birinchi sakkiz bayt.
    expect(view.getUint32(4, true)).toBe(36 + dataBaytlari);
  });

  it('namunalarni 16-bit ga o`tkazadi va chegaradan chiqarmaydi', () => {
    const view = new DataView(wavYoz(namunalar, 16_000));
    const o = (n: number) => view.getInt16(44 + n * 2, true);

    expect(o(0)).toBe(0);
    expect(o(1)).toBe(Math.round(0.5 * 32767));
    expect(o(2)).toBe(Math.round(-0.5 * 32768));
    // Chegaraviy qiymatlar aylanib ketmasligi kerak: +1 va -1
    // to'g'ridan-to'g'ri 32767/-32768 ga tushadi.
    expect(o(3)).toBe(32767);
    expect(o(4)).toBe(-32768);
  });

  it('chegaradan oshgan qiymat qirqiladi, aylanmaydi', () => {
    // Mikrofon juda baland bo'lsa namuna 1 dan oshishi mumkin.
    const view = new DataView(wavYoz(new Float32Array([2, -2]), 16_000));

    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
  });
});
