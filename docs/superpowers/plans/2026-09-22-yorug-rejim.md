# Yorug' rejim — adminka. Implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adminkada yorug' rejim va almashtirgich; tanlov backendda
(`uiTheme`) va `localStorage` da saqlanadi.

**Architecture:** Ranglar CSS o'zgaruvchisiga o'tadi, shuning uchun
`figma.*` ishlatadigan 39 ta faylga tegilmaydi. Yagona manba —
`palitra.ts`; o'zgaruvchilar JavaScript orqali `<html>` ga qo'yiladi,
antd mavzusi esa haqiqiy hex qiymatlar bilan quriladi.

**Tech Stack:** React 19, antd 6, Vite 8, Tailwind 4 (faqat utility),
Vitest 4 + MSW + Testing Library.

**Spec:** `../street-sport-back-api/docs/superpowers/specs/2026-09-22-yorug-rejim-design.md`
Backend shartnomasi: `../street-sport-back-api/docs/API.md` (`/auth/me`).

## Global Constraints

- `figma` obyektining nomi va kalitlari O'ZGARMAYDI — 39 ta fayl unga tayanadi.
- antd mavzusiga faqat haqiqiy hex beriladi: algoritm hosila ranglarni hisoblaydi, CSS o'zgaruvchisi bilan ishlamaydi.
- Kontrast qiymatlari testdan chiqadi, qo'lda yozilmaydi (WCAG AA = 4.5).
- `localStorage` ga har murojaat `try/catch` ichida: xususiy rejimda u tashlaydi.
- Rejim saqlanmasa, ko'rinish orqaga QAYTARILMAYDI — faqat xabar.
- Matnlar o'zbekcha, `‘` (U+2018) apostrof.
- Tekshiruv: `npm run lint && npx tsc -b && npx vitest run <fayl>`; oxirida `npm test` va `npm run build`.
- Dev serverlar (3000/3001/5173) o'chirilmaydi. Sekin testlarga `}, 30_000)` beriladi.
- Kommit oxirida `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Tarmoq `feat/yorug-rejim`.

## Fayl tuzilmasi

| Fayl | Mas'uliyat |
|---|---|
| `src/shared/theme/palitra.ts` | Ikki palitra (hex) + CSS o'zgaruvchi nomlari |
| `src/shared/theme/palitra.test.ts` | Kontrast va `index.html` bilan moslik |
| `src/shared/theme/tokens.ts` | `figma` — ranglar endi `var(--rang-*)` |
| `src/shared/theme/antd-theme.ts` | `antdTheme(rejim)` |
| `src/features/theme/mavzu.ts` | Tanlov, tizim rejimi, qo'llash (sof + DOM) |
| `src/features/theme/mavzu.test.ts` | Sof funksiyalar |
| `src/features/theme/MavzuProvider.tsx` | Kontekst va holat |
| `src/features/theme/hooks.ts` | `useMavzu`, `useMavzuSaqlash` |
| `src/features/theme/MavzuTugma.tsx` | Sarlavhadagi quyosh/oy |
| `src/features/theme/MavzuTanlov.tsx` | Profildagi `Segmented` |
| `src/features/theme/MavzuSinxron.tsx` | `/auth/me` dagi qiymatni qo'llash |
| `src/features/theme/theme.test.tsx` | Integratsion testlar |
| `index.html`, `src/index.css`, `src/app/providers.tsx`, `src/App.tsx`, `src/app/layout/AppLayout.tsx`, `src/features/auth/ProfilePage.tsx`, `src/features/auth/api.ts`, `src/test/render.tsx` | Ulanish |

---

### Task 1: Palitra va kontrast testi

**Files:**
- Create: `src/shared/theme/palitra.ts`, `src/shared/theme/palitra.test.ts`

**Interfaces:**
- Produces: `type Rejim = 'dark' | 'light'`; `type RangKaliti`; `PALITRA: Record<Rejim, Record<RangKaliti, string>>`; `RANG_KALITLARI`; `varNomi(kalit)`; `KONTRAST_JUFTLARI`.

- [ ] **Step 1: Test (yiqiladigan)**

<!-- file: src/shared/theme/palitra.test.ts -->
```ts
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
    expect(Object.keys(PALITRA.dark).sort()).toEqual([...RANG_KALITLARI].sort());
    expect(Object.keys(PALITRA.light).sort()).toEqual([
      ...RANG_KALITLARI,
    ].sort());
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
```

- [ ] **Step 2: Yiqilishini ko'rish**

Run: `npx vitest run src/shared/theme/palitra.test.ts`
Expected: FAIL — `Failed to resolve import "./palitra"`.

- [ ] **Step 3: Palitra**

<!-- file: src/shared/theme/palitra.ts -->
```ts
/**
 * Ikkala rejimning RANGLARI — yagona manba.
 *
 * Bu yerdagi qiymatlar komponentlarda TO'G'RIDAN-TO'G'RI ishlatilmaydi:
 * ular ikki joyga boradi — antd mavzusi (`antd-theme.ts`, unga haqiqiy
 * hex kerak: algoritm yuzlab hosila rangni hisoblaydi) va CSS
 * o'zgaruvchilari (`features/theme/mavzu.ts`, ularni `tokens.ts`
 * orqali komponentlar o'qiydi).
 *
 * Qorong'i qiymatlar Figma'dan (StreetSport, k8OXDrj1dxTlVP3yhjoeFW).
 * Yorug' qiymatlar Figma'da YO'Q — ular shu ishda tanlandi va
 * kontrasti `palitra.test.ts` da o'lchanadi.
 */
