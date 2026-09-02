/**
 * Enum yorliqlari BITTA joyda — `ROLE_LABELS` bilan bir xil uslubda.
 * Ro'yxat, forma va filtr bir xil so'zni ishlatadi; aks holda bitta
 * qiymat uch joyda uch xil nomlanib qolardi.
 *
 * Kalitlar backend enumlari bilan bir xil (`docs/API.md`, 3-bo'lim).
 */
export const SPORT_TYPE_LABELS = {
  FOOTBALL_5X5: 'Futbol 5x5',
  FOOTBALL_6X6: 'Futbol 6x6',
  FOOTBALL_7X7: 'Futbol 7x7',
  FOOTBALL_11X11: 'Futbol 11x11',
  FUTSAL: 'Futzal',
  BASKETBALL: 'Basketbol',
  TENNIS: 'Tennis',
  VOLLEYBALL: 'Voleybol',
  UNIVERSAL_HALL: 'Universal zal',
} as const;

export const SURFACE_LABELS = {
  ARTIFICIAL_GRASS: 'Sun’iy maysa',
  NATURAL_GRASS: 'Tabiiy maysa',
  PARQUET: 'Parket',
  RUBBER: 'Rezina',
  CONCRETE: 'Beton',
} as const;

export const AMENITY_LABELS = {
  SHOWER: 'Dush',
  CHANGING_ROOM: 'Kiyinish xonasi',
  PARKING: 'Avtoturargoh',
  LIGHTING: 'Yoritish',
  TRIBUNE: 'Tribuna',
  BALL_RENTAL: 'To‘p ijarasi',
  BUFFET: 'Bufet',
  AIR_CONDITIONING: 'Konditsioner',
} as const;

export const VENUE_STATUS_VIEW = {
  ACTIVE: { label: 'Faol', color: 'success' },
  TEMPORARILY_CLOSED: { label: 'Vaqtincha yopiq', color: 'warning' },
  ARCHIVED: { label: 'Arxivlangan', color: 'default' },
} as const;

export type SportType = keyof typeof SPORT_TYPE_LABELS;
export type Surface = keyof typeof SURFACE_LABELS;
export type Amenity = keyof typeof AMENITY_LABELS;
export type VenueStatus = keyof typeof VENUE_STATUS_VIEW;

/** antd `Select` uchun variantlar — yorliq jadvalidan olinadi. */
function optionsOf<T extends Record<string, string>>(
  labels: T,
): { value: keyof T; label: string }[] {
  return (Object.keys(labels) as (keyof T)[]).map((value) => ({
    value,
    label: labels[value],
  }));
}

export const SPORT_TYPE_OPTIONS = optionsOf(SPORT_TYPE_LABELS);
export const SURFACE_OPTIONS = optionsOf(SURFACE_LABELS);
export const AMENITY_OPTIONS = optionsOf(AMENITY_LABELS);

export const VENUE_STATUS_OPTIONS = (
  Object.keys(VENUE_STATUS_VIEW) as VenueStatus[]
).map((value) => ({ value, label: VENUE_STATUS_VIEW[value].label }));

/** Dushanba = 1 (backend shunday kutadi). */
export const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: 'Dushanba', short: 'Du' },
  { value: 2, label: 'Seshanba', short: 'Se' },
  { value: 3, label: 'Chorshanba', short: 'Ch' },
  { value: 4, label: 'Payshanba', short: 'Pa' },
  { value: 5, label: 'Juma', short: 'Ju' },
  { value: 6, label: 'Shanba', short: 'Sh' },
  { value: 7, label: 'Yakshanba', short: 'Ya' },
];
