/**
 * Vaqt tanlovidagi daqiqalar.
 *
 * 15 daqiqalik qadam — bron va narx qoidalari shu qadamda ishlaydi.
 * 59 alohida: kun oxiri (23:59) yoki oraliq tugashi uchun.
 * `minuteStep={15}` 59 ni chiqarmaydi, shuning uchun ro'yxat qo'lda.
 */
export const TIME_MINUTES = [0, 15, 30, 45, 59] as const;

const RUXSAT = new Set<number>(TIME_MINUTES);

export const DISABLED_MINUTES: number[] = Array.from(
  { length: 60 },
  (_, daqiqa) => daqiqa,
).filter((daqiqa) => !RUXSAT.has(daqiqa));

export function pickerDisabledTime(): {
  disabledMinutes: () => number[];
} {
  return { disabledMinutes: () => DISABLED_MINUTES };
}

/** TimePicker va TimePicker.RangePicker uchun umumiy panel. */
export const TIME_PICKER_PANEL = {
  hideDisabledOptions: true,
  showSecond: false as const,
  disabledTime: pickerDisabledTime,
  classNames: { popup: { root: 'ss-vaqt-popup' } },
};

/**
 * DatePicker `showTime` ichiga. Popup kengaytirilmaydi — yonida
 * kalendar turadi, vaqt ustunini 100% qilish uni ezib yuboradi.
 */
export const SHOW_TIME = {
  format: 'HH:mm',
  hideDisabledOptions: true,
  showSecond: false as const,
  disabledTime: pickerDisabledTime,
};