export type Rejim = 'dark' | 'light';

export const RANG_KALITLARI = [
  'primary',
  'primarySoft',
  'primarySoftBorder',
  'primaryGlow',
  'primaryBright',
  'bg',
  'bgSider',
  'bgHeader',
  'bgCard',
  'bgInput',
  'border',
  'text',
  'textMuted',
  'success',
  'warning',
  'danger',
] as const;

export type RangKaliti = (typeof RANG_KALITLARI)[number];

export const PALITRA: Record<Rejim, Record<RangKaliti, string>> = {
  dark: {
    primary: '#5a00db',
    primarySoft: 'rgba(90, 0, 219, 0.2)',
    primarySoftBorder: 'rgba(90, 0, 219, 0.3)',
    primaryGlow: 'rgba(90, 0, 219, 0.5)',
    // Quyuq fonda brend binafshasi o'qilmaydi — yorug' varianti.
    primaryBright: '#974cff',
    bg: '#130726',
    bgSider: '#110524',
    bgHeader: '#0e041d',
    bgCard: '#1b0c36',
    bgInput: '#2c1c48',
    border: '#2d1a53',
    text: '#ffffff',
    textMuted: '#a18fc3',
    success: '#00e676',
    warning: '#fdc700',
    danger: '#fb2c36',
  },
  light: {
    primary: '#5a00db',
    primarySoft: 'rgba(90, 0, 219, 0.12)',
    primarySoftBorder: 'rgba(90, 0, 219, 0.25)',
    primaryGlow: 'rgba(90, 0, 219, 0.35)',
    // Yorug' fonda brend binafshasining o'zi yetarli (8.54).
    primaryBright: '#5a00db',
    bg: '#f4f2f8',
    bgSider: '#ffffff',
    bgHeader: '#ffffff',
    bgCard: '#ffffff',
    bgInput: '#f0edf6',
    border: '#ded7ee',
    text: '#1a1033',
    textMuted: '#615777',
    // Qorong'i rejimdagi neon qiymatlar oq fonda ~1.5 kontrast beradi
    // va o'qilmaydi, shuning uchun quyuqroq variantlari.
    success: '#00733c',
    warning: '#8a5a00',
    danger: '#c1121f',
  },
};

/**
 * Testda o'lchanadigan matn/fon juftliklari.
 *
 * Shaffof ranglar (`primarySoft`) va faqat fon sifatida ishlatiladigan
 * qiymatlar bu yerda YO'Q: ularning ustiga matn yozilmaydi.
 *
 * `primaryBright` ham yo'q: qorong'i rejimda u karta ustida 4.16 beradi,
 * ya'ni AA dan past. Bu avvaldan mavjud nuqson (spec §4.2) va uni
 * tuzatish ko'rinishni o'zgartiradigan alohida dizayn qarori.
 */
export const KONTRAST_JUFTLARI: readonly [RangKaliti, RangKaliti][] = [
  ['text', 'bg'],
  ['text', 'bgCard'],
  ['text', 'bgSider'],
  ['text', 'bgInput'],
  ['textMuted', 'bg'],
  ['textMuted', 'bgCard'],
  ['success', 'bgCard'],
  ['warning', 'bgCard'],
];

