import { describe, expect, it } from 'vitest';
import type { SurveyDetail } from './api';
import { foiz, isChoice, javobMatni, toFormValues, toInput } from './model';

const DETAIL: SurveyDetail = {
  id: 's-1',
  title: 'Mijozlar fikri',
  description: null,
  collectContact: true,
  isActive: false,
  responseCount: 0,
  locked: false,
  questions: [
    {
      id: 'q-1',
      position: 0,
      type: 'SINGLE_CHOICE',
      text: 'Nechta maydon?',
      required: true,
      options: [
        { id: 'o-1', position: 0, text: '1' },
        { id: 'o-2', position: 1, text: '2+' },
      ],
    },
    {
      id: 'q-2',
      position: 1,
      type: 'RATING',
      text: 'Baho',
      required: false,
      options: [],
    },
  ],
  createdAt: '2026-09-16T10:00:00.000Z',
  updatedAt: '2026-09-16T10:00:00.000Z',
};

describe('isChoice', () => {
  it('faqat tanlov turlari', () => {
    expect(isChoice('SINGLE_CHOICE')).toBe(true);
    expect(isChoice('MULTI_CHOICE')).toBe(true);
    expect(isChoice('TEXT')).toBe(false);
    expect(isChoice('RATING')).toBe(false);
  });
});

describe('toFormValues → toInput', () => {
  it('aylanib qaytganda id lar va tartib saqlanadi', () => {
    expect(toInput(toFormValues(DETAIL))).toEqual({
      title: 'Mijozlar fikri',
      description: null,
      collectContact: true,
      questions: [
        {
          id: 'q-1',
          type: 'SINGLE_CHOICE',
          text: 'Nechta maydon?',
          required: true,
          options: [
            { id: 'o-1', text: '1' },
            { id: 'o-2', text: '2+' },
          ],
        },
        {
          id: 'q-2',
          type: 'RATING',
          text: 'Baho',
          required: false,
          options: [],
        },
      ],
    });
  });

  it('tur tanlovdan boshqaga o‘zgarsa variantlar yuborilmaydi', () => {
    const values = toFormValues(DETAIL);
    values.questions[0]!.type = 'TEXT';
    expect(toInput(values).questions[0]!.options).toEqual([]);
  });

  it('bo‘sh tavsif null bo‘ladi', () => {
    const values = toFormValues(DETAIL);
    values.description = '   ';
    expect(toInput(values).description).toBeNull();
  });
});

describe('foiz', () => {
  it('butun songa yuvarlaydi, nolga bo‘lmaydi', () => {
    expect(foiz(2, 3)).toBe(67);
    expect(foiz(1, 3)).toBe(33);
    expect(foiz(0, 0)).toBe(0);
  });
});

describe('javobMatni', () => {
  const [single, rating] = DETAIL.questions;

  it('variant matnlari', () => {
    expect(
      javobMatni(single!, {
        questionId: 'q-1',
        optionIds: ['o-2'],
        text: null,
        rating: null,
      }),
    ).toBe('2+');
  });

  it('baho', () => {
    expect(
      javobMatni(rating!, {
        questionId: 'q-2',
        optionIds: [],
        text: null,
        rating: 4,
      }),
    ).toBe('4 / 5');
  });

  it('javob yo‘q', () => {
    expect(javobMatni(rating!, undefined)).toBe('—');
  });
});
