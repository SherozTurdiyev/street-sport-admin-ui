import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { KONTRAST_JUFTLARI, PALITRA, RANG_KALITLARI, varNomi } from './palitra';

/** WCAG 2.1 nisbiy yorqinlik. */
function yorqinlik(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
}

function kontrast(a: string, b: string): number {
  const [x, y] = [yorqinlik(a), yorqinlik(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

describe('palitra', () => {
  it('ikkala rejimda ham bir xil kalitlar bor', () => {
    // Kalit tushib qolsa, o'sha rang faqat bitta rejimda ishlardi va
    // buni ko'z bilan payqash qiyin.
    expect(Object.keys(PALITRA.dark).sort()).toEqual(
      [...RANG_KALITLARI].sort(),
    );
    expect(Object.keys(PALITRA.light).sort()).toEqual(
      [...RANG_KALITLARI].sort(),
    );
  });

  it('CSS o‘zgaruvchi nomi kebab-case', () => {
    expect(varNomi('textMuted')).toBe('--rang-text-muted');
    expect(varNomi('bg')).toBe('--rang-bg');
  });

  it.each(['dark', 'light'] as const)(
    '%s: matn/fon juftliklari WCAG AA (4.5) dan past emas',
    (rejim) => {
      const past = KONTRAST_JUFTLARI.map(([matn, fon]) => ({
        juftlik: `${matn} / ${fon}`,
        nisbat:
          Math.round(
            kontrast(PALITRA[rejim][matn], PALITRA[rejim][fon]) * 100,
          ) / 100,
      })).filter((r) => r.nisbat < 4.5);

      expect(past).toEqual([]);
    },
  );

  it('index.html dagi zaxira ranglar palitra bilan bir xil', () => {
    /*
     * `index.html` React'dan oldin fonni bo'yaydi (chaqnashning oldini
     * olish uchun) va qiymatlarni qo'lda saqlaydi. Palitra o'zgarib,
     * u yerda eski rang qolsa, yuklanishda boshqa rang chaqnardi.
     */
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain(PALITRA.dark.bg);
    expect(html).toContain(PALITRA.light.bg);
  });
});