/** `textMuted` -> `--rang-text-muted`. */
export function varNomi(kalit: RangKaliti): string {
  return `--rang-${kalit.replace(/[A-Z]/g, (h) => `-${h.toLowerCase()}`)}`;
}
```

- [ ] **Step 4: O'tishini ko'rish**

Run: `npx vitest run src/shared/theme/palitra.test.ts`
Expected: `index.html` testi FAIL (u hali eski), qolgani PASS. Bu
kutilgan: `index.html` 2-taskda yangilanadi.

- [ ] **Step 5: Kommit**

```bash
npm run lint && npx tsc -b
git add src/shared/theme
git commit -m "feat(mavzu): ikki palitra va kontrast testi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Ranglarni o'zgaruvchiga o'tkazish va rejim holati

**Files:**
- Modify: `src/shared/theme/tokens.ts`, `src/shared/theme/antd-theme.ts`, `src/index.css`, `index.html`, `src/app/providers.tsx`, `src/App.tsx`, `src/features/auth/api.ts`, `src/test/render.tsx`
- Create: `src/features/theme/mavzu.ts`, `src/features/theme/mavzu.test.ts`, `src/features/theme/MavzuProvider.tsx`, `src/features/theme/mavzu-context.ts`, `src/features/theme/hooks.ts`, `src/features/theme/MavzuSinxron.tsx`

**Interfaces:**
- Consumes: `PALITRA`, `Rejim`, `varNomi`, `RANG_KALITLARI` (Task 1).
- Produces:
  - `type MavzuTanlovi = 'DARK' | 'LIGHT' | 'SYSTEM'`
  - `saqlanganTanlov(): MavzuTanlovi`, `tanlovniYoz(t)`, `tizimRejimi(): Rejim`, `tizimgaObuna(cb): () => void`, `hisobla(tanlov, tizim): Rejim`, `qolla(rejim): void`
  - `MavzuProvider`, `useMavzu(): { tanlov, rejim, ornat(t), ornatVaSaqla(t) }`
  - `Me` tipida `uiTheme: MavzuTanlovi`; `authApi.updateProfile({ uiTheme })`
  - `antdTheme(rejim: Rejim): ThemeConfig`

- [ ] **Step 1: Sof funksiyalar testi (yiqiladigan)**

<!-- file: src/features/theme/mavzu.test.ts -->
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PALITRA } from '@/shared/theme/palitra';
import { hisobla, qolla, saqlanganTanlov, tanlovniYoz } from './mavzu';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('hisobla', () => {
  it('aniq tanlov tizimdan ustun', () => {
    expect(hisobla('LIGHT', 'dark')).toBe('light');
    expect(hisobla('DARK', 'light')).toBe('dark');
  });

  it('SYSTEM tizimga ergashadi', () => {
    expect(hisobla('SYSTEM', 'dark')).toBe('dark');
    expect(hisobla('SYSTEM', 'light')).toBe('light');
  });
});

describe('saqlangan tanlov', () => {
  it('bo‘sh xotirada DARK — hozirgi ko‘rinish o‘zgarmaydi', () => {
    expect(saqlanganTanlov()).toBe('DARK');
  });

  it('yozilganini qaytaradi', () => {
    tanlovniYoz('SYSTEM');
    expect(saqlanganTanlov()).toBe('SYSTEM');
  });

  it('begona qiymatni DARK deb oladi', () => {
    localStorage.setItem('ss-mavzu', 'BLUE');
    expect(saqlanganTanlov()).toBe('DARK');
  });

  it('localStorage tashlasa ham yiqilmaydi', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloklangan');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloklangan');
    });
    expect(saqlanganTanlov()).toBe('DARK');
    expect(() => tanlovniYoz('LIGHT')).not.toThrow();
  });
});

describe('qolla', () => {
  it('data-theme, color-scheme va o‘zgaruvchilarni qo‘yadi', () => {
    qolla('light');
    const el = document.documentElement;
    expect(el.dataset.theme).toBe('light');
    expect(el.style.colorScheme).toBe('light');
    expect(el.style.getPropertyValue('--rang-bg')).toBe(PALITRA.light.bg);
    expect(el.style.getPropertyValue('--rang-text-muted')).toBe(
      PALITRA.light.textMuted,
    );

    qolla('dark');
    expect(el.dataset.theme).toBe('dark');
    expect(el.style.getPropertyValue('--rang-bg')).toBe(PALITRA.dark.bg);
  });
});
```

- [ ] **Step 2: Yiqilishini ko'rish**

Run: `npx vitest run src/features/theme/mavzu.test.ts`
Expected: FAIL — `Failed to resolve import "./mavzu"`.

- [ ] **Step 3: `mavzu.ts`**

<!-- file: src/features/theme/mavzu.ts -->
```ts
import {
  PALITRA,
  RANG_KALITLARI,
  varNomi,
  type Rejim,
} from '@/shared/theme/palitra';

