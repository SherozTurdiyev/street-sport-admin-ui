/**
 * "Meni eslab qol" — HAQIQIY xatti-harakat bilan.
 *
 * Sessiya `httpOnly` refresh cookie orqali 30 kun saqlanadi va uni
 * JavaScript o'chira olmaydi. Shuning uchun tanlov shu yerda,
 * brauzerda eslab qolinadi va ilova KEYINGI ishga tushishida qo'llanadi:
 * belgi qo'yilmagan bo'lsa, brauzer yopilib qayta ochilganda sessiya
 * serverda yopiladi.
 *
 * Ikkita xotira ATAYLAB: `localStorage` tanlovni saqlaydi (brauzer
 * yopilsa ham qoladi), `sessionStorage` esa "shu oyna hali yopilmagan"
 * degan belgidir — u brauzer yopilganda yo'qoladi. Ikkovining farqi
 * "yangi brauzer sessiyasi" ni aniqlashning yagona ishonchli usuli.
 */

const CHOICE = 'streetsport:session-only';
const ALIVE = 'streetsport:browser-session';

/**
 * Xotira ba'zi muhitlarda o'qishda ham xato beradi (maxfiy oyna,
 * sayt ma'lumotlari bloklangan brauzer). Bunday holatda tanlov
 * saqlanmaydi — bu sessiyani yo'qotishdan afzal.
 */
function safely<T>(ish: () => T, standart: T): T {
  try {
    return ish();
  } catch {
    return standart;
  }
}

export function rememberChoice(remember: boolean): void {
  safely(() => {
    if (remember) localStorage.removeItem(CHOICE);
    else localStorage.setItem(CHOICE, '1');
    sessionStorage.setItem(ALIVE, '1');
  }, undefined);
}

/** Brauzer yopilib qayta ochildi va foydalanuvchi eslab qolishni tanlamagan. */
export function shouldForget(): boolean {
  return safely(
    () =>
      localStorage.getItem(CHOICE) === '1' &&
      sessionStorage.getItem(ALIVE) === null,
    false,
  );
}

/** Oyna tirikligini belgilaydi — ilova har ishga tushganda chaqiriladi. */
export function markAlive(): void {
  safely(() => sessionStorage.setItem(ALIVE, '1'), undefined);
}

export function clearRemember(): void {
  safely(() => {
    localStorage.removeItem(CHOICE);
    sessionStorage.removeItem(ALIVE);
  }, undefined);
}
