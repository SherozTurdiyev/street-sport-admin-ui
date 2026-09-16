import type {
  SurveyDetail,
  SurveyInput,
  SurveyQuestionType,
  SurveyResponseView,
} from './api';

export const QUESTION_TYPE_OPTIONS: {
  value: SurveyQuestionType;
  label: string;
}[] = [
  { value: 'SINGLE_CHOICE', label: 'Bitta variant' },
  { value: 'MULTI_CHOICE', label: 'Bir nechta variant' },
  { value: 'TEXT', label: 'Matn javob' },
  { value: 'RATING', label: 'Baho (1–5)' },
];

export function isChoice(type: SurveyQuestionType): boolean {
  return type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE';
}

/** antd `Form` ichidagi ko'rinish. `id` yashirin maydonda yuradi. */
export type SurveyFormValues = {
  title: string;
  description: string;
  collectContact: boolean;
  questions: {
    id?: string;
    type: SurveyQuestionType;
    text: string;
    required: boolean;
    options?: { id?: string; text: string }[];
  }[];
};

export function yangiSavol(): SurveyFormValues['questions'][number] {
  return {
    type: 'SINGLE_CHOICE',
    text: '',
    required: true,
    options: [{ text: '' }, { text: '' }],
  };
}

export const BOSH_FORMA: SurveyFormValues = {
  title: '',
  description: '',
  collectContact: false,
  questions: [yangiSavol()],
};

export function toFormValues(detail: SurveyDetail): SurveyFormValues {
  return {
    title: detail.title,
    description: detail.description ?? '',
    collectContact: detail.collectContact,
    questions: detail.questions.map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      required: q.required,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}

/**
 * Tur tanlovdan boshqaga o'zgarganda forma ichida eski variantlar
 * qolib ketadi — ular backendga YUBORILMAYDI, aks holda
 * `SURVEY_STRUCTURE_INVALID` qaytardi.
 */
export function toInput(values: SurveyFormValues): SurveyInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    collectContact: values.collectContact,
    questions: values.questions.map((q) => ({
      ...(q.id ? { id: q.id } : {}),
      type: q.type,
      text: q.text.trim(),
      required: q.required,
      options: isChoice(q.type)
        ? (q.options ?? []).map((o) => ({
            ...(o.id ? { id: o.id } : {}),
            text: o.text.trim(),
          }))
        : [],
    })),
  };
}

export function foiz(count: number, answered: number): number {
  return answered === 0 ? 0 : Math.round((count * 100) / answered);
}

export function javobMatni(
  question: SurveyDetail['questions'][number],
  answer: SurveyResponseView['answers'][number] | undefined,
): string {
  if (!answer) return '—';
  if (answer.rating !== null) return `${answer.rating} / 5`;
  if (answer.text !== null) return answer.text;
  const matnlar = question.options
    .filter((o) => answer.optionIds.includes(o.id))
    .map((o) => o.text);
  return matnlar.length > 0 ? matnlar.join(', ') : '—';
}