/** Foydalanuvchi tanlovi — backenddagi `uiTheme` bilan bir xil. */
export type MavzuTanlovi = 'DARK' | 'LIGHT' | 'SYSTEM';

export const MAVZU_KALIT = 'ss-mavzu';

const TANLOVLAR: readonly MavzuTanlovi[] = ['DARK', 'LIGHT', 'SYSTEM'];

export function tanlovMi(x: unknown): x is MavzuTanlovi {
  return typeof x === 'string' && (TANLOVLAR as readonly string[]).includes(x);
}

/**
 * `localStorage` — tezkor xotira, haqiqat manbai emas: server qiymati
 * `/auth/me` bilan kelgach ustun turadi. Xususiy rejimda yoki sayt
 * ma'lumoti bloklanganda o'qish TASHLAYDI, shuning uchun har murojaat
 * `try/catch` ichida.
 */
export function saqlanganTanlov(): MavzuTanlovi {
  try {
    const x = window.localStorage.getItem(MAVZU_KALIT);
    return tanlovMi(x) ? x : 'DARK';
  } catch {
    return 'DARK';
  }
}

export function tanlovniYoz(tanlov: MavzuTanlovi): void {
  try {
    window.localStorage.setItem(MAVZU_KALIT, tanlov);
  } catch {
    // Saqlanmasa, tanlov faqat shu sahifa uchun ishlaydi.
  }
}

const TIZIM_SOROVI = '(prefers-color-scheme: dark)';

export function tizimRejimi(): Rejim {
  try {
    return window.matchMedia(TIZIM_SOROVI).matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

/** `useSyncExternalStore` uchun obuna. */
export function tizimgaObuna(ozgardi: () => void): () => void {
  const mql = window.matchMedia(TIZIM_SOROVI);
  mql.addEventListener('change', ozgardi);
  return () => mql.removeEventListener('change', ozgardi);
}

export function hisobla(tanlov: MavzuTanlovi, tizim: Rejim): Rejim {
  if (tanlov === 'SYSTEM') return tizim;
  return tanlov === 'LIGHT' ? 'light' : 'dark';
}

/**
 * Ranglarni `<html>` ga qo'yadi. React qayta chizmaydi — brauzer
 * o'zgaruvchi o'zgarganda o'zi qayta bo'yaydi, shuning uchun almashish
 * bir zumda bo'ladi.
 */
export function qolla(rejim: Rejim): void {
  const el = document.documentElement;
  el.dataset.theme = rejim;
  // Skrollbar va brauzerning o'z elementlari ham mos bo'lishi uchun.
  el.style.colorScheme = rejim;
  for (const kalit of RANG_KALITLARI) {
    el.style.setProperty(varNomi(kalit), PALITRA[rejim][kalit]);
  }
}
```

- [ ] **Step 4: O'tishini ko'rish**

Run: `npx vitest run src/features/theme/mavzu.test.ts`
Expected: PASS (7 test).

- [ ] **Step 5: `tokens.ts` — ranglar o'zgaruvchiga**

`src/shared/theme/tokens.ts` to'liq almashtiriladi (kalitlar va nom
O'ZGARMAYDI — 39 ta fayl shunga tayanadi):

<!-- file: src/shared/theme/tokens.ts -->
```ts
import { RANG_KALITLARI, varNomi, type RangKaliti } from './palitra';

/**
 * Komponentlar uchun YAGONA manba. Ranglar endi aniq qiymat emas, CSS
 * o'zgaruvchisi: joriy rejimni `<html>` belgilaydi (`features/theme/mavzu.ts`).
 *
 * Shuning uchun `figma.textMuted` yozilgan 39 ta faylning birortasiga
 * tegilmadi — ular baribir to'g'ri rangni oladi va rejim almashganda
 * React qayta chizmasdan yangilanadi.
 *
 * Haqiqiy qiymatlar `palitra.ts` da; antd mavzusi ularni o'sha yerdan
 * oladi, chunki algoritmga hex kerak.
 *
 * O'lchamlar va shrift Figma'dan (StreetSport, k8OXDrj1dxTlVP3yhjoeFW)
 * va rejimga bog'liq emas.
 */
const rang = Object.fromEntries(
  RANG_KALITLARI.map((kalit) => [kalit, `var(${varNomi(kalit)})`]),
) as Record<RangKaliti, string>;

export const figma = {
  ...rang,

  /** Karta va oynalar. */
  radiusCard: 20,
  /** Tugma, menyu elementi, belgi — Figma'da to'liq yumaloq. */
  radiusPill: 32,
  radiusControl: 12,

  siderWidth: 280,
  headerHeight: 88,

  /**
   * Shrift `index.html` da Google Fonts orqali yuklanadi. Zaxira
   * ro'yxati SHART: shrift kelmasa ham interfeys o'qilishi kerak.
   */
  fontFamily:
    "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
} as const;
```

- [ ] **Step 6: `antd-theme.ts` — funksiya**

`export const antdTheme: ThemeConfig = {` qatori quyidagiga almashadi
va fayl oxiridagi `};` — `});` ga:

```ts
import { theme, type ThemeConfig } from 'antd';
import { PALITRA, type Rejim } from './palitra';
import { figma } from './tokens';

