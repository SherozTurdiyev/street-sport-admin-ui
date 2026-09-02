import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoneyInput } from './MoneyInput';
import { PhoneInput } from './PhoneInput';

function TelefonProbe({ boshlangich = '' }: { boshlangich?: string }) {
  const [qiymat, setQiymat] = useState(boshlangich);
  return (
    <>
      <PhoneInput aria-label="Telefon" value={qiymat} onChange={setQiymat} />
      <output data-testid="qiymat">{qiymat}</output>
    </>
  );
}

function SummaProbe() {
  const [qiymat, setQiymat] = useState('');
  return (
    <>
      <MoneyInput aria-label="Narx" value={qiymat} onChange={setQiymat} />
      <output data-testid="qiymat">{qiymat}</output>
    </>
  );
}

function maydon(nomi: string): HTMLInputElement {
  return screen.getByLabelText(nomi);
}

describe('Telefon maskasi', () => {
  it('raqamlarni maskaga soladi, formaga E.164 beradi', async () => {
    render(<TelefonProbe />);
    await userEvent.type(maydon('Telefon'), '901234567');

    expect(maydon('Telefon')).toHaveValue('+998 (90) 123-45-67');
    // Serverga bo'sh joysiz ketadi.
    expect(screen.getByTestId('qiymat')).toHaveTextContent('+998901234567');
  });

  it('to`liq raqam qo`yib berilsa mamlakat kodini takrorlamaydi', async () => {
    render(<TelefonProbe />);
    /*
     * Qo'yib berish (yoki avtoto'ldirish) — bitta hodisada to'liq
     * raqam. Maska `+998` ni ikki marta yozmasligi kerak.
     *
     * Qo'lda terishda esa kod maydonda ALLAQACHON turadi: birinchi
     * raqam yozilishi bilan `+998 (` paydo bo'ladi, foydalanuvchi
     * faqat milliy raqamni teradi.
     */
    await userEvent.click(maydon('Telefon'));
    await userEvent.paste('+998 90 111 00 01');

    expect(maydon('Telefon')).toHaveValue('+998 (90) 111-00-01');
    expect(screen.getByTestId('qiymat')).toHaveTextContent('+998901110001');
  });

  it('harf va ortiqcha raqamni qabul qilmaydi', async () => {
    render(<TelefonProbe />);
    await userEvent.type(maydon('Telefon'), '90abc12345678');

    expect(maydon('Telefon')).toHaveValue('+998 (90) 123-45-67');
  });

  it('tozalanganda qiymat bo`shaydi', async () => {
    render(<TelefonProbe boshlangich="+998901110001" />);
    await userEvent.clear(maydon('Telefon'));

    expect(maydon('Telefon')).toHaveValue('');
    expect(screen.getByTestId('qiymat')).toHaveTextContent('');
  });

  it('o`rtaga yozilganda kursor o`z joyida qoladi', async () => {
    render(<TelefonProbe boshlangich="+998901234567" />);
    // `+998 (90) 1` dan keyin, ya'ni uchinchi milliy raqamdan so'ng.
    await userEvent.type(maydon('Telefon'), '9', {
      initialSelectionStart: 11,
      initialSelectionEnd: 11,
    });

    expect(screen.getByTestId('qiymat')).toHaveTextContent('+998901923456');
    // Kursor oxiriga sakrab ketmasligi kerak — yozish davom etadi.
    expect(maydon('Telefon').selectionStart).toBe(12);
  });

  it('ajratgich ustida Backspace chapdagi raqamni o`chiradi', async () => {
    render(<TelefonProbe boshlangich="+998901234567" />);
    // Kursor `) ` dan keyin: Backspace bo'sh joyga tushadi.
    await userEvent.type(maydon('Telefon'), '{Backspace}', {
      initialSelectionStart: 10,
      initialSelectionEnd: 10,
    });

    // Maydon qotib qolmasligi kerak: `0` yo'qoladi.
    expect(screen.getByTestId('qiymat')).toHaveTextContent('+99891234567');
  });
});

describe('Summa maskasi', () => {
  it('uchtalab ajratadi, formaga faqat raqam beradi', async () => {
    render(<SummaProbe />);
    await userEvent.type(maydon('Narx'), '200000');

    expect(maydon('Narx')).toHaveValue('200 000');
    expect(screen.getByTestId('qiymat')).toHaveTextContent('200000');
  });

  it('boshidagi ortiqcha nolni olib tashlaydi', async () => {
    render(<SummaProbe />);
    await userEvent.type(maydon('Narx'), '0200');

    expect(screen.getByTestId('qiymat')).toHaveTextContent('200');
  });

  it('katta summani aniq saqlaydi', async () => {
    render(<SummaProbe />);
    // 2^53 dan katta: `Number` bo'lganda oxirgi raqam buzilardi (BR-13).
    await userEvent.type(maydon('Narx'), '9007199254740993');

    expect(screen.getByTestId('qiymat')).toHaveTextContent('9007199254740993');
    expect(maydon('Narx')).toHaveValue('9 007 199 254 740 993');
  });
});
