/**
 * Yozib olingan audioni uzbekvoice.ai qabul qiladigan formatga keltirish.
 *
 * Nima uchun WAV. `MediaRecorder` Chrome'da `audio/webm;codecs=opus`,
 * Safari'da esa `audio/mp4` beradi. Xizmat qaysi formatlarni qabul
 * qilishi hujjatlashtirilmagan; 16 kHz mono WAV esa sinovdan o'tgan va
 * ishlashi aniq. Shuning uchun brauzer tomonida bir xil formatga
 * keltiriladi — backend nima kelishini taxmin qilmaydi.
 */

/** Xizmat uchun yetarli va fayl hajmini keraksiz oshirmaydi. */
export const NAMUNA_CHASTOTASI = 16_000;

const SARLAVHA_BAYTLARI = 44;

function matnYoz(view: DataView, dan: number, matn: string): void {
  for (let i = 0; i < matn.length; i += 1) {
    view.setUint8(dan + i, matn.charCodeAt(i));
  }
}

/**
 * `Float32Array` (−1…1) → 16-bit PCM WAV.
 *
 * Sof funksiya: brauzer API lariga tegmaydi, shuning uchun to'liq
 * test qilinadi.
 */
export function wavYoz(
  namunalar: Float32Array,
  chastota: number,
): ArrayBuffer {
  const dataBaytlari = namunalar.length * 2;
  const buffer = new ArrayBuffer(SARLAVHA_BAYTLARI + dataBaytlari);
  const view = new DataView(buffer);

  matnYoz(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBaytlari, true);
  matnYoz(view, 8, 'WAVE');

  matnYoz(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // `fmt` bo'limi uzunligi
  view.setUint16(20, 1, true); // 1 = siqilmagan PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, chastota, true);
  view.setUint32(28, chastota * 2, true); // byteRate
  view.setUint16(32, 2, true); // blockAlign
  view.setUint16(34, 16, true); // bit chuqurligi

  matnYoz(view, 36, 'data');
  view.setUint32(40, dataBaytlari, true);

  for (let i = 0; i < namunalar.length; i += 1) {
    // Baland ovozda namuna 1 dan oshishi mumkin. Qirqilmasa son
    // aylanib ketardi va baland tovush shovqinga aylanardi.
    const n = Math.max(-1, Math.min(1, namunalar[i] ?? 0));
    view.setInt16(
      SARLAVHA_BAYTLARI + i * 2,
      Math.round(n < 0 ? n * 0x8000 : n * 0x7fff),
      true,
    );
  }

  return buffer;
}

/**
 * Yozib olingan bo'lakni 16 kHz mono WAV ga o'tkazadi.
 *
 * `OfflineAudioContext` ikki ishni bir yo'la bajaradi: ko'p kanalni
 * monoga yig'adi va chastotani o'zgartiradi. Qo'lda yozilsa, bu ikkisi
 * ham xatoga moyil bo'lardi.
 */
export async function wavGaOtkaz(blob: Blob): Promise<Blob> {
  const baytlar = await blob.arrayBuffer();

  const ctx = new AudioContext();
  let xom: AudioBuffer;
  try {
    xom = await ctx.decodeAudioData(baytlar);
  } finally {
    void ctx.close();
  }

  const uzunlik = Math.max(1, Math.ceil(xom.duration * NAMUNA_CHASTOTASI));
  const offline = new OfflineAudioContext(1, uzunlik, NAMUNA_CHASTOTASI);
  const manba = offline.createBufferSource();
  manba.buffer = xom;
  manba.connect(offline.destination);
  manba.start();

  const natija = await offline.startRendering();
  return new Blob([wavYoz(natija.getChannelData(0), NAMUNA_CHASTOTASI)], {
    type: 'audio/wav',
  });
}