/**
 * Butun interfeysning rangi shu yerdan keladi.
 *
 * Algoritm yuzlab hosila rangni (hover, disabled, ajratuvchi chiziq,
 * soya) o'zi hisoblaydi, shuning uchun unga HAQIQIY qiymat kerak —
 * `tokens.ts` dagi CSS o'zgaruvchilari bu yerda ishlamaydi.
 */
export function antdTheme(rejim: Rejim): ThemeConfig {
  const rang = PALITRA[rejim];
  return {
    algorithm:
      rejim === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: rang.primary,
      colorLink: rang.primaryBright,
      // ... mavjud `token` bloki: har bir `figma.X` -> `rang.X`,
      //     o'lchamlar (`figma.radiusControl`, `figma.fontFamily`) esa
      //     `figma` dan qoladi
    },
    components: {
      // ... mavjud `components` bloki: ranglar `rang.X`, o'lchamlar
      //     `figma.X`
    },
  };
}
```

Aniq ko'rsatma: faylda `figma.` bilan boshlanadigan RANG qiymatlarini
(`primary`, `primaryBright`, `primarySoft`, `primaryGlow`, `success`,
`warning`, `danger`, `bg`, `bgCard`, `bgSider`, `bgHeader`, `bgInput`,
`border`, `text`, `textMuted`) `rang.` ga almashtir; `radiusCard`,
`radiusPill`, `radiusControl`, `siderWidth`, `headerHeight`,
`fontFamily` — `figma.` bo'lib qoladi. `Table.headerBg: 'transparent'`
kabi literal qiymatlarga tegilmaydi.

- [ ] **Step 7: `index.css` va `index.html`**

`src/index.css` dagi `body` bloki:

```css
/*
 * Fon CSS o'zgaruvchisidan. Boshlang'ich qiymat `index.html` dagi
 * skript qo'yadi (React'dan oldin), shuning uchun yuklanishda
 * boshqa rang chaqnamaydi. `color-scheme` ham o'sha yerda.
 */
body {
  background: var(--rang-bg);
}
```

`index.html` — `<head>` oxiriga, `<title>` dan keyin:

```html
    <!--
      Rejim React'dan OLDIN qo'llanadi: usiz yorug' rejimdagi
      foydalanuvchi har yuklanishda qorong'i chaqnashni ko'rardi.
      Bu yerda faqat ikkita fon rangi takrorlanadi; ular
      `src/shared/theme/palitra.ts` bilan bir xilligini
      `palitra.test.ts` tekshiradi.
    -->
    <script>
      (function () {
        var tanlov = 'DARK';
        try {
          var x = localStorage.getItem('ss-mavzu');
          if (x === 'LIGHT' || x === 'SYSTEM' || x === 'DARK') tanlov = x;
        } catch (e) {}
        var rejim =
          tanlov === 'SYSTEM'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            : tanlov === 'LIGHT'
              ? 'light'
              : 'dark';
        var el = document.documentElement;
        el.dataset.theme = rejim;
        el.style.colorScheme = rejim;
        el.style.setProperty(
          '--rang-bg',
          rejim === 'dark' ? '#130726' : '#f4f2f8',
        );
      })();
    </script>
```

`<meta name="theme-color" content="#130726" />` o'z joyida qoladi:
u mobil brauzer panelining rangi va qorong'i standart uchun to'g'ri.

- [ ] **Step 8: Kontekst, provider va hook**

<!-- file: src/features/theme/mavzu-context.ts -->
```ts
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
```

<!-- file: src/features/theme/MavzuProvider.tsx -->
```tsx
import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
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
  const tizim = useSyncExternalStore(tizimgaObuna, tizimRejimi, () => 'dark');

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
```

<!-- file: src/features/theme/hooks.ts -->
```ts
import { useContext } from 'react';
import { App } from 'antd';
import { authApi } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks';
import { MavzuContext, type MavzuValue } from './mavzu-context';
import type { MavzuTanlovi } from './mavzu';

