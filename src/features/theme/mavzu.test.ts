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