export function useMavzu(): MavzuValue {
  const value = useContext(MavzuContext);
  if (!value) throw new Error('useMavzu faqat MavzuProvider ichida ishlaydi');
  return value;
}

/**
 * Tanlovni qo'llaydi va serverga yuboradi.
 *
 * Xato bo'lsa ko'rinish ORQAGA QAYTARILMAYDI: foydalanuvchi ko'zi
 * oldida ikki marta rang almashishi eng yoqimsiz variant. Keyingi
 * kirishda server qiymati qaytadi.
 */
export function useMavzuSaqlash(): (tanlov: MavzuTanlovi) => void {
  const { message } = App.useApp();
  const { ornat } = useMavzu();
  const { applyMe } = useAuth();

  return (tanlov: MavzuTanlovi) => {
    ornat(tanlov);
    authApi
      .updateProfile({ uiTheme: tanlov })
      .then(applyMe)
      .catch(() => {
        message.error('Rejim saqlanmadi — bu qurilmada ishlaydi');
      });
  };
}
```

<!-- file: src/features/theme/MavzuSinxron.tsx -->
```tsx
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
```

- [ ] **Step 9: Ulanish**

`src/features/auth/api.ts`:

```ts
// `Me` tipiga:
  uiTheme: MavzuTanlovi;
// `updateProfile` imzosiga:
  updateProfile: (input: {
    fullName?: string;
    phone?: string;
    uiTheme?: MavzuTanlovi;
  }) => api.patch<Me>('/auth/me', input).then((r) => r.data),
```

`import type { MavzuTanlovi } from '@/features/theme/mavzu';` qo'shiladi.

`src/app/providers.tsx` — `ConfigProvider` endi rejimga qarab mavzu
oladi; buning uchun ichki komponent:

```tsx
import { MavzuProvider } from '@/features/theme/MavzuProvider';
import { useMavzu } from '@/features/theme/hooks';
import { antdTheme } from '@/shared/theme/antd-theme';

function AntdQobiq({ children }: PropsWithChildren) {
  const { rejim } = useMavzu();
  return (
    <ConfigProvider locale={uzUZ} theme={antdTheme(rejim)}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Mavzu ConfigProvider'dan TASHQARIDA: antd mavzusi rejimga
          bog'liq, ya'ni rejim yuqorida turishi kerak. */}
      <MavzuProvider>
        <AntdQobiq>{children}</AntdQobiq>
      </MavzuProvider>
    </QueryClientProvider>
  );
}
```

`src/App.tsx` — `AuthProvider` ichiga `<MavzuSinxron />`:

```tsx
        <AuthProvider>
          <MavzuSinxron />
          <AppRouter />
        </AuthProvider>
```

`src/test/render.tsx` — `ConfigProvider` shu tartibda o'raladi:

```tsx
      <MavzuProvider>
        <ConfigProvider locale={uzUZ} theme={antdTheme('dark')}>
```

(Testlar uchun rejim qat'iy `dark`: mavjud 45 ta fayl ko'rinishga emas,
xulq-atvorga qaraydi. Mavzu testlari o'z provayderini ishlatadi.)

- [ ] **Step 10: Tekshiruv**

```bash
npm run lint && npx tsc -b && npx vitest run src/features/theme src/shared/theme
npm test
```

Expected: hammasi yashil, `palitra.test.ts` dagi `index.html` testi ham.

- [ ] **Step 11: Kommit**

```bash
git add src index.html
git commit -m "feat(mavzu): ranglar CSS o'zgaruvchisiga o'tdi va rejim holati

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Almashtirgichlar va integratsion testlar

**Files:**
- Create: `src/features/theme/MavzuTugma.tsx`, `src/features/theme/MavzuTanlov.tsx`, `src/features/theme/theme.test.tsx`
- Modify: `src/app/layout/AppLayout.tsx`, `src/features/auth/ProfilePage.tsx`

**Interfaces:**
- Consumes: `useMavzu`, `useMavzuSaqlash` (Task 2).

- [ ] **Step 1: Integratsion testlar (yiqiladigan)**

<!-- file: src/features/theme/theme.test.tsx -->
```tsx
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/msw';
import { renderApp } from '@/test/render';
import {
  API,
  DIRECTOR_ME,
  authedHandlers,
  dashboardHandlers,
} from '@/test/handlers';
import { AppRouter } from '@/app/router';

const rejim = () => document.documentElement.dataset.theme;

describe('Interfeys rejimi', () => {
  beforeEach(() => {
    server.use(
      ...authedHandlers({ ...DIRECTOR_ME, uiTheme: 'DARK' }),
      ...dashboardHandlers(),
    );
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('localStorage bo‘sh bo‘lsa qorong‘i ochiladi', async () => {
    renderApp(<AppRouter />, { route: '/dashboard' });
    await screen.findByRole('button', { name: 'Yorug‘ rejimga o‘tish' });
    expect(rejim()).toBe('dark');
  });

  it('tugma rejimni almashtiradi, saqlaydi va serverga yuboradi', async () => {
    let yuborilgan: unknown = null;
    server.use(
      http.patch(`${API}/auth/me`, async ({ request }) => {
        yuborilgan = await request.json();
        return HttpResponse.json({ ...DIRECTOR_ME, uiTheme: 'LIGHT' });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/dashboard' });

    await user.click(
      await screen.findByRole('button', { name: 'Yorug‘ rejimga o‘tish' }),
    );

    expect(rejim()).toBe('light');
    expect(localStorage.getItem('ss-mavzu')).toBe('LIGHT');
    await expect.poll(() => yuborilgan).toEqual({ uiTheme: 'LIGHT' });
    // Endi tugma teskari amalni taklif qiladi.
    expect(
      await screen.findByRole('button', { name: 'Qorong‘i rejimga o‘tish' }),
    ).toBeInTheDocument();
  });

  it('serverdagi qiymat localStorage’dan ustun', async () => {
    localStorage.setItem('ss-mavzu', 'DARK');
    server.use(...authedHandlers({ ...DIRECTOR_ME, uiTheme: 'LIGHT' }));
    renderApp(<AppRouter />, { route: '/dashboard' });

    await screen.findByRole('button', { name: 'Qorong‘i rejimga o‘tish' });
    expect(rejim()).toBe('light');
    expect(localStorage.getItem('ss-mavzu')).toBe('LIGHT');
  });

  it('saqlash xatosida rejim joyida qoladi va xabar chiqadi', async () => {
    server.use(
      http.patch(`${API}/auth/me`, () => HttpResponse.error()),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/dashboard' });

    await user.click(
      await screen.findByRole('button', { name: 'Yorug‘ rejimga o‘tish' }),
    );

    expect(
      await screen.findByText('Rejim saqlanmadi — bu qurilmada ishlaydi'),
    ).toBeInTheDocument();
    // Orqaga qaytarish foydalanuvchi ko'zi oldida ikkinchi marta rang
    // almashtirardi — ataylab qilinmaydi.
    expect(rejim()).toBe('light');
  });

  it('profildagi tanlov “Tizim”ni ham yuboradi', async () => {
    let yuborilgan: unknown = null;
    server.use(
      http.patch(`${API}/auth/me`, async ({ request }) => {
        yuborilgan = await request.json();
        return HttpResponse.json({ ...DIRECTOR_ME, uiTheme: 'SYSTEM' });
      }),
    );
    const user = userEvent.setup();
    renderApp(<AppRouter />, { route: '/profile' });

    await user.click(await screen.findByRole('radio', { name: 'Tizim' }));
    await expect.poll(() => yuborilgan).toEqual({ uiTheme: 'SYSTEM' });
  });

  it('“Tizim” tanlansa brauzer sozlamasiga ergashadi', async () => {
    // jsdom da `prefers-color-scheme` doim `false` (`src/test/setup.ts`),
    // shuning uchun so'rov shu testda aniq javob beradi.
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (q: string) =>
        ({
          matches: q.includes('prefers-color-scheme: dark'),
          media: q,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    localStorage.setItem('ss-mavzu', 'SYSTEM');
    server.use(...authedHandlers({ ...DIRECTOR_ME, uiTheme: 'SYSTEM' }));

    renderApp(<AppRouter />, { route: '/dashboard' });
    await screen.findByRole('button', { name: 'Yorug‘ rejimga o‘tish' });
    expect(rejim()).toBe('dark');
  });
});
```

`src/test/handlers.ts` dagi `DIRECTOR_ME` va `SUPER_ADMIN_ME` ga
`uiTheme: 'DARK'` qo'shiladi (backend shartnomasi endi shuni qaytaradi).

- [ ] **Step 2: Yiqilishini ko'rish**

Run: `npx vitest run src/features/theme/theme.test.tsx`
Expected: FAIL — tugma topilmaydi.

- [ ] **Step 3: `MavzuTugma.tsx`**

<!-- file: src/features/theme/MavzuTugma.tsx -->
```tsx
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useMavzu, useMavzuSaqlash } from './hooks';

/**
 * Sarlavhadagi tugma faqat ikki holat orasida yuradi. "Tizim" bu yerda
 * YO'Q: aylanma bosishda foydalanuvchi qaysi holatda turganini bilmay
 * qolardi — u profil sahifasida tanlanadi.
 */
export function MavzuTugma() {
  const { rejim } = useMavzu();
  const saqla = useMavzuSaqlash();
  const yoruggami = rejim === 'light';
  const nom = yoruggami ? 'Qorong‘i rejimga o‘tish' : 'Yorug‘ rejimga o‘tish';

  return (
    <Tooltip title={nom}>
      <Button
        type="text"
        aria-label={nom}
        icon={yoruggami ? <MoonOutlined aria-hidden /> : <SunOutlined aria-hidden />}
        onClick={() => saqla(yoruggami ? 'DARK' : 'LIGHT')}
      />
    </Tooltip>
  );
}
```

- [ ] **Step 4: `MavzuTanlov.tsx`**

<!-- file: src/features/theme/MavzuTanlov.tsx -->
```tsx
import { Segmented, Typography } from 'antd';
import { useMavzu, useMavzuSaqlash } from './hooks';
import type { MavzuTanlovi } from './mavzu';

const VARIANTLAR: { value: MavzuTanlovi; label: string }[] = [
  { value: 'DARK', label: 'Qorong‘i' },
  { value: 'LIGHT', label: 'Yorug‘' },
  { value: 'SYSTEM', label: 'Tizim' },
];

export function MavzuTanlov() {
  const { tanlov } = useMavzu();
  const saqla = useMavzuSaqlash();

  return (
    <div className="flex flex-col gap-2">
      <Segmented
        options={VARIANTLAR}
        value={tanlov}
        onChange={(v) => saqla(v as MavzuTanlovi)}
      />
      <Typography.Text type="secondary">
        “Tizim” — qurilma sozlamasiga ergashadi. Tanlov hisobingizda
        saqlanadi va boshqa qurilmada ham qo‘llanadi.
      </Typography.Text>
    </div>
  );
}
```

- [ ] **Step 5: Sarlavha va profil**

`src/app/layout/AppLayout.tsx` — `<NotificationsBell />` dan OLDIN
`<MavzuTugma />` (import qo'shiladi).

`src/features/auth/ProfilePage.tsx` — parol kartochkasidan oldin yangi
karta:

```tsx
      <Card title="Ko‘rinish">
        <MavzuTanlov />
      </Card>
```

- [ ] **Step 6: O'tishini ko'rish**

Run: `npx vitest run src/features/theme`
Expected: PASS (6 integratsion + 7 sof). Sekin bo'lsa, o'sha testga
`}, 30_000)` qo'shiladi (`series.test.tsx` qolipi).

- [ ] **Step 7: To'liq tekshiruv**

```bash
npm run lint && npx tsc -b && npx prettier --check src && npm test && npm run build
```

Expected: yashil. `npm test` da 45+ fayl — `handlers.ts` o'zgargani
uchun hammasi qayta yuriladi.

- [ ] **Step 8: Kommit**

```bash
git add src
git commit -m "feat(mavzu): sarlavhada tugma va profilda rejim tanlovi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Brauzerda tekshirish

- [ ] **Step 1:** Dev serverlar ishlayotganini tekshir (3000/3001/5173) — ular o'chirilmaydi.
- [ ] **Step 2:** Adminkada yorug' rejimga o'tib, quyidagi sahifalarni ko'r: boshqaruv paneli, bronlar kalendari, stadion tafsiloti, hisobotlar, so'rovnoma natijalari. Kalendar va `StatCard` — eng ko'p inline rang ishlatadigan joylar.
- [ ] **Step 3:** Sahifani yangilab, chaqnash yo'qligini tekshir.
- [ ] **Step 4:** 375px kenglikda sarlavhadagi tugma boshqa elementlarni siqib qo'ymasligini tekshir.
- [ ] **Step 5:** Topilgan nuqsonlar alohida `fix:` kommitlarda; palitra o'zgarsa `palitra.test.ts` o'zi tekshiradi.
